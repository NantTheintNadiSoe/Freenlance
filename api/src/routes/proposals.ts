import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { notify } from "../lib/notify.js";
import { httpError, paginationMeta, parsePagination } from "../utils/http.js";

const proposalInput = z.object({
  coverLetter: z.string().trim().min(30).max(5000),
  proposedAmountMinor: z.number().int().positive(),
  currency: z.enum(["USD", "MMK"]),
  estimatedDays: z.number().int().positive().max(3650)
});

export const proposalsRouter = Router();

proposalsRouter.get("/", requireAuth, async (request, response) => {
  const { page, pageSize, skip } = parsePagination(request.query);
  const jobId = typeof request.query.jobId === "string" ? request.query.jobId : undefined;
  const where = {
    ...(request.user!.role === "CLIENT" ? { job: { clientId: request.user!.id } } : { freelancerId: request.user!.id }),
    ...(jobId ? { jobId } : {})
  };
  const [total, data] = await prisma.$transaction([
    prisma.proposal.count({ where }),
    prisma.proposal.findMany({ where, skip, take: pageSize, orderBy: { createdAt: "desc" }, include: { job: { select: { id: true, title: true, currency: true, status: true } }, freelancer: { select: { id: true, displayName: true, avatarUrl: true, headline: true, ratingAverage: true, ratingCount: true } } } })
  ]);
  response.json({ data, meta: paginationMeta(page, pageSize, total) });
});

proposalsRouter.get("/:proposalId", requireAuth, async (request, response) => {
  const proposal = await prisma.proposal.findUnique({ where: { id: String(request.params.proposalId) }, include: { job: true, freelancer: { select: { id: true, displayName: true, avatarUrl: true, headline: true, bio: true, ratingAverage: true, ratingCount: true } } } });
  if (!proposal || (proposal.freelancerId !== request.user!.id && proposal.job.clientId !== request.user!.id)) throw httpError("Proposal not found", 404, "NOT_FOUND");
  response.json({ data: proposal });
});

proposalsRouter.post("/jobs/:jobId", requireAuth, requireRole("FREELANCER"), async (request, response) => {
  const input = proposalInput.parse(request.body);
  const job = await prisma.job.findUnique({ where: { id: String(request.params.jobId) } });
  if (!job || job.status !== "OPEN") throw httpError("Open job not found", 404, "JOB_NOT_OPEN");
  if (job.clientId === request.user!.id) throw httpError("You cannot propose on your own job", 400, "INVALID_PROPOSAL");
  if (job.currency !== input.currency) throw httpError("Proposal currency must match the job currency", 400, "CURRENCY_MISMATCH");

  const existing = await prisma.proposal.findUnique({
    where: { jobId_freelancerId: { jobId: job.id, freelancerId: request.user!.id } }
  });
  if (existing && existing.status !== "WITHDRAWN") {
    throw httpError("You already have a proposal on this job", 409, "PROPOSAL_EXISTS");
  }

  const proposal = existing
    ? await prisma.proposal.update({
      where: { id: existing.id },
      data: { ...input, status: "SUBMITTED" },
      include: { job: { select: { id: true, title: true, currency: true } } }
    })
    : await prisma.proposal.create({
      data: { jobId: job.id, freelancerId: request.user!.id, ...input },
      include: { job: { select: { id: true, title: true, currency: true } } }
    });
  await notify({
    userId: job.clientId,
    type: "PROPOSAL_RECEIVED",
    title: "New proposal",
    body: `A freelancer proposed on ${job.title}.`,
    targetType: "proposal",
    targetId: proposal.id
  });
  response.status(existing ? 200 : 201).json({ data: proposal });
});

proposalsRouter.post("/:proposalId/withdraw", requireAuth, requireRole("FREELANCER"), async (request, response) => {
  const proposal = await prisma.proposal.findUnique({ where: { id: String(request.params.proposalId) } });
  if (!proposal || proposal.freelancerId !== request.user!.id) throw httpError("Proposal not found", 404, "NOT_FOUND");
  if (!["SUBMITTED", "SHORTLISTED"].includes(proposal.status)) throw httpError("This proposal cannot be withdrawn", 409, "INVALID_STATE");
  const updated = await prisma.proposal.update({ where: { id: proposal.id }, data: { status: "WITHDRAWN" } });
  const job = await prisma.job.findUnique({ where: { id: proposal.jobId } });
  if (job) {
    await notify({
      userId: job.clientId,
      type: "PROPOSAL_WITHDRAWN",
      title: "Proposal withdrawn",
      body: `A proposal on ${job.title} was withdrawn.`,
      targetType: "proposal",
      targetId: proposal.id
    });
  }
  response.json({ data: updated });
});

proposalsRouter.post("/:proposalId/reject", requireAuth, requireRole("CLIENT"), async (request, response) => {
  const proposal = await prisma.proposal.findUnique({ where: { id: String(request.params.proposalId) }, include: { job: true } });
  if (!proposal || proposal.job.clientId !== request.user!.id) throw httpError("Proposal not found", 404, "NOT_FOUND");
  if (!["SUBMITTED", "SHORTLISTED"].includes(proposal.status)) throw httpError("This proposal cannot be rejected", 409, "INVALID_STATE");
  const updated = await prisma.proposal.update({ where: { id: proposal.id }, data: { status: "REJECTED" } });
  await notify({
    userId: proposal.freelancerId,
    type: "PROPOSAL_REJECTED",
    title: "Proposal not selected",
    body: `Your proposal on ${proposal.job.title} was not selected.`,
    targetType: "proposal",
    targetId: proposal.id
  });
  response.json({ data: updated });
});

proposalsRouter.post("/:proposalId/shortlist", requireAuth, requireRole("CLIENT"), async (request, response) => {
  const proposal = await prisma.proposal.findUnique({ where: { id: String(request.params.proposalId) }, include: { job: true } });
  if (!proposal || proposal.job.clientId !== request.user!.id) throw httpError("Proposal not found", 404, "NOT_FOUND");
  if (!["SUBMITTED", "SHORTLISTED"].includes(proposal.status)) throw httpError("This proposal cannot be shortlisted", 409, "INVALID_STATE");
  const updated = await prisma.proposal.update({ where: { id: proposal.id }, data: { status: "SHORTLISTED" } });
  await notify({
    userId: proposal.freelancerId,
    type: "PROPOSAL_SHORTLISTED",
    title: "You were shortlisted",
    body: `The client shortlisted your proposal on ${proposal.job.title}.`,
    targetType: "proposal",
    targetId: proposal.id
  });
  response.json({ data: updated });
});

proposalsRouter.post("/:proposalId/accept", requireAuth, requireRole("CLIENT"), async (request, response) => {
  const proposal = await prisma.proposal.findUnique({ where: { id: String(request.params.proposalId) }, include: { job: true } });
  if (!proposal || proposal.job.clientId !== request.user!.id) throw httpError("Proposal not found", 404, "NOT_FOUND");
  if (proposal.job.status !== "OPEN" || !["SUBMITTED", "SHORTLISTED"].includes(proposal.status)) {
    throw httpError("This proposal cannot be accepted", 409, "INVALID_STATE");
  }

  const contract = await prisma.$transaction(async (tx) => {
    await tx.proposal.updateMany({ where: { jobId: proposal.jobId, id: { not: proposal.id }, status: { in: ["SUBMITTED", "SHORTLISTED"] } }, data: { status: "REJECTED" } });
    await tx.proposal.update({ where: { id: proposal.id }, data: { status: "ACCEPTED" } });
    await tx.job.update({ where: { id: proposal.jobId }, data: { status: "HIRED" } });
    const created = await tx.contract.create({
      data: {
        jobId: proposal.jobId,
        proposalId: proposal.id,
        clientId: proposal.job.clientId,
        freelancerId: proposal.freelancerId,
        title: proposal.job.title,
        description: proposal.job.description,
        agreedAmountMinor: proposal.proposedAmountMinor,
        currency: proposal.currency,
        status: "PENDING"
      },
      include: { job: true, client: { select: { id: true, displayName: true } }, freelancer: { select: { id: true, displayName: true } } }
    });
    await tx.conversation.create({
      data: {
        jobId: proposal.jobId,
        contractId: created.id,
        clientId: proposal.job.clientId,
        freelancerId: proposal.freelancerId
      }
    });
    return created;
  });
  await notify({
    userId: proposal.freelancerId,
    type: "PROPOSAL_ACCEPTED",
    title: "You were hired",
    body: `Your proposal on ${proposal.job.title} was accepted.`,
    targetType: "contract",
    targetId: contract.id
  });
  response.status(201).json({ data: contract });
});

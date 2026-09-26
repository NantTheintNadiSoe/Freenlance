import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { httpError, paginationMeta, parsePagination } from "../utils/http.js";

const jobInput = z.object({
  title: z.string().trim().min(5).max(160),
  description: z.string().trim().min(30).max(10000),
  category: z.string().trim().min(2).max(80),
  budgetType: z.enum(["FIXED", "HOURLY"]).default("FIXED"),
  budgetMinMinor: z.number().int().nonnegative(),
  budgetMaxMinor: z.number().int().nonnegative(),
  currency: z.enum(["USD", "MMK"]),
  experienceLevel: z.enum(["ENTRY", "INTERMEDIATE", "EXPERT"]).default("INTERMEDIATE"),
  locationMode: z.enum(["REMOTE", "ONSITE", "HYBRID"]).default("REMOTE"),
  location: z.string().trim().max(120).nullable().optional(),
  deadline: z.coerce.date().nullable().optional(),
  skillIds: z.array(z.string()).max(20).default([]),
  status: z.enum(["DRAFT", "OPEN"]).default("DRAFT")
}).refine((input) => input.budgetMaxMinor >= input.budgetMinMinor, { message: "Maximum budget must be at least the minimum budget", path: ["budgetMaxMinor"] });

const jobStatusSchema = z.object({
  status: z.enum(["OPEN", "PAUSED", "CLOSED", "CANCELLED"])
});

const JOB_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["OPEN", "CANCELLED"],
  OPEN: ["PAUSED", "CLOSED", "CANCELLED"],
  PAUSED: ["OPEN", "CLOSED", "CANCELLED"],
  CLOSED: [],
  HIRED: [],
  CANCELLED: []
};

const EDITABLE_JOB_STATUSES = ["DRAFT", "OPEN", "PAUSED"];

export const jobsRouter = Router();

jobsRouter.get("/mine", requireAuth, requireRole("CLIENT"), async (request, response) => {
  const { page, pageSize, skip } = parsePagination(request.query);
  const status = typeof request.query.status === "string" ? request.query.status : undefined;
  const where = { clientId: request.user!.id, ...(status ? { status } : {}) };
  const [total, data] = await prisma.$transaction([
    prisma.job.count({ where }),
    prisma.job.findMany({ where, skip, take: pageSize, orderBy: { createdAt: "desc" }, include: { client: { select: { id: true, displayName: true, avatarUrl: true, ratingAverage: true, ratingCount: true } }, skills: { include: { skill: true } }, _count: { select: { proposals: true } } } })
  ]);
  response.json({ data, meta: paginationMeta(page, pageSize, total) });
});

jobsRouter.get("/", async (request, response) => {
  const { page, pageSize, skip } = parsePagination(request.query);
  const q = typeof request.query.q === "string" ? request.query.q.trim() : undefined;
  const status = typeof request.query.status === "string" ? request.query.status : "OPEN";
  const currency = request.query.currency === "USD" || request.query.currency === "MMK" ? request.query.currency : undefined;
  const category = typeof request.query.category === "string" ? request.query.category : undefined;
  const where = {
    status,
    ...(currency ? { currency } : {}),
    ...(category ? { category } : {}),
    ...(q ? { OR: [{ title: { contains: q } }, { description: { contains: q } }] } : {})
  };
  const [total, data] = await prisma.$transaction([
    prisma.job.count({ where }),
    prisma.job.findMany({ where, skip, take: pageSize, orderBy: { createdAt: "desc" }, include: { client: { select: { id: true, displayName: true, avatarUrl: true, ratingAverage: true, ratingCount: true } }, skills: { include: { skill: true } }, _count: { select: { proposals: true } } } })
  ]);
  response.json({ data, meta: paginationMeta(page, pageSize, total) });
});

jobsRouter.get("/:jobId", async (request, response) => {
  const job = await prisma.job.findUnique({ where: { id: String(request.params.jobId) }, include: { client: { select: { id: true, displayName: true, avatarUrl: true, bio: true, ratingAverage: true, ratingCount: true } }, skills: { include: { skill: true } }, _count: { select: { proposals: true } } } });
  if (!job) throw httpError("Job not found", 404, "NOT_FOUND");
  response.json({ data: job });
});

jobsRouter.post("/", requireAuth, requireRole("CLIENT"), async (request, response) => {
  const input = jobInput.parse(request.body);
  const job = await prisma.job.create({
    data: {
      clientId: request.user!.id,
      title: input.title,
      description: input.description,
      category: input.category,
      budgetType: input.budgetType,
      budgetMinMinor: input.budgetMinMinor,
      budgetMaxMinor: input.budgetMaxMinor,
      currency: input.currency,
      experienceLevel: input.experienceLevel,
      locationMode: input.locationMode,
      location: input.location,
      deadline: input.deadline,
      status: input.status,
      skills: input.skillIds.length ? { create: input.skillIds.map((skillId) => ({ skillId })) } : undefined
    },
    include: { skills: { include: { skill: true } } }
  });
  response.status(201).json({ data: job });
});

jobsRouter.patch("/:jobId/status", requireAuth, requireRole("CLIENT"), async (request, response) => {
  const existing = await prisma.job.findUnique({ where: { id: String(request.params.jobId) } });
  if (!existing || existing.clientId !== request.user!.id) throw httpError("Job not found", 404, "NOT_FOUND");
  const { status } = jobStatusSchema.parse(request.body);
  if (!JOB_TRANSITIONS[existing.status]?.includes(status)) {
    throw httpError(`Cannot move job from ${existing.status} to ${status}`, 409, "INVALID_STATE");
  }

  const job = await prisma.$transaction(async (tx) => {
    if (["CLOSED", "CANCELLED"].includes(status)) {
      await tx.proposal.updateMany({
        where: { jobId: existing.id, status: { in: ["SUBMITTED", "SHORTLISTED"] } },
        data: { status: "REJECTED" }
      });
    }
    return tx.job.update({
      where: { id: existing.id },
      data: { status },
      include: { skills: { include: { skill: true } } }
    });
  });
  response.json({ data: job });
});

jobsRouter.patch("/:jobId", requireAuth, requireRole("CLIENT"), async (request, response) => {
  const existing = await prisma.job.findUnique({ where: { id: String(request.params.jobId) } });
  if (!existing || existing.clientId !== request.user!.id) throw httpError("Job not found", 404, "NOT_FOUND");
  if (!EDITABLE_JOB_STATUSES.includes(existing.status)) throw httpError("This job can no longer be edited", 409, "INVALID_STATE");
  const input = jobInput.omit({ status: true }).partial().parse(request.body);
  const { skillIds, ...data } = input;
  const job = await prisma.job.update({
    where: { id: existing.id },
    data: {
      ...data,
      ...(skillIds ? { skills: { deleteMany: {}, create: skillIds.map((skillId) => ({ skillId })) } } : {})
    },
    include: { skills: { include: { skill: true } } }
  });
  response.json({ data: job });
});

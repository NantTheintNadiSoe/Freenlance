import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { notify } from "../lib/notify.js";
import { requireAuth } from "../middleware/auth.js";
import { httpError } from "../utils/http.js";

export const contractsRouter = Router();

contractsRouter.get("/", requireAuth, async (request, response) => {
  const where = request.user!.role === "CLIENT" ? { clientId: request.user!.id } : { freelancerId: request.user!.id };
  const data = await prisma.contract.findMany({ where, orderBy: { updatedAt: "desc" }, include: { job: { select: { id: true, title: true, category: true } }, client: { select: { id: true, displayName: true, avatarUrl: true } }, freelancer: { select: { id: true, displayName: true, avatarUrl: true } } } });
  response.json({ data });
});

contractsRouter.get("/:contractId", requireAuth, async (request, response) => {
  const contract = await prisma.contract.findUnique({
    where: { id: String(request.params.contractId) },
    include: {
      job: true,
      proposal: true,
      client: { select: { id: true, displayName: true, avatarUrl: true } },
      freelancer: { select: { id: true, displayName: true, avatarUrl: true } },
      reviews: { include: { author: { select: { id: true, displayName: true, avatarUrl: true } } } },
      conversations: { select: { id: true }, take: 1 }
    }
  });
  if (!contract || contract.clientId !== request.user!.id && contract.freelancerId !== request.user!.id) throw httpError("Contract not found", 404, "NOT_FOUND");
  response.json({ data: contract });
});

contractsRouter.patch("/:contractId/status", requireAuth, async (request, response) => {
  const { status } = z.object({ status: z.enum(["ACTIVE", "COMPLETED", "CANCELLED"]) }).parse(request.body);
  const contract = await prisma.contract.findUnique({ where: { id: String(request.params.contractId) } });
  if (!contract || contract.clientId !== request.user!.id && contract.freelancerId !== request.user!.id) throw httpError("Contract not found", 404, "NOT_FOUND");

  const allowed: Record<string, string[]> = {
    PENDING: ["ACTIVE", "CANCELLED"],
    ACTIVE: ["COMPLETED", "CANCELLED"],
    COMPLETED: [],
    CANCELLED: [],
    DISPUTED: []
  };
  if (!allowed[contract.status]?.includes(status)) throw httpError(`Cannot move contract from ${contract.status} to ${status}`, 409, "INVALID_STATE");
  const updated = await prisma.contract.update({ where: { id: contract.id }, data: { status } });
  if (status === "COMPLETED") await prisma.job.update({ where: { id: contract.jobId }, data: { status: "CLOSED" } });
  const otherId = contract.clientId === request.user!.id ? contract.freelancerId : contract.clientId;
  await notify({
    userId: otherId,
    type: "CONTRACT_STATUS",
    title: `Contract ${status.toLowerCase()}`,
    body: `${contract.title} is now ${status.toLowerCase()}.`,
    targetType: "contract",
    targetId: contract.id
  });
  response.json({ data: updated });
});

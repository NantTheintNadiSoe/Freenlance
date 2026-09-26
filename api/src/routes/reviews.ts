import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { notify } from "../lib/notify.js";
import { requireAuth } from "../middleware/auth.js";
import { httpError } from "../utils/http.js";

export const reviewsRouter = Router();

reviewsRouter.get("/users/:userId", async (request, response) => {
  const data = await prisma.review.findMany({ where: { recipientId: String(request.params.userId) }, orderBy: { createdAt: "desc" }, include: { author: { select: { id: true, displayName: true, avatarUrl: true } }, contract: { select: { title: true } } } });
  response.json({ data });
});

reviewsRouter.post("/contracts/:contractId", requireAuth, async (request, response) => {
  const { rating, title, comment } = z.object({ rating: z.number().int().min(1).max(5), title: z.string().trim().max(120).nullable().optional(), comment: z.string().trim().min(10).max(2000) }).parse(request.body);
  const contract = await prisma.contract.findUnique({ where: { id: String(request.params.contractId) } });
  if (!contract || contract.status !== "COMPLETED" || (contract.clientId !== request.user!.id && contract.freelancerId !== request.user!.id)) throw httpError("Completed contract not found", 404, "NOT_FOUND");
  const recipientId = contract.clientId === request.user!.id ? contract.freelancerId : contract.clientId;
  const review = await prisma.review.create({ data: { contractId: contract.id, authorId: request.user!.id, recipientId, rating, title, comment } });
  const summary = await prisma.review.aggregate({ where: { recipientId }, _avg: { rating: true }, _count: { rating: true } });
  await prisma.user.update({ where: { id: recipientId }, data: { ratingAverage: summary._avg.rating ?? 0, ratingCount: summary._count.rating } });
  await notify({
    userId: recipientId,
    type: "REVIEW_RECEIVED",
    title: "New review",
    body: `Someone left a ${rating}-star review on a completed contract.`,
    targetType: "review",
    targetId: review.id
  });
  response.status(201).json({ data: review });
});

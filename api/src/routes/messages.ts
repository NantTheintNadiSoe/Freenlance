import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { notify } from "../lib/notify.js";
import { requireAuth } from "../middleware/auth.js";
import { httpError } from "../utils/http.js";

export const messagesRouter = Router();

messagesRouter.post("/", requireAuth, async (request, response) => {
  const input = z.object({ recipientId: z.string(), jobId: z.string().nullable().optional(), contractId: z.string().nullable().optional() }).parse(request.body);
  if (input.recipientId === request.user!.id) throw httpError("You cannot message yourself", 400, "INVALID_PARTICIPANTS");
  const recipient = await prisma.user.findUnique({ where: { id: input.recipientId } });
  if (!recipient || recipient.status !== "ACTIVE") throw httpError("Recipient not found", 404, "NOT_FOUND");
  const isClient = request.user!.role === "CLIENT";
  const conversation = await prisma.conversation.create({ data: { clientId: isClient ? request.user!.id : input.recipientId, freelancerId: isClient ? input.recipientId : request.user!.id, jobId: input.jobId, contractId: input.contractId }, include: { client: { select: { id: true, displayName: true, avatarUrl: true } }, freelancer: { select: { id: true, displayName: true, avatarUrl: true } } } });
  response.status(201).json({ data: conversation });
});

messagesRouter.get("/", requireAuth, async (request, response) => {
  const data = await prisma.conversation.findMany({
    where: { OR: [{ clientId: request.user!.id }, { freelancerId: request.user!.id }] },
    orderBy: { updatedAt: "desc" },
    include: { client: { select: { id: true, displayName: true, avatarUrl: true } }, freelancer: { select: { id: true, displayName: true, avatarUrl: true } }, messages: { take: 1, orderBy: { createdAt: "desc" } } }
  });
  response.json({ data });
});

messagesRouter.get("/:conversationId", requireAuth, async (request, response) => {
  const conversation = await prisma.conversation.findUnique({ where: { id: String(request.params.conversationId) }, include: { messages: { orderBy: { createdAt: "asc" } }, client: { select: { id: true, displayName: true, avatarUrl: true } }, freelancer: { select: { id: true, displayName: true, avatarUrl: true } } } });
  if (!conversation || conversation.clientId !== request.user!.id && conversation.freelancerId !== request.user!.id) throw httpError("Conversation not found", 404, "NOT_FOUND");
  response.json({ data: conversation });
});

messagesRouter.post("/:conversationId/messages", requireAuth, async (request, response) => {
  const { body } = z.object({ body: z.string().trim().min(1).max(5000) }).parse(request.body);
  const conversation = await prisma.conversation.findUnique({ where: { id: String(request.params.conversationId) } });
  if (!conversation || conversation.clientId !== request.user!.id && conversation.freelancerId !== request.user!.id) throw httpError("Conversation not found", 404, "NOT_FOUND");
  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.message.create({ data: { conversationId: conversation.id, senderId: request.user!.id, body } });
    await tx.conversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });
    return created;
  });
  const recipientId = conversation.clientId === request.user!.id ? conversation.freelancerId : conversation.clientId;
  await notify({
    userId: recipientId,
    type: "MESSAGE_RECEIVED",
    title: "New message",
    body: body.slice(0, 140),
    targetType: "conversation",
    targetId: conversation.id
  });
  response.status(201).json({ data: message });
});

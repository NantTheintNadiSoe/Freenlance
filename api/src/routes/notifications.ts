import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

export const notificationsRouter = Router();

notificationsRouter.get("/", requireAuth, async (request, response) => {
  const data = await prisma.notification.findMany({ where: { userId: request.user!.id }, orderBy: { createdAt: "desc" }, take: 50 });
  response.json({ data });
});

notificationsRouter.post("/read-all", requireAuth, async (request, response) => {
  await prisma.notification.updateMany({ where: { userId: request.user!.id, readAt: null }, data: { readAt: new Date() } });
  response.status(204).send();
});

notificationsRouter.post("/:notificationId/read", requireAuth, async (request, response) => {
  const notification = await prisma.notification.findUnique({ where: { id: String(request.params.notificationId) } });
  if (!notification || notification.userId !== request.user!.id) return response.status(404).json({ error: { code: "NOT_FOUND", message: "Notification not found" } });
  response.json({ data: await prisma.notification.update({ where: { id: notification.id }, data: { readAt: new Date() } }) });
});

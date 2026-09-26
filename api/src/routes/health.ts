import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const healthRouter = Router();

healthRouter.get("/health", (_request, response) => {
  response.json({ status: "ok", service: "archer-api", timestamp: new Date().toISOString() });
});

healthRouter.get("/ready", async (_request, response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    response.json({ status: "ready" });
  } catch {
    response.status(503).json({ status: "not_ready" });
  }
});

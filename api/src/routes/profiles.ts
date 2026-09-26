import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { publicUser } from "../lib/auth.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { httpError, paginationMeta, parsePagination } from "../utils/http.js";

export const profilesRouter = Router();

const profileSelect = { id: true, displayName: true, avatarUrl: true, bio: true, headline: true, location: true, timezone: true, defaultCurrency: true, role: true, status: true, hourlyRateMinor: true, availability: true, ratingAverage: true, ratingCount: true, createdAt: true } as const;

profilesRouter.get("/", async (request, response) => {
  const { page, pageSize, skip } = parsePagination(request.query);
  const q = typeof request.query.q === "string" ? request.query.q.trim() : undefined;
  const availability = typeof request.query.availability === "string" ? request.query.availability : undefined;
  const where = { role: "FREELANCER", status: "ACTIVE", ...(availability ? { availability } : {}), ...(q ? { OR: [{ displayName: { contains: q } }, { headline: { contains: q } }, { bio: { contains: q } }, { location: { contains: q } }] } : {}) };
  const [total, profiles] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({ where, select: { ...profileSelect, skills: { include: { skill: true } }, portfolioItems: { orderBy: { sortOrder: "asc" } } }, skip, take: pageSize, orderBy: [{ ratingAverage: "desc" }, { createdAt: "desc" }] })
  ]);
  response.json({ data: profiles, meta: paginationMeta(page, pageSize, total) });
});

profilesRouter.get("/:userId", async (request, response) => {
  const profile = await prisma.user.findUnique({ where: { id: String(request.params.userId) }, select: { ...profileSelect, skills: { include: { skill: true } }, portfolioItems: { orderBy: { sortOrder: "asc" } }, receivedReviews: { orderBy: { createdAt: "desc" }, take: 10, include: { author: { select: { id: true, displayName: true, avatarUrl: true } }, contract: { select: { title: true } } } } } });
  if (!profile || profile.status !== "ACTIVE") throw httpError("Profile not found", 404, "NOT_FOUND");
  response.json({ data: profile });
});

profilesRouter.post("/me/portfolio", requireAuth, requireRole("FREELANCER"), async (request, response) => {
  const input = z.object({ title: z.string().trim().min(2).max(120), description: z.string().trim().max(1000).nullable().optional(), projectUrl: z.string().url().nullable().optional(), imageUrl: z.string().url().nullable().optional() }).parse(request.body);
  const item = await prisma.portfolioItem.create({ data: { ...input, userId: request.user!.id } });
  response.status(201).json({ data: item });
});

profilesRouter.patch("/me/portfolio/:portfolioId", requireAuth, requireRole("FREELANCER"), async (request, response) => {
  const existing = await prisma.portfolioItem.findUnique({ where: { id: String(request.params.portfolioId) } });
  if (!existing || existing.userId !== request.user!.id) throw httpError("Portfolio item not found", 404, "NOT_FOUND");
  const input = z.object({ title: z.string().trim().min(2).max(120).optional(), description: z.string().trim().max(1000).nullable().optional(), projectUrl: z.string().url().nullable().optional(), imageUrl: z.string().url().nullable().optional() }).parse(request.body);
  response.json({ data: await prisma.portfolioItem.update({ where: { id: existing.id }, data: input }) });
});

profilesRouter.delete("/me/portfolio/:portfolioId", requireAuth, requireRole("FREELANCER"), async (request, response) => {
  const existing = await prisma.portfolioItem.findUnique({ where: { id: String(request.params.portfolioId) } });
  if (!existing || existing.userId !== request.user!.id) throw httpError("Portfolio item not found", 404, "NOT_FOUND");
  await prisma.portfolioItem.delete({ where: { id: existing.id } });
  response.status(204).send();
});

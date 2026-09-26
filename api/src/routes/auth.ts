import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { createAccessToken, createRefreshToken, hashPassword, hashRefreshToken, publicUser, refreshTokenExpiry, verifyPassword } from "../lib/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { httpError } from "../utils/http.js";

const credentialsSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128)
});

const registerSchema = credentialsSchema.extend({
  displayName: z.string().trim().min(2).max(80),
  role: z.enum(["CLIENT", "FREELANCER"]).default("FREELANCER"),
  defaultCurrency: z.enum(["USD", "MMK"]).default("USD")
});

async function issueTokens(user: { id: string; email: string; role: string }, deviceName?: string) {
  const accessToken = createAccessToken({ sub: user.id, email: user.email, role: user.role });
  const refresh = createRefreshToken(user.id);
  await prisma.session.create({
    data: {
      userId: user.id,
      refreshTokenHash: refresh.tokenHash,
      expiresAt: refreshTokenExpiry(),
      deviceName
    }
  });
  return { accessToken, refreshToken: refresh.token };
}

export const authRouter = Router();

authRouter.post("/register", async (request, response) => {
  const input = registerSchema.parse(request.body);
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw httpError("An account with this email already exists", 409, "EMAIL_IN_USE");

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash: await hashPassword(input.password),
      displayName: input.displayName,
      role: input.role,
      defaultCurrency: input.defaultCurrency
    }
  });
  const tokens = await issueTokens(user);
  response.status(201).json({ data: { user: publicUser(user), ...tokens } });
});

authRouter.post("/login", async (request, response) => {
  const input = credentialsSchema.parse(request.body);
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw httpError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }
  if (user.status !== "ACTIVE") throw httpError("This account is unavailable", 403, "ACCOUNT_UNAVAILABLE");

  const tokens = await issueTokens(user, request.header("user-agent"));
  response.json({ data: { user: publicUser(user), ...tokens } });
});

authRouter.post("/refresh", async (request, response) => {
  const token = z.object({ refreshToken: z.string().min(20) }).parse(request.body).refreshToken;
  const session = await prisma.session.findUnique({ where: { refreshTokenHash: hashRefreshToken(token) }, include: { user: true } });
  if (!session || session.revokedAt || session.expiresAt < new Date() || session.user.status !== "ACTIVE") {
    throw httpError("Invalid or expired refresh token", 401, "INVALID_REFRESH_TOKEN");
  }

  const nextTokens = await prisma.$transaction(async (tx) => {
    await tx.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
    const next = createRefreshToken(session.userId);
    await tx.session.create({
      data: { userId: session.userId, refreshTokenHash: next.tokenHash, expiresAt: refreshTokenExpiry(), deviceName: session.deviceName }
    });
    return {
      accessToken: createAccessToken({ sub: session.user.id, email: session.user.email, role: session.user.role }),
      refreshToken: next.token
    };
  });
  response.json({ data: nextTokens });
});

authRouter.post("/logout", async (request, response) => {
  const token = z.object({ refreshToken: z.string().min(20) }).parse(request.body).refreshToken;
  await prisma.session.updateMany({ where: { refreshTokenHash: hashRefreshToken(token), revokedAt: null }, data: { revokedAt: new Date() } });
  response.status(204).send();
});

authRouter.get("/me", requireAuth, async (request, response) => {
  const user = await prisma.user.findUnique({ where: { id: request.user!.id }, include: { skills: { include: { skill: true } }, portfolioItems: true } });
  if (!user) throw httpError("User not found", 404, "NOT_FOUND");
  response.json({ data: { ...publicUser(user), skills: user.skills.map(({ skill, proficiency }) => ({ ...skill, proficiency })), portfolioItems: user.portfolioItems } });
});

authRouter.post("/change-password", requireAuth, async (request, response) => {
  const input = z.object({
    currentPassword: z.string().min(8).max(128),
    newPassword: z.string().min(8).max(128)
  }).parse(request.body);
  if (input.currentPassword === input.newPassword) {
    throw httpError("Choose a different password", 400, "PASSWORD_UNCHANGED");
  }

  const user = await prisma.user.findUnique({ where: { id: request.user!.id } });
  if (!user || !(await verifyPassword(input.currentPassword, user.passwordHash))) {
    throw httpError("Current password is incorrect", 401, "INVALID_CREDENTIALS");
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(input.newPassword) } }),
    prisma.session.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } })
  ]);
  response.status(204).send();
});

authRouter.patch("/me", requireAuth, async (request, response) => {
  const input = z.object({
    displayName: z.string().trim().min(2).max(80).optional(),
    headline: z.string().trim().max(120).nullable().optional(),
    bio: z.string().trim().max(2000).nullable().optional(),
    location: z.string().trim().max(120).nullable().optional(),
    timezone: z.string().trim().max(80).optional(),
    defaultCurrency: z.enum(["USD", "MMK"]).optional(),
    hourlyRateMinor: z.number().int().nonnegative().nullable().optional(),
    availability: z.enum(["AVAILABLE", "LIMITED", "UNAVAILABLE"]).optional()
  }).parse(request.body);
  const user = await prisma.user.update({ where: { id: request.user!.id }, data: input });
  response.json({ data: publicUser(user) });
});


import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { verifyAccessToken } from "../lib/auth.js";

export async function requireAuth(request: Request, _response: Response, next: NextFunction) {
  const header = request.header("authorization");
  if (!header?.startsWith("Bearer ")) {
    return next(Object.assign(new Error("Authentication required"), { statusCode: 401, code: "UNAUTHORIZED" }));
  }

  try {
    const payload = verifyAccessToken(header.slice("Bearer ".length));
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status !== "ACTIVE") {
      return next(Object.assign(new Error("User account is unavailable"), { statusCode: 401, code: "UNAUTHORIZED" }));
    }
    request.user = { id: user.id, email: user.email, role: user.role };
    return next();
  } catch {
    return next(Object.assign(new Error("Invalid or expired access token"), { statusCode: 401, code: "UNAUTHORIZED" }));
  }
}

export function requireRole(...roles: string[]) {
  return (request: Request, _response: Response, next: NextFunction) => {
    if (!request.user || !roles.includes(request.user.role) && request.user.role !== "ADMIN") {
      return next(Object.assign(new Error("You do not have permission for this action"), { statusCode: 403, code: "FORBIDDEN" }));
    }
    return next();
  };
}

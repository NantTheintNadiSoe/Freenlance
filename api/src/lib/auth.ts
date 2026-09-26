import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";

export type AccessTokenPayload = {
  sub: string;
  email: string;
  role: string;
  type: "access";
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function createAccessToken(payload: Omit<AccessTokenPayload, "type">) {
  return jwt.sign({ ...payload, type: "access" }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL as SignOptions["expiresIn"]
  });
}

export function createRefreshToken(userId: string) {
  const token = crypto.randomBytes(48).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, tokenHash, userId };
}

export function hashRefreshToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function refreshTokenExpiry() {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 30);
  return expiry;
}

export function publicUser(user: {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  headline: string | null;
  location: string | null;
  timezone: string;
  defaultCurrency: string;
  role: string;
  status: string;
  hourlyRateMinor: number | null;
  availability: string;
  ratingAverage: number;
  ratingCount: number;
  createdAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    headline: user.headline,
    location: user.location,
    timezone: user.timezone,
    defaultCurrency: user.defaultCurrency,
    role: user.role,
    status: user.status,
    hourlyRateMinor: user.hourlyRateMinor,
    availability: user.availability,
    ratingAverage: user.ratingAverage,
    ratingCount: user.ratingCount,
    createdAt: user.createdAt
  };
}

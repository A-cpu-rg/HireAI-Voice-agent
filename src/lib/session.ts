import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { env } from "@/env";

/**
 * Pure session + password cryptography. Kept free of `next/headers`/Prisma so it
 * is unit-testable and reusable from any runtime.
 */
export const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

const SESSION_SECRET = env.AUTH_SECRET;

function sign(payload: string): string {
  return createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
}

export function constantTimeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  try {
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/** Token format: `${userId}.${expiresAtUnix}.${nonce}.${signature}` */
export function encodeSession(userId: string, ttlSeconds = SESSION_TTL_SECONDS): string {
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const nonce = randomBytes(12).toString("hex");
  const payload = `${userId}.${expiresAt}.${nonce}`;
  return `${payload}.${sign(payload)}`;
}

export function decodeSession(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 4) return null;

  const [userId, expiresAtRaw, nonce, signature] = parts;
  if (!userId || !expiresAtRaw || !nonce || !signature) return null;

  const payload = `${userId}.${expiresAtRaw}.${nonce}`;
  if (!constantTimeEqual(signature, sign(payload))) return null;

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt * 1000 < Date.now()) return null;

  return userId;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, passwordHash: string): boolean {
  const [salt, storedHash] = passwordHash.split(":");
  if (!salt || !storedHash) return false;
  const derivedHash = scryptSync(password, salt, 64).toString("hex");
  return constantTimeEqual(storedHash, derivedHash);
}

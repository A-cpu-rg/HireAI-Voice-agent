import { cookies } from "next/headers";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { prisma } from "./prisma";

const SESSION_COOKIE = "hireai_session";
const SESSION_SECRET = process.env.AUTH_SECRET || "dev-hireai-session-secret";

function hashValue(value: string) {
  return createHmac("sha256", SESSION_SECRET).update(value).digest("hex");
}

function encodeSession(userId: string) {
  const nonce = randomBytes(8).toString("hex");
  const payload = `${userId}.${nonce}`;
  const signature = hashValue(payload);
  return `${payload}.${signature}`;
}

function decodeSession(token: string) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [userId, nonce, signature] = parts;
  const payload = `${userId}.${nonce}`;
  const expectedSignature = hashValue(payload);

  try {
    const valid = timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    return valid ? userId : null;
  } catch {
    return null;
  }
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, passwordHash: string) {
  const [salt, storedHash] = passwordHash.split(":");
  if (!salt || !storedHash) return false;

  const derivedHash = scryptSync(password, salt, 64).toString("hex");

  try {
    return timingSafeEqual(Buffer.from(storedHash), Buffer.from(derivedHash));
  } catch {
    return false;
  }
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const userId = decodeSession(token);
  if (!userId) {
    return null;
  }

  try {
    return await prisma.user.findUnique({
      where: { id: userId },
    });
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}

export async function loginUser(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, encodeSession(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
  });
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

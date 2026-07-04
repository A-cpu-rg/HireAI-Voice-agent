import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { isProduction } from "@/env";
import { logger } from "./logger";
import { decodeSession, encodeSession, SESSION_TTL_SECONDS } from "./session";

export const SESSION_COOKIE = "hireai_session";

// Re-export the pure crypto helpers so existing imports keep working.
export {
  encodeSession,
  decodeSession,
  hashPassword,
  verifyPassword,
  SESSION_TTL_SECONDS,
} from "./session";

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const userId = decodeSession(token);
  if (!userId) return null;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.emailVerifiedAt) return null;
    return user;
  } catch (error) {
    logger.error("Failed to resolve session user", { error });
    return null;
  }
}

export async function loginUser(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, encodeSession(userId), {
    httpOnly: true,
    secure: isProduction,
    path: "/",
    sameSite: "lax",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

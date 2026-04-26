import { createHash, randomBytes } from "crypto";

const VERIFICATION_TTL_MS = 1000 * 60 * 60 * 24;

export function generateVerificationToken() {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashVerificationToken(token);
  const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);

  return { token, tokenHash, expiresAt };
}

export function hashVerificationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function buildVerificationUrl(token: string) {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  return `${appUrl}/verify-email?token=${encodeURIComponent(token)}`;
}


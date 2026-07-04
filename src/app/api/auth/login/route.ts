import { ApiError, assertSameOrigin, getClientIp, json, parseBody, withRoute } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { hashPassword, loginUser, verifyPassword } from "@/lib/auth";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/schemas";

// Precomputed hash used to equalise timing when the account does not exist, so
// responses do not reveal which emails are registered.
const DUMMY_HASH = hashPassword("timing-equalizer-placeholder");

export const POST = withRoute(async (req) => {
  assertSameOrigin(req);
  enforceRateLimit(`login:${getClientIp(req)}`, RATE_LIMITS.auth);

  const { email, password } = await parseBody(req, loginSchema);

  const user = await prisma.user.findUnique({ where: { email } });

  // Always run a hash comparison to keep timing uniform for missing accounts.
  const passwordValid = user?.passwordHash
    ? verifyPassword(password, user.passwordHash)
    : (verifyPassword(password, DUMMY_HASH), false);

  if (!user || !passwordValid) {
    throw ApiError.unauthorized("Invalid email or password.");
  }

  if (!user.emailVerifiedAt) {
    throw new ApiError(403, "Please verify your email before logging in.", "EMAIL_NOT_VERIFIED");
  }

  await loginUser(user.id);

  return json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
});

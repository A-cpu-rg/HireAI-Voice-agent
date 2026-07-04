import { ApiError, assertSameOrigin, getClientIp, json, parseBody, withRoute } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { signupSchema } from "@/lib/schemas";
import { issueAndSendVerification } from "@/services/auth.service";

export const POST = withRoute(async (req) => {
  assertSameOrigin(req);
  enforceRateLimit(`register:${getClientIp(req)}`, RATE_LIMITS.auth);

  const { name, email, password } = await parseBody(req, signupSchema);

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser?.emailVerifiedAt) {
    throw ApiError.conflict("An account with this email already exists.");
  }

  const passwordHash = hashPassword(password);
  const fallbackName = name?.trim() || email.split("@")[0];

  const user = existingUser
    ? await prisma.user.update({
        where: { id: existingUser.id },
        data: { name: name?.trim() || existingUser.name || fallbackName, passwordHash },
      })
    : await prisma.user.create({
        data: { name: fallbackName, email, passwordHash },
      });

  const delivery = await issueAndSendVerification(user);

  return json(
    {
      success: true,
      requiresVerification: true,
      message: "Account created. Verify your email before logging in.",
      previewUrl: "previewUrl" in delivery ? delivery.previewUrl : undefined,
      user: { id: user.id, email: user.email, name: user.name },
    },
    { status: 201 }
  );
});

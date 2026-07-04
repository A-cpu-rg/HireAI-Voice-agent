import { ApiError, json, parseBody, withRoute } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { hashVerificationToken } from "@/lib/email-verification";
import { loginUser } from "@/lib/auth";
import { verifyEmailSchema } from "@/lib/schemas";

export const POST = withRoute(async (req) => {
  const { token } = await parseBody(req, verifyEmailSchema);

  const tokenHash = hashVerificationToken(token);
  const user = await prisma.user.findFirst({
    where: {
      verificationTokenHash: tokenHash,
      verificationTokenExpiresAt: { gt: new Date() },
    },
  });

  if (!user) {
    throw ApiError.badRequest("This verification link is invalid or has expired.");
  }

  const verifiedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifiedAt: new Date(),
      verificationTokenHash: null,
      verificationTokenExpiresAt: null,
    },
  });

  await loginUser(verifiedUser.id);

  return json({
    success: true,
    user: { id: verifiedUser.id, email: verifiedUser.email, name: verifiedUser.name },
  });
});

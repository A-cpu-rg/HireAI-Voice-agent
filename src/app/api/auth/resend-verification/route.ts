import { assertSameOrigin, getClientIp, json, parseBody, withRoute } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { resendVerificationSchema } from "@/lib/schemas";
import { issueAndSendVerification } from "@/services/auth.service";

export const POST = withRoute(async (req) => {
  assertSameOrigin(req);
  enforceRateLimit(`resend:${getClientIp(req)}`, RATE_LIMITS.email);

  const { email } = await parseBody(req, resendVerificationSchema);

  const user = await prisma.user.findUnique({ where: { email } });

  // Only send when the account exists and is unverified, but always return the
  // same response so the endpoint does not disclose which emails are registered.
  let previewUrl: string | undefined;
  if (user && !user.emailVerifiedAt) {
    const delivery = await issueAndSendVerification(user);
    if ("previewUrl" in delivery) previewUrl = delivery.previewUrl;
  }

  return json({
    success: true,
    message: "If an account needs verification, a new link has been sent.",
    previewUrl,
  });
});

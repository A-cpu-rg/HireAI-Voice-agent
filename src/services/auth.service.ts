import { prisma } from "@/lib/prisma";
import { buildVerificationUrl, generateVerificationToken } from "@/lib/email-verification";
import { sendVerificationEmail } from "@/lib/mailer";

/**
 * Issue a fresh verification token for a user, persist its hash, and send the
 * email. Shared by registration and resend so the token lifecycle lives in one
 * place. Returns the delivery result (which includes a preview URL only in dev).
 */
export async function issueAndSendVerification(user: {
  id: string;
  email: string;
  name: string | null;
}) {
  const { token, tokenHash, expiresAt } = generateVerificationToken();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      verificationTokenHash: tokenHash,
      verificationTokenExpiresAt: expiresAt,
    },
  });

  return sendVerificationEmail({
    to: user.email,
    name: user.name,
    verificationUrl: buildVerificationUrl(token),
  });
}

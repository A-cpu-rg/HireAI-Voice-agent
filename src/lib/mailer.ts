import { env, isProduction } from "@/env";
import { logger } from "./logger";
import { fetchWithTimeout } from "./http";

interface SendVerificationEmailArgs {
  to: string;
  name?: string | null;
  verificationUrl: string;
}

export async function sendVerificationEmail({
  to,
  name,
  verificationUrl,
}: SendVerificationEmailArgs) {
  const resendApiKey = env.RESEND_API_KEY;
  const emailFrom = env.EMAIL_FROM;

  const subject = "Verify your HireAI account";
  const greeting = name?.trim() ? `Hi ${name.trim()},` : "Hi,";
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;">
      <h2 style="margin-bottom:12px;">Verify your email</h2>
      <p>${greeting}</p>
      <p>Thanks for creating your HireAI account. Confirm your email to activate login and access the app.</p>
      <p style="margin:24px 0;">
        <a href="${verificationUrl}" style="background:#0f766e;color:#ffffff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:600;">
          Verify email
        </a>
      </p>
      <p>If the button does not work, open this link:</p>
      <p><a href="${verificationUrl}">${verificationUrl}</a></p>
      <p>This link expires in 24 hours.</p>
    </div>
  `;

  const text = `${greeting}\n\nVerify your HireAI account:\n${verificationUrl}\n\nThis link expires in 24 hours.`;

  if (!resendApiKey || !emailFrom) {
    if (!isProduction) {
      logger.warn("Email delivery not configured; logging verification link for local dev", {
        to,
        verificationUrl,
      });
      return { delivered: false as const, previewUrl: verificationUrl };
    }

    throw new Error("Email delivery is not configured. Set RESEND_API_KEY and EMAIL_FROM.");
  }

  const response = await fetchWithTimeout("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: emailFrom, to: [to], subject, html, text }),
    timeoutMs: 10_000,
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error("Resend rejected verification email", { status: response.status, errorText });
    throw new Error("Failed to send verification email.");
  }

  return { delivered: true as const };
}

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
  const resendApiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM;

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
    if (process.env.NODE_ENV !== "production") {
      console.log("[Verification Email Preview]");
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Verify URL: ${verificationUrl}`);
      return { delivered: false, previewUrl: verificationUrl };
    }

    throw new Error("Email delivery is not configured. Set RESEND_API_KEY and EMAIL_FROM.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: emailFrom,
      to: [to],
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to send verification email: ${errorText}`);
  }

  return { delivered: true };
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildVerificationUrl, generateVerificationToken } from "@/lib/email-verification";
import { sendVerificationEmail } from "@/lib/mailer";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json({ error: "No account found for this email." }, { status: 404 });
    }

    if (user.emailVerifiedAt) {
      return NextResponse.json({ error: "This email is already verified." }, { status: 409 });
    }

    const { token, tokenHash, expiresAt } = generateVerificationToken();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationTokenHash: tokenHash,
        verificationTokenExpiresAt: expiresAt,
      },
    });

    const verificationUrl = buildVerificationUrl(token);
    const delivery = await sendVerificationEmail({
      to: user.email,
      name: user.name,
      verificationUrl,
    });

    return NextResponse.json({
      success: true,
      message: "Verification email sent.",
      previewUrl: "previewUrl" in delivery ? delivery.previewUrl : undefined,
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to resend verification email." }, { status: 500 });
  }
}

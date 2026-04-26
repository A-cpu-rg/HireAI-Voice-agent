import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { buildVerificationUrl, generateVerificationToken } from "@/lib/email-verification";
import { sendVerificationEmail } from "@/lib/mailer";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const trimmedName = String(name || "").trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser?.emailVerifiedAt) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const { token, tokenHash, expiresAt } = generateVerificationToken();

    const user = existingUser
      ? await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            name: trimmedName || existingUser.name || normalizedEmail.split("@")[0],
            passwordHash: hashPassword(password),
            verificationTokenHash: tokenHash,
            verificationTokenExpiresAt: expiresAt,
          },
        })
      : await prisma.user.create({
          data: {
            name: trimmedName || normalizedEmail.split("@")[0],
            email: normalizedEmail,
            passwordHash: hashPassword(password),
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
      ok: true,
      requiresVerification: true,
      message: "Account created. Verify your email before logging in.",
      previewUrl: "previewUrl" in delivery ? delivery.previewUrl : undefined,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create account." }, { status: 500 });
  }
}

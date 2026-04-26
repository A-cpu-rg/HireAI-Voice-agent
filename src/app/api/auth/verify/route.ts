import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashVerificationToken } from "@/lib/email-verification";
import { loginUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Verification token is required." }, { status: 400 });
    }

    const tokenHash = hashVerificationToken(token);
    const user = await prisma.user.findFirst({
      where: {
        verificationTokenHash: tokenHash,
        verificationTokenExpiresAt: { gt: new Date() },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "This verification link is invalid or has expired." }, { status: 400 });
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

    return NextResponse.json({
      success: true,
      user: {
        id: verifiedUser.id,
        email: verifiedUser.email,
        name: verifiedUser.name,
      },
    });
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.json({ error: "Failed to verify email." }, { status: 500 });
  }
}


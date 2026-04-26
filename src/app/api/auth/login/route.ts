import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, loginUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Attempt to locate user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "User not found, please create a new account" }, { status: 404 });
    }

    if (!user.emailVerifiedAt) {
      return NextResponse.json({ error: "Please verify your email before logging in.", code: "EMAIL_NOT_VERIFIED" }, { status: 403 });
    }

    // Verify Password
    const isValid = verifyPassword(password, user.passwordHash);
    
    if (!isValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Establish session cookies
    await loginUser(user.id);

    return NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error: any) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "An internal error occurred" }, { status: 500 });
  }
}

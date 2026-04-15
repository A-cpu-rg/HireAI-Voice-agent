import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, loginUser } from "@/lib/auth";

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

    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        name: trimmedName || normalizedEmail.split("@")[0],
        email: normalizedEmail,
        passwordHash: hashPassword(password),
      },
    });

    await loginUser(user.id);

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Failed to create account." }, { status: 500 });
  }
}

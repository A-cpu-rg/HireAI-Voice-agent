import { NextResponse } from "next/server";
import { logoutUser } from "@/lib/auth";

export async function POST() {
  try {
    await logoutUser();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Failed to log out." }, { status: 500 });
  }
}

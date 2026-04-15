import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { apiKey, agentId } = await req.json();

    if (!apiKey || !agentId) {
      return NextResponse.json({ error: "API key and Agent ID are required." }, { status: 400 });
    }

    const res = await fetch(`https://api.bolna.ai/v2/agent/${agentId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json({ ok: false, error: errorText || "Connection failed" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Config test error:", error);
    return NextResponse.json({ error: "Failed to test Bolna connection" }, { status: 500 });
  }
}

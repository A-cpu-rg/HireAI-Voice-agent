import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
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

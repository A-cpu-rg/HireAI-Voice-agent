import { NextResponse } from 'next/server';
import { BolnaService } from '@/services/bolna.service';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    console.log("[Webhook Received]", JSON.stringify(payload, null, 2));

    await BolnaService.processWebhook(payload);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Webhook Error]:", error.message);
    return NextResponse.json({ error: error.message }, { status: 400 }); // Retrying could happen if bolna respects 400s
  }
}

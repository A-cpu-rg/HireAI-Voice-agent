import { NextResponse } from 'next/server';
import { BolnaService } from '@/services/bolna.service';

/**
 * Bolna Webhook Endpoint
 * This is a PUBLIC endpoint (no auth) that Bolna calls when a screening call finishes.
 * It delegates all DB logic to BolnaService.processWebhook for transactional safety.
 */
export async function POST(req: Request) {
  try {
    const payload = await req.json();
    console.log("[Webhook] Received Bolna callback:", JSON.stringify(payload).slice(0, 200));

    await BolnaService.processWebhook(payload);

    return new Response(null, { status: 200 });
  } catch (error: any) {
    console.error("Webhook error:", error.message);
    // Always return 200 to Bolna to prevent retries on our known errors
    return new Response(null, { status: 200 });
  }
}

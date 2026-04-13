import { NextResponse } from 'next/server';
import { BolnaService } from '@/services/bolna.service';

export async function POST(req: Request) {
  try {
    const { apiKey, agentId, candidateId } = await req.json();

    if (!apiKey || !agentId || !candidateId) {
      return NextResponse.json({ error: 'Missing required configuration or candidate ID' }, { status: 400 });
    }

    const { call_id } = await BolnaService.triggerOutboundCall(apiKey, agentId, candidateId);
    return NextResponse.json({ success: true, call_id });
  } catch (error: any) {
    console.error('[Call Proxy Error]:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

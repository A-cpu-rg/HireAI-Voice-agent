import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { BolnaService } from '@/services/bolna.service';

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { candidateId } = await req.json();

    if (!user.apiKey || !user.agentId) {
      return NextResponse.json({ error: 'Missing Bolna credentials. Configure them in Settings first.' }, { status: 400 });
    }

    // Get candidate — use findFirst for multi-tenant scoping
    const candidate = await prisma.candidate.findFirst({
      where: { id: candidateId, userId: user.id }
    });

    if (!candidate) return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });

    // Call the Bolna API (service only makes HTTP call, no DB writes)
    const { call_id } = await BolnaService.triggerOutboundCall(user.apiKey, user.agentId, candidateId);

    // Save records in a transaction using relation connect syntax
    await prisma.$transaction([
      prisma.callLog.create({
        data: {
          id: call_id,
          candidateName: candidate.name,
          role: candidate.role,
          status: 'in-progress',
          agentId: user.agentId,
          candidate: { connect: { id: candidate.id } },
          user: { connect: { id: user.id } },
        }
      }),
      prisma.candidate.update({
        where: { id: candidate.id },
        data: { status: 'in_progress', callId: call_id }
      })
    ]);

    return NextResponse.json({ success: true, call_id });
  } catch (error: any) {
    console.error('[Call Proxy Error]:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

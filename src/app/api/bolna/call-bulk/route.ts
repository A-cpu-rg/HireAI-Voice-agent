import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { BolnaService } from '@/services/bolna.service';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { candidateIds } = await req.json();

    if (!user.apiKey || !user.agentId) {
      return NextResponse.json({ error: 'Missing Bolna credentials. Configure them in Settings first.' }, { status: 400 });
    }

    if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
        return NextResponse.json({ error: 'No candidates selected' }, { status: 400 });
    }

    // Get candidates — use findMany for multi-tenant scoping
    const candidates = await prisma.candidate.findMany({
      where: { id: { in: candidateIds }, userId: user.id },
      include: { job: true }
    });

    if (candidates.length === 0) return NextResponse.json({ error: 'No candidates found' }, { status: 404 });

    const results = [];
    const errors = [];

    // Queue-based calling to avoid rate limit spam on Bolna APIs
    for (const candidate of candidates) {
      try {
        // Call the Bolna API with injected Smart Prompt if available
        const { call_id } = await BolnaService.triggerOutboundCall(user.apiKey, user.agentId, candidate.id, (candidate.job as any)?.smartPrompt || undefined);

        // Save records
        await prisma.$transaction([
          prisma.callLog.create({
            data: {
              id: call_id,
              candidateName: candidate.name,
              role: candidate.role,
              status: 'calling',
              agentId: user.agentId,
              candidate: { connect: { id: candidate.id } },
              user: { connect: { id: user.id } },
            }
          }),
          prisma.candidate.update({
            where: { id: candidate.id },
            data: { callStatus: 'calling', decisionStatus: 'undecided', callId: call_id }
          })
        ]);
        
        results.push({ candidateId: candidate.id, call_id });
      } catch (err: any) {
        errors.push({ candidateId: candidate.id, error: err.message });
        
        await prisma.candidate.update({
            where: { id: candidate.id },
            data: { callStatus: 'failed' }
        });
      }

      // Small delay between calls to be safe
      await delay(1500);
    }

    return NextResponse.json({ success: true, results, errors });
  } catch (error: any) {
    console.error('[Bulk Call Error]:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

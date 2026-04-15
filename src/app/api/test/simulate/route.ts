import { NextResponse } from 'next/server';
import { BolnaService } from '@/services/bolna.service';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { candidateId } = await req.json();

    if (!candidateId) {
      return NextResponse.json({ error: 'Missing candidate ID' }, { status: 400 });
    }

    // Find the latest call for this candidate that is still active.
    const callLog = await prisma.callLog.findFirst({
        where: { candidateId, userId: user.id, status: { in: ["calling", "processing"] } },
        orderBy: { startedAt: "desc" }
    });

    if (!callLog) {
      return NextResponse.json({ error: 'No active calls found for this candidate. Initiate a call first.' }, { status: 404 });
    }

    const simulatedPayload = {
      event: "call.completed",
      call_id: callLog.id,
      data: {
        duration: "3m 42s",
        extraction: {
          technical_depth_score: 90,
          communication_score: 85,
          problem_solving_score: 92,
          enthusiasm_score: 88,
          strengths: ["Strong problem solving", "Excellent technical depth", "Great communication"],
          concerns: ["Needs more domain context"],
          summary: "This was a locally simulated AI call completing flawlessly.",
          tech_stack: ["Next.js", "Prisma", "TypeScript"],
          notice_period: "Immediate",
          salary_expectation: "20 LPA"
        },
        transcript: [
          { role: "agent", text: "Hello! Thank you for testing the simulator.", timestamp: "00:00" },
          { role: "user", text: "You're welcome! Does the database save this?", timestamp: "00:10" },
          { role: "agent", text: "Yes, it flawlessly writes into SQLite within a transaction lock.", timestamp: "00:20" }
        ]
      }
    };

    console.log("[Simulation] Firing simulated Bolna webhook for Call:", callLog.id);
    await BolnaService.processWebhook(simulatedPayload);

    return NextResponse.json({ success: true, simulated: true, call_id: callLog.id });
  } catch (error: any) {
    console.error('[Simulation Error]:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

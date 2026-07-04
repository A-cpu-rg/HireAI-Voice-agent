import { ApiError, assertSameOrigin, json, parseBody, requireUser, withRoute } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { isProduction } from "@/env";
import { triggerCallSchema } from "@/lib/schemas";
import { BolnaService } from "@/services/bolna.service";

/**
 * Development-only helper: fires a simulated Bolna webhook against a candidate's
 * active call so the results pipeline can be exercised without a live phone
 * call. Disabled in production so simulated scores can never enter real data.
 */
export const POST = withRoute(async (req) => {
  if (isProduction) throw ApiError.notFound();

  assertSameOrigin(req);
  const user = await requireUser();
  const { candidateId } = await parseBody(req, triggerCallSchema);

  const callLog = await prisma.callLog.findFirst({
    where: { candidateId, userId: user.id, status: { in: ["calling", "processing"] } },
    orderBy: { startedAt: "desc" },
  });
  if (!callLog) {
    throw ApiError.notFound("No active call for this candidate. Start a call first.");
  }

  await BolnaService.processWebhook({
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
        summary: "Simulated screening call (development only).",
        tech_stack: ["Next.js", "Prisma", "TypeScript"],
        notice_period: "Immediate",
        salary_expectation: "20 LPA",
      },
      transcript: [
        { role: "agent", text: "Hello! Thanks for taking the time today.", timestamp: "00:00" },
        { role: "user", text: "Happy to be here.", timestamp: "00:10" },
      ],
    },
  });

  return json({ success: true, simulated: true, callId: callLog.id });
});

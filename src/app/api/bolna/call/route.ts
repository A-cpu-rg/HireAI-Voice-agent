import {
  ApiError,
  assertSameOrigin,
  getClientIp,
  json,
  parseBody,
  requireUser,
  withRoute,
} from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { triggerCallSchema } from "@/lib/schemas";
import { BolnaService } from "@/services/bolna.service";

export const POST = withRoute(async (req) => {
  assertSameOrigin(req);
  const user = await requireUser();
  enforceRateLimit(`call:${user.id}:${getClientIp(req)}`, RATE_LIMITS.calls);

  const { candidateId } = await parseBody(req, triggerCallSchema);

  if (!user.apiKey || !user.agentId) {
    throw ApiError.badRequest("Missing Bolna credentials. Configure them in Settings first.");
  }

  const candidate = await prisma.candidate.findFirst({
    where: { id: candidateId, userId: user.id },
    include: { job: true },
  });
  if (!candidate) throw ApiError.notFound("Candidate not found.");

  const { callId } = await BolnaService.triggerOutboundCall({
    apiKey: user.apiKey,
    agentId: user.agentId,
    candidate,
    smartPrompt: candidate.job?.smartPrompt ?? undefined,
  });

  await prisma.$transaction([
    prisma.callLog.create({
      data: {
        id: callId,
        candidateName: candidate.name,
        role: candidate.role,
        status: "calling",
        agentId: user.agentId,
        candidate: { connect: { id: candidate.id } },
        user: { connect: { id: user.id } },
      },
    }),
    prisma.candidate.update({
      where: { id: candidate.id },
      data: { callStatus: "calling", callId },
    }),
  ]);

  return json({ success: true, callId });
});

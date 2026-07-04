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
import { logger } from "@/lib/logger";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { bulkCallSchema } from "@/lib/schemas";
import { BolnaService } from "@/services/bolna.service";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Trigger outbound calls for a batch of candidates. The batch is capped
 * (see bulkCallSchema) so it completes within a request timeout; larger
 * campaigns should be moved to a durable queue/worker.
 */
export const POST = withRoute(async (req) => {
  assertSameOrigin(req);
  const user = await requireUser();
  enforceRateLimit(`call-bulk:${user.id}:${getClientIp(req)}`, RATE_LIMITS.calls);

  const { candidateIds } = await parseBody(req, bulkCallSchema);

  if (!user.apiKey || !user.agentId) {
    throw ApiError.badRequest("Missing Bolna credentials. Configure them in Settings first.");
  }

  const candidates = await prisma.candidate.findMany({
    where: { id: { in: candidateIds }, userId: user.id },
    include: { job: true },
  });
  if (candidates.length === 0) throw ApiError.notFound("No matching candidates found.");

  const results: { candidateId: string; callId: string }[] = [];
  const errors: { candidateId: string; error: string }[] = [];

  for (const candidate of candidates) {
    try {
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

      results.push({ candidateId: candidate.id, callId });
    } catch (error) {
      logger.error("Bulk call failed for candidate", { candidateId: candidate.id, error });
      errors.push({
        candidateId: candidate.id,
        error: error instanceof Error ? error.message : "Call failed",
      });
      await prisma.candidate.update({
        where: { id: candidate.id },
        data: { callStatus: "failed" },
      });
    }

    await delay(800);
  }

  return json({ success: true, results, errors });
});

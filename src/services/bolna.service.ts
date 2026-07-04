import type { Candidate } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { fetchWithTimeout } from "@/lib/http";
import type { Recommendation } from "@/lib/constants";

const BOLNA_API_BASE = "https://api.bolna.ai";

/** Loose shape of the Bolna webhook body — fields are provider-dependent. */
interface BolnaWebhookPayload {
  call_id?: string;
  headers?: { call_id?: string };
  data?: {
    call_id?: string;
    extraction?: Record<string, unknown>;
    transcript?: unknown;
    duration?: string;
  };
  extraction?: Record<string, unknown>;
  extracted_data?: Record<string, unknown>;
  transcript?: unknown;
}

/** Parse a value into a 0–100 integer, or null if it is not a real number. */
function parseScore(value: unknown): number | null {
  const n =
    typeof value === "number" ? value : typeof value === "string" ? parseInt(value, 10) : NaN;
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v)).filter(Boolean);
  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function recommendationFor(overall: number): Recommendation {
  if (overall >= 80) return "Shortlist";
  if (overall >= 65) return "Hold";
  return "Reject";
}

export const BolnaService = {
  /**
   * Trigger an outbound screening call. The caller must pass a candidate it has
   * already loaded and authorised (tenant-scoped) — this service does no
   * ownership checks of its own.
   */
  async triggerOutboundCall(params: {
    apiKey: string;
    agentId: string;
    candidate: Pick<Candidate, "id" | "name" | "phone" | "role">;
    smartPrompt?: string;
  }): Promise<{ callId: string }> {
    const { apiKey, agentId, candidate, smartPrompt } = params;

    const response = await fetchWithTimeout(`${BOLNA_API_BASE}/call`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agent_id: agentId,
        recipient_phone_number: candidate.phone,
        user_data: {
          candidate_id: candidate.id,
          candidate_name: candidate.name,
          role: candidate.role,
          smartPrompt: smartPrompt || "Explore their general professional background.",
        },
      }),
      timeoutMs: 15_000,
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("Bolna rejected outbound call", {
        status: response.status,
        candidateId: candidate.id,
        errorText,
      });
      throw new Error("The voice provider rejected the call request.");
    }

    const data = (await response.json()) as { call_id?: string };
    if (!data.call_id) {
      throw new Error("The voice provider did not return a call id.");
    }
    return { callId: data.call_id };
  },

  /**
   * Persist the result of a completed call. Idempotent: replays overwrite the
   * same rows rather than duplicating transcript messages. Scores are taken from
   * the provider's extraction verbatim — when they are absent, the call is marked
   * completed with no screening result rather than inventing numbers.
   */
  async processWebhook(
    payload: BolnaWebhookPayload
  ): Promise<{ status: "processed" | "ignored"; scored?: boolean; reason?: string }> {
    const callId = payload.call_id ?? payload.headers?.call_id ?? payload.data?.call_id;
    if (!callId) {
      logger.warn("Webhook ignored: no call_id in payload");
      return { status: "ignored", reason: "missing_call_id" };
    }

    const callLog = await prisma.callLog.findUnique({ where: { id: callId } });
    if (!callLog) {
      logger.warn("Webhook ignored: no matching call log", { callId });
      return { status: "ignored", reason: "unknown_call_id" };
    }

    const extraction =
      payload.data?.extraction ?? payload.extraction ?? payload.extracted_data ?? {};

    const technical = parseScore(extraction.technical_depth_score);
    const communication = parseScore(extraction.communication_score);
    const problemSolving = parseScore(extraction.problem_solving_score);
    const cultureFit = parseScore(extraction.enthusiasm_score);

    const scores = [technical, communication, problemSolving, cultureFit];
    const hasFullScores = scores.every((s): s is number => s !== null);
    const overall = hasFullScores
      ? Math.round((technical! + communication! + problemSolving! + cultureFit!) / 4)
      : null;

    const rawTranscript = payload.data?.transcript ?? payload.transcript;
    const transcriptData = Array.isArray(rawTranscript)
      ? rawTranscript.map((message: Record<string, unknown>) => ({
          candidateId: callLog.candidateId,
          role: String(message.role ?? "")
            .toLowerCase()
            .includes("user")
            ? "candidate"
            : "agent",
          text: String(message.text ?? message.content ?? ""),
          timestamp: String(message.timestamp ?? "00:00"),
        }))
      : [];

    const duration = payload.data?.duration;

    await prisma.$transaction(async (tx) => {
      await tx.candidate.update({
        where: { id: callLog.candidateId },
        data: { callStatus: "completed", score: overall, completedAt: new Date() },
      });

      await tx.callLog.update({
        where: { id: callId },
        data: {
          status: "completed",
          score: overall,
          ...(duration ? { duration } : {}),
        },
      });

      if (hasFullScores) {
        const screening = {
          technicalScore: technical!,
          communicationScore: communication!,
          problemSolvingScore: problemSolving!,
          cultureFitScore: cultureFit!,
          overallScore: overall!,
          strengths: JSON.stringify(toStringArray(extraction.strengths)),
          concerns: JSON.stringify(toStringArray(extraction.concerns)),
          recommendation: recommendationFor(overall!),
          summary: typeof extraction.summary === "string" ? extraction.summary : "",
          keySkills: JSON.stringify(toStringArray(extraction.tech_stack)),
          availability:
            typeof extraction.notice_period === "string" ? extraction.notice_period : "",
          salaryExpectation:
            typeof extraction.salary_expectation === "string" ? extraction.salary_expectation : "",
        };

        await tx.screeningResult.upsert({
          where: { candidateId: callLog.candidateId },
          update: screening,
          create: { candidateId: callLog.candidateId, ...screening },
        });
      }

      // Idempotent transcript: replace rather than append on replay.
      await tx.transcriptMessage.deleteMany({ where: { candidateId: callLog.candidateId } });
      if (transcriptData.length > 0) {
        await tx.transcriptMessage.createMany({ data: transcriptData });
      }
    });

    logger.info("Processed Bolna webhook", {
      callId,
      candidateId: callLog.candidateId,
      scored: hasFullScores,
    });

    return { status: "processed", scored: hasFullScores };
  },
};

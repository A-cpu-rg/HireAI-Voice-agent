import { prisma } from "@/lib/prisma";
import { clamp } from "@/lib/text-metrics";
import { documentSimilarity } from "./fraud-detection";
import type { CreateCandidateInput } from "@/lib/schemas";

/**
 * Create a candidate, persisting any resume-parsing intelligence and fraud
 * signals produced by /api/parse-resume. Duplicate-resume detection runs
 * server-side against the tenant's existing resume analyses so it cannot be
 * bypassed by the client.
 */
export async function createCandidateWithIntelligence(userId: string, data: CreateCandidateInput) {
  const { intelligence, fraud } = data;

  const fraudFlags = new Set((fraud?.flags ?? []).map((f) => f.code));
  let fraudScore = fraud?.fraudScore ?? null;

  if (intelligence?.summary) {
    const peers = await prisma.resumeAnalysis.findMany({
      where: { candidate: { userId } },
      select: { summary: true },
    });
    const isDuplicate = peers.some(
      (peer) => documentSimilarity(intelligence.summary, peer.summary) >= 0.85
    );
    if (isDuplicate) {
      fraudFlags.add("duplicate_resume");
      fraudScore = clamp((fraudScore ?? 0) + 45);
    }
  }

  const hasFraudSignal = fraud !== undefined || fraudFlags.size > 0;

  return prisma.candidate.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      experience: data.experience,
      location: data.location,
      avatarColor: data.avatarColor ?? "#3B82F6",
      appliedAt: data.appliedAt ? new Date(data.appliedAt) : new Date(),
      tags: data.tags ? JSON.stringify(data.tags) : null,
      callStatus: data.callStatus ?? "pending",
      decisionStatus: data.decisionStatus ?? "undecided",
      matchScore: data.matchScore ?? intelligence?.matchScore ?? null,
      matchConfidence: intelligence?.confidence ?? null,
      resumeUrl: data.resumeUrl ?? null,
      fraudScore,
      fraudFlags: fraudFlags.size ? JSON.stringify([...fraudFlags]) : null,
      fraudCheckedAt: hasFraudSignal ? new Date() : null,
      jobId: data.jobId ?? null,
      userId,
      ...(intelligence
        ? {
            resumeAnalysis: {
              create: {
                matchScore: intelligence.matchScore,
                confidence: intelligence.confidence,
                skills: JSON.stringify(intelligence.skills),
                strengths: JSON.stringify(intelligence.strengths),
                weaknesses: JSON.stringify(intelligence.weaknesses),
                summary: intelligence.summary,
                source: intelligence.source,
              },
            },
          }
        : {}),
    },
    include: { screeningResult: true, job: true, resumeAnalysis: true },
  });
}

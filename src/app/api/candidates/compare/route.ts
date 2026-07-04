import { ApiError, assertSameOrigin, json, parseBody, requireUser, withRoute } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { compareCandidatesSchema } from "@/lib/schemas";
import { computeRanking } from "@/lib/ranking";
import { compareCandidates, type ComparisonCandidate } from "@/services/comparison.service";
import { parseJsonArray } from "@/lib/serializers";

/** Side-by-side comparison of candidates with pros/cons, risk, and best fit. */
export const POST = withRoute(async (req) => {
  assertSameOrigin(req);
  const user = await requireUser();
  const { candidateIds } = await parseBody(req, compareCandidatesSchema);

  const candidates = await prisma.candidate.findMany({
    where: { id: { in: candidateIds }, userId: user.id },
    include: { screeningResult: true, resumeAnalysis: true, job: true },
  });
  if (candidates.length < 2) {
    throw ApiError.badRequest("At least two of your candidates are required to compare.");
  }

  const input: ComparisonCandidate[] = candidates.map((candidate) => {
    const jobSkills = candidate.job ? parseJsonArray(candidate.job.skills) : [];
    const resumeSkills = candidate.resumeAnalysis
      ? parseJsonArray(candidate.resumeAnalysis.skills)
      : [];
    const ranking = computeRanking({
      resumeSkills,
      jobSkills,
      experience: candidate.experience,
      screening: candidate.screeningResult
        ? {
            technicalScore: candidate.screeningResult.technicalScore,
            communicationScore: candidate.screeningResult.communicationScore,
          }
        : null,
      resumeConfidence: candidate.matchConfidence,
    });

    return {
      id: candidate.id,
      name: candidate.name,
      overallScore: ranking.overallScore,
      skillMatch: ranking.skillMatch,
      experience: candidate.experience,
      technicalScore: candidate.screeningResult?.technicalScore ?? null,
      communicationScore: candidate.screeningResult?.communicationScore ?? null,
      fraudScore: candidate.fraudScore,
    };
  });

  return json(compareCandidates(input));
});

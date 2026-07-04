import { z } from "zod";
import { ApiError, json, parseQuery, requireUser, withRoute } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { computeRanking } from "@/lib/ranking";
import { parseJsonArray, serializeCandidate } from "@/lib/serializers";

const rankQuerySchema = z.object({ jobId: z.string().uuid() });

/** Rank a job's candidates on a multi-dimension scorecard (highest first). */
export const GET = withRoute(async (req) => {
  const user = await requireUser();
  const { jobId } = parseQuery(req, rankQuerySchema);

  const job = await prisma.job.findFirst({ where: { id: jobId, userId: user.id } });
  if (!job) throw ApiError.notFound("Job not found.");

  const jobSkills = parseJsonArray(job.skills);
  const candidates = await prisma.candidate.findMany({
    where: { userId: user.id, jobId },
    include: { screeningResult: true, resumeAnalysis: true, job: true },
  });

  const ranked = candidates
    .map((candidate) => {
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
      return { candidate: serializeCandidate(candidate), ranking };
    })
    .sort((a, b) => b.ranking.overallScore - a.ranking.overallScore);

  return json({ data: ranked, job: { id: job.id, title: job.title, skills: jobSkills } });
});

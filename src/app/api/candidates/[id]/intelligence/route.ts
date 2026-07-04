import { ApiError, json, requireUser, withRoute } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { analyzeTranscript } from "@/services/interview-intelligence";

/** Derived interview-quality analysis from the candidate's transcript. */
export const GET = withRoute(async (req, { params }) => {
  const user = await requireUser();
  const { id } = await params;

  const candidate = await prisma.candidate.findFirst({
    where: { id, userId: user.id },
    select: { id: true, transcript: { orderBy: { id: "asc" } } },
  });
  if (!candidate) throw ApiError.notFound("Candidate not found.");

  const intelligence = analyzeTranscript(
    candidate.transcript.map((t) => ({ role: t.role, text: t.text, timestamp: t.timestamp }))
  );

  return json({ intelligence });
});

import { ApiError, assertSameOrigin, json, parseBody, requireUser, withRoute } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { serializeCandidate } from "@/lib/serializers";
import { updateCandidateSchema } from "@/lib/schemas";

export const GET = withRoute(async (req, { params }) => {
  const user = await requireUser();
  const { id } = await params;

  const candidate = await prisma.candidate.findFirst({
    where: { id, userId: user.id },
    include: {
      screeningResult: true,
      job: true,
      transcript: { orderBy: { id: "asc" } },
    },
  });
  if (!candidate) throw ApiError.notFound("Candidate not found.");

  return json({ candidate: serializeCandidate(candidate) });
});

export const PATCH = withRoute(async (req, { params }) => {
  assertSameOrigin(req);
  const user = await requireUser();
  const { id } = await params;
  const updates = await parseBody(req, updateCandidateSchema);

  // Scope the update itself by userId so ownership is enforced atomically.
  const result = await prisma.candidate.updateMany({
    where: { id, userId: user.id },
    data: updates,
  });
  if (result.count === 0) throw ApiError.notFound("Candidate not found.");

  const candidate = await prisma.candidate.findFirst({
    where: { id, userId: user.id },
    include: { screeningResult: true, job: true },
  });

  return json({ data: candidate ? serializeCandidate(candidate) : null });
});

import { Prisma } from "@prisma/client";
import {
  ApiError,
  assertSameOrigin,
  json,
  parseBody,
  parseQuery,
  requireUser,
  withRoute,
} from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { serializeCandidate } from "@/lib/serializers";
import { createCandidateSchema, listCandidatesSchema } from "@/lib/schemas";
import { createCandidateWithIntelligence } from "@/services/candidate.service";

export const GET = withRoute(async (req) => {
  const user = await requireUser();
  const query = parseQuery(req, listCandidatesSchema);

  const where: Prisma.CandidateWhereInput = { userId: user.id };
  const callStatus = query.callStatus ?? query.status;
  if (callStatus) where.callStatus = callStatus;
  if (query.decisionStatus) where.decisionStatus = query.decisionStatus;
  if (query.jobId) where.jobId = query.jobId;
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } },
      { role: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const orderByField =
    query.sortBy === "name"
      ? "name"
      : query.sortBy === "score"
        ? "score"
        : query.sortBy === "matchScore"
          ? "matchScore"
          : "appliedAt";

  const [total, candidates] = await Promise.all([
    prisma.candidate.count({ where }),
    prisma.candidate.findMany({
      where,
      include: { screeningResult: true, job: true },
      orderBy: { [orderByField]: query.sortOrder },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return json({
    data: candidates.map(serializeCandidate),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
  });
});

export const POST = withRoute(async (req) => {
  assertSameOrigin(req);
  const user = await requireUser();
  const data = await parseBody(req, createCandidateSchema);

  // IDOR guard: a candidate may only be linked to a job the caller owns.
  if (data.jobId) {
    const job = await prisma.job.findFirst({
      where: { id: data.jobId, userId: user.id },
      select: { id: true },
    });
    if (!job) throw ApiError.badRequest("Unknown job.");
  }

  const candidate = await createCandidateWithIntelligence(user.id, data);
  return json({ data: serializeCandidate(candidate) }, { status: 201 });
});

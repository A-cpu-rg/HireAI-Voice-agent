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
import { createInterviewSchema, listInterviewsSchema } from "@/lib/schemas";

const candidateSelect = {
  candidate: { select: { id: true, name: true, role: true, avatarColor: true } },
} as const;

export const GET = withRoute(async (req) => {
  const user = await requireUser();
  const query = parseQuery(req, listInterviewsSchema);

  const where: Prisma.InterviewWhereInput = { userId: user.id };
  if (query.status) where.status = query.status;
  if (query.candidateId) where.candidateId = query.candidateId;

  const [total, interviews] = await Promise.all([
    prisma.interview.count({ where }),
    prisma.interview.findMany({
      where,
      include: candidateSelect,
      orderBy: { scheduledAt: query.sortOrder },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return json({
    data: interviews,
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
  const data = await parseBody(req, createInterviewSchema);

  // Ownership: the candidate must belong to the caller.
  const candidate = await prisma.candidate.findFirst({
    where: { id: data.candidateId, userId: user.id },
    select: { id: true },
  });
  if (!candidate) throw ApiError.badRequest("Unknown candidate.");

  const interview = await prisma.interview.create({
    data: {
      candidateId: data.candidateId,
      userId: user.id,
      scheduledAt: new Date(data.scheduledAt),
      durationMins: data.durationMins,
      mode: data.mode,
      interviewer: data.interviewer,
      location: data.location,
      notes: data.notes,
    },
    include: candidateSelect,
  });

  return json({ data: interview }, { status: 201 });
});

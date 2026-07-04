import type { Prisma } from "@prisma/client";
import { ApiError, assertSameOrigin, json, parseBody, requireUser, withRoute } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { updateInterviewSchema } from "@/lib/schemas";

export const PATCH = withRoute(async (req, { params }) => {
  assertSameOrigin(req);
  const user = await requireUser();
  const { id } = await params;
  const { scheduledAt, ...rest } = await parseBody(req, updateInterviewSchema);

  const data: Prisma.InterviewUpdateManyMutationInput = { ...rest };
  if (scheduledAt) data.scheduledAt = new Date(scheduledAt);

  const result = await prisma.interview.updateMany({
    where: { id, userId: user.id },
    data,
  });
  if (result.count === 0) throw ApiError.notFound("Interview not found.");

  const interview = await prisma.interview.findFirst({
    where: { id, userId: user.id },
    include: { candidate: { select: { id: true, name: true, role: true, avatarColor: true } } },
  });

  return json({ data: interview });
});

export const DELETE = withRoute(async (req, { params }) => {
  assertSameOrigin(req);
  const user = await requireUser();
  const { id } = await params;

  const result = await prisma.interview.deleteMany({ where: { id, userId: user.id } });
  if (result.count === 0) throw ApiError.notFound("Interview not found.");

  return json({ ok: true });
});

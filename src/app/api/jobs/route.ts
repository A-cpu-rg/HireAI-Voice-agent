import { Prisma } from "@prisma/client";
import { assertSameOrigin, json, parseBody, parseQuery, requireUser, withRoute } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { serializeJob } from "@/lib/serializers";
import { createJobSchema, listJobsSchema } from "@/lib/schemas";

export const GET = withRoute(async (req) => {
  const user = await requireUser();
  const query = parseQuery(req, listJobsSchema);

  const where: Prisma.JobWhereInput = { userId: user.id };
  if (query.status) where.status = query.status;
  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: "insensitive" } },
      { department: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const [total, jobs] = await Promise.all([
    prisma.job.count({ where }),
    prisma.job.findMany({
      where,
      orderBy: { createdAt: query.sortOrder },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return json({
    data: jobs.map(serializeJob),
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
  const data = await parseBody(req, createJobSchema);

  const job = await prisma.job.create({
    data: {
      title: data.title,
      department: data.department,
      location: data.location,
      type: data.type,
      openings: data.openings,
      status: data.status,
      description: data.description,
      skills: JSON.stringify(data.skills),
      salaryRange: data.salaryRange,
      smartPrompt: data.smartPrompt ?? null,
      userId: user.id,
    },
  });

  return json({ data: serializeJob(job) }, { status: 201 });
});

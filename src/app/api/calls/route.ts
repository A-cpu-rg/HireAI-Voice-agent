import { Prisma } from "@prisma/client";
import { json, parseQuery, requireUser, withRoute } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { listCallsSchema } from "@/lib/schemas";

export const GET = withRoute(async (req) => {
  const user = await requireUser();
  const query = parseQuery(req, listCallsSchema);

  const where: Prisma.CallLogWhereInput = { userId: user.id };
  if (query.status) where.status = query.status;

  const [total, calls] = await Promise.all([
    prisma.callLog.count({ where }),
    prisma.callLog.findMany({
      where,
      orderBy: { startedAt: query.sortOrder },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return json({
    data: calls,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
  });
});

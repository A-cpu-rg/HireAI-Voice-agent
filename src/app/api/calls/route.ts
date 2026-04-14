import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const whereClause: any = { userId: user.id };
    if (status && status !== 'all') {
      whereClause.status = status;
    }

    const calls = await prisma.callLog.findMany({
      where: whereClause,
      orderBy: { startedAt: 'desc' }
    });
    return NextResponse.json({ data: calls });
  } catch (error) {
    console.error('Error fetching calls:', error);
    return NextResponse.json({ error: 'Failed to fetch calls' }, { status: 500 });
  }
}

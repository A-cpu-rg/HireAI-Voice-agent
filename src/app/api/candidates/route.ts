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

    const candidates = await prisma.candidate.findMany({
      where: whereClause,
      include: {
        screeningResult: true,
        transcript: true,
      },
      orderBy: { appliedAt: 'desc' },
    });

    const parsed = candidates.map((c) => {
      const result: any = {
        ...c,
        tags: c.tags ? JSON.parse(c.tags) : undefined,
      };
      if (c.screeningResult) {
        result.screeningResult = {
          ...c.screeningResult,
          strengths: JSON.parse(c.screeningResult.strengths),
          concerns: JSON.parse(c.screeningResult.concerns),
          keySkills: JSON.parse(c.screeningResult.keySkills),
        };
      }
      return result;
    });

    return NextResponse.json({ data: parsed });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch candidates' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await req.json();
    const candidate = await prisma.candidate.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        experience: Number(data.experience),
        location: data.location,
        avatarColor: data.avatarColor || '#3B82F6',
        appliedAt: data.appliedAt ? new Date(data.appliedAt) : new Date(),
        tags: data.tags ? JSON.stringify(data.tags) : null,
        status: data.status || 'pending',
        user: { connect: { id: user.id } }, // Relation connect syntax
      }
    });

    return NextResponse.json({ data: { ...candidate, tags: data.tags } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create candidate' }, { status: 500 });
  }
}

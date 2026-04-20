import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const callStatus = searchParams.get('callStatus') || searchParams.get('status');
    const decisionStatus = searchParams.get('decisionStatus');

    const whereClause: any = { userId: user.id };
    if (callStatus && callStatus !== 'all') {
      whereClause.callStatus = callStatus;
    }
    if (decisionStatus && decisionStatus !== 'all') {
      whereClause.decisionStatus = decisionStatus;
    }

    const candidates = await prisma.candidate.findMany({
      where: whereClause,
      include: {
        screeningResult: true,
        transcript: true,
        job: true,
      },
      orderBy: { appliedAt: 'desc' },
    });

    const parsed = candidates.map((c) => {
      const result: any = {
        ...c,
        tags: c.tags ? JSON.parse(c.tags) : undefined,
        job: c.job ? { ...c.job, skills: c.job.skills ? JSON.parse(c.job.skills) : [] } : null,
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
    const candidate = await (prisma.candidate as any).create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || "",
        role: data.role,
        experience: Number(data.experience) || 0,
        location: data.location || "Remote",
        avatarColor: data.avatarColor || '#3B82F6',
        appliedAt: data.appliedAt ? new Date(data.appliedAt) : new Date(),
        tags: data.tags ? JSON.stringify(data.tags) : null,
        callStatus: data.callStatus || 'pending',
        decisionStatus: data.decisionStatus || 'undecided',
        matchScore: data.matchScore ?? null,
        job: data.jobId ? { connect: { id: data.jobId } } : undefined,
        user: { connect: { id: user.id } },
      }
    });

    return NextResponse.json({ data: { ...candidate, tags: data.tags } });
  } catch (error: any) {
    console.error('Failed to create candidate:', JSON.stringify(error?.message || error, null, 2));
    return NextResponse.json({ error: error?.message || 'Failed to create candidate' }, { status: 500 });
  }
}

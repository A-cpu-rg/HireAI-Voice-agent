import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const jobs = await prisma.job.findMany();
    const parsed = jobs.map((j: any) => ({
      ...j,
      skills: j.skills ? JSON.parse(j.skills) : [],
    }));
    return NextResponse.json(parsed);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await req.json();

    const job = await prisma.job.create({
      data: {
        title: data.title,
        department: data.department,
        location: data.location,
        type: data.type,
        openings: Number(data.openings || 1),
        description: data.description,
        skills: JSON.stringify(data.skills || []),
        salaryRange: data.salaryRange,
      },
    });

    return NextResponse.json({
      ...job,
      skills: data.skills || [],
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }
}

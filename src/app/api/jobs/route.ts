import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
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

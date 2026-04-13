import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const candidates = await prisma.candidate.findMany({
      include: {
        screeningResult: true,
        transcript: true,
      },
      orderBy: { appliedAt: 'desc' },
    });

    const parsed = candidates.map((c: any) => ({
      ...c,
      tags: c.tags ? JSON.parse(c.tags) : undefined,
      screeningResult: c.screeningResult ? {
        ...c.screeningResult,
        strengths: JSON.parse(c.screeningResult.strengths),
        concerns: JSON.parse(c.screeningResult.concerns),
        keySkills: JSON.parse(c.screeningResult.keySkills),
      } : undefined
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch candidates' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const candidate = await prisma.candidate.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        experience: Number(data.experience),
        location: data.location,
        avatarColor: data.avatarColor,
        appliedAt: data.appliedAt ? new Date(data.appliedAt) : new Date(),
        tags: data.tags ? JSON.stringify(data.tags) : null,
      }
    });

    return NextResponse.json({ ...candidate, tags: data.tags });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create candidate' }, { status: 500 });
  }
}

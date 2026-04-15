import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    
    // Use findFirst with both id + userId for multi-tenant scoping
    const candidate = await prisma.candidate.findFirst({
      where: { id, userId: user.id },
      include: {
        screeningResult: true,
        transcript: true,
        job: true,
      }
    });

    if (!candidate) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Parse JSON fields before sending to client
    const parsed: any = {
      ...candidate,
      tags: candidate.tags ? JSON.parse(candidate.tags) : [],
      job: candidate.job ? { ...candidate.job, skills: candidate.job.skills ? JSON.parse(candidate.job.skills) : [] } : null,
      screeningResult: candidate.screeningResult ? {
        ...candidate.screeningResult,
        strengths: JSON.parse(candidate.screeningResult.strengths),
        concerns: JSON.parse(candidate.screeningResult.concerns),
        keySkills: JSON.parse(candidate.screeningResult.keySkills),
      } : undefined
    };

    return NextResponse.json({ candidate: parsed });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch candidate detail' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const updateData: any = {};
    if (body.callStatus) updateData.callStatus = body.callStatus;
    if (body.decisionStatus) updateData.decisionStatus = body.decisionStatus;
    if (body.score !== undefined) updateData.score = body.score;

    // First ensure the candidate belongs to the user
    const existing = await prisma.candidate.findFirst({
      where: { id, userId: user.id }
    });

    if (!existing) {
       return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const candidate = await prisma.candidate.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ data: candidate });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update candidate' }, { status: 500 });
  }
}

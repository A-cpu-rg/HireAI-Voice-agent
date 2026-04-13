import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updateData: any = {};
    if (body.status) updateData.status = body.status;

    const candidate = await prisma.candidate.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(candidate);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update candidate' }, { status: 500 });
  }
}

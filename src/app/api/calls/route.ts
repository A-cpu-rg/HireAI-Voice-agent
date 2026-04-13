import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const calls = await prisma.callLog.findMany({
      orderBy: { startedAt: 'desc' }
    });
    return NextResponse.json(calls);
  } catch (error) {
    console.error('Error fetching calls:', error);
    return NextResponse.json({ error: 'Failed to fetch calls' }, { status: 500 });
  }
}

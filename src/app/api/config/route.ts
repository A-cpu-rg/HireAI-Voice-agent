import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasKey = !!user.apiKey;
    const hasAgent = !!user.agentId;

    return NextResponse.json({
      hasKey,
      hasAgent,
      mode: 'live',
      maskedApiKey: user.apiKey ? `${user.apiKey.slice(0, 6)}••••${user.apiKey.slice(-4)}` : '',
      agentId: user.agentId || '',
    });
  } catch (error) {
    console.error("Config GET error:", error);
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { apiKey, agentId } = await req.json();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        apiKey: apiKey?.trim() ? apiKey.trim() : user.apiKey,
        agentId: agentId?.trim() || null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Config POST error:", error);
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
  }
}

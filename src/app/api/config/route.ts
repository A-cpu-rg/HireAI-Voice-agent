import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, loginMockUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    
    // Auto-create a mock user for testing if none exists
    // This is purely for demoing the SaaS without a full auth provider.
    if (!user) {
      const newUser = await prisma.user.create({
        data: {
          email: `demo-${Date.now()}@navisvoice.com`,
          name: 'Demo User'
        }
      });
      await loginMockUser(newUser.id);
      return NextResponse.json({
        hasKey: false,
        hasAgent: false,
        isNewUser: true,
      });
    }

    return NextResponse.json({
      hasKey: !!user.apiKey,
      hasAgent: !!user.agentId,
      apiKey: user.apiKey || '', // Often best to redact this if frontend doesn't need to display it
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
      data: { apiKey, agentId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Config POST error:", error);
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
  }
}

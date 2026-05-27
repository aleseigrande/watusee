import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { challengeId, type } = await req.json();
    if (!challengeId || !type) {
      return NextResponse.json({ error: 'challengeId and type required' }, { status: 400 });
    }

    const existing = await prisma.mindReaderReaction.findUnique({
      where: { challengeId_userId_type: { challengeId, userId: session.user.id, type } },
    });

    if (existing) {
      await prisma.mindReaderReaction.delete({ where: { id: existing.id } });
      return NextResponse.json({ liked: false });
    }

    await prisma.mindReaderReaction.create({
      data: { challengeId, userId: session.user.id, type },
    });

    return NextResponse.json({ liked: true });
  } catch (error) {
    console.error('Mind reader reaction error:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

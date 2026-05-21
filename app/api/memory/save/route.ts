import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// POST /api/memory/save — guarda resultado de una partida
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { pairs, matched, score, time } = await req.json();

  const game = await prisma.memoryGameSession.create({
    data: {
      userId: session.user.id,
      pairs,
      matched,
      score,
      time,
      completed: true,
    },
  });

  return NextResponse.json({ game });
}

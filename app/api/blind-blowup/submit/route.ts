import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { imageUrl, guess, timeSeconds, difficulty } = await req.json();
    if (!imageUrl || !guess?.trim() || timeSeconds == null) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const game = await prisma.blindBlowupGame.create({
      data: {
        imageUrl,
        userId: session.user.id,
        guess: guess.trim(),
        timeSeconds,
        difficulty: difficulty || 'medium',
        completed: true,
      },
    });

    return NextResponse.json({ game });
  } catch (error) {
    console.error('Error submitting guess:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

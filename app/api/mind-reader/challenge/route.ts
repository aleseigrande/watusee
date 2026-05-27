import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { title, rounds } = await req.json();
    if (!title || !rounds || rounds.length !== 5) {
      return NextResponse.json({ error: 'Title and 5 rounds required' }, { status: 400 });
    }

    const challenge = await prisma.mindReaderChallenge.create({
      data: {
        title,
        creatorId: session.user.id,
        rounds: {
          create: rounds.map((r: any, i: number) => ({
            clue: r.clue,
            correctIndex: r.correctIndex,
            explanation: r.explanation || null,
            image0: r.images[0],
            image1: r.images[1],
            image2: r.images[2],
            roundNumber: i + 1,
          })),
        },
      },
    });

    return NextResponse.json({ challenge });
  } catch (error) {
    console.error('Create mind reader error:', error);
    return NextResponse.json({ error: 'Error creating challenge' }, { status: 500 });
  }
}

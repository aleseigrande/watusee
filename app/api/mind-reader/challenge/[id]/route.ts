import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split('/').pop();
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const challenge = await prisma.mindReaderChallenge.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, username: true, image: true } },
        rounds: { orderBy: { roundNumber: 'asc' }, select: { id: true, clue: true, image0: true, image1: true, image2: true, roundNumber: true } },
        _count: { select: { attempts: true } },
        reactions: { where: { type: 'like' }, select: { id: true } },
      },
    });

    if (!challenge) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({
      id: challenge.id,
      title: challenge.title,
      creator: challenge.creator,
      rounds: challenge.rounds,
      playCount: challenge.playCount,
      averageScore: challenge.averageScore,
      likeCount: challenge.reactions.length,
      attemptCount: challenge._count.attempts,
      createdAt: challenge.createdAt,
    });
  } catch (error) {
    console.error('Mind reader detail error:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

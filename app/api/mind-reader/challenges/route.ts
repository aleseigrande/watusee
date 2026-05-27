import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const challenges = await prisma.mindReaderChallenge.findMany({
      include: {
        creator: { select: { username: true, image: true } },
        _count: { select: { attempts: true } },
        reactions: { where: { type: 'like' }, select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const data = challenges.map((c) => ({
      id: c.id,
      title: c.title,
      creator: c.creator,
      playCount: c.playCount,
      averageScore: c.averageScore,
      likeCount: c.reactions.length,
      attemptCount: c._count.attempts,
      createdAt: c.createdAt,
    }));

    return NextResponse.json({ challenges: data });
  } catch (error) {
    console.error('Mind reader feed error:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

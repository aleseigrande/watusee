import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const imageUrl = url.searchParams.get('imageUrl');
    const difficultyFilter = url.searchParams.get('difficulty');
    if (!imageUrl) {
      return NextResponse.json({ error: 'imageUrl required' }, { status: 400 });
    }

    const where: any = { imageUrl, completed: true };
    if (difficultyFilter) where.difficulty = difficultyFilter;

    const games = await prisma.blindBlowupGame.findMany({
      where,
      include: { user: { select: { username: true, image: true } } },
      orderBy: { timeSeconds: 'asc' },
      take: 50,
    });

    return NextResponse.json({ games });
  } catch (error) {
    console.error('Error fetching results:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

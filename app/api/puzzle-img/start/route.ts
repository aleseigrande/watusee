import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('mode') || 'original';
  const daily = url.searchParams.get('daily') === 'true';

  if (daily) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dp = await prisma.dailyPuzzle.findFirst({
      where: { date: today },
      include: {
        game: {
          include: { creator: { select: { id: true, username: true, image: true } } },
        },
      },
    });
    if (dp) {
      const game = dp.game;
      return NextResponse.json({
        id: game.id,
        originalImage: game.originalImage,
        interpretationImage: game.interpretationImage,
        title: game.title,
        description: game.description,
        creator: game.creator,
        mode,
        daily: true,
      });
    }
  }

  const posts = await prisma.post.findMany({
    where: { interpretedImage: { not: '' } },
    include: {
      author: { select: { id: true, username: true, image: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  if (posts.length === 0) {
    return NextResponse.json({ error: 'No puzzles available' }, { status: 404 });
  }

  const pick = posts[Math.floor(Math.random() * posts.length)];

  await prisma.puzzleGame.upsert({
    where: { postId: pick.id },
    update: {},
    create: {
      postId: pick.id,
      originalImage: pick.originalImage,
      interpretationImage: pick.interpretedImage,
      title: pick.title,
      description: pick.description,
      creatorId: pick.authorId,
    },
  });

  const game = await prisma.puzzleGame.findUnique({
    where: { postId: pick.id },
    include: {
      creator: { select: { id: true, username: true, image: true } },
    },
  });

  if (!game) {
    return NextResponse.json({ error: 'Failed to create puzzle' }, { status: 500 });
  }

  return NextResponse.json({
    id: game.id,
    originalImage: game.originalImage,
    interpretationImage: game.interpretationImage,
    title: game.title,
    description: game.description,
    creator: game.creator,
    mode,
    daily: false,
  });
}

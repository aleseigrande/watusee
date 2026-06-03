import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const daily = req.nextUrl.searchParams.get('daily') === 'true';

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
        imageUrl: game.originalImage,
        title: game.title,
        description: game.description,
        creator: game.creator,
        daily: true,
      });
    }
  }

  const images = await prisma.playImage.findMany({
    include: { author: { select: { id: true, username: true, image: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  if (images.length === 0) {
    return NextResponse.json({ error: 'No puzzles available' }, { status: 404 });
  }

  const pick = images[Math.floor(Math.random() * images.length)];

  await prisma.puzzleGame.upsert({
    where: { postId: pick.id },
    update: {},
    create: {
      postId: pick.id,
      originalImage: pick.imageUrl,
      interpretationImage: '',
      title: pick.title,
      description: pick.description,
      creatorId: pick.authorId,
    },
  });

  const game = await prisma.puzzleGame.findUnique({
    where: { postId: pick.id },
    include: { creator: { select: { id: true, username: true, image: true } } },
  });

  if (!game) {
    return NextResponse.json({ error: 'Failed to create puzzle' }, { status: 500 });
  }

  return NextResponse.json({
    id: game.id,
    imageUrl: game.originalImage,
    title: game.title,
    description: game.description,
    creator: game.creator,
    daily: false,
  });
}

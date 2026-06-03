import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let dp = await prisma.dailyPuzzle.findFirst({
    where: { date: today },
    include: {
      game: {
        include: { creator: { select: { id: true, username: true, image: true } } },
      },
    },
  });

  if (dp) {
    const g = dp.game;
    return NextResponse.json({
      id: g.id,
      originalImage: g.originalImage,
      interpretationImage: g.interpretationImage,
      title: g.title,
      description: g.description,
      creator: g.creator,
    });
  }

  const posts = await prisma.post.findMany({
    where: { interpretedImage: { not: '' } },
    include: { author: { select: { id: true, username: true, image: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  if (posts.length === 0) {
    return NextResponse.json({ error: 'No content available' }, { status: 404 });
  }

  const pick = posts[Math.floor(Math.random() * posts.length)];

  const game = await prisma.puzzleGame.upsert({
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

  await prisma.dailyPuzzle.upsert({
    where: { date: today },
    update: { gameId: game.id },
    create: { date: today, gameId: game.id },
  });

  return NextResponse.json({
    id: game.id,
    originalImage: game.originalImage,
    interpretationImage: game.interpretationImage,
    title: game.title,
    description: game.description,
    creator: pick.author,
  });
}

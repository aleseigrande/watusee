import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const [users, posts, playImages, stories, echoDrawings, memoryGames, blindGames, mindGames] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.playImage.count(),
    prisma.story.count(),
    prisma.echoDrawing.count(),
    prisma.memoryGameSession.count(),
    prisma.blindBlowupGame.count(),
    prisma.mindReaderChallenge.count(),
  ]);

  return NextResponse.json({
    users,
    imagesUploaded: playImages,
    imagesInterpreted: posts,
    stories,
    gamesPlayed: memoryGames + blindGames + mindGames,
    echoDrawings,
  });
}

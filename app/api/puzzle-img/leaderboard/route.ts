import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const gameId = url.searchParams.get('gameId');

  const sessions = await prisma.puzzleSession.findMany({
    where: { completed: true, ...(gameId ? { gameId } : {}) },
    include: {
      player: { select: { id: true, username: true, image: true } },
    },
    orderBy: { score: 'desc' },
    take: 50,
  });

  return NextResponse.json(sessions.map((s, i) => ({
    rank: i + 1,
    player: s.player,
    score: s.score,
    moves: s.moves,
    timeSeconds: s.timeSeconds,
    gridSize: s.gridSize,
    mode: s.mode,
    createdAt: s.createdAt,
  })));
}

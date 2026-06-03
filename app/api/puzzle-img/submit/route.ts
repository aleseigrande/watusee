import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { gameId, mode, gridSize, moves, timeSeconds, hintsUsed } = await req.json();

  if (!gameId || mode == null || !gridSize || moves == null || timeSeconds == null) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const timeScore = Math.max(0, 1000 - timeSeconds * 2);
  const moveScore = Math.max(0, 500 - moves * 3);
  const difficultyBonus = (gridSize - 2) * 100;
  const hintPenalty = hintsUsed ? hintsUsed * 50 : 0;
  const score = Math.max(0, timeScore + moveScore + difficultyBonus - hintPenalty);

  const sessionRec = await prisma.puzzleSession.create({
    data: {
      gameId,
      playerId: session.user.id,
      mode,
      gridSize,
      moves,
      timeSeconds,
      hintsUsed: hintsUsed || 0,
      score,
      completed: true,
    },
  });

  await prisma.puzzleGame.update({
    where: { id: gameId },
    data: {
      playCount: { increment: 1 },
      avgMoves: undefined,
      avgTime: undefined,
      completionRate: undefined,
    },
  });

  const allSessions = await prisma.puzzleSession.findMany({
    where: { gameId, completed: true },
    select: { moves: true, timeSeconds: true },
  });

  if (allSessions.length > 0) {
    const avgMoves = allSessions.reduce((s, r) => s + r.moves, 0) / allSessions.length;
    const avgTime = allSessions.reduce((s, r) => s + r.timeSeconds, 0) / allSessions.length;
    const completedCount = allSessions.length;
    const totalAttempts = await prisma.puzzleSession.count({ where: { gameId } });
    const completionRate = totalAttempts > 0 ? completedCount / totalAttempts : 0;

    await prisma.puzzleGame.update({
      where: { id: gameId },
      data: { avgMoves, avgTime, completionRate },
    });
  }

  return NextResponse.json({ id: sessionRec.id, score });
}

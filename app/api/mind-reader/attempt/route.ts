import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { challengeId, answers } = await req.json();
    if (!challengeId || !answers || answers.length !== 5) {
      return NextResponse.json({ error: 'challengeId and 5 answers required' }, { status: 400 });
    }

    const rounds = await prisma.mindReaderRound.findMany({
      where: { challengeId },
      orderBy: { roundNumber: 'asc' },
    });

    if (rounds.length !== 5) {
      return NextResponse.json({ error: 'Challenge not ready' }, { status: 400 });
    }

    const answerRecords = answers.map((a: any, i: number) => {
      const round = rounds[i];
      return {
        roundId: round.id,
        chosenIndex: a.chosenIndex,
        correct: a.chosenIndex === round.correctIndex,
      };
    });

    const score = answerRecords.filter((a: any) => a.correct).length;

    const attempt = await prisma.mindReaderAttempt.create({
      data: {
        challengeId,
        playerId: session.user.id,
        score,
        completed: true,
        answers: { create: answerRecords },
      },
      include: {
        answers: true,
      },
    });

    // Update challenge stats
    const allAttempts = await prisma.mindReaderAttempt.findMany({
      where: { challengeId, completed: true },
      select: { score: true },
    });
    const avg = allAttempts.reduce((sum, a) => sum + a.score, 0) / allAttempts.length;

    await prisma.mindReaderChallenge.update({
      where: { id: challengeId },
      data: {
        playCount: allAttempts.length,
        averageScore: avg,
      },
    });

    // Return results with correct answers
    const resultData = rounds.map((round, i) => ({
      ...round,
      correctIndex: round.correctIndex,
    }));

    return NextResponse.json({
      attempt: { id: attempt.id, score, total: 5 },
      rounds: resultData,
      answers: answerRecords,
    });
  } catch (error) {
    console.error('Mind reader attempt error:', error);
    return NextResponse.json({ error: 'Error submitting attempt' }, { status: 500 });
  }
}

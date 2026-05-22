import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

function getTodayStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function getTomorrowStart(): Date {
  const today = getTodayStart();
  return new Date(today.getTime() + 24 * 60 * 60 * 1000);
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export async function GET() {
  try {
    const session = await auth();
    const todayStart = getTodayStart();
    const tomorrowStart = getTomorrowStart();

    let challenge = await prisma.dailyPareidolia.findUnique({
      where: { date: todayStart },
      include: {
        entries: {
          include: {
            user: { select: { username: true, image: true } },
            likedBy: { select: { userId: true } },
          },
          orderBy: { likes: 'desc' },
        },
      },
    });

    if (!challenge) {
      const images = await prisma.playImage.findMany({ select: { imageUrl: true } });
      if (images.length === 0) {
        return NextResponse.json({ error: 'No images available' }, { status: 400 });
      }
      const dailySeed = todayStart.getFullYear() * 10000 + (todayStart.getMonth() + 1) * 100 + todayStart.getDate();
      const shuffled = seededShuffle(images, dailySeed);
      const imageUrl = shuffled[0].imageUrl;

      challenge = await prisma.dailyPareidolia.create({
        data: { date: todayStart, imageUrl },
        include: {
          entries: {
            include: {
              user: { select: { username: true, image: true } },
              likedBy: { select: { userId: true } },
            },
            orderBy: { likes: 'desc' },
          },
        },
      });
    }

    const now = new Date();
    const revealed = now >= tomorrowStart;
    const userEntry = session?.user?.id
      ? challenge.entries.find((e) => e.userId === session.user.id) || null
      : null;

    const entries = challenge.entries.map((e) => ({
      id: e.id,
      userId: e.userId,
      username: e.user.username,
      userImage: e.user.image,
      interpretation: revealed ? e.interpretation : e.userId === session?.user?.id ? e.interpretation : null,
      likes: e.likes,
      likedByMe: session?.user?.id ? e.likedBy.some((l) => l.userId === session.user.id) : false,
    }));

    return NextResponse.json({
      id: challenge.id,
      imageUrl: challenge.imageUrl,
      date: challenge.date,
      revealed,
      totalEntries: challenge.entries.length,
      myEntry: userEntry ? { interpretation: userEntry.interpretation } : null,
      entries,
    });
  } catch (error) {
    console.error('Error in daily-pareidolia:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { interpretation } = await req.json();
    if (!interpretation?.trim()) {
      return NextResponse.json({ error: 'Interpretation required' }, { status: 400 });
    }

    const todayStart = getTodayStart();

    let challenge = await prisma.dailyPareidolia.findUnique({
      where: { date: todayStart },
    });

    if (!challenge) {
      return NextResponse.json({ error: 'No challenge for today yet' }, { status: 400 });
    }

    const existing = await prisma.dailyPareidoliaEntry.findUnique({
      where: { challengeId_userId: { challengeId: challenge.id, userId: session.user.id } },
    });

    if (existing) {
      return NextResponse.json({ error: 'Ya participaste hoy' }, { status: 400 });
    }

    const entry = await prisma.dailyPareidoliaEntry.create({
      data: {
        challengeId: challenge.id,
        userId: session.user.id,
        interpretation: interpretation.trim(),
      },
      include: {
        user: { select: { username: true, image: true } },
      },
    });

    return NextResponse.json({ entry });
  } catch (error) {
    console.error('Error submitting entry:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

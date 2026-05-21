import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
    const images = await prisma.playImage.findMany({
      include: { author: { select: { username: true } } },
    });

    const now = new Date();
    const dailySeed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();

    const shuffled = seededShuffle(images, dailySeed);
    const selected = shuffled.slice(0, 5);

    return NextResponse.json(selected);
  } catch (error) {
    console.error('Error fetching featured images:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

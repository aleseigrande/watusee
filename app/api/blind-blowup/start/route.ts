import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

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
    const images = await prisma.playImage.findMany({ select: { imageUrl: true, title: true } });
    if (images.length === 0) {
      return NextResponse.json({ error: 'No images available' }, { status: 400 });
    }
    const now = new Date();
    const seed = now.getTime();
    const shuffled = seededShuffle(images, seed);
    const pick = shuffled[0];

    return NextResponse.json({
      imageUrl: pick.imageUrl,
      title: pick.title,
    });
  } catch (error) {
    console.error('Error starting blind blowup:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

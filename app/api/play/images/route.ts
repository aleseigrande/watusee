import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const images = await prisma.playImage.findMany({
      include: { author: { select: { username: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(images);
  } catch (error) {
    console.error('Error fetching play images:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

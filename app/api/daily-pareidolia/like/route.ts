import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { entryId } = await req.json();
    if (!entryId) {
      return NextResponse.json({ error: 'entryId required' }, { status: 400 });
    }

    const entry = await prisma.dailyPareidoliaEntry.findUnique({ where: { id: entryId } });
    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    const existing = await prisma.dailyPareidoliaLike.findUnique({
      where: { entryId_userId: { entryId, userId: session.user.id } },
    });

    if (existing) {
      await prisma.dailyPareidoliaLike.delete({ where: { id: existing.id } });
      await prisma.dailyPareidoliaEntry.update({
        where: { id: entryId },
        data: { likes: { decrement: 1 } },
      });
      const updated = await prisma.dailyPareidoliaEntry.findUnique({ where: { id: entryId } });
      return NextResponse.json({ liked: false, likes: updated?.likes ?? 0 });
    } else {
      await prisma.dailyPareidoliaLike.create({
        data: { entryId, userId: session.user.id },
      });
      await prisma.dailyPareidoliaEntry.update({
        where: { id: entryId },
        data: { likes: { increment: 1 } },
      });
      const updated = await prisma.dailyPareidoliaEntry.findUnique({ where: { id: entryId } });
      return NextResponse.json({ liked: true, likes: updated?.likes ?? 0 });
    }
  } catch (error) {
    console.error('Error liking entry:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// GET /api/echo/drawings/[id]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const drawing = await prisma.echoDrawing.findUnique({
    where: { id },
    include: {
      user: { select: { username: true, image: true } },
      reactions: {
        include: { user: { select: { username: true } } },
      },
      comments: {
        include: { user: { select: { username: true, image: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!drawing) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  }

  return NextResponse.json({ drawing });
}

// POST /api/echo/drawings/[id] — react or comment
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;
  const { action, type, content } = await req.json();

  if (action === 'react' && type) {
    const existing = await prisma.echoReaction.findUnique({
      where: { drawingId_userId: { drawingId: id, userId: session.user.id } },
    });

    if (existing && existing.type === type) {
      await prisma.echoReaction.delete({ where: { id: existing.id } });
      const total = await prisma.echoReaction.count({ where: { drawingId: id, type } });
      return NextResponse.json({ reacted: false, type, count: total });
    }

    if (existing) {
      await prisma.echoReaction.delete({ where: { id: existing.id } });
    }

    await prisma.echoReaction.create({
      data: { type, drawingId: id, userId: session.user.id },
    });

    const total = await prisma.echoReaction.count({ where: { drawingId: id, type } });
    return NextResponse.json({ reacted: true, type, count: total });
  }

  if (action === 'comment' && content) {
    const comment = await prisma.echoComment.create({
      data: { content: content.trim(), drawingId: id, userId: session.user.id },
      include: { user: { select: { username: true, image: true } } },
    });
    return NextResponse.json({ comment }, { status: 201 });
  }

  return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
}

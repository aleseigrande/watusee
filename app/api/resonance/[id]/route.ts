import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// GET /api/resonance/[id]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  const signal = await prisma.resonanceSignal.findUnique({
    where: { id },
    include: {
      author: { select: { username: true, image: true } },
      responses: {
        include: { user: { select: { username: true, image: true } } },
        orderBy: { createdAt: 'desc' },
      },
      reactions: {
        include: { user: { select: { username: true } } },
      },
      comments: {
        include: { user: { select: { username: true, image: true } } },
        orderBy: { createdAt: 'desc' },
      },
      _count: { select: { responses: true, reactions: true, comments: true } },
    },
  });

  if (!signal) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  }

  // Check if current user already responded
  let userResponded = false;
  let userResponse: string | null = null;
  if (session?.user?.id) {
    const r = await prisma.resonanceResponse.findUnique({
      where: { signalId_userId: { signalId: id, userId: session.user.id } },
    });
    userResponded = !!r;
    userResponse = r?.interpretation || null;
  }

  return NextResponse.json({ signal, userResponded, userResponse });
}

// POST /api/resonance/[id] — respond to a signal
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;
  const { action, interpretation, type, content } = await req.json();

  if (action === 'respond') {
    if (!interpretation || interpretation.trim().length === 0) {
      return NextResponse.json({ error: 'Interpretación requerida' }, { status: 400 });
    }

    const existing = await prisma.resonanceResponse.findUnique({
      where: { signalId_userId: { signalId: id, userId: session.user.id } },
    });
    if (existing) {
      return NextResponse.json({ error: 'Ya respondiste' }, { status: 400 });
    }

    await prisma.resonanceResponse.create({
      data: {
        interpretation: interpretation.trim(),
        signalId: id,
        userId: session.user.id,
      },
    });

    const signal = await prisma.resonanceSignal.update({
      where: { id },
      data: {
        callsAnswered: { increment: 1 },
        resonanceScore: { increment: 10 },
      },
    });

    return NextResponse.json({ signal });
  }

  if (action === 'react' && type) {
    const existing = await prisma.resonanceReaction.findUnique({
      where: { signalId_userId: { signalId: id, userId: session.user.id } },
    });

    if (existing && existing.type === type) {
      await prisma.resonanceReaction.delete({ where: { id: existing.id } });
    } else {
      if (existing) await prisma.resonanceReaction.delete({ where: { id: existing.id } });
      await prisma.resonanceReaction.create({
        data: { type, signalId: id, userId: session.user.id },
      });
    }

    const total = await prisma.resonanceReaction.count({ where: { signalId: id, type } });
    return NextResponse.json({ reacted: !existing || existing.type !== type, type, count: total });
  }

  if (action === 'comment' && content) {
    const comment = await prisma.resonanceComment.create({
      data: { content: content.trim(), signalId: id, userId: session.user.id },
      include: { user: { select: { username: true, image: true } } },
    });
    return NextResponse.json({ comment }, { status: 201 });
  }

  if (action === 'share') {
    const signal = await prisma.resonanceSignal.update({
      where: { id },
      data: { callsSent: { increment: 1 }, resonanceScore: { increment: 5 } },
    });
    return NextResponse.json({ callsSent: signal.callsSent });
  }

  return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
}

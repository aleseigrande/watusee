import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// GET /api/resonance — list signals
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sort = searchParams.get('sort') || 'latest';
  const limit = Math.min(Number(searchParams.get('limit')) || 20, 50);
  const page = Number(searchParams.get('page')) || 1;

  let orderBy: any = { createdAt: 'desc' };
  if (sort === 'resonance') orderBy = { resonanceScore: 'desc' };
  if (sort === 'answered') orderBy = { callsAnswered: 'desc' };

  const signals = await prisma.resonanceSignal.findMany({
    orderBy,
    take: limit,
    skip: (page - 1) * limit,
    include: {
      author: { select: { username: true, image: true } },
      _count: { select: { responses: true, reactions: true, comments: true } },
    },
  });

  const total = await prisma.resonanceSignal.count();
  return NextResponse.json({ signals, total, page, limit });
}

// POST /api/resonance — create a signal
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { title, question, imageUrl } = await req.json();
  if (!title || !imageUrl) {
    return NextResponse.json({ error: 'Faltan title o imageUrl' }, { status: 400 });
  }

  const signal = await prisma.resonanceSignal.create({
    data: {
      title,
      question: question || 'What do you see?',
      imageUrl,
      authorId: session.user.id,
    },
    include: {
      author: { select: { username: true, image: true } },
    },
  });

  return NextResponse.json({ signal }, { status: 201 });
}

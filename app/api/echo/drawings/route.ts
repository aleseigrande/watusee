import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// POST /api/echo/drawings — guarda un drawing
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { imageUrl, drawingData } = await req.json();
  if (!imageUrl || !drawingData) {
    return NextResponse.json({ error: 'Faltan imageUrl o drawingData' }, { status: 400 });
  }

  const existing = await prisma.echoDrawing.findUnique({
    where: { imageUrl_userId: { imageUrl, userId: session.user.id } },
  });

  if (existing) {
    const drawing = await prisma.echoDrawing.update({
      where: { id: existing.id },
      data: { drawingData },
      include: {
        user: { select: { username: true, image: true } },
      },
    });
    return NextResponse.json({ drawing });
  }

  const drawing = await prisma.echoDrawing.create({
    data: { imageUrl, drawingData, userId: session.user.id },
    include: {
      user: { select: { username: true, image: true } },
    },
  });

  return NextResponse.json({ drawing }, { status: 201 });
}

// GET /api/echo/drawings?imageUrl=xxx — devuelve drawings para una imagen
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get('imageUrl');

  if (!imageUrl) {
    return NextResponse.json({ error: 'Falta imageUrl' }, { status: 400 });
  }

  const drawings = await prisma.echoDrawing.findMany({
    where: { imageUrl },
    include: {
      user: { select: { username: true, image: true } },
      _count: { select: { reactions: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ drawings, total: drawings.length });
}

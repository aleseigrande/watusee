import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// GET /api/echo/start — devuelve una imagen aleatoria del Imaginarium
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const count = await prisma.playImage.count();
  if (count < 1) {
    return NextResponse.json({ error: 'No hay imágenes en el Imaginarium' }, { status: 400 });
  }

  const skip = Math.floor(Math.random() * count);
  const [image] = await prisma.playImage.findMany({
    skip,
    take: 1,
    select: { id: true, imageUrl: true, title: true },
  });

  return NextResponse.json({ image });
}

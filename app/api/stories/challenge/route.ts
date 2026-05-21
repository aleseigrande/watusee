import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// GET /api/stories/challenge — devuelve 4 imágenes aleatorias del Imaginarium
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // Obtener todas las imágenes del Imaginarium
  const count = await prisma.playImage.count();
  if (count < 4) {
    return NextResponse.json({ error: 'No hay suficientes imágenes en el Imaginarium' }, { status: 400 });
  }

  // Seleccionar 4 aleatorias
  const skip = Math.max(0, Math.floor(Math.random() * (count - 3)));
  const images = await prisma.playImage.findMany({
    skip,
    take: 4,
    select: { id: true, imageUrl: true, title: true },
    orderBy: { id: 'asc' },
  });

  // Shuffle
  const shuffled = images.sort(() => Math.random() - 0.5);

  return NextResponse.json({ images: shuffled });
}

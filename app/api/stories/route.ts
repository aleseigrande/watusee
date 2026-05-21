import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// GET /api/stories — list stories with filters
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sort = searchParams.get('sort') || 'latest';
  const limit = Math.min(Number(searchParams.get('limit')) || 20, 50);
  const page = Number(searchParams.get('page')) || 1;

  let orderBy: any = { createdAt: 'desc' };
  if (sort === 'trending') orderBy = { likes: 'desc' };
  if (sort === 'most-remixed') orderBy = { remixes: { _count: 'desc' } };

  const stories = await prisma.story.findMany({
    orderBy,
    take: limit,
    skip: (page - 1) * limit,
    include: {
      author: { select: { username: true, image: true } },
      images: { orderBy: { order: 'asc' } },
      _count: { select: { reactions: true, comments: true, bookmarks: true, remixes: true } },
    },
  });

  const total = await prisma.story.count();

  return NextResponse.json({ stories, total, page, limit });
}

// POST /api/stories — create a new story
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { title, content, imageIds, mood, tags, dailyChallengeId } = await req.json();

  if (!title || !content || !imageIds || !Array.isArray(imageIds) || imageIds.length !== 4) {
    return NextResponse.json({ error: 'Se requieren title, content y 4 imageIds' }, { status: 400 });
  }

  // Obtener URLs de las imágenes del Imaginarium
  const playImages = await prisma.playImage.findMany({
    where: { id: { in: imageIds } },
    select: { id: true, imageUrl: true },
  });

  if (playImages.length !== 4) {
    return NextResponse.json({ error: 'Alguna imagen no encontrada' }, { status: 400 });
  }

  const imageUrlMap = new Map(playImages.map((i) => [i.id, i.imageUrl]));

  const story = await prisma.story.create({
    data: {
      title,
      content,
      mood: mood || '',
      tags: tags || '[]',
      authorId: session.user.id,
      dailyChallengeId: dailyChallengeId || null,
      images: {
        create: imageIds.map((imgId: string, idx: number) => ({
          imageUrl: imageUrlMap.get(imgId) || '',
          order: idx,
        })),
      },
    },
    include: {
      author: { select: { username: true, image: true } },
      images: { orderBy: { order: 'asc' } },
    },
  });

  return NextResponse.json({ story }, { status: 201 });
}

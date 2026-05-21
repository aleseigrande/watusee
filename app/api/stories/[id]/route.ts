import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// GET /api/stories/[id]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const story = await prisma.story.findUnique({
    where: { id },
    include: {
      author: { select: { username: true, image: true } },
      images: { orderBy: { order: 'asc' } },
      reactions: {
        include: { user: { select: { username: true } } },
      },
      comments: {
        include: { user: { select: { username: true, image: true } } },
        orderBy: { createdAt: 'desc' },
      },
      remixes: {
        include: {
          author: { select: { username: true, image: true } },
          images: { orderBy: { order: 'asc' } },
        },
      },
      _count: { select: { reactions: true, comments: true, bookmarks: true, remixes: true } },
    },
  });

  if (!story) {
    return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
  }

  // Verificar si el usuario actual tiene bookmark
  let bookmarked = false;
  let userReaction: string | null = null;
  const session = await auth();
  if (session?.user?.id) {
    const [bm, react] = await Promise.all([
      prisma.storyBookmark.findUnique({
        where: { storyId_userId: { storyId: id, userId: session.user.id } },
      }),
      prisma.storyReaction.findUnique({
        where: { storyId_userId: { storyId: id, userId: session.user.id } },
      }),
    ]);
    bookmarked = !!bm;
    userReaction = react?.type || null;
  }

  return NextResponse.json({ story, bookmarked, userReaction });
}

// PATCH /api/stories/[id] — share, react, bookmark
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;
  const { action, type } = await req.json();

  if (action === 'share') {
    const story = await prisma.story.update({
      where: { id },
      data: { sharesCount: { increment: 1 } },
    });
    return NextResponse.json({ sharesCount: story.sharesCount });
  }

  if (action === 'react' && type) {
    const existing = await prisma.storyReaction.findUnique({
      where: { storyId_userId: { storyId: id, userId: session.user.id } },
    });

    if (existing && existing.type === type) {
      await prisma.storyReaction.delete({ where: { id: existing.id } });
      const total = await prisma.storyReaction.count({ where: { storyId: id, type } });
      return NextResponse.json({ reacted: false, type, count: total });
    }

    if (existing) {
      await prisma.storyReaction.delete({ where: { id: existing.id } });
    }

    await prisma.storyReaction.create({
      data: { type, storyId: id, userId: session.user.id },
    });

    // Notificar autor
    try {
      const story = await prisma.story.findUnique({
        where: { id },
        select: { authorId: true },
      });
      if (story && story.authorId !== session.user.id) {
        await prisma.notification.create({
          data: {
            userId: story.authorId,
            actorId: session.user.id,
            postId: null,
            type: 'story_reaction',
            detail: type,
          },
        });
      }
    } catch {}

    const total = await prisma.storyReaction.count({ where: { storyId: id, type } });
    return NextResponse.json({ reacted: true, type, count: total });
  }

  if (action === 'bookmark') {
    const existing = await prisma.storyBookmark.findUnique({
      where: { storyId_userId: { storyId: id, userId: session.user.id } },
    });

    if (existing) {
      await prisma.storyBookmark.delete({ where: { id: existing.id } });
      return NextResponse.json({ bookmarked: false });
    } else {
      await prisma.storyBookmark.create({
        data: { storyId: id, userId: session.user.id },
      });
      return NextResponse.json({ bookmarked: true });
    }
  }

  return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
}

// POST /api/stories/[id] — add comment
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;
  const { content } = await req.json();

  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: 'El comentario no puede estar vacío' }, { status: 400 });
  }

  const comment = await prisma.storyComment.create({
    data: {
      content: content.trim(),
      storyId: id,
      userId: session.user.id,
    },
    include: {
      user: { select: { username: true, image: true } },
    },
  });

  await prisma.story.update({
    where: { id },
    data: { commentsCount: { increment: 1 } },
  });

  return NextResponse.json({ comment }, { status: 201 });
}

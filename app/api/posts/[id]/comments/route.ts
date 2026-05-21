import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// GET /api/posts/[id]/comments
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const comments = await prisma.comment.findMany({
    where: { postId: id },
    include: {
      user: { select: { username: true, image: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json({ comments });
}

// POST /api/posts/[id]/comments
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

  const comment = await prisma.comment.create({
    data: {
      content: content.trim(),
      postId: id,
      userId: session.user.id,
    },
    include: {
      user: { select: { username: true, image: true } },
    },
  });

  // Incrementar contador en el post
  await prisma.post.update({
    where: { id },
    data: { commentsCount: { increment: 1 } },
  });

  // Notificar al autor
  try {
    const post = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    });
    if (post && post.authorId !== session.user.id) {
      await prisma.notification.create({
        data: {
          userId: post.authorId,
          actorId: session.user.id,
          postId: id,
          type: 'comment',
          detail: content.slice(0, 100),
        },
      });
    }
  } catch {}

  return NextResponse.json({ comment }, { status: 201 });
}

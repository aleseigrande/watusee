import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export const GET = auth(async (req) => {
  const session = req.auth;
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      _count: { select: { posts: true } },
      posts: {
        select: { id: true, likes: true, sharesCount: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  const postIds = user.posts.map((p) => p.id);
  const totalLikes = user.posts.reduce((sum, p) => sum + p.likes, 0);
  const totalShares = user.posts.reduce((sum, p) => sum + p.sharesCount, 0);
  const totalRemixes = await prisma.post.count({
    where: { remixOfId: { in: postIds } },
  });

  return NextResponse.json({
    id: user.id,
    username: user.username,
    email: user.email,
    image: user.image,
    createdAt: user.createdAt,
    stats: {
      posts: user._count.posts,
      totalLikes,
      totalShares,
      totalRemixes,
    },
  });
});

export const PATCH = auth(async (req) => {
  const session = req.auth;
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { image } = await req.json();

  if (!image) {
    return NextResponse.json({ error: 'Imagen requerida' }, { status: 400 });
  }

  const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  const filename = `avatar-${crypto.randomBytes(8).toString('hex')}.png`;
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  try { await fs.access(uploadsDir); } catch { await fs.mkdir(uploadsDir, { recursive: true }); }
  const filepath = path.join(uploadsDir, filename);
  await fs.writeFile(filepath, buffer);

  const imageUrl = `/uploads/${filename}`;

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { image: imageUrl },
  });

  return NextResponse.json({ image: user.image });
});

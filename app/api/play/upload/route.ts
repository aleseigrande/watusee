import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('image') as File | null;
    const title = formData.get('title') as string | null;
    const description = formData.get('description') as string | null;

    if (!file || !title) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'play', 'uploads');
    try { await fs.access(uploadsDir); } catch { await fs.mkdir(uploadsDir, { recursive: true }); }

    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `play-${crypto.randomBytes(8).toString('hex')}.${ext}`;
    const filepath = path.join(uploadsDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filepath, buffer);
    const imageUrl = `/play/uploads/${filename}`;

    const playImage = await prisma.playImage.create({
      data: {
        title,
        description: description || '',
        imageUrl,
        authorId: session.user.id,
      },
      include: { author: { select: { username: true } } },
    });

    return NextResponse.json(playImage);
  } catch (error) {
    console.error('Error uploading play image:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

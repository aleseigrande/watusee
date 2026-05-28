import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

function getDataDir(): string {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && dbUrl.startsWith('file:/')) {
    return path.dirname(dbUrl.slice(5));
  }
  const home = process.env.HOME || '/home';
  const cwd = process.cwd();
  const escapedHome = home.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const domainMatch = cwd.match(new RegExp(`^${escapedHome}/domains/[^/]+`));
  if (domainMatch) {
    return path.join(domainMatch[0], 'data');
  }
  return path.join(cwd, 'data');
}

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

    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `play-${crypto.randomBytes(8).toString('hex')}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    // Save to public dir for immediate serving
    const publicDir = path.join(process.cwd(), 'public', 'play', 'uploads');
    try { await fs.access(publicDir); } catch { await fs.mkdir(publicDir, { recursive: true }); }
    await fs.writeFile(path.join(publicDir, filename), buffer);

    // Save to persistent data dir for redeploy survival
    const persistentDir = path.join(getDataDir(), 'uploads', 'play');
    try { await fs.access(persistentDir); } catch { await fs.mkdir(persistentDir, { recursive: true }); }
    await fs.writeFile(path.join(persistentDir, filename), buffer);

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

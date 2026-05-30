import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { auth } from '@/auth';

function getDataDir() {
  if (process.env.DATABASE_URL?.startsWith('file:/')) {
    const dbPath = process.env.DATABASE_URL.slice(5);
    return path.join(path.dirname(dbPath), 'uploads');
  }
  const cwd = process.cwd();
  const match = cwd.match(/^(\/home\/[^/]+\/domains\/[^/]+)/);
  if (match) return path.join(match[1], 'data', 'uploads');
  return null;
}

// POST /api/posts — crea un nuevo post (pareidolia).
// Recibe JSON con: title, description, originalImage (base64), drawnImage (base64),
// audience ("everyone"|"adults"), remixOfId (opcional).
// Si audience === "adults", las imágenes se guardan en /uploads/adults/ (separadas).
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { title, description, originalImage, drawnImage, audience, remixOfId } = await req.json();

    if (!title || !originalImage || !drawnImage) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    // Si es adulto, guarda en /uploads/adults/ para mantener separación física
    const isAdult = audience === 'adults';
    const subDir = isAdult ? 'uploads/adults' : 'uploads';
    const uploadsDir = path.join(process.cwd(), 'public', subDir);
    try {
      await fs.access(uploadsDir);
    } catch {
      await fs.mkdir(uploadsDir, { recursive: true });
    }

    // Guarda imagen: si es ruta copia el archivo, si es base64 lo decodifica y escribe
    const saveImage = async (input: string, prefix: string) => {
      let relativePath;
      if (input.startsWith('/')) {
        const existingPath = path.join(process.cwd(), 'public', input);
        const ext = path.extname(input) || '.png';
        const filename = `${prefix}-${crypto.randomBytes(8).toString('hex')}${ext}`;
        const destPath = path.join(uploadsDir, filename);
        try {
          await fs.copyFile(existingPath, destPath);
        } catch {
          await fs.writeFile(destPath, input);
        }
        relativePath = `/${subDir}/${filename}`;
      } else {
        const base64Data = input.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const filename = `${prefix}-${crypto.randomBytes(8).toString('hex')}.png`;
        const filepath = path.join(uploadsDir, filename);
        await fs.writeFile(filepath, buffer);
        relativePath = `/${subDir}/${filename}`;
      }
      // Dual save to data/ for persistence across deploys
      const dataDir = getDataDir();
      if (dataDir) {
        const dataSubDir = path.join(dataDir, subDir);
        try { await fs.access(dataSubDir); } catch { await fs.mkdir(dataSubDir, { recursive: true }); }
        const filename = path.basename(relativePath);
        const src = path.join(uploadsDir, filename);
        try { await fs.copyFile(src, path.join(dataSubDir, filename)); } catch {}
      }
      return relativePath;
    };

    const originalImageUrl = await saveImage(originalImage, 'original');
    const drawnImageUrl = await saveImage(drawnImage, 'drawn');

    const post = await prisma.post.create({
      data: {
        title,
        description: description || '',
        originalImage: originalImageUrl,
        interpretedImage: drawnImageUrl,
        audience: isAdult ? 'adults' : 'everyone',
        authorId: session.user.id,
        remixOfId: remixOfId || undefined,
      },
    });

    // Notificar al autor original si es un remix
    if (remixOfId) {
      try {
        const original = await prisma.post.findUnique({ where: { id: remixOfId }, select: { authorId: true } });
        if (original && original.authorId !== session.user.id) {
          await prisma.notification.create({
            data: { userId: original.authorId, actorId: session.user.id, postId: post.id, type: 'remix', detail: '' },
          });
        }
      } catch (e) {
        console.error('Error creating remix notification:', e);
      }
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { auth } from '@/auth';

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

    // Convierte base64 a archivo PNG y retorna la ruta pública
    const saveBase64Image = async (base64String: string, prefix: string) => {
      const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const filename = `${prefix}-${crypto.randomBytes(8).toString('hex')}.png`;
      const filepath = path.join(uploadsDir, filename);
      await fs.writeFile(filepath, buffer);
      return `/${subDir}/${filename}`;
    };

    const originalImageUrl = await saveBase64Image(originalImage, 'original');
    const drawnImageUrl = await saveBase64Image(drawnImage, 'drawn');

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

    // Agregar la imagen original al Imaginarium (PlayImage)
    if (!isAdult) {
      try {
        await prisma.playImage.create({
          data: {
            title: title || 'Untitled',
            description: description || '',
            imageUrl: originalImageUrl,
            authorId: session.user.id,
          },
        });
      } catch (e) {
        console.error('Error adding to Imaginarium:', e);
      }
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

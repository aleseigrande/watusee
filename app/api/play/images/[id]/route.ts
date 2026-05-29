import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import fs from 'fs/promises';
import path from 'path';

function getDataDir() {
  if (process.env.DATABASE_URL?.startsWith('file:/')) {
    const dbPath = process.env.DATABASE_URL.slice(5);
    return path.join(path.dirname(dbPath), 'uploads', 'play');
  }
  const cwd = process.cwd();
  const match = cwd.match(/^(\/home\/[^/]+\/domains\/[^/]+)/);
  if (match) return path.join(match[1], 'data', 'uploads', 'play');
  return null;
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const image = await prisma.playImage.findUnique({ where: { id } });
    if (!image) {
      return NextResponse.json({ error: 'Imagen no encontrada' }, { status: 404 });
    }

    if (image.authorId !== session.user.id) {
      return NextResponse.json({ error: 'No tienes permiso para borrar esta imagen' }, { status: 403 });
    }

    const remixCount = await prisma.post.count({
      where: { originalImage: image.imageUrl },
    });

    if (remixCount === 0) {
      const uploadPath = path.join(process.cwd(), 'public', image.imageUrl);
      try { await fs.unlink(uploadPath); } catch {}

      const dataDir = getDataDir();
      if (dataDir) {
        const filename = path.basename(image.imageUrl);
        try { await fs.unlink(path.join(dataDir, filename)); } catch {}
      }
    }

    await prisma.playImage.delete({ where: { id } });

    return NextResponse.json({ success: true, remixCount });
  } catch (error) {
    console.error('Error deleting play image:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
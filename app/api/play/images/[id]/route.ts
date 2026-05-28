import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import path from 'path';
import fs from 'fs';

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

function deleteIfExists(filepath: string) {
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }
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

    // Delete physical files from both locations if no remixes
    if (remixCount === 0) {
      const filename = path.basename(image.imageUrl);
      deleteIfExists(path.join(process.cwd(), 'public', 'play', 'uploads', filename));
      deleteIfExists(path.join(getDataDir(), 'uploads', 'play', filename));
    }

    await prisma.playImage.delete({ where: { id } });

    return NextResponse.json({ success: true, remixCount });
  } catch (error) {
    console.error('Error deleting play image:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
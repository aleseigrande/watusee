import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import path from 'path';
import fs from 'fs';
import { getUploadsDir } from '@/lib/uploads';

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

    // Contar cuántos posts usan esta imagen como original (remixes)
    const remixCount = await prisma.post.count({
      where: { originalImage: image.imageUrl },
    });

    // Borrar archivo físico solo si no hay remixes
    if (remixCount === 0) {
      const filename = path.basename(image.imageUrl);
      const filePath = path.join(getUploadsDir('play'), filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await prisma.playImage.delete({ where: { id } });

    return NextResponse.json({ success: true, remixCount });
  } catch (error) {
    console.error('Error deleting play image:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
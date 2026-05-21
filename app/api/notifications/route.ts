import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// GET /api/notifications — devuelve notificaciones del usuario logueado
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const notifs = await prisma.notification.findMany({
    where: { userId: session.user.id },
    include: {
      actor: { select: { username: true, image: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const unread = notifs.filter((n) => !n.read).length;

  return NextResponse.json({ notifs, unread });
}

// PATCH /api/notifications — marca una notificación como leída
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: 'Falta id' }, { status: 400 });
  }

  await prisma.notification.update({
    where: { id },
    data: { read: true },
  });

  return NextResponse.json({ ok: true });
}

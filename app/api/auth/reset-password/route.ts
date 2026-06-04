import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();

  if (!token || !password?.trim()) {
    return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { email: resetToken.email },
    data: { password: hashedPassword },
  });

  await prisma.passwordResetToken.update({
    where: { id: resetToken.id },
    data: { used: true },
  });

  return NextResponse.json({ message: 'Password updated successfully' });
}

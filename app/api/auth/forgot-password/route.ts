import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email?.trim()) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });

  if (!user) {
    return NextResponse.json({ message: 'If that email exists, a reset link has been sent.' });
  }

  await prisma.passwordResetToken.updateMany({
    where: { email: user.email!, used: false },
    data: { used: true },
  });

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 3600000);

  await prisma.passwordResetToken.create({
    data: {
      email: user.email!,
      token,
      expiresAt,
    },
  });

  const sent = await sendPasswordResetEmail(user.email!, token);

  if (!sent) {
    return NextResponse.json({ error: 'Failed to send email. Try again later.' }, { status: 500 });
  }

  return NextResponse.json({ message: 'If that email exists, a reset link has been sent.' });
}

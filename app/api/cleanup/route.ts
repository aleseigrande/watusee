import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const posts = await prisma.post.findMany({ select: { id: true, originalImage: true, interpretedImage: true } });
  let deleted = 0;
  for (const p of posts) {
    const origPath = path.join(process.cwd(), 'public', p.originalImage);
    const interpPath = path.join(process.cwd(), 'public', p.interpretedImage);
    if (!fs.existsSync(origPath) || !fs.existsSync(interpPath)) {
      await prisma.post.delete({ where: { id: p.id } });
      deleted++;
    }
  }
  return NextResponse.json({ cleaned: deleted });
}

const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  const posts = await prisma.post.findMany({ select: { id: true, originalImage: true, interpretedImage: true } });
  let deleted = 0;
  for (const p of posts) {
    const origPath = path.join(process.cwd(), 'public', p.originalImage);
    const interpPath = path.join(process.cwd(), 'public', p.interpretedImage);
    if (!fs.existsSync(origPath) || !fs.existsSync(interpPath)) {
      await prisma.post.delete({ where: { id: p.id } });
      deleted++;
      console.log('Deleted post', p.id, '- missing images');
    }
  }
  console.log('Cleaned up', deleted, 'posts with missing images');
  await prisma.$disconnect();
}
main().catch(console.error);

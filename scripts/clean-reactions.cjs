const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const all = await p.reaction.findMany({ select: { id: true, postId: true, userId: true } });
  const seen = new Map();
  for (const r of all) {
    const key = r.postId + '|' + r.userId;
    if (seen.has(key)) {
      await p.reaction.delete({ where: { id: r.id } });
      console.log('deleted', r.id);
    } else {
      seen.set(key, true);
    }
  }
  console.log('done');
}

main().catch(e => console.error(e)).finally(() => p.$disconnect());

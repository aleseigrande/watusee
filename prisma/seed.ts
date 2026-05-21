import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_IMAGES = [
  { title: 'Clouds', description: 'What do you see in the clouds?', imageUrl: '/play/clouds1.jpg' },
  { title: 'Horizon', description: 'Shapes in the landscape', imageUrl: '/play/clouds2.jpg' },
  { title: 'Rocks', description: 'Figures among the stones', imageUrl: '/play/rocks.jpg' },
  { title: 'Texture', description: 'Hidden patterns in the wood', imageUrl: '/play/wood.jpg' },
  { title: 'Sky', description: 'Silhouettes in the clouds', imageUrl: '/play/cloud.png' },
  { title: 'Wall', description: 'Faces in the texture', imageUrl: '/play/outlet.png' },
  { title: 'Stars', description: 'Imaginary constellations', imageUrl: '/play/stars.jpg' },
  { title: 'Abstract', description: 'Shapes in chaos', imageUrl: '/play/abstract.jpg' },
];

async function main() {
  const existing = await prisma.playImage.count();
  if (existing > 0) {
    console.log(`Already have ${existing} play images, skipping seed.`);
    return;
  }

  let systemUser = await prisma.user.findUnique({ where: { username: 'watusee' } });
  if (!systemUser) {
    systemUser = await prisma.user.create({
      data: {
        username: 'watusee',
        email: 'system@watusee.app',
        password: '',
        dateOfBirth: new Date('2000-01-01'),
      },
    });
    console.log('Created system user: watusee');
  }

  for (const img of DEFAULT_IMAGES) {
    await prisma.playImage.create({
      data: {
        title: img.title,
        description: img.description,
        imageUrl: img.imageUrl,
        authorId: systemUser.id,
      },
    });
    console.log(`Added play image: ${img.title}`);
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

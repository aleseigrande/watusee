import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import StoryClient from './StoryClient';
import type { StoryWithRelations } from './types';

export const dynamic = 'force-dynamic';

export default async function StoryPage() {
  const session = await auth();

  // Fetch stories for the feed (latest)
  const stories = await prisma.story.findMany({
    orderBy: { createdAt: 'desc' },
    take: 12,
    include: {
      author: { select: { username: true, image: true } },
      images: { orderBy: { order: 'asc' } },
      _count: { select: { reactions: true, comments: true, bookmarks: true, remixes: true } },
    },
  }) as unknown as StoryWithRelations[];

  return <StoryClient session={session} initialStories={stories} />;
}

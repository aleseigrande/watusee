import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { notFound } from 'next/navigation';
import StoryPostcard from './StoryPostcard';

export const dynamic = 'force-dynamic';

export default async function StoryPostcardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const story = await prisma.story.findUnique({
    where: { id },
    include: {
      author: { select: { username: true, image: true } },
      images: { orderBy: { order: 'asc' } },
      reactions: {
        include: { user: { select: { username: true } } },
      },
      comments: {
        include: { user: { select: { username: true, image: true } } },
        orderBy: { createdAt: 'desc' },
      },
      remixes: {
        include: {
          author: { select: { username: true, image: true } },
          images: { orderBy: { order: 'asc' } },
        },
      },
      _count: { select: { reactions: true, comments: true, bookmarks: true, remixes: true } },
    },
  });

  if (!story) notFound();

  let bookmarked = false;
  let userReaction: string | null = null;
  if (session?.user?.id) {
    const [bm, react] = await Promise.all([
      prisma.storyBookmark.findUnique({
        where: { storyId_userId: { storyId: id, userId: session.user.id } },
      }),
      prisma.storyReaction.findUnique({
        where: { storyId_userId: { storyId: id, userId: session.user.id } },
      }),
    ]);
    bookmarked = !!bm;
    userReaction = react?.type || null;
  }

  return <StoryPostcard story={story as any} session={session} bookmarked={bookmarked} userReaction={userReaction} />;
}

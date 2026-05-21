import Link from 'next/link';
import PostCard from "@/components/PostCard";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

function isMinor(dateOfBirth: Date | null): boolean {
  if (!dateOfBirth) return true;
  const today = new Date();
  const age = today.getFullYear() - dateOfBirth.getFullYear();
  const m = today.getMonth() - dateOfBirth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dateOfBirth.getDate())) {
    return age - 1 < 18;
  }
  return age < 18;
}

function sortByScore(posts: any[]) {
  return [...posts].sort((a, b) => {
    const scoreA = a.likes + a.commentsCount + a.sharesCount + a._count.remixes;
    const scoreB = b.likes + b.commentsCount + b.sharesCount + b._count.remixes;
    return scoreB - scoreA;
  });
}

export default async function AdultsPage(props: { searchParams?: Promise<{ sort?: string }> }) {
  const searchParams = await props.searchParams;
  const sort = searchParams?.sort || 'latest';
  const session = await auth();

  let userIsMinor = true;
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { dateOfBirth: true },
    });
    userIsMinor = isMinor(user?.dateOfBirth ?? null);
  }

  if (!session?.user || userIsMinor) {
    redirect('/');
  }

  const posts = await prisma.post.findMany({
    where: { remixOfId: null, audience: 'adults' },
    include: {
      author: true,
      _count: { select: { remixes: true } },
      reactions: { select: { type: true, userId: true } },
    },
    orderBy: sort === 'top' ? undefined : { createdAt: 'desc' as const },
  });

  const userId = session?.user?.id;
  const postsWithReactions = posts.map((post) => {
    const reactionCounts: Record<string, number> = {};
    let userReaction: string | null = null;
    for (const r of post.reactions) {
      reactionCounts[r.type] = (reactionCounts[r.type] || 0) + 1;
      if (r.userId === userId) userReaction = r.type;
    }
    const { reactions, ...rest } = post;
    return { ...rest, reactionCounts, userReaction };
  });

  const sortedPosts = sort === 'top' ? sortByScore(postsWithReactions) : postsWithReactions;

  const btnClass = (active: boolean) =>
    active
      ? 'px-4 py-2 rounded-full bg-red-500 text-white text-sm font-medium transition-colors'
      : 'px-4 py-2 rounded-full bg-dark-surface border border-dark-glass-border text-sm font-medium hover:text-red-400 transition-colors';

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">&larr; Back to Home</Link>
          <h1 className="text-3xl font-bold tracking-tight text-red-400 mt-2">Adults Content</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/adults" className={btnClass(sort === 'latest')} scroll={false}>Latest</Link>
          <Link href="/adults?sort=top" className={btnClass(sort === 'top')} scroll={false}>Top</Link>
        </div>
      </div>

      {sortedPosts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No adult content yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {sortedPosts.map((post) => (
            <PostCard
              key={post.id}
              id={post.id}
              title={post.title}
              author={post.author.username}
              originalImage={post.originalImage}
              interpretedImage={post.interpretedImage}
              likes={post.likes}
              comments={post.commentsCount}
              remixesCount={post._count.remixes}
              audience={post.audience}
              reactionCounts={post.reactionCounts}
              userReaction={post.userReaction}
            />
          ))}
        </div>
      )}
    </div>
  );
}

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import PostCard from "@/components/PostCard";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import T from '@/components/T';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

// Página "My Creations": muestra solo los posts del usuario logueado.
// Si no hay sesión, redirige al login.
export default async function MyCreations() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect('/login');

  const posts = await prisma.post.findMany({
    where: { authorId: userId },
    include: {
      author: { select: { username: true } },
      _count: { select: { remixes: true } },
      reactions: { select: { type: true, userId: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

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

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        HOME
      </Link>

      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8"><T id="mycreations.title" /></h1>

      {postsWithReactions.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg mb-4"><T id="mycreations.empty" /></p>
          <Link
            href="/create"
            className="inline-flex items-center gap-2 bg-brand-primary hover:bg-brand-primary/80 text-white px-6 py-3 rounded-full font-bold transition-colors"
          >
            <T id="mycreations.empty.cta" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {postsWithReactions.map((post) => (
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

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { PenTool, ArrowLeft, ArrowRight } from "lucide-react";
import PostCard from "@/components/PostCard";
import T from '@/components/T';
import CommentsSection from "@/components/CommentsSection";

export const dynamic = 'force-dynamic';

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: true,
      remixes: {
        include: {
          author: true,
          _count: {
            select: { remixes: true },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      _count: {
        select: { remixes: true },
      },
    },
  });

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8">
        <ArrowLeft className="w-5 h-5" />
        <T id="post.back" />
      </Link>

      {/* Main Post Focus */}
      <div className="glass-panel p-6 md:p-10 rounded-3xl border-dark-glass-border mb-16 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-3xl bg-brand-primary/10 blur-[100px] -z-10 rounded-full" />
        
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
          <div className="w-full md:w-2/3 relative aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/5">
              <Image
                src={post.originalImage}
                alt="Original"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 66vw"
              />
              <Image
                src={post.interpretedImage}
                alt="Dibujo"
                fill
              className="object-contain z-10"
              sizes="(max-width: 768px) 100vw, 66vw"
            />
          </div>
          
          <div className="w-full md:w-1/3 flex flex-col gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{post.title}</h1>
              <p className="text-gray-400 text-lg"><T id="post.by" /> <span className="text-brand-accent">@{post.author.username}</span></p>
            </div>

            <div className="flex items-center gap-4 py-6 border-y border-dark-glass-border">
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold text-white">{post._count.remixes}</span>
                <span className="text-sm text-gray-400 uppercase tracking-wider"><T id="post.remixes" /></span>
              </div>
              <div className="w-px h-12 bg-dark-glass-border mx-2" />
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold text-white">{post.likes}</span>
                <span className="text-sm text-gray-400 uppercase tracking-wider"><T id="post.likes" /></span>
              </div>
            </div>

            <div className="mt-auto flex items-center justify-center gap-4 py-2">
              <div className="flex items-center gap-2 text-brand-primary font-bold text-xl">
                <span><T id="post.whatisee" /></span>
                <ArrowRight className="w-6 h-6 animate-pulse" />
              </div>
              <Link
                href={`/create?remixId=${post.id}&remixUrl=${encodeURIComponent(post.originalImage)}`}
                className="bg-gradient-to-r from-brand-primary to-brand-secondary text-white p-5 rounded-full shadow-[0_0_30px_rgba(5,150,105,0.4)] flex items-center justify-center hover:scale-110 transition-all"
                title="What I See"
              >
                <PenTool className="w-7 h-7" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Comments */}
      <CommentsSection postId={post.id} initialCount={post.commentsCount} />

      {/* Remixes Gallery */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <T id="post.community" />
            <span className="bg-brand-primary/20 text-brand-primary text-sm py-1 px-3 rounded-full">
              {post._count.remixes}
            </span>
          </h2>
        </div>

        {post.remixes.length === 0 ? (
          <div className="text-center py-16 glass-panel rounded-2xl border-dark-glass-border">
            <p className="text-gray-400 mb-4"><T id="post.empty" /></p>
            <p className="text-white font-medium"><T id="post.empty.cta" /></p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {post.remixes.map((remix) => (
              <PostCard
                key={remix.id}
                id={remix.id}
                title={remix.title}
                author={remix.author.username}
                originalImage={remix.originalImage}
                interpretedImage={remix.interpretedImage}
                likes={remix.likes}
                comments={remix.commentsCount}
                remixesCount={remix._count.remixes}
                hideOriginal={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

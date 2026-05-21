'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Heart, MessageCircle, Bookmark, Share2, Repeat2, Send, Sparkles } from 'lucide-react';

const EMOJI_REACTIONS = [
  { id: 'funny', emoji: '\u{1F602}', label: 'Funny' },
  { id: 'disturbing', emoji: '\u{1F631}', label: 'Disturbing' },
  { id: 'beautiful', emoji: '\u{1F970}', label: 'Beautiful' },
  { id: 'weird', emoji: '\u{1F92E}', label: 'Weird' },
  { id: 'sad', emoji: '\u{1F622}', label: 'Sad' },
  { id: 'mind-blowing', emoji: '\u{1F92F}', label: 'Mind-blowing' },
];

export default function StoryPostcard({ story, session, bookmarked: initBookmarked, userReaction: initReaction }: any) {
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(initBookmarked);
  const [myReaction, setMyReaction] = useState<string | null>(initReaction);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState(story.comments || []);
  const [showComments, setShowComments] = useState(false);
  const [shares, setShares] = useState(story.sharesCount || 0);

  const isOwner = session?.user?.id === story.authorId;

  const moodEmojis: Record<string, string> = {
    funny: '\u{1F602}', dark: '\u{1F525}', mysterious: '\u{1F52E}',
    poetic: '\u{1F3B5}', absurd: '\u{1F92A}', emotional: '\u{1F497}', surreal: '\u{1F300}',
  };

  const handleReact = async (type: string) => {
    if (!session?.user) return router.push('/login');
    try {
      const res = await fetch(`/api/stories/${story.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'react', type }),
      });
      if (res.ok) {
        const data = await res.json();
        setReactionCounts((prev) => ({ ...prev, [type]: data.count }));
        setMyReaction(data.reacted ? type : null);
      }
    } catch {}
  };

  const handleBookmark = async () => {
    if (!session?.user) return router.push('/login');
    try {
      const res = await fetch(`/api/stories/${story.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bookmark' }),
      });
      if (res.ok) {
        const data = await res.json();
        setBookmarked(data.bookmarked);
      }
    } catch {}
  };

  const handleShare = async () => {
    if (!session?.user) return router.push('/login');
    try {
      await fetch(`/api/stories/${story.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'share' }),
      });
      setShares((s: number) => s + 1);
    } catch {}
    if (navigator.share) {
      navigator.share({ title: story.title, url: window.location.href });
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) return router.push('/login');
    if (!commentText.trim()) return;
    try {
      const res = await fetch(`/api/stories/${story.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentText.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments((prev: any[]) => [data.comment, ...prev]);
        setCommentText('');
      }
    } catch {}
  };

  return (
    <div className="min-h-screen pt-20 pb-16 px-4 max-w-4xl mx-auto">
      {/* Back */}
      <Link href="/story" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-5 h-5" />
        <span>Stories</span>
      </Link>

      {/* Postcard */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-dark-glass-border/50 shadow-[0_0_60px_rgba(5,150,105,0.1)]">
        {/* Images Grid */}
        <div className="grid grid-cols-2">
          {story.images.map((img: any, i: number) => (
            <div key={img.id} className={`relative aspect-[4/3] overflow-hidden bg-zinc-900 ${i % 2 === 1 ? 'border-l border-dark-glass-border/50' : ''}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>

        {/* Story Content */}
        <div className="p-6 md:p-8">
          {/* Mood badge */}
          {story.mood && moodEmojis[story.mood] && (
            <div className="inline-flex items-center gap-1.5 text-sm bg-brand-primary/10 text-brand-primary px-3 py-1 rounded-full mb-4">
              <span>{moodEmojis[story.mood]}</span>
              <span className="capitalize">{story.mood}</span>
            </div>
          )}

          <h1 className="text-2xl md:text-4xl font-bold text-white mb-4">{story.title}</h1>

          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-dark-glass-border/50">
            <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center text-sm font-bold text-brand-primary">
              {story.author.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={story.author.image} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                story.author.username.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <p className="text-white font-semibold">@{story.author.username}</p>
              <p className="text-xs text-gray-500">{new Date(story.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none mb-8">
            <p className="text-gray-200 leading-relaxed text-base md:text-lg whitespace-pre-wrap">{story.content}</p>
          </div>

          {/* Remix button */}
          <Link
            href={`/story?remix=${story.id}`}
            className="inline-flex items-center gap-2 text-sm bg-zinc-800 hover:bg-zinc-700 text-gray-300 px-4 py-2 rounded-full border border-dark-glass-border/50 transition-all mb-6"
          >
            <Repeat2 className="w-4 h-4" />
            Remix this story
          </Link>

          {/* Reactions */}
          <div className="flex flex-wrap gap-2 mb-6">
            {EMOJI_REACTIONS.map((r) => (
              <button
                key={r.id}
                onClick={() => handleReact(r.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm transition-all ${myReaction === r.id ? 'bg-brand-primary/20 border-brand-primary text-white' : 'bg-zinc-800/50 border-dark-glass-border/50 text-gray-400 hover:border-gray-500'}`}
              >
                <span className="text-lg">{r.emoji}</span>
                <span>{reactionCounts[r.id] || ''}</span>
              </button>
            ))}
          </div>

          {/* Action bar */}
          <div className="flex items-center gap-4 py-4 border-t border-dark-glass-border/50">
            <button onClick={handleBookmark} className={`flex items-center gap-1.5 text-sm transition-colors ${bookmarked ? 'text-brand-primary' : 'text-gray-400 hover:text-white'}`}>
              <Bookmark className="w-5 h-5" fill={bookmarked ? 'currentColor' : 'none'} />
              {story._count.bookmarks + (bookmarked && !initBookmarked ? 1 : 0)}
            </button>
            <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
              <MessageCircle className="w-5 h-5" />
              {comments.length}
            </button>
            <button onClick={handleShare} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
              <Share2 className="w-5 h-5" />
              {shares}
            </button>
          </div>

          {/* Comments */}
          {showComments && (
            <div className="mt-4 pt-4 border-t border-dark-glass-border/50">
              <form onSubmit={handleComment} className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 bg-zinc-800 border border-dark-glass-border rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                />
                <button type="submit" className="bg-brand-primary text-white p-2.5 rounded-xl">
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">No comments yet</p>
                ) : (
                  comments.map((c: any) => (
                    <div key={c.id} className="flex gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-brand-primary/20 flex items-center justify-center text-[10px] font-bold text-brand-primary flex-shrink-0">
                        {c.user.image ? <img src={c.user.image} alt="" className="w-7 h-7 rounded-full object-cover" /> : c.user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">@{c.user.username}</span>
                          <span className="text-[10px] text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-gray-300">{c.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Remixes */}
      {story.remixes?.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Repeat2 className="w-5 h-5" /> Remixes ({story.remixes.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {story.remixes.map((remix: any) => (
              <Link key={remix.id} href={`/story/${remix.id}`} className="block glass-panel rounded-2xl p-4 border border-dark-glass-border/50 hover:border-brand-primary/30 transition-all">
                <div className="grid grid-cols-2 gap-1 mb-3 h-24">
                  {remix.images?.slice(0, 4).map((img: any) => (
                    <div key={img.id} className="overflow-hidden rounded-lg bg-zinc-800">
                      <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <h3 className="text-white font-bold text-sm truncate">{remix.title}</h3>
                <p className="text-xs text-gray-500">@{remix.author.username}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send } from 'lucide-react';

const EMOJI_REACTIONS = [
  { id: 'creepy', emoji: '\u{1F31F}' },
  { id: 'accurate', emoji: '\u{2705}' },
  { id: 'hilarious', emoji: '\u{1F923}' },
  { id: 'cursed', emoji: '\u{1FAE1}' },
  { id: 'genius', emoji: '\u{1F9E0}' },
  { id: 'beautiful', emoji: '\u{1F970}' },
  { id: 'impossible', emoji: '\u{1F92F}' },
];

export default function EchoDrawingPage() {
  const { id } = useParams();
  const router = useRouter();
  const [drawing, setDrawing] = useState<any>(null);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/echo/drawings/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setDrawing(data.drawing);
        const counts: Record<string, number> = {};
        data.drawing.reactions?.forEach((r: any) => {
          counts[r.type] = (counts[r.type] || 0) + 1;
        });
        setReactionCounts(counts);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleReact = async (type: string) => {
    try {
      const res = await fetch(`/api/echo/drawings/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'react', type }),
      });
      if (res.ok) {
        const data = await res.json();
        setReactionCounts((prev) => ({ ...prev, [type]: data.count }));
      }
    } catch {}
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const res = await fetch(`/api/echo/drawings/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'comment', content: commentText.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setDrawing((prev: any) => ({ ...prev, comments: [data.comment, ...(prev.comments || [])] }));
        setCommentText('');
      }
    } catch {}
  };

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-pulse text-gray-500">Loading...</div></div>;
  }

  if (!drawing) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-gray-400">Not found</div>;
  }

  return (
    <div className="min-h-screen bg-black pt-6 pb-16 px-4 max-w-2xl mx-auto">
      <Link href="/echo" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-5 h-5" />
        <span>Echo Vision</span>
      </Link>

      {/* Original vs Drawing */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-2 text-center">Original</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={drawing.imageUrl} alt="" className="w-full aspect-square object-cover rounded-2xl border border-dark-glass-border/50" />
        </div>
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-2 text-center">@{drawing.user.username}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={drawing.drawingData} alt="" className="w-full aspect-square object-cover rounded-2xl border border-brand-primary/30 bg-black" />
        </div>
      </div>

      {/* Reactions */}
      <div className="flex flex-wrap gap-2 mb-6 justify-center">
        {EMOJI_REACTIONS.map((r) => (
          <button
            key={r.id}
            onClick={() => handleReact(r.id)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl border border-dark-glass-border/50 bg-zinc-900 text-sm hover:border-brand-primary/50 transition-all"
          >
            <span className="text-lg">{r.emoji}</span>
            {reactionCounts[r.id] > 0 && <span className="text-gray-400 text-xs">{reactionCounts[r.id]}</span>}
          </button>
        ))}
      </div>

      {/* Comments */}
      <form onSubmit={handleComment} className="flex gap-2 mb-4">
        <input
          type="text"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 bg-zinc-800 border border-dark-glass-border rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
        />
        <button type="submit" disabled={!commentText.trim()} className="bg-brand-primary text-white p-2.5 rounded-xl disabled:opacity-40">
          <Send className="w-4 h-4" />
        </button>
      </form>

      <div className="space-y-3">
        {(!drawing.comments || drawing.comments.length === 0) ? (
          <p className="text-gray-600 text-sm text-center">No comments yet</p>
        ) : (
          drawing.comments.map((c: any) => (
            <div key={c.id} className="flex gap-2.5 bg-zinc-900 rounded-xl p-3 border border-dark-glass-border/50">
              <div className="w-7 h-7 rounded-full bg-brand-primary/20 flex items-center justify-center text-[10px] font-bold text-brand-primary flex-shrink-0">
                {c.user.image ? <img src={c.user.image} alt="" className="w-7 h-7 rounded-full object-cover" /> : c.user.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="text-xs font-semibold text-white">@{c.user.username}</span>
                <p className="text-sm text-gray-300">{c.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

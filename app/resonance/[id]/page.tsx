'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useT } from '@/lib/i18n/context';
import { ArrowLeft, Send, Share2, Sparkles, MessageCircle, Eye } from 'lucide-react';

const REACTION_EMOJIS = [
  { id: 'scared', emoji: '\u{1F631}' },
  { id: 'curious', emoji: '\u{1F914}' },
  { id: 'amused', emoji: '\u{1F602}' },
  { id: 'confused', emoji: '\u{1F615}' },
  { id: 'fascinated', emoji: '\u{1F92F}' },
  { id: 'disturbed', emoji: '\u{1F940}' },
];

export default function ResonanceSignalPage() {
  const { id } = useParams();
  const t = useT();
  const [signal, setSignal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [responded, setResponded] = useState(false);
  const [interpretation, setInterpretation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
  const [commentText, setCommentText] = useState('');
  const [showReveal, setShowReveal] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/resonance/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setSignal(data.signal);
        setResponded(data.userResponded);
        const counts: Record<string, number> = {};
        data.signal.reactions?.forEach((r: any) => {
          counts[r.type] = (counts[r.type] || 0) + 1;
        });
        setReactionCounts(counts);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleRespond = async () => {
    if (!interpretation.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/resonance/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'respond', interpretation: interpretation.trim() }),
      });
      if (res.ok) {
        setResponded(true);
        setShowReveal(true);
        // Refetch to get collective data
        const updated = await fetch(`/api/resonance/${id}`);
        const data = await updated.json();
        setSignal(data.signal);
      }
    } catch {}
    setSubmitting(false);
  };

  const handleReact = async (type: string) => {
    try {
      const res = await fetch(`/api/resonance/${id}`, {
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

  const handleShare = async () => {
    try {
      await fetch(`/api/resonance/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'share' }),
      });
    } catch {}
    if (navigator.share) {
      navigator.share({ title: signal.title, text: t('resonance.share.text'), url: window.location.href });
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const res = await fetch(`/api/resonance/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'comment', content: commentText.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setSignal((prev: any) => ({
          ...prev,
          comments: [data.comment, ...(prev.comments || [])],
        }));
        setCommentText('');
      }
    } catch {}
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading signal...</div>
      </div>
    );
  }

  if (!signal) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Signal not found</p>
          <Link href="/resonance" className="text-brand-primary hover:underline">Explore signals</Link>
        </div>
      </div>
    );
  }

  // Not responded yet → show image + respond form
  if (!responded) {
    return (
      <div className="min-h-screen bg-black pt-6 pb-16 px-4 max-w-3xl mx-auto">
        <Link href="/resonance" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span>Signals</span>
        </Link>

        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{signal.title}</h1>
          <p className="text-gray-400 italic text-lg">&ldquo;{signal.question}&rdquo;</p>
          <p className="text-xs text-gray-600 mt-1">by @{signal.author.username}</p>
        </div>

        {/* Image */}
        <div className="relative aspect-square max-w-lg mx-auto rounded-2xl overflow-hidden border border-dark-glass-border/50 mb-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={signal.imageUrl} alt={signal.title} className="w-full h-full object-cover" />
        </div>

        {/* Respond */}
        <div className="max-w-lg mx-auto">
          <p className="text-gray-300 text-sm mb-3 text-center font-medium">What do <span className="text-brand-primary">you</span> see?</p>
          <div className="flex gap-3">
            <input
              type="text"
              value={interpretation}
              onChange={(e) => setInterpretation(e.target.value)}
              placeholder="Type your interpretation..."
              className="flex-1 bg-zinc-800 border border-dark-glass-border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
            />
            <button
              onClick={handleRespond}
              disabled={!interpretation.trim() || submitting}
              className="bg-brand-primary text-white p-3 rounded-xl disabled:opacity-40 transition-all"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Reveal phase
  return (
    <div className="min-h-screen bg-black pt-6 pb-16 px-4 max-w-4xl mx-auto">
      <Link href="/resonance" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-5 h-5" />
        <span>Signals</span>
      </Link>

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">{signal.title}</h1>
        <p className="text-gray-400 italic">&ldquo;{signal.question}&rdquo;</p>
        <p className="text-xs text-gray-600">by @{signal.author.username}</p>
      </div>

      {/* Image */}
      <div className="relative aspect-video max-w-xl mx-auto rounded-2xl overflow-hidden border border-dark-glass-border/50 mb-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={signal.imageUrl} alt={signal.title} className="w-full h-full object-cover" />
      </div>

      {/* Resonance Stats */}
      <div className="glass-panel rounded-2xl border border-dark-glass-border/50 p-6 mb-8 max-w-xl mx-auto">
        <div className="grid grid-cols-3 gap-4 text-center mb-4">
          <div>
            <div className="flex items-center justify-center gap-1 text-brand-primary mb-1">
              <Sparkles className="w-5 h-5" />
              <span className="text-2xl font-bold text-white">{signal.resonanceScore.toFixed(0)}</span>
            </div>
            <p className="text-xs text-gray-500">Resonance</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{signal.callsAnswered}</div>
            <p className="text-xs text-gray-500">Answered</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{signal.callsSent}</div>
            <p className="text-xs text-gray-500">Sent</p>
          </div>
        </div>

        {/* Responses count */}
        <p className="text-center text-sm text-gray-400 border-t border-dark-glass-border/50 pt-4">
          {signal.responses?.length || 0} people responded
        </p>
      </div>

      {/* Collective interpretations */}
      {signal.responses?.length > 0 && (
        <div className="mb-8 max-w-xl mx-auto">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-brand-primary" />
            What others saw
          </h3>
          <div className="space-y-2">
            {signal.responses.slice(0, 20).map((r: any) => (
              <div key={r.id} className="flex items-center gap-3 bg-zinc-900 rounded-xl px-4 py-3 border border-dark-glass-border/50">
                <div className="w-7 h-7 rounded-full bg-brand-primary/20 flex items-center justify-center text-[10px] font-bold text-brand-primary flex-shrink-0">
                  {r.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.user.image} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    r.user.username.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 truncate">{r.interpretation}</p>
                  <p className="text-[10px] text-gray-600">@{r.user.username}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reactions */}
      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        {REACTION_EMOJIS.map((r) => (
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

      {/* Share */}
      <div className="text-center mb-8">
        <button onClick={handleShare} className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
          <Share2 className="w-4 h-4" />
          {t('resonance.share.button')}
        </button>
      </div>

      {/* Comments */}
      <div className="max-w-xl mx-auto">
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
          {(!signal.comments || signal.comments.length === 0) ? (
            <p className="text-gray-600 text-sm text-center">No comments yet</p>
          ) : (
            signal.comments.map((c: any) => (
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
    </div>
  );
}

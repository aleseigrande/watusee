'use client';

import Link from 'next/link';
import { Eye, MessageCircle, Share2, Sparkles } from 'lucide-react';

interface SignalCardProps {
  signal: {
    id: string;
    title: string;
    question: string;
    imageUrl: string;
    callsSent: number;
    callsAnswered: number;
    resonanceScore: number;
    createdAt: string;
    author: { username: string; image: string | null };
    _count: { responses: number; reactions: number; comments: number };
  };
}

export default function ResonanceSignalCard({ signal }: SignalCardProps) {
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/resonance/${signal.id}` : '';

  return (
    <Link
      href={`/resonance/${signal.id}`}
      className="group block glass-panel rounded-2xl overflow-hidden border border-dark-glass-border/50 hover:border-brand-primary/30 transition-all hover-lift"
    >
      {/* Blurred image preview */}
      <div className="relative aspect-video overflow-hidden bg-zinc-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={signal.imageUrl}
          alt={signal.title}
          className="w-full h-full object-cover blur-xl scale-110 group-hover:scale-125 transition-transform duration-700"
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        {/* Question overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-white/90 text-sm italic mb-1">&ldquo;{signal.question}&rdquo;</p>
        </div>

        {/* Resonance score badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-brand-primary/90 text-white text-xs font-bold px-2.5 py-1 rounded-full">
          <Sparkles className="w-3 h-3" />
          {signal.resonanceScore.toFixed(0)}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-bold text-white text-base mb-1 group-hover:text-brand-primary transition-colors">{signal.title}</h3>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-full bg-brand-primary/20 flex items-center justify-center text-[8px] font-bold text-brand-primary">
            {signal.author.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={signal.author.image} alt="" className="w-5 h-5 rounded-full object-cover" />
            ) : (
              signal.author.username.charAt(0).toUpperCase()
            )}
          </div>
          <span className="text-xs text-gray-500">@{signal.author.username}</span>
        </div>

        {/* Metrics */}
        <div className="flex items-center justify-between text-xs text-gray-500 border-t border-dark-glass-border/50 pt-3">
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            {signal.callsAnswered} answers
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="w-3.5 h-3.5" />
            {signal._count.comments}
          </span>
          <span className="flex items-center gap-1">
            <Share2 className="w-3.5 h-3.5" />
            {signal.callsSent}
          </span>
        </div>
      </div>
    </Link>
  );
}

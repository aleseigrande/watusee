'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, Heart, Eye, Sparkles, Clock } from 'lucide-react';
import { useT } from '@/lib/i18n/context';

interface Entry {
  id: string;
  userId: string;
  username: string;
  userImage: string | null;
  interpretation: string | null;
  likes: number;
  likedByMe: boolean;
}

interface ChallengeData {
  id: string;
  imageUrl: string;
  date: string;
  revealed: boolean;
  totalEntries: number;
  myEntry: { interpretation: string } | null;
  entries: Entry[];
}

export default function DailyChallengePage() {
  const t = useT();
  const [data, setData] = useState<ChallengeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [interpretation, setInterpretation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchChallenge = () => {
    setLoading(true);
    fetch('/api/daily-pareidolia')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchChallenge(); }, []);

  const handleSubmit = async () => {
    if (!interpretation.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/daily-pareidolia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interpretation: interpretation.trim() }),
      });
      if (res.ok) fetchChallenge();
    } catch {}
    setSubmitting(false);
  };

  const handleLike = async (entryId: string) => {
    try {
      const res = await fetch('/api/daily-pareidolia/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId }),
      });
      if (res.ok) {
        const result = await res.json();
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            entries: prev.entries.map((e) =>
              e.id === entryId ? { ...e, likes: result.likes, likedByMe: result.liked } : e
            ),
          };
        });
      }
    } catch {}
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-24 pb-16 px-4 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">{t('daily.loading')}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-black pt-24 pb-16 px-4 text-center">
        <p className="text-gray-400 mb-4">{t('daily.noimages')}</p>
        <Link href="/" className="text-brand-primary hover:underline">{t('daily.back')}</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-20 pb-16 px-4 max-w-3xl mx-auto">
      <Link href="/play" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-5 h-5" />
        <span>{t('daily.games')}</span>
      </Link>

      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/20 text-brand-primary text-xs font-medium mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          {t('daily.title')}
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{t('daily.whatyousee')}</h1>
        <p className="text-gray-500 text-sm flex items-center justify-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          {data.revealed ? t('daily.revealed') : `${t('daily.reveal')} ${data.totalEntries} ${t('daily.participated', { count: data.totalEntries.toString() })}`}
        </p>
      </div>

      {/* Image */}
      <div className="relative aspect-square max-w-md mx-auto rounded-2xl overflow-hidden border border-dark-glass-border/50 mb-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={data.imageUrl} alt="Daily challenge" className="w-full h-full object-cover" />
      </div>

      {/* Submit interpretation */}
      {!data.revealed && !data.myEntry && (
        <div className="max-w-md mx-auto mb-10">
          <p className="text-gray-300 text-sm mb-3 text-center">
            {t('daily.whatyousee')} <span className="text-brand-primary">{t('daily.you')}</span>? {t('daily.hidden')}
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              value={interpretation}
              onChange={(e) => setInterpretation(e.target.value)}
              placeholder={t('daily.placeholder')}
              className="flex-1 bg-zinc-800 border border-dark-glass-border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
            />
            <button
              onClick={handleSubmit}
              disabled={!interpretation.trim() || submitting}
              className="bg-brand-primary text-white p-3 rounded-xl disabled:opacity-40 transition-all"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Show my submission when waiting for reveal */}
      {!data.revealed && data.myEntry && (
        <div className="max-w-md mx-auto mb-10 text-center">
          <div className="glass-panel rounded-xl p-4 border border-brand-primary/30">
            <p className="text-xs text-gray-500 mb-1">{t('daily.yoursubmission')}</p>
            <p className="text-white font-medium italic">&ldquo;{data.myEntry.interpretation}&rdquo;</p>
          </div>
          <p className="text-gray-600 text-xs mt-3">{t('daily.comeback')}</p>
        </div>
      )}

      {/* Revealed entries */}
      {data.revealed && data.entries.length > 0 && (
        <div className="max-w-lg mx-auto">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-brand-primary" />
            {t('daily.everyone')}
          </h3>
          <div className="space-y-2">
            {data.entries.map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 bg-zinc-900 rounded-xl px-4 py-3 border border-dark-glass-border/50">
                <div className="w-7 h-7 rounded-full bg-brand-primary/20 flex items-center justify-center text-[10px] font-bold text-brand-primary flex-shrink-0">
                  {entry.userImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={entry.userImage} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    entry.username.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {entry.interpretation && (
                    <p className="text-sm text-gray-200">{entry.interpretation}</p>
                  )}
                  <p className="text-[10px] text-gray-600">@{entry.username}</p>
                </div>
                <button
                  onClick={() => handleLike(entry.id)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-all ${entry.likedByMe ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800 text-gray-500 hover:text-red-400'}`}
                >
                  <Heart className={`w-3.5 h-3.5 ${entry.likedByMe ? 'fill-red-400' : ''}`} />
                  {entry.likes > 0 && <span>{entry.likes}</span>}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.revealed && data.entries.length === 0 && (
        <p className="text-center text-gray-500">{t('daily.nobody')}</p>
      )}
    </div>
  );
}

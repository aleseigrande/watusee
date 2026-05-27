'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Brain, Eye, Heart, Trophy, Users, Star } from 'lucide-react';
import { useT } from '@/lib/i18n/context';

interface Challenge {
  id: string;
  title: string;
  creator: { username: string; image: string | null };
  playCount: number;
  averageScore: number;
  likeCount: number;
  attemptCount: number;
}

const RESONANCE_LEVELS = [
  { min: 0, label: 'Emerging Reader', icon: '🌱' },
  { min: 20, label: 'Thought Explorer', icon: '🔍' },
  { min: 40, label: 'Vision Decoder', icon: '👁️' },
  { min: 60, label: 'Mind Synchronizer', icon: '🧠' },
  { min: 80, label: 'Mind Reader Master', icon: '👑' },
];

export default function MindReaderPage() {
  const t = useT();
  const router = useRouter();
  const [mode, setMode] = useState<'select' | 'creator' | 'player'>('select');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(false);
  const [myStats, setMyStats] = useState<{ total: number; avgScore: number } | null>(null);

  useEffect(() => {
    if (mode === 'player') {
      setLoading(true);
      fetch('/api/mind-reader/challenges')
        .then((r) => r.json())
        .then((d) => setChallenges(d.challenges || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [mode]);

  const getResonance = (score: number) => {
    const pct = (score / 5) * 100;
    for (const lvl of RESONANCE_LEVELS) {
      if (pct <= lvl.min + 19) return lvl;
    }
    return RESONANCE_LEVELS[RESONANCE_LEVELS.length - 1];
  };

  if (mode === 'select') {
    return (
      <div className="min-h-screen bg-black pt-20 pb-16 px-4 max-w-lg mx-auto text-center">
        <Link href="/play" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors absolute top-20 left-4">
          <ArrowLeft className="w-5 h-5" /><span>{t('mindreader.games')}</span>
        </Link>
        <div className="pt-12">
          <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-6">
            <Brain className="w-10 h-10 text-purple-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">{t('mindreader.title')}</h1>
          <p className="text-gray-400 text-sm mb-8 max-w-sm mx-auto">{t('mindreader.desc')}</p>
          <div className="space-y-4">
            <button onClick={() => router.push('/mind-reader/create')} className="w-full flex items-center gap-4 px-5 py-5 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 transition-all text-left">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Eye className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-white font-bold text-lg">{t('mindreader.creator')}</p>
                <p className="text-gray-400 text-xs">{t('mindreader.creatorDesc')}</p>
              </div>
            </button>
            <button onClick={() => setMode('player')} className="w-full flex items-center gap-4 px-5 py-5 rounded-xl border border-brand-primary/30 bg-brand-primary/10 hover:bg-brand-primary/20 transition-all text-left">
              <div className="w-12 h-12 rounded-full bg-brand-primary/20 flex items-center justify-center">
                <Brain className="w-6 h-6 text-brand-primary" />
              </div>
              <div>
                <p className="text-white font-bold text-lg">{t('mindreader.player')}</p>
                <p className="text-gray-400 text-xs">{t('mindreader.playerDesc')}</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-20 pb-16 px-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setMode('select')} className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-white">{t('mindreader.browse')}</h1>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map((i) => (
            <div key={i} className="bg-zinc-900 rounded-2xl p-5 border border-dark-glass-border/50 animate-pulse">
              <div className="h-5 bg-zinc-800 rounded w-3/4 mb-3" />
              <div className="h-3 bg-zinc-800 rounded w-1/2 mb-2" />
              <div className="h-3 bg-zinc-800 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : challenges.length === 0 ? (
        <div className="text-center py-16">
          <Brain className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-600">{t('mindreader.empty')}</p>
          <button onClick={() => router.push('/mind-reader/create')} className="mt-4 px-6 py-2.5 bg-brand-primary text-white rounded-full font-semibold">
            {t('mindreader.createFirst')}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {challenges.map((ch) => (
            <button key={ch.id} onClick={() => router.push(`/mind-reader/${ch.id}`)} className="w-full glass-panel rounded-2xl p-5 border border-dark-glass-border/50 hover:border-brand-primary/50 transition-all text-left">
              <h3 className="text-white font-bold text-lg mb-2">{ch.title}</h3>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-full bg-brand-primary/20 flex items-center justify-center text-[6px] font-bold text-brand-primary">
                  {ch.creator.image ? <img src={ch.creator.image} alt="" className="w-5 h-5 rounded-full object-cover" /> : ch.creator.username.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs text-gray-500">@{ch.creator.username}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{ch.playCount}</span>
                <span className="flex items-center gap-1"><Star className="w-3 h-3" />{(ch.averageScore).toFixed(1)} avg</span>
                <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{ch.likeCount}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

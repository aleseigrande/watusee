'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Check, X, Brain, Heart, Share2, Trophy, Star, Loader2 } from 'lucide-react';
import { useT } from '@/lib/i18n/context';

interface RoundData {
  id: string;
  clue: string;
  image0: string;
  image1: string;
  image2: string;
  roundNumber: number;
}

interface ResultRound extends RoundData {
  correctIndex: number;
  explanation: string | null;
}

interface ChallengeDetail {
  id: string;
  title: string;
  creator: { id: string; username: string; image: string | null };
  rounds: RoundData[];
  playCount: number;
  averageScore: number;
  likeCount: number;
}

const RESONANCE_LEVELS = [
  { min: 0, label: 'Emerging Reader', icon: '🌱' },
  { min: 20, label: 'Thought Explorer', icon: '🔍' },
  { min: 40, label: 'Vision Decoder', icon: '👁️' },
  { min: 60, label: 'Mind Synchronizer', icon: '🧠' },
  { min: 80, label: 'Mind Reader Master', icon: '👑' },
];

export default function PlayMindReaderPage() {
  const params = useParams();
  const router = useRouter();
  const t = useT();
  const answersRef = useRef<number[]>([]);
  const [challenge, setChallenge] = useState<ChallengeDetail | null>(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<{ rounds: ResultRound[]; answers: { chosenIndex: number; correct: boolean }[]; score: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/mind-reader/challenge/${params.id}`)
      .then((r) => r.json())
      .then((d) => { setChallenge(d); setLoading(false); })
      .catch(() => { setLoading(false); setError('Failed to load challenge'); });
  }, [params.id]);

  const handleSelect = (idx: number) => {
    if (revealed || results) return;
    setSelected(idx);
    setRevealed(true);
    answersRef.current = [...answersRef.current, idx];
  };

  const handleNext = () => {
    if (currentRound < 4) {
      setCurrentRound(currentRound + 1);
      setSelected(null);
      setRevealed(false);
    } else {
      submitAll();
    }
  };

  const submitAll = async () => {
    setSubmitting(true);
    const allAnswers = answersRef.current;
    try {
      const res = await fetch('/api/mind-reader/attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: challenge!.id, answers: allAnswers.map((a) => ({ chosenIndex: a })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResults({ ...data, score: data.attempt.score });
    } catch (err: any) {
      setError(err.message);
    }
    setSubmitting(false);
  };

  const toggleLike = async () => {
    try {
      await fetch('/api/mind-reader/reaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: challenge!.id, type: 'like' }),
      });
      setLiked(!liked);
    } catch {}
  };

  const getResonance = (score: number) => {
    const pct = (score / 5) * 100;
    for (const lvl of RESONANCE_LEVELS) {
      if (pct <= lvl.min + 19) return lvl;
    }
    return RESONANCE_LEVELS[RESONANCE_LEVELS.length - 1];
  };

  if (loading) return (
    <div className="min-h-screen bg-black pt-24 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
    </div>
  );

  if (error || !challenge) return (
    <div className="min-h-screen bg-black pt-20 pb-16 px-4 max-w-lg mx-auto text-center">
      <p className="text-red-400">{error || 'Challenge not found'}</p>
      <button onClick={() => router.push('/mind-reader')} className="mt-4 text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5 inline" /> Back</button>
    </div>
  );

  // RESULTS VIEW
  if (results) {
    const resonance = getResonance(results.score);
    return (
      <div className="min-h-screen bg-black pt-20 pb-16 px-4 max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">{resonance.icon}</div>
          <h1 className="text-2xl font-bold text-white mb-1">{resonance.label}</h1>
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-5xl font-bold text-white">{Math.round((results.score / 5) * 100)}%</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-3 mb-2 overflow-hidden relative">
            <div className={`h-full rounded-full transition-all ${results.score === 5 ? 'bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-300 animate-pulse shadow-[0_0_15px_rgba(250,204,21,0.6)]' : 'bg-gradient-to-r from-purple-500 to-brand-primary'}`} style={{ width: `${(results.score / 5) * 100}%` }} />
            {results.score === 5 && (
              <Trophy className="absolute -right-2 top-1/2 -translate-y-1/2 w-5 h-5 text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.8)]" />
            )}
          </div>
          {results.score === 5 && (
            <p className="text-yellow-400 text-sm font-bold mt-1">✨ Perfect Mind Sync! ✨</p>
          )}
          <p className="text-gray-400 text-sm">{results.score} {t('mindreader.scoreDesc')}</p>
        </div>

        <div className="flex items-center justify-center gap-4 mb-8">
          <button onClick={toggleLike} className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${liked ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-zinc-800 border-dark-glass-border text-gray-400'}`}>
            <Heart className={`w-4 h-4 ${liked ? 'fill-red-500 text-red-500' : ''}`} /> {challenge.likeCount + (liked ? 1 : 0)}
          </button>
          <button onClick={() => { if (navigator.share) navigator.share({ title: challenge.title, url: window.location.href }); }} className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800 border border-dark-glass-border text-gray-400 hover:text-white transition-all">
            <Share2 className="w-4 h-4" /> Share
          </button>
        </div>

        <div className="space-y-4">
          {results.rounds.map((round, i) => {
            const ans = results.answers[i];
            return (
              <div key={round.id} className={`glass-panel rounded-2xl p-4 border ${ans.correct ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500">{t('mindreader.round')} {i + 1}</span>
                  {ans.correct ? <Check className="w-4 h-4 text-green-400" /> : <X className="w-4 h-4 text-red-400" />}
                </div>
                <p className="text-sm text-gray-300 mb-2 italic">"{round.clue}"</p>
                <div className="grid grid-cols-3 gap-1 mb-2">
                  {[round.image0, round.image1, round.image2].map((img, j) => (
                    <div key={j} className={`aspect-square rounded-lg overflow-hidden border-2 bg-zinc-900 ${j === round.correctIndex ? 'border-green-500' : j === ans.chosenIndex && !ans.correct ? 'border-red-500' : 'border-transparent'}`}>
                      <img src={img} alt="" className="w-full h-full object-contain p-1" />
                    </div>
                  ))}
                </div>
                {round.explanation && <p className="text-xs text-gray-500 mt-1">{round.explanation}</p>}
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 mt-8">
          <button onClick={() => router.push('/mind-reader')} className="flex-1 bg-zinc-800 text-white py-3 rounded-xl border border-dark-glass-border hover:border-brand-primary/50 transition-all">{t('mindreader.moreChallenges')}</button>
          <button onClick={() => router.push('/mind-reader/create')} className="flex-1 bg-brand-primary text-white py-3 rounded-xl font-semibold hover:bg-brand-primary/80 transition-all">{t('mindreader.createOwn')}</button>
        </div>
      </div>
    );
  }

  // PLAY VIEW
  const round = challenge.rounds[currentRound];
  const images = [round.image0, round.image1, round.image2];

  return (
    <div className="min-h-screen bg-black pt-20 pb-16 px-4 max-w-lg mx-auto">
      <button onClick={() => router.push('/mind-reader')} className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors">
        <ArrowLeft className="w-5 h-5" /><span>{t('mindreader.back')}</span>
      </button>

      {/* Progress */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm text-gray-500">{t('mindreader.round')} {currentRound + 1} / 5</span>
        <span className="text-xs text-gray-600">{challenge.title}</span>
      </div>
      <div className="w-full bg-zinc-800 rounded-full h-1.5 mb-6 overflow-hidden">
        <div className="h-full bg-brand-primary rounded-full transition-all" style={{ width: `${((currentRound + (revealed ? 1 : 0)) / 5) * 100}%` }} />
      </div>

      {/* Clue */}
      <div className="glass-panel rounded-2xl p-5 border border-dark-glass-border/50 mb-6 text-center">
        <Brain className="w-6 h-6 text-purple-400 mx-auto mb-3" />
        <p className="text-white text-lg font-medium italic">"{round.clue}"</p>
        <p className="text-xs text-gray-600 mt-2">{t('mindreader.pickImage')}</p>
      </div>

      {/* Images - 3 side by side, full visibility */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            disabled={revealed}
            className={`relative rounded-xl overflow-hidden border-2 transition-all bg-zinc-900 ${
              revealed
                ? selected === i
                  ? 'border-brand-primary ring-2 ring-brand-primary/50'
                  : 'border-dark-glass-border opacity-60'
                : 'border-dark-glass-border/50 hover:border-brand-primary/50 hover:scale-[1.02]'
            }`}
          >
            <div className="aspect-square relative flex items-center justify-center">
              <img src={img} alt="" className="w-full h-full object-contain p-1" />
              <div className="absolute top-1 left-1 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center">
                <span className="text-white font-bold text-xs">{i + 1}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Reveal feedback */}
      {revealed && !results && (
        <button onClick={handleNext} disabled={submitting} className="w-full bg-brand-primary text-white py-3.5 rounded-xl font-bold hover:bg-brand-primary/80 transition-all disabled:opacity-50">
          {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : currentRound < 4 ? t('mindreader.nextRound') : t('mindreader.seeResults')}
        </button>
      )}

      {error && <p className="text-red-400 text-sm text-center mt-4">{error}</p>}
    </div>
  );
}

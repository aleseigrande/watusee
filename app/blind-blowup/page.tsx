'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, Clock, Trophy, RefreshCw, Zap, Target, Skull } from 'lucide-react';
import { useT } from '@/lib/i18n/context';

interface DifficultyConfig {
  label: string;
  time: number;
  pixelStart: number;
  clearAtProgress: number;
  color: string;
  icon: React.ReactNode;
}

const DIFFICULTIES: Record<string, DifficultyConfig> = {
  easy: { label: 'Easy', time: 45, pixelStart: 8, clearAtProgress: 0.5, color: 'text-green-400 bg-green-500/10 border-green-500/30', icon: <Zap className="w-5 h-5" /> },
  medium: { label: 'Medium', time: 30, pixelStart: 12, clearAtProgress: 1, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30', icon: <Target className="w-5 h-5" /> },
  hard: { label: 'Hard', time: 15, pixelStart: 16, clearAtProgress: 1, color: 'text-red-400 bg-red-500/10 border-red-500/30', icon: <Skull className="w-5 h-5" /> },
};

interface GameResult {
  id: string;
  guess: string;
  timeSeconds: number;
  difficulty: string;
  user: { username: string; image: string | null };
}

export default function BlindBlowupPage() {
  const t = useT();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [difficulty, setDifficulty] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(30);
  const [guess, setGuess] = useState('');
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'submitted'>('idle');
  const [submitting, setSubmitting] = useState(false);
  const [myResult, setMyResult] = useState<{ time: number; guess: string; difficulty: string } | null>(null);
  const [results, setResults] = useState<GameResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState('');
  const imgRef = useRef<HTMLImageElement | null>(null);
  const animRef = useRef<number>(0);
  const configRef = useRef<DifficultyConfig | null>(null);

  const startGame = async (diff: string) => {
    const config = DIFFICULTIES[diff];
    if (!config) return;
    configRef.current = config;
    setDifficulty(diff);
    setError('');
    setGameState('idle');
    setMyResult(null);
    setResults([]);
    setGuess('');
    setTotalTime(config.time);
    setTimeLeft(config.time);

    const res = await fetch('/api/blind-blowup/start');
    if (!res.ok) { setError(t('blind.noimages')); return; }
    const data = await res.json();
    setImageUrl(data.imageUrl);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      setGameState('playing');
    };
    img.onerror = () => setError('Failed to load image');
    img.src = data.imageUrl;
  };

  useEffect(() => {
    if (gameState !== 'playing') return;
    const startTime = Date.now();
    const config = configRef.current;
    let ticking = true;

    const tick = () => {
      if (!ticking) return;
      const elapsed = (Date.now() - startTime) / 1000;
      const remaining = Math.max(0, totalTime - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        handleSubmit('');
        return;
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => { ticking = false; cancelAnimationFrame(animRef.current); };
  }, [gameState]);

  useEffect(() => {
    if (!canvasRef.current || !imgRef.current || gameState !== 'playing') return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const config = configRef.current;
    if (!config) return;

    const elapsed = totalTime - timeLeft;
    const progress = Math.min(elapsed / totalTime, 1);
    const adjustedProgress = progress / config.clearAtProgress;
    const clampedProgress = Math.min(adjustedProgress, 1);
    const pixelSize = Math.max(1, Math.round(config.pixelStart - clampedProgress * (config.pixelStart - 1)));

    const w = imgRef.current.naturalWidth || 400;
    const h = imgRef.current.naturalHeight || 400;
    canvas.width = 400;
    canvas.height = 400;

    const sw = Math.max(1, Math.floor(w / pixelSize));
    const sh = Math.max(1, Math.floor(h / pixelSize));

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(imgRef.current, 0, 0, sw, sh);
    ctx.drawImage(canvas, 0, 0, sw, sh, 0, 0, 400, 400);
  }, [timeLeft, gameState]);

  const handleSubmit = async (forcedGuess?: string) => {
    const finalGuess = forcedGuess !== undefined ? forcedGuess : guess.trim();
    if (!finalGuess && forcedGuess === undefined) return;
    setSubmitting(true);
    setGameState('submitted');

    const elapsed = totalTime - timeLeft;
    const timeSeconds = parseFloat(elapsed.toFixed(1));

    try {
      await fetch('/api/blind-blowup/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, guess: finalGuess || 'No answer', timeSeconds, difficulty }),
      });
    } catch {}

    setMyResult({ time: timeSeconds, guess: finalGuess || 'No answer', difficulty: difficulty || 'medium' });

    setLoadingResults(true);
    try {
      const r = await fetch(`/api/blind-blowup/results?imageUrl=${encodeURIComponent(imageUrl)}&difficulty=${difficulty}`);
      const d = await r.json();
      setResults(d.games || []);
    } catch {}
    setLoadingResults(false);
    setSubmitting(false);
  };

  if (gameState === 'idle' && !imageUrl) {
    return (
      <div className="min-h-screen bg-black pt-20 pb-16 px-4 max-w-lg mx-auto text-center">
        <Link href="/play" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-5 h-5" /><span>{t('blind.games')}</span>
        </Link>
        <div className="glass-panel rounded-2xl p-8 border border-dark-glass-border/50">
          <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{t('blind.title')}</h1>
          <p className="text-gray-400 text-sm mb-8">{t('blind.desc')}</p>

          <div className="space-y-3">
            {Object.entries(DIFFICULTIES).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => startGame(key)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border transition-all hover:scale-[1.02] ${cfg.color}`}
              >
                <div className="w-10 h-10 rounded-full bg-black/30 flex items-center justify-center flex-shrink-0">
                  {cfg.icon}
                </div>
                <div className="text-left flex-1">
                  <p className="text-white font-bold">{cfg.label}</p>
                  <p className="text-xs text-gray-400">{cfg.time}s &middot; {cfg.pixelStart}px start</p>
                </div>
              </button>
            ))}
          </div>
        </div>
        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
      </div>
    );
  }

  if (gameState === 'submitted') {
    const cfg = DIFFICULTIES[myResult?.difficulty || 'medium'];
    return (
      <div className="min-h-screen bg-black pt-20 pb-16 px-4 max-w-lg mx-auto">
        <Link href="/play" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5" /><span>{t('blind.games')}</span>
        </Link>

        <div className="text-center mb-6">
          <Trophy className="w-10 h-10 text-yellow-400 mx-auto mb-2" />
          <h2 className="text-xl font-bold text-white">{t('blind.result')}</h2>
          {cfg && (
            <span className={`inline-flex items-center gap-1 mt-1 px-3 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>
              {cfg.icon} {cfg.label}
            </span>
          )}
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-dark-glass-border/50 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">{t('blind.yourtime')}</span>
            <span className="text-white font-bold font-mono text-lg">{myResult?.time.toFixed(1)}s</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">{t('blind.yourguess')}</span>
            <span className="text-white font-medium italic">&ldquo;{myResult?.guess}&rdquo;</span>
          </div>
        </div>

        <div className="relative aspect-square rounded-2xl overflow-hidden border border-dark-glass-border/50 mb-6 bg-zinc-900">
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        </div>

        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-primary" />
          {t('blind.others')} <span className="text-xs text-gray-600">({cfg?.label})</span>
        </h3>
        {loadingResults ? (
          <p className="text-gray-600 text-sm text-center animate-pulse">Loading...</p>
        ) : results.length === 0 ? (
          <p className="text-gray-600 text-sm text-center">{t('blind.noothers')}</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {results.filter((r) => r.guess !== 'No answer').map((r) => (
              <div key={r.id} className="flex items-center gap-2 bg-zinc-900 rounded-xl px-3 py-2 border border-dark-glass-border/50">
                <div className="w-6 h-6 rounded-full bg-brand-primary/20 flex items-center justify-center text-[8px] font-bold text-brand-primary flex-shrink-0">
                  {r.user.image ? <img src={r.user.image} alt="" className="w-6 h-6 rounded-full object-cover" /> : r.user.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-300 truncate">&ldquo;{r.guess}&rdquo;</p>
                  <p className="text-[9px] text-gray-600">@{r.user.username}</p>
                </div>
                <span className="text-xs font-mono text-gray-400">{r.timeSeconds.toFixed(1)}s</span>
              </div>
            ))}
          </div>
        )}

        <button onClick={() => { setGameState('idle'); setImageUrl(''); setDifficulty(null); }} className="mt-6 w-full flex items-center justify-center gap-2 bg-zinc-800 text-white px-4 py-3 rounded-xl border border-dark-glass-border hover:border-brand-primary/50 transition-all">
          <RefreshCw className="w-4 h-4" /> {t('blind.playagain')}
        </button>
      </div>
    );
  }

  const cfg = DIFFICULTIES[difficulty || 'medium'];
  return (
    <div className="min-h-screen bg-black pt-20 pb-16 px-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {cfg && (
            <span className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>
              {cfg.icon} {cfg.label}
            </span>
          )}
        </div>
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-dark-glass-border/50`}>
          <Clock className={`w-4 h-4 ${timeLeft < 10 ? 'text-red-400 animate-pulse' : 'text-brand-primary'}`} />
          <span className={`font-mono text-lg font-bold ${timeLeft < 10 ? 'text-red-400' : 'text-white'}`}>
            {Math.ceil(timeLeft)}s
          </span>
        </div>
      </div>

      <div className="relative aspect-square rounded-2xl overflow-hidden border border-dark-glass-border/50 mb-6 bg-zinc-900">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      <div className="w-full h-1 bg-zinc-800 rounded-full mb-6 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${timeLeft < 10 ? 'bg-red-500' : 'bg-brand-primary'}`}
          style={{ width: `${((totalTime - timeLeft) / totalTime) * 100}%` }}
        />
      </div>

      <div className="flex gap-3">
        <input
          type="text"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder={t('blind.placeholder')}
          disabled={submitting}
          className="flex-1 bg-zinc-800 border border-dark-glass-border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 disabled:opacity-40"
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          autoFocus
        />
        <button
          onClick={() => handleSubmit()}
          disabled={!guess.trim() || submitting}
          className="bg-brand-primary text-white p-3 rounded-xl disabled:opacity-40 transition-all"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
      <p className="text-center text-xs text-gray-600 mt-2">{t('blind.hint')}</p>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Heart, Repeat2, Share2, Clock, Trophy, RefreshCw, Layers } from 'lucide-react';
import Link from 'next/link';

interface CardData {
  id: string;
  pairId: string;
  type: 'original' | 'interpretation';
  imageUrl: string;
  title: string;
  author: { username: string; image: string | null };
}

type Phase = 'menu' | 'playing' | 'end';

const DIFFICULTIES = [
  { pairs: 4, label: 'Easy', cols: 2, colsMobile: 2 },
  { pairs: 6, label: 'Medium', cols: 2, colsMobile: 2 },
  { pairs: 8, label: 'Hard', cols: 3, colsMobile: 2 },
  { pairs: 10, label: 'Master', cols: 3, colsMobile: 2 },
];

export default function MemoryGame() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('menu');
  const [difficulty, setDifficulty] = useState(4);
  const [cards, setCards] = useState<CardData[]>([]);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [matchData, setMatchData] = useState<CardData | null>(null);
  const [showMatch, setShowMatch] = useState(false);
  const [error, setError] = useState('');
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const startGame = async (pairs: number) => {
    setDifficulty(pairs);
    setError('');
    try {
      const res = await fetch(`/api/memory/start?pairs=${pairs}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Error starting game');
        return;
      }
      const data = await res.json();
      setCards(data.cards);
      setFlipped([]);
      setMatched([]);
      setScore(0);
      setTimer(0);
      setPhase('playing');
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setTimer(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } catch {
      setError('Error connecting to server');
    }
  };

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleCardClick = useCallback((cardId: string) => {
    if (isChecking || flipped.includes(cardId) || matched.includes(cardId)) return;
    if (flipped.length === 1 && flipped[0] === cardId) return;

    const newFlipped = [...flipped, cardId];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setIsChecking(true);
      const [first, second] = newFlipped;
      const card1 = cards.find(c => c.id === first)!;
      const card2 = cards.find(c => c.id === second)!;

      if (card1.pairId === card2.pairId && card1.type !== card2.type) {
        // Match!
        setTimeout(() => {
          setMatched(prev => [...prev, first, second]);
          setScore(prev => prev + 100 + Math.max(0, 50 - Math.floor(timer / 10)));
          setFlipped([]);
          setIsChecking(false);
          // Show match popup
          setMatchData(card1);
          setShowMatch(true);
          // Check if game complete
          if (matched.length + 2 >= cards.length) {
            if (timerRef.current) clearInterval(timerRef.current);
            setTimeout(() => {
              setPhase('end');
              // Save score
              fetch('/api/memory/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pairs: difficulty, matched: matched.length / 2 + 1, score: score + 100, time: timer }),
              }).catch(() => {});
            }, 1500);
          }
        }, 600);
      } else {
        // No match
        setTimeout(() => {
          setFlipped([]);
          setIsChecking(false);
        }, 800);
      }
    }
  }, [cards, flipped, matched, isChecking, score, timer, difficulty]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // Menu phase
  if (phase === 'menu') {
    return (
      <div className="min-h-screen bg-black pt-20 pb-16 px-4 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-primary to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(5,150,105,0.2)]">
            <Layers className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Memory Resonance</h1>
          <p className="text-gray-400 mb-1">Match original images with their interpretations.</p>
          <p className="text-gray-600 text-sm mb-8">Find the connection between perception and imagination.</p>

          {error && <p className="text-red-400 text-sm mb-4 bg-red-400/10 rounded-xl px-4 py-2">{error}</p>}

          <div className="grid grid-cols-2 gap-3 mb-8">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.pairs}
                onClick={() => startGame(d.pairs)}
                className="glass-panel rounded-2xl p-4 border border-dark-glass-border/50 hover:border-brand-primary/30 transition-all hover-lift"
              >
                <div className="text-2xl font-bold text-white mb-1">{d.pairs}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">{d.label}</div>
                <div className="text-[10px] text-gray-600 mt-1">{d.pairs * 2} cards</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // End phase
  if (phase === 'end') {
    return (
      <div className="min-h-screen bg-black pt-16 pb-16 px-4 flex items-center justify-center">
        <div className="text-center max-w-md glass-panel rounded-3xl p-8 border-dark-glass-border">
          <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-2">All Matched!</h2>
          <p className="text-gray-400 mb-6">You found every connection.</p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-zinc-800 rounded-2xl p-4 border border-dark-glass-border/50">
              <div className="text-2xl font-bold text-brand-primary">{score}</div>
              <div className="text-xs text-gray-500">Score</div>
            </div>
            <div className="bg-zinc-800 rounded-2xl p-4 border border-dark-glass-border/50">
              <div className="text-2xl font-bold text-white">{formatTime(timer)}</div>
              <div className="text-xs text-gray-500">Time</div>
            </div>
            <div className="bg-zinc-800 rounded-2xl p-4 border border-dark-glass-border/50">
              <div className="text-2xl font-bold text-white">{difficulty}</div>
              <div className="text-xs text-gray-500">Pairs</div>
            </div>
            <div className="bg-zinc-800 rounded-2xl p-4 border border-dark-glass-border/50">
              <div className="text-2xl font-bold text-white">{Math.round((matched.length / cards.length) * 100)}%</div>
              <div className="text-xs text-gray-500">Accuracy</div>
            </div>
          </div>

          <button
            onClick={() => setPhase('menu')}
            className="w-full bg-gradient-to-r from-brand-primary to-purple-600 text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-105 transition-all"
          >
            <RefreshCw className="w-5 h-5" />
            Play Again
          </button>
        </div>
      </div>
    );
  }

  // Playing phase
  const diff = DIFFICULTIES.find(d => d.pairs === difficulty);
  const cols = diff?.cols || 4;
  const colsMobile = diff?.colsMobile || 2;

  return (
    <div className="min-h-screen bg-black pt-4 pb-16 px-2 max-w-5xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-3 px-2">
        <button onClick={() => { if (timerRef.current) clearInterval(timerRef.current); setPhase('menu'); }} className="text-gray-400 hover:text-white text-sm transition-colors">
          Quit
        </button>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1 text-gray-400">
            <Clock className="w-4 h-4" />{formatTime(timer)}
          </span>
          <span className="flex items-center gap-1 text-brand-primary font-bold">
            <Sparkles className="w-4 h-4" />{score}
          </span>
          <span className="text-gray-500">{matched.length / 2}/{difficulty}</span>
        </div>
      </div>

      {/* Match popup */}
      {showMatch && matchData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowMatch(false)}>
          <div className="bg-zinc-900 rounded-3xl p-6 max-w-sm w-full border border-brand-primary/30 shadow-[0_0_40px_rgba(5,150,105,0.15)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 text-brand-primary mb-4 justify-center">
              <Sparkles className="w-5 h-5" />
              <span className="font-bold text-sm uppercase tracking-wider">Match Found!</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="aspect-square rounded-xl overflow-hidden bg-zinc-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={matchData.imageUrl} alt="" className="w-full h-full object-cover" />
                <div className="text-[10px] text-gray-500 text-center py-1 bg-black/60">Original</div>
              </div>
              <div className="aspect-square rounded-xl overflow-hidden bg-zinc-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cards.find(c => c.pairId === matchData.pairId && c.type === 'interpretation')?.imageUrl || ''} alt="" className="w-full h-full object-cover" />
                <div className="text-[10px] text-gray-500 text-center py-1 bg-black/60">Interpretation</div>
              </div>
            </div>
            <p className="text-white font-bold text-sm text-center mb-1">{matchData.title}</p>
            <p className="text-gray-500 text-xs text-center mb-4">by @{matchData.author.username}</p>
            <div className="flex justify-center gap-3">
              <button className="text-gray-400 hover:text-brand-primary transition-colors p-2"><Heart className="w-4 h-4" /></button>
              <button className="text-gray-400 hover:text-brand-primary transition-colors p-2"><Repeat2 className="w-4 h-4" /></button>
              <button className="text-gray-400 hover:text-brand-primary transition-colors p-2"><Share2 className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      )}

      {/* Card grid */}
      <div
        className="grid gap-3 mg"
        style={{
          gridTemplateColumns: `repeat(${colsMobile}, 1fr)`,
        }}
      >
        <style>{`@media(min-width:640px){.mg{grid-template-columns:repeat(${cols},1fr)!important}}`}</style>
        {cards.map((card) => {
          const isFlipped = flipped.includes(card.id) || matched.includes(card.id);
          return (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className="relative w-full rounded-xl overflow-hidden focus:outline-none"
              style={{
                aspectRatio: '3/4',
                perspective: '800px',
              }}
            >
              {/* Inner wrapper for 3D flip */}
              <div
                className="absolute inset-0 transition-transform duration-600"
                style={{
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* Image side: hidden by default, visible when flipped */}
                <div
                  className="absolute inset-0 rounded-xl overflow-hidden bg-zinc-900"
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={card.imageUrl} alt="" className="w-full h-full object-cover" />
                  <div className={`absolute bottom-0 left-0 right-0 text-[10px] text-center py-1.5 ${card.type === 'original' ? 'bg-brand-primary/80' : 'bg-purple-500/80'} text-white font-bold uppercase tracking-wider`}>
                    {card.type === 'original' ? 'Original' : 'Drawing'}
                  </div>
                  {matched.includes(card.id) && (
                    <div className="absolute inset-0 ring-2 ring-brand-primary ring-inset rounded-xl shadow-[0_0_20px_rgba(5,150,105,0.3)]" />
                  )}
                </div>
                {/* Back side (dorso): visible by default, hidden when flipped */}
                <div
                  className="absolute inset-0 bg-gradient-to-br from-zinc-700 to-zinc-900 rounded-xl border-2 border-dark-glass-border/30 flex items-center justify-center"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <div className="w-14 h-14 rounded-full bg-brand-primary/15 flex items-center justify-center">
                    <Sparkles className="w-7 h-7 text-brand-primary/40" />
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

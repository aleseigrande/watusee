'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useT } from '@/lib/i18n/context';
import { Clock, Move, Sparkles, User, Trophy, Puzzle } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface PuzzleData {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
  creator: { id: string; username: string; image: string | null };
  daily?: boolean;
}

interface PuzzleImgProps {
  puzzle: PuzzleData;
  onBack: () => void;
}

const DIFFICULTIES = [
  { label: 'Classic', grid: 3, pieces: 9, key: 'classic' },
  { label: 'Hard', grid: 4, pieces: 16, key: 'hard' },
];

function shuffleTiles(count: number): number[] {
  const arr = Array.from({ length: count }, (_, i) => i);
  const emptyIdx = count - 1;
  let emptyPos = emptyIdx;

  for (let step = 0; step < count * 10; step++) {
    const neighbors: number[] = [];
    const size = Math.sqrt(count);
    const row = Math.floor(emptyPos / size);
    const col = emptyPos % size;

    if (row > 0) neighbors.push(emptyPos - size);
    if (row < size - 1) neighbors.push(emptyPos + size);
    if (col > 0) neighbors.push(emptyPos - 1);
    if (col < size - 1) neighbors.push(emptyPos + 1);

    const pick = neighbors[Math.floor(Math.random() * neighbors.length)];
    arr[emptyPos] = arr[pick];
    arr[pick] = emptyIdx;
    emptyPos = pick;
  }

  return arr;
}

function isSolvable(arr: number[], size: number): boolean {
  let inversions = 0;
  const flat = arr.filter(n => n !== arr.length - 1);
  for (let i = 0; i < flat.length; i++) {
    for (let j = i + 1; j < flat.length; j++) {
      if (flat[i] > flat[j]) inversions++;
    }
  }
  const emptyRowFromBottom = size - Math.floor(arr.indexOf(arr.length - 1) / size);
  if (size % 2 === 0) return (inversions + emptyRowFromBottom) % 2 === 0;
  return inversions % 2 === 0;
}

function getShuffled(count: number): number[] {
  for (let attempt = 0; attempt < 100; attempt++) {
    const arr = shuffleTiles(count);
    if (isSolvable(arr, Math.sqrt(count))) return arr;
  }
  return shuffleTiles(count);
}

export default function PuzzleImg({ puzzle, onBack }: PuzzleImgProps) {
  const t = useT();
  const { data: session } = useSession();

  const [phase, setPhase] = useState<'difficulty' | 'playing' | 'completed'>('difficulty');
  const [gridSize, setGridSize] = useState(3);
  const [tiles, setTiles] = useState<number[]>([]);
  const [emptyPos, setEmptyPos] = useState(-1);
  const [moves, setMoves] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsed, setElapsed] = useState(0);
  const [score, setScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [revealStep, setRevealStep] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const [boardSize, setBoardSize] = useState(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (phase !== 'playing' || !boardRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setBoardSize(entry.contentRect.width);
      }
    });
    ro.observe(boardRef.current);
    return () => ro.disconnect();
  }, [phase]);

  const startGame = useCallback((grid: number) => {
    const count = grid * grid;
    const shuffled = getShuffled(count);
    setGridSize(grid);
    setTiles(shuffled);
    setEmptyPos(shuffled.indexOf(count - 1));
    setMoves(0);
    setStartTime(Date.now());
    setElapsed(0);
    setScore(0);
    setRevealStep(0);
    setPhase('playing');

    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
  }, []);

  const moveTile = useCallback(
    (tilePos: number) => {
      if (phase !== 'playing') return;

      const size = gridSize;
      const tileRow = Math.floor(tilePos / size);
      const tileCol = tilePos % size;
      const emptyRow = Math.floor(emptyPos / size);
      const emptyCol = emptyPos % size;

      if (Math.abs(tileRow - emptyRow) + Math.abs(tileCol - emptyCol) !== 1) return;

      setTiles((prev) => {
        const next = [...prev];
        next[emptyPos] = next[tilePos];
        next[tilePos] = prev.length - 1;
        return next;
      });
      setEmptyPos(tilePos);
      setMoves((prev) => prev + 1);
    },
    [phase, gridSize, emptyPos]
  );

  const isComplete = useCallback(() => tiles.every((t, i) => t === i), [tiles]);

  useEffect(() => {
    if (phase === 'playing' && tiles.length > 0 && isComplete()) {
      if (timerRef.current) clearInterval(timerRef.current);
      setPhase('completed');
      setRevealStep(1);

      const timeTaken = Math.floor((Date.now() - startTime) / 1000);
      const timeScore = Math.max(0, 1000 - timeTaken * 2);
      const moveScore = Math.max(0, 500 - moves * 3);
      const difficultyBonus = (gridSize - 2) * 100;
      const finalScore = Math.max(0, timeScore + moveScore + difficultyBonus);
      setScore(finalScore);

      if (session?.user?.id) {
        setSubmitting(true);
        fetch('/api/puzzle-img/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameId: puzzle.id,
            mode: 'original',
            gridSize,
            moves,
            timeSeconds: timeTaken,
            hintsUsed: 0,
          }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.score) setScore(data.score);
          })
          .catch(() => {})
          .finally(() => setSubmitting(false));
      }

      let step = 1;
      const revealTimer = setInterval(() => {
        step++;
        setRevealStep(step);
        if (step >= 4) clearInterval(revealTimer);
      }, 800);
    }
  }, [tiles, phase, isComplete, startTime, moves, gridSize, puzzle.id, session]);

  const tileSize = boardSize / gridSize;

  return (
    <div className="w-full max-w-lg mx-auto">
      {phase === 'difficulty' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="glass-panel rounded-2xl border border-dark-glass-border/50 p-6">
            <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden mb-4">
              <div
                className="absolute inset-0"
                style={{ backgroundImage: `url(${puzzle.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(16px)', opacity: 0.4 }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Puzzle className="w-12 h-12 text-white/40" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-white text-center mb-1">{puzzle.title}</h2>
            <p className="text-sm text-gray-400 text-center mb-4 line-clamp-2">{puzzle.description}</p>
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center overflow-hidden">
                {puzzle.creator.image ? (
                  <img src={puzzle.creator.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-brand-primary" />
                )}
              </div>
              <span className="text-sm text-gray-300">{puzzle.creator.username}</span>
            </div>
          </div>

          <div className="glass-panel rounded-2xl border border-dark-glass-border/50 p-6">
            <h3 className="text-lg font-bold text-white text-center mb-4">{t('puzzle.selectDifficulty')}</h3>
            <div className="grid grid-cols-2 gap-4">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.key}
                  onClick={() => startGame(d.grid)}
                  className="glass-panel rounded-xl p-5 border border-dark-glass-border/50 text-center hover:border-brand-primary transition-all hover:scale-[1.02]"
                >
                  <p className="text-2xl font-bold text-white">{d.label}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {d.grid}x{d.grid} &middot; {d.pieces} {t('puzzle.pieces')}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {phase === 'playing' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="glass-panel rounded-xl p-3 border border-dark-glass-border/50">
            <div className="flex items-center justify-between text-sm text-gray-400">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, '0')}
                </span>
                <span className="flex items-center gap-1">
                  <Move className="w-4 h-4" />
                  {moves}
                </span>
              </div>
              <button onClick={onBack} className="text-xs text-gray-500 hover:text-white transition-colors">
                {t('puzzle.quit')}
              </button>
            </div>
          </div>

          <div
            ref={boardRef}
            className="relative w-full aspect-square bg-zinc-900 rounded-2xl overflow-hidden border border-dark-glass-border/50"
          >
            {boardSize > 0 &&
              tiles.map((tileIndex, pos) => {
                if (tileIndex === tiles.length - 1) return null;
                const size = gridSize;
                const origRow = Math.floor(tileIndex / size);
                const origCol = tileIndex % size;
                const curRow = Math.floor(pos / size);
                const curCol = pos % size;

                return (
                  <motion.div
                    key={tileIndex}
                    layout
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="absolute cursor-pointer border-r border-b border-white/10"
                    style={{
                      width: tileSize,
                      height: tileSize,
                      left: curCol * tileSize,
                      top: curRow * tileSize,
                      backgroundImage: `url(${puzzle.imageUrl})`,
                      backgroundSize: `${boardSize}px ${boardSize}px`,
                      backgroundPosition: `-${origCol * tileSize}px -${origRow * tileSize}px`,
                    }}
                    onClick={() => moveTile(pos)}
                  />
                );
              })}
          </div>

          <div className="glass-panel rounded-xl p-3 border border-dark-glass-border/50">
            <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full transition-all duration-500"
                style={{ width: `${(tiles.filter((t, i) => t === i).length / (tiles.length - 1)) * 100}%` }}
              />
            </div>
            <p className="text-center text-xs text-gray-500 mt-2">
              {tiles.filter((t, i) => t === i).length}/{tiles.length - 1} {t('puzzle.inPlace')}
            </p>
          </div>
        </motion.div>
      )}

      {phase === 'completed' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {revealStep >= 1 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="text-center"
            >
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6 }}>
                <Sparkles className="w-16 h-16 text-yellow-400 mx-auto mb-2" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-1">{t('puzzle.complete')}</h2>
              <p className="text-gray-400 text-sm">{t('puzzle.completeDesc')}</p>
            </motion.div>
          )}

          {revealStep >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-2xl border border-dark-glass-border/50 overflow-hidden"
            >
              <div
                className="relative w-full aspect-[16/9] bg-black/40"
                style={{ backgroundImage: `url(${puzzle.imageUrl})`, backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}
              />
            </motion.div>
          )}

          {revealStep >= 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-2xl border border-dark-glass-border/50 p-5"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-brand-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                  {puzzle.creator.image ? (
                    <img src={puzzle.creator.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-brand-primary" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-white">{puzzle.creator.username}</p>
                  <p className="text-xs text-gray-400">{t('puzzle.creator')}</p>
                </div>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{puzzle.title}</h3>
              <p className="text-sm text-gray-400">{puzzle.description}</p>
            </motion.div>
          )}

          {revealStep >= 4 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="glass-panel rounded-2xl border border-dark-glass-border/50 p-5">
                <div className="flex items-center justify-center gap-8">
                  <div className="text-center">
                    <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-white">{score}</p>
                    <p className="text-xs text-gray-400">{t('puzzle.perceptionScore')}</p>
                  </div>
                  <div className="text-center">
                    <Move className="w-8 h-8 text-brand-primary mx-auto mb-1" />
                    <p className="text-2xl font-bold text-white">{moves}</p>
                    <p className="text-xs text-gray-400">{t('puzzle.moves')}</p>
                  </div>
                  <div className="text-center">
                    <Clock className="w-8 h-8 text-green-400 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-white">{elapsed}s</p>
                    <p className="text-xs text-gray-400">{t('puzzle.time')}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onBack}
                  className="flex-1 glass-panel rounded-xl py-3 border border-dark-glass-border/50 text-white font-semibold hover:bg-white/5 transition-colors"
                >
                  {t('puzzle.playAgain')}
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}

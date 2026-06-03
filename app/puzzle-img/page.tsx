'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Puzzle } from 'lucide-react';
import { useT } from '@/lib/i18n/context';
import PuzzleImg from '@/components/PuzzleImg';

export default function PuzzleImgPage() {
  const t = useT();
  const [puzzle, setPuzzle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPuzzle = async (daily = false) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/puzzle-img/start${daily ? '?daily=true' : ''}`);
      if (!res.ok) throw new Error('No puzzles available');
      const data = await res.json();
      setPuzzle(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPuzzle();
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <Link href="/play" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6">
        <ArrowLeft className="w-5 h-5" /><span>{t('puzzle.games')}</span>
      </Link>

      <div className="text-center mb-8">
        <Puzzle className="w-10 h-10 text-brand-primary mx-auto mb-3" />
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{t('puzzle.title')}</h1>
        <p className="text-gray-400 text-sm sm:text-base max-w-lg mx-auto">{t('puzzle.subtitle')}</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="text-center py-20">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={() => fetchPuzzle()} className="bg-brand-primary hover:bg-brand-primary/90 text-white px-6 py-3 rounded-full font-semibold transition-colors">
            {t('puzzle.tryAgain')}
          </button>
        </div>
      )}

      {puzzle && !loading && (
        <PuzzleImg puzzle={puzzle} onBack={() => fetchPuzzle()} />
      )}
    </div>
  );
}

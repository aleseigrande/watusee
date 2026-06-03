'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Trophy } from 'lucide-react';
import { useT } from '@/lib/i18n/context';
import PuzzleImg from '@/components/PuzzleImg';

export default function DailyPuzzlePage() {
  const t = useT();
  const [puzzle, setPuzzle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const fetchDaily = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/puzzle-img/daily');
      if (!res.ok) throw new Error('No daily puzzle');
      const data = await res.json();
      setPuzzle({ ...data, mode: 'original', daily: true });

      const lbRes = await fetch(`/api/puzzle-img/leaderboard?gameId=${data.id}`);
      if (lbRes.ok) setLeaderboard(await lbRes.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDaily();
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <Link href="/play" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6">
        <ArrowLeft className="w-5 h-5" /><span>{t('puzzle.games')}</span>
      </Link>

      <div className="text-center mb-8">
        <Sparkles className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{t('puzzle.dailyTitle')}</h1>
        <p className="text-gray-400 text-sm sm:text-base max-w-lg mx-auto">{t('puzzle.dailyDesc')}</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="text-center py-20">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={fetchDaily} className="bg-brand-primary hover:bg-brand-primary/90 text-white px-6 py-3 rounded-full font-semibold transition-colors">
            {t('puzzle.tryAgain')}
          </button>
        </div>
      )}

      {puzzle && !loading && (
        <div className="space-y-6">
          <PuzzleImg puzzle={puzzle} onBack={fetchDaily} />

          {leaderboard.length > 0 && (
            <div className="glass-panel rounded-2xl border border-dark-glass-border/50 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <h3 className="font-bold text-white">{t('puzzle.leaderboard')}</h3>
              </div>
              <div className="space-y-2">
                {leaderboard.slice(0, 10).map((entry: any) => (
                  <div key={entry.rank} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${entry.rank <= 3 ? 'bg-yellow-400/20 text-yellow-400' : 'bg-zinc-800 text-gray-400'}`}>
                        {entry.rank}
                      </span>
                      <span className="text-gray-300">{entry.player.username}</span>
                    </div>
                    <div className="flex items-center gap-4 text-gray-400 text-xs">
                      <span>{entry.score} pts</span>
                      <span>{entry.moves} {t('puzzle.moves').toLowerCase()}</span>
                      <span>{entry.timeSeconds}s</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

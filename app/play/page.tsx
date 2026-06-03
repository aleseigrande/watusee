'use client';

import { ArrowLeft, Gamepad2, BookOpen, Eye, Radio, Layers, Sparkles, ScanEye, Brain, Puzzle } from 'lucide-react';
import Link from 'next/link';
import { useT } from '@/lib/i18n/context';

const games = [
  { id: 2.5, titleKey: 'games.daily.title', descKey: 'games.daily.desc', icon: <Sparkles className="w-8 h-8 text-yellow-400" />, href: '/daily-challenge' },
  { id: 3, titleKey: 'games.story.title', descKey: 'games.story.desc', icon: <BookOpen className="w-8 h-8 text-brand-primary" />, href: '/story' },
  { id: 4, titleKey: 'games.echo.title', descKey: 'games.echo.desc', icon: <Eye className="w-8 h-8 text-purple-400" />, href: '/echo' },
  { id: 5, titleKey: 'games.resonance.title', descKey: 'games.resonance.desc', icon: <Radio className="w-8 h-8 text-amber-400" />, href: '/resonance' },
  { id: 6, titleKey: 'games.memory.title', descKey: 'games.memory.desc', icon: <Layers className="w-8 h-8 text-brand-primary" />, href: '/memory' },
  { id: 7, titleKey: 'games.blind.title', descKey: 'games.blind.desc', icon: <ScanEye className="w-8 h-8 text-cyan-400" />, href: '/blind-blowup' },
  { id: 8, titleKey: 'games.mindreader.title', descKey: 'games.mindreader.desc', icon: <Brain className="w-8 h-8 text-purple-400" />, href: '/mind-reader' },
  { id: 9, titleKey: 'games.puzzle.title', descKey: 'games.puzzle.desc', icon: <Puzzle className="w-8 h-8 text-green-400" />, href: '/puzzle-img' },
];

export default function PlayPage() {
  const t = useT();

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>HOME</span>
      </Link>

      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">{t('games.title')}</h1>
        <p className="text-gray-400 text-lg">{t('games.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((game) => (
          <div
            key={game.id}
            className="glass-panel rounded-2xl border border-dark-glass-border/50 p-6 flex flex-col items-center text-center hover-lift transition-all duration-300"
          >
            <div className="w-16 h-16 rounded-full bg-brand-primary/20 flex items-center justify-center mb-4">
              {game.icon || <Gamepad2 className="w-8 h-8 text-brand-primary" />}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{t(game.titleKey)}</h3>
            <p className="text-gray-400 text-sm mb-6 flex-1">{t(game.descKey)}</p>
            {game.href ? (
              <Link href={game.href} className="w-full px-4 py-2.5 bg-brand-primary hover:bg-brand-primary/80 text-white rounded-full font-semibold transition-colors text-center block">
                {t(game.titleKey)}
              </Link>
            ) : (
              <button className="w-full px-4 py-2.5 bg-brand-primary hover:bg-brand-primary/80 text-white rounded-full font-semibold transition-colors">
                {t(game.titleKey)}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import { ArrowLeft, Gamepad2, BookOpen, Eye, Radio, Layers } from 'lucide-react';
import Link from 'next/link';
import { useT } from '@/lib/i18n/context';

const games = [
  { id: 1, title: 'Game 1', desc: 'Descripción del juego 1' },
  { id: 2, title: 'Game 2', desc: 'Descripción del juego 2' },
  { id: 3, title: 'Story Teller', desc: 'Cuatro imágenes aleatorias, una historia. Crea, comparte y descubre.', icon: <BookOpen className="w-8 h-8 text-brand-primary" />, href: '/story' },
  { id: 4, title: 'Echo Vision', desc: 'Un experimento de memoria visual. Ve una imagen 2 segundos y dibújala de memoria. Compara con otros.', icon: <Eye className="w-8 h-8 text-purple-400" />, href: '/echo' },
  { id: 5, title: 'Resonance Master', desc: 'Publica una imagen, haz una pregunta. Descubre cómo el mundo ve lo que tú ves.', icon: <Radio className="w-8 h-8 text-amber-400" />, href: '/resonance' },
  { id: 6, title: 'Memory Resonance', desc: 'Encuentra las parejas entre imágenes originales y sus interpretaciones. Un juego de memoria y percepción.', icon: <Layers className="w-8 h-8 text-brand-primary" />, href: '/memory' },
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
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Games</h1>
        <p className="text-gray-400 text-lg">Choose a game and have fun</p>
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
            <h3 className="text-xl font-bold text-white mb-2">{game.title}</h3>
            <p className="text-gray-400 text-sm mb-6 flex-1">{game.desc}</p>
            {game.href ? (
              <Link href={game.href} className="w-full px-4 py-2.5 bg-brand-primary hover:bg-brand-primary/80 text-white rounded-full font-semibold transition-colors text-center block">
                {game.title}
              </Link>
            ) : (
              <button className="w-full px-4 py-2.5 bg-brand-primary hover:bg-brand-primary/80 text-white rounded-full font-semibold transition-colors">
                {game.title}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

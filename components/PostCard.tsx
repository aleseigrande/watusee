'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Share2, X, PenTool } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useT } from '@/lib/i18n/context';

interface PostCardProps {
  id: string;
  originalImage: string;
  interpretedImage: string;
  author: string;
  title: string;
  likes: number;
  comments: number;
  remixesCount: number;
  sharesCount?: number;
  hideOriginal?: boolean;
  audience?: string;
  reactionCounts?: Record<string, number>;
  userReaction?: string | null;
}

// Emojis disponibles para reacciones
const EMOJIS: Record<string, string> = {
  like: '\u{1F44D}',
  fun: '\u{1F602}',
  angry: '\u{1F621}',
  indifferent: '\u{1F610}',
  surprised: '\u{1F62E}',
  disgust: '\u{1F92E}',
};

const EMOJI_LIST = ['like', 'fun', 'angry', 'indifferent', 'surprised', 'disgust'];

// Tarjeta de post en el feed. Incluye selector de reacciones con emojis al hover.
export default function PostCard({ id, originalImage, interpretedImage, author, title, likes, comments, remixesCount, sharesCount = 0, hideOriginal, audience, reactionCounts, userReaction }: PostCardProps) {
  const t = useT();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shareCount, setShareCount] = useState(sharesCount);
  const [reactions, setReactions] = useState<Record<string, number>>(reactionCounts || {});
  const [myReaction, setMyReaction] = useState<string | null>(userReaction || null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerPos, setPickerPos] = useState({ left: 0, bottom: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  const totalReactions = Object.values(reactions).reduce((a, b) => a + b, 0);

  const handleReact = async (type: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'react', type }),
      });
      if (res.ok) {
        const data = await res.json();
        setReactions((prev) => ({ ...prev, [type]: data.count }));
        setMyReaction(data.reacted ? type : null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewRemixes = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/create?remixId=${id}&remixUrl=${encodeURIComponent(originalImage)}`);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'share' }),
      });
      if (res.ok) {
        const data = await res.json();
        setShareCount(data.sharesCount);
      }
      if (navigator.share) {
        navigator.share({ title, url: window.location.origin + '/post/' + id });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <div 
        className={`group flex flex-col h-full glass-panel rounded-2xl overflow-hidden hover-lift transition-all duration-500 hover:shadow-[0_8px_30px_rgb(5,150,105,0.2)] cursor-pointer ${audience === 'adults' ? 'border-2 border-red-500' : 'border-dark-glass-border/50'}`}
        onClick={() => setIsModalOpen(true)}
      >
        {/* Contenedor de imágenes */}
        <div className={`w-full overflow-hidden bg-zinc-900 grid ${hideOriginal ? 'grid-cols-1' : 'grid-cols-2'} bg-dark-glass-border`}>
          {!hideOriginal && (
            <div className="flex flex-col">
              <div className="relative aspect-[1/1.4] w-full">
                  <Image 
                    src={originalImage} 
                    alt={t('card.alt.original')}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                  />
                </div>
                  <div className="px-2 py-1 bg-black/60 text-[10px] font-medium text-gray-500 text-center tracking-wide">
                    {t('card.label.original')}
                  </div>
                </div>
              )}

          <div className="flex flex-col">
            <div className="relative aspect-[1/1.4] w-full bg-black">
              <Image 
                src={interpretedImage} 
                alt={t('card.alt.interpreted')}
                fill
                className="object-cover z-10"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
              />
              {audience === 'adults' && (
                <div className="absolute top-2 right-2 z-20 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-lg border border-red-400">
                  18+
                </div>
              )}
            </div>
            {!hideOriginal && (
              <div className="px-2 py-1 bg-brand-primary/50 text-[10px] font-medium text-white/70 text-center tracking-wide">
                {t('card.label.interpreted')}
              </div>
            )}
          </div>
        </div>

        {/* Título, autor y barra de acciones */}
        <div className="p-3 flex flex-col bg-transparent" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-bold text-sm text-white truncate pr-2">{title}</h3>
          </div>
          <p className="text-xs text-gray-400 mb-2">{t('card.by')} <span className="text-brand-accent hover:text-brand-secondary cursor-pointer transition-colors">@{author}</span></p>
          <div className="flex items-center justify-between mt-auto pt-2 border-t border-dark-glass-border">
            <div className="flex items-center gap-4 text-gray-400">
              {/* Selector de reacciones con emojis */}
              <div className="relative"
                onMouseEnter={() => {
                  if (btnRef.current) {
                    const r = btnRef.current.getBoundingClientRect();
                    setPickerPos({ left: r.left, bottom: window.innerHeight - r.top + 8 });
                  }
                  setShowPicker(true);
                }}
                onMouseLeave={() => setShowPicker(false)}
                onTouchStart={() => {
                  if (!showPicker && btnRef.current) {
                    const r = btnRef.current.getBoundingClientRect();
                    setPickerPos({ left: r.left, bottom: window.innerHeight - r.top + 8 });
                  }
                  setShowPicker(!showPicker);
                }}
              >
                <button ref={btnRef} className="flex items-center gap-1.5 hover:text-brand-secondary transition-colors text-lg">
                  {myReaction ? EMOJIS[myReaction] : '\u{1F44D}'}
                  <span className="text-sm font-medium">{totalReactions || ''}</span>
                </button>
                {/* Popup con emojis — fijo para no cortarse */}
                {showPicker && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowPicker(false)} />
                    <div className="fixed z-50 flex gap-1.5 bg-zinc-800 border border-dark-glass-border rounded-2xl px-3 py-2 shadow-2xl"
                      style={{ left: pickerPos.left, bottom: pickerPos.bottom }}
                    >
                      {EMOJI_LIST.map((type) => (
                        <button
                          key={type}
                          onClick={(e) => handleReact(type, e)}
                          className={`text-xl sm:text-2xl hover:scale-125 transition-transform ${myReaction === type ? 'scale-125 ring-2 ring-brand-primary rounded-full' : ''}`}
                        >
                          {EMOJIS[type]}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <button className="flex items-center gap-1.5 hover:text-white transition-colors" onClick={(e) => { e.stopPropagation(); router.push(`/post/${id}`); }}>
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm font-medium">{comments}</span>
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleViewRemixes}
                className="flex items-center gap-1.5 text-brand-primary hover:text-brand-secondary transition-colors group/btn"
                title={t('card.remixes')}
              >
                <PenTool className="w-5 h-5" />
                <span className="text-sm font-medium">{remixesCount}</span>
              </button>
              <button className="text-gray-400 hover:text-brand-primary transition-colors" onClick={handleShare}>
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal full-screen */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 md:p-8 cursor-zoom-out animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-5xl bg-zinc-900 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden cursor-default border border-dark-glass-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`grid ${hideOriginal ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'} gap-px bg-dark-glass-border`}>
              {!hideOriginal && (
                <div className="flex flex-col bg-black/50">
                  <div className="relative aspect-video w-full">
                    <Image 
                      src={originalImage} 
                      alt={t('card.alt.original')}
                      fill
                      className="object-contain"
                      sizes="50vw"
                      priority
                    />
                  </div>
                  <div className="px-3 py-1.5 bg-black/60 text-xs font-medium text-gray-500 text-center tracking-wide">
                    {t('card.label.original')}
                  </div>
                </div>
              )}
              <div className="flex flex-col bg-black">
                <div className="relative aspect-video w-full">
                  <Image 
                    src={interpretedImage} 
                    alt={t('card.alt.interpreted')} 
                    fill
                    className="object-contain"
                    sizes="50vw"
                    priority
                  />
                </div>
                {!hideOriginal && (
                  <div className="px-3 py-1.5 bg-brand-primary/40 text-xs font-medium text-white/60 text-center tracking-wide">
                    {t('card.label.interpreted')}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-black/80 px-6 py-4 text-center border-t border-dark-glass-border">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-1">{title}</h2>
              <p className="text-gray-400">{t('card.by')} <span className="text-brand-accent">@{author}</span></p>
            </div>

            <button 
              className="absolute top-4 right-4 z-30 p-2 bg-black/60 hover:bg-brand-primary rounded-full text-white transition-all hover:scale-110 shadow-xl border border-white/10"
              onClick={() => setIsModalOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

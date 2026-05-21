'use client';

import Link from 'next/link';
import { MessageCircle, Heart, Bookmark, Repeat2 } from 'lucide-react';
import type { StoryWithRelations } from '@/app/story/types';

export default function StoryCard({ story }: { story: StoryWithRelations }) {
  const firstSentence = story.content.split(/[.!?]/)[0] || story.content.slice(0, 120);
  const preview = firstSentence.length > story.content.length / 2
    ? story.content.slice(0, 150) + '...'
    : firstSentence + (story.content.length > firstSentence.length ? '...' : '');

  return (
    <Link
      href={`/story/${story.id}`}
      className="group block glass-panel rounded-2xl overflow-hidden border border-dark-glass-border/50 hover:border-brand-primary/30 transition-all hover-lift"
    >
      {/* 4 Mini images grid */}
      <div className="grid grid-cols-2 h-40 overflow-hidden">
        {story.images.slice(0, 4).map((img, i) => (
          <div key={img.id} className={`relative overflow-hidden ${i >= 2 ? 'mt-[1px]' : ''} ${i % 2 === 1 ? 'ml-[1px]' : ''}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-white text-base mb-1 truncate group-hover:text-brand-primary transition-colors">{story.title}</h3>
        <p className="text-sm text-gray-400 line-clamp-2 mb-3 leading-relaxed">{preview}</p>

        {/* Author + stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-brand-primary/20 flex items-center justify-center text-[10px] font-bold text-brand-primary">
              {story.author.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={story.author.image} alt="" className="w-6 h-6 rounded-full object-cover" />
              ) : (
                story.author.username.charAt(0).toUpperCase()
              )}
            </div>
            <span className="text-xs text-gray-500">@{story.author.username}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-500">
            {story._count.reactions > 0 && (
              <span className="flex items-center gap-1 text-xs">
                <Heart className="w-3 h-3" />{story._count.reactions}
              </span>
            )}
            {story._count.comments > 0 && (
              <span className="flex items-center gap-1 text-xs">
                <MessageCircle className="w-3 h-3" />{story._count.comments}
              </span>
            )}
            {story._count.remixes > 0 && (
              <span className="flex items-center gap-1 text-xs">
                <Repeat2 className="w-3 h-3" />{story._count.remixes}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

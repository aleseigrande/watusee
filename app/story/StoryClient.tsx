'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Send, ArrowLeft, BookOpen, TrendingUp, Zap } from 'lucide-react';
import StoryCard from '@/components/StoryCard';
import type { StoryWithRelations } from './types';

interface ChallengeImage {
  id: string;
  imageUrl: string;
  title: string;
}

interface Props {
  session: any;
  initialStories: StoryWithRelations[];
}

const MOODS = [
  { id: 'funny', label: 'Funny', emoji: '\u{1F602}' },
  { id: 'dark', label: 'Dark', emoji: '\u{1F525}' },
  { id: 'mysterious', label: 'Mysterious', emoji: '\u{1F52E}' },
  { id: 'poetic', label: 'Poetic', emoji: '\u{1F3B5}' },
  { id: 'absurd', label: 'Absurd', emoji: '\u{1F92A}' },
  { id: 'emotional', label: 'Emotional', emoji: '\u{1F497}' },
  { id: 'surreal', label: 'Surreal', emoji: '\u{1F300}' },
  { id: 'none', label: 'No mood', emoji: '\u{1F4AD}' },
];

const SORT_TABS = [
  { id: 'latest', label: 'Latest', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'trending', label: 'Trending', icon: <TrendingUp className="w-4 h-4" /> },
  { id: 'most-remixed', label: 'Most Remixed', icon: <Zap className="w-4 h-4" /> },
];

export default function StoryClient({ session, initialStories }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<'start' | 'writing'>('start');
  const [images, setImages] = useState<ChallengeImage[]>([]);
  const [title, setTitle] = useState('');
  const [story, setStory] = useState('');
  const [mood, setMood] = useState('none');
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [sort, setSort] = useState('latest');
  const [stories, setStories] = useState<StoryWithRelations[]>(initialStories);

  const wordCount = story.trim() ? story.trim().split(/\s+/).length : 0;
  const maxWords = 500;

  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stories/challenge');
      if (res.ok) {
        const data = await res.json();
        setImages(data.images);
        setPhase('writing');
      }
    } catch {}
    setLoading(false);
  };

  const handlePublish = async () => {
    if (!title.trim() || story.trim().split(/\s+/).length > maxWords) return;
    setPublishing(true);
    try {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: story.trim(),
          imageIds: images.map((i) => i.id),
          mood: mood === 'none' ? '' : mood,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/story/${data.story.id}`);
      }
    } catch {}
    setPublishing(false);
  };

  const loadStories = async (newSort: string) => {
    setSort(newSort);
    try {
      const res = await fetch(`/api/stories?sort=${newSort}&limit=12`);
      if (res.ok) {
        const data = await res.json();
        setStories(data.stories);
      }
    } catch {}
  };

  if (!session?.user) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 flex items-center justify-center">
        <div className="text-center max-w-md glass-panel rounded-3xl p-10 border-dark-glass-border">
          <BookOpen className="w-16 h-16 text-brand-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">Story Teller</h1>
          <p className="text-gray-400 mb-6">Sign in to create and explore stories</p>
          <a href="/login" className="inline-block bg-brand-primary hover:bg-brand-secondary text-white px-8 py-3 rounded-full font-bold transition-all">
            Sign In
          </a>
        </div>
      </div>
    );
  }

  if (phase === 'writing') {
    return (
      <div className="min-h-screen pt-20 pb-16 px-4 max-w-3xl mx-auto">
        {/* Back */}
        <button onClick={() => setPhase('start')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        {/* 4 Images */}
        <div className="grid grid-cols-2 gap-2 mb-8">
          {images.map((img, i) => (
            <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-dark-glass-border/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.imageUrl} alt={img.title} className="w-full h-full object-cover" />
              {i === 0 && <div className="absolute top-2 left-2 bg-brand-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">1</div>}
              {i === 1 && <div className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">2</div>}
              {i === 2 && <div className="absolute top-2 left-2 bg-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">3</div>}
              {i === 3 && <div className="absolute top-2 left-2 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">4</div>}
            </div>
          ))}
        </div>

        {/* Mood selector */}
        <div className="flex flex-wrap gap-2 mb-6">
          {MOODS.map((m) => (
            <button
              key={m.id}
              onClick={() => setMood(m.id)}
              className={`text-sm px-3 py-1.5 rounded-full border transition-all ${mood === m.id ? 'bg-brand-primary text-white border-brand-primary' : 'bg-zinc-800 text-gray-300 border-dark-glass-border hover:border-brand-primary/50'}`}
            >
              {m.emoji} {m.label}
            </button>
          ))}
        </div>

        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give your story a title..."
          maxLength={100}
          className="w-full bg-zinc-800/80 border border-dark-glass-border rounded-xl px-5 py-4 text-xl font-bold text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 mb-4"
        />

        {/* Story textarea */}
        <div className="relative mb-6">
          <textarea
            value={story}
            onChange={(e) => setStory(e.target.value)}
            placeholder="Write a story that connects these 4 images... Be creative, emotional, mysterious, or absurd."
            maxLength={4000}
            rows={8}
            className="w-full bg-zinc-800/80 border border-dark-glass-border rounded-xl px-5 py-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 resize-none text-base leading-relaxed"
          />
          <div className={`absolute bottom-3 right-3 text-xs font-medium ${wordCount > maxWords ? 'text-red-400' : 'text-gray-500'}`}>
            {wordCount}/{maxWords}
          </div>
        </div>

        {/* Publish */}
        <button
          onClick={handlePublish}
          disabled={!title.trim() || !story.trim() || wordCount > maxWords || publishing}
          className="w-full bg-gradient-to-r from-brand-primary to-brand-secondary text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 disabled:opacity-40 hover:shadow-[0_0_30px_rgba(5,150,105,0.3)] transition-all"
        >
          {publishing ? 'Publishing...' : <><Send className="w-5 h-5" /> Publish Story</>}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-16 px-4 max-w-5xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-brand-primary to-purple-600 mb-4 shadow-[0_0_40px_rgba(5,150,105,0.3)]">
          <BookOpen className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Story Teller</h1>
        <p className="text-gray-400 max-w-lg mx-auto mb-8">
          Four random images. One story. Infinite possibilities.
        </p>
        <button
          onClick={handleStart}
          disabled={loading}
          className="bg-gradient-to-r from-brand-primary via-purple-500 to-amber-500 text-white px-10 py-4 rounded-2xl font-bold text-lg flex items-center gap-3 mx-auto hover:scale-105 transition-all shadow-[0_0_40px_rgba(5,150,105,0.3)] disabled:opacity-50"
        >
          {loading ? 'Finding images...' : <><Sparkles className="w-6 h-6" /> Tell me a story</>}
        </button>
      </div>

      {/* Explore stories */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {SORT_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => loadStories(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${sort === tab.id ? 'bg-brand-primary text-white' : 'bg-zinc-800 text-gray-400 hover:text-white'}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {stories.length === 0 ? (
          <div className="text-center py-16 glass-panel rounded-3xl border-dark-glass-border">
            <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No stories yet. Be the first to tell one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((s) => (
              <StoryCard key={s.id} story={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

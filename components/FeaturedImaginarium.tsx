'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PenTool, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PlayImage {
  id: string;
  title: string;
  imageUrl: string;
  author: { username: string };
}

export default function FeaturedImaginarium() {
  const router = useRouter();
  const [images, setImages] = useState<PlayImage[]>([]);

  useEffect(() => {
    fetch('/api/play/featured')
      .then((r) => r.json())
      .then((data) => setImages(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  if (images.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-brand-accent" />
          Daily Imaginarium
        </h2>
        <Link href="/imaginarium" className="text-sm text-brand-primary hover:underline">
          View all
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        {images.map((img) => (
          <button
            key={img.id}
            onClick={() => router.push(`/create?remixUrl=${encodeURIComponent(img.imageUrl)}`)}
            className="group relative aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-dark-glass-border/50 hover:border-brand-primary/50 transition-all"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.imageUrl} alt={img.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-xs font-semibold text-white truncate">{img.title}</p>
            </div>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <PenTool className="w-4 h-4 text-white drop-shadow-lg" />
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import T from '@/components/T';

interface FeaturedImage {
  id: string;
  imageUrl: string;
  title: string;
}

export default function Hero() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [images, setImages] = useState<FeaturedImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/play/featured')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setImages(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (images.length === 0) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [images.length]);

  const currentImg = images[current];

  return (
    <div className="relative overflow-hidden py-12 sm:py-20 lg:pb-24 xl:pb-28 bg-background">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-full pointer-events-none opacity-30 sm:opacity-40 blur-2xl sm:blur-3xl mix-blend-screen">
        <div className="absolute top-1/4 left-1/4 w-40 h-40 sm:w-64 sm:h-64 lg:w-96 lg:h-96 bg-brand-primary rounded-full mix-blend-screen filter blur-[60px] sm:blur-[80px] lg:blur-[100px] animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-44 h-44 sm:w-72 sm:h-72 lg:w-[28rem] lg:h-[28rem] bg-brand-secondary rounded-full mix-blend-screen filter blur-[70px] sm:blur-[90px] lg:blur-[120px] opacity-70"></div>
        <div className="absolute bottom-1/4 left-1/3 w-36 h-36 sm:w-56 sm:h-56 lg:w-80 lg:h-80 bg-brand-accent rounded-full mix-blend-screen filter blur-[50px] sm:blur-[70px] lg:blur-[90px] opacity-50"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 text-gradient leading-none">
          WHAT YOU SEE?
        </h1>

        {/* Carousel from daily Imaginarium */}
        {loading ? (
          <div className="mt-8 sm:mt-10 w-full max-w-xl mx-auto aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-900 animate-pulse border border-dark-glass-border" />
        ) : currentImg ? (
          <button
            onClick={() => router.push(`/create?remixUrl=${encodeURIComponent(currentImg.imageUrl)}`)}
            className="mt-8 sm:mt-10 relative w-full max-w-xl mx-auto aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-dark-glass-border bg-black/40 group cursor-pointer"
          >
            {images.map((img, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={img.id}
                src={img.imageUrl}
                alt={img.title}
                className="absolute inset-0 w-full h-full object-contain transition-all duration-1000 ease-out"
                style={{
                  transform: `translateX(${i === current ? '0%' : i < current ? '-100%' : '100%'})`,
                  opacity: i === current ? 1 : 0,
                }}
              />
            ))}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <span className="text-white/0 group-hover:text-white/90 text-sm font-medium transition-all duration-300 bg-black/50 px-4 py-2 rounded-full">
                Draw this →
              </span>
            </div>
          </button>
        ) : null}

        <h2 className="mt-10 sm:mt-14 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
          <span className="block text-white"><T id="hero.line1" /></span>
          <span className="block text-gradient mt-1 pb-1"><T id="hero.line2" /></span>
          <span className="block text-white"><T id="hero.line3" /></span>
        </h2>

        <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-gray-400">
          <T id="hero.desc" />
        </p>

        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/play" className="inline-flex justify-center items-center gap-2 px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full hover-lift shadow-[0_0_20px_rgba(138,43,226,0.3)]">
            <T id="hero.cta1" />
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link href="/create" className="inline-flex justify-center items-center gap-2 px-8 py-4 text-base font-semibold text-gray-300 bg-dark-glass border border-dark-glass-border rounded-full hover:bg-dark-surface hover:text-white transition-colors hover-lift backdrop-blur-md">
            <T id="hero.cta2" />
          </Link>
        </div>
      </div>
    </div>
  );
}

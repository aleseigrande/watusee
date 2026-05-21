'use client';

import { useState, Suspense } from 'react';
import PareidoliaCanvas from '@/components/PareidoliaCanvas';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useT } from '@/lib/i18n/context';

function CanvasWrapper({ onSave }: { onSave: (originalDataUrl: string, drawingDataUrl: string) => void }) {
  const searchParams = useSearchParams();
  const remixUrl = searchParams.get('remixUrl');
  return <PareidoliaCanvas onSave={onSave} initialImage={remixUrl || undefined} />;
}

function CreateContent() {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<1 | 2>(1);
  const [images, setImages] = useState<{ original: string; drawing: string } | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [audience, setAudience] = useState<'everyone' | 'adults'>('everyone');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const remixId = searchParams.get('remixId');

  const handleCanvasSave = (originalDataUrl: string, drawingDataUrl: string) => {
    setImages({ original: originalDataUrl, drawing: drawingDataUrl });
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!images || !title.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          originalImage: images.original,
          drawnImage: images.drawing,
          audience,
          remixOfId: remixId || undefined,
        }),
      });

      if (res.ok) {
        router.push(remixId ? `/post/${remixId}` : '/');
        router.refresh();
      } else {
        console.error('Failed to create post');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black pt-24 pb-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto flex flex-col items-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 text-center">
          {t('create.title1')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">{t('create.title2')}</span>
        </h1>
        
        {step === 1 && (
          <>
            <p className="text-gray-400 text-lg mb-12 text-center max-w-2xl">
              {t('create.step1.desc')}
            </p>
            <Suspense fallback={<div className="p-12"><Loader2 className="w-8 h-8 animate-spin text-brand-primary" /></div>}>
              <CanvasWrapper onSave={handleCanvasSave} />
            </Suspense>
          </>
        )}

        {step === 2 && images && (
          <div className="w-full max-w-2xl mt-4 sm:mt-8">
            <div className="glass-panel p-5 sm:p-8 rounded-2xl border-dark-glass-border flex flex-col gap-6 sm:gap-8">
              <div className="flex flex-col gap-4 items-center">
                <h3 className="text-xl sm:text-2xl font-bold text-white">{t('create.step2.title')}</h3>
                <p className="text-gray-400 text-sm sm:text-base text-center px-2">{t('create.step2.desc')}</p>
                
                <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md aspect-video rounded-lg overflow-hidden border border-dark-glass-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={images.original} alt={t('create.alt.original')} className="absolute inset-0 w-full h-full object-contain" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={images.drawing} alt={t('create.alt.drawing')} className="absolute inset-0 w-full h-full object-contain mix-blend-normal" />
                </div>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="title" className="text-sm font-medium text-gray-300">
                    {t('create.step2.label')}
                  </label>
                  <input
                    id="title"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t('create.step2.placeholder')}
                    className="bg-black/50 border border-dark-glass-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-primary transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="description" className="text-sm font-medium text-gray-300">
                    {t('create.step2.descLabel')}
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('create.step2.descPlaceholder')}
                    className="bg-black/50 border border-dark-glass-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-primary transition-colors resize-none"
                  />
                </div>
                
                <div className="flex items-center justify-center gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setAudience('everyone')}
                    className={`px-6 py-2 rounded-full text-sm font-bold transition-colors ${
                      audience === 'everyone'
                        ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                        : 'bg-white/10 text-gray-400 hover:bg-white/20'
                    }`}
                  >
                    Everyone
                  </button>
                  <button
                    type="button"
                    onClick={() => setAudience('adults')}
                    className={`px-6 py-2 rounded-full text-sm font-bold transition-colors ${
                      audience === 'adults'
                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                        : 'bg-white/10 text-gray-400 hover:bg-white/20'
                    }`}
                  >
                    Adults Only
                  </button>
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 mt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-3 text-gray-400 hover:text-white transition-colors text-sm sm:text-base"
                  >
                    {t('create.step2.back')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !title.trim()}
                    className="bg-brand-primary hover:bg-brand-primary/90 text-white px-8 py-3 rounded-full font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px] text-sm sm:text-base"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : t('create.step2.publish')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black pt-24 pb-12 px-6 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-primary mt-12" /></div>}>
      <CreateContent />
    </Suspense>
  );
}

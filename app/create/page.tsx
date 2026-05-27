'use client';

import { useState, useRef, Suspense } from 'react';
import PareidoliaCanvas from '@/components/PareidoliaCanvas';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Upload, Camera, LayoutGrid, X } from 'lucide-react';
import { useT } from '@/lib/i18n/context';

interface PlayImage {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  author: { username: string };
  createdAt: string;
}

function CanvasWrapper({ onSave, initialImage }: { onSave: (originalDataUrl: string, drawingDataUrl: string) => void; initialImage?: string }) {
  const searchParams = useSearchParams();
  const remixUrl = searchParams.get('remixUrl');
  return <PareidoliaCanvas onSave={onSave} initialImage={initialImage || remixUrl || undefined} />;
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

  const [initialImage, setInitialImage] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(true);
  const [showImaginarium, setShowImaginarium] = useState(false);
  const [imaginariumImages, setImaginariumImages] = useState<PlayImage[]>([]);
  const [loadingImaginarium, setLoadingImaginarium] = useState(false);

  const uploadRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const remixId = searchParams.get('remixId');
  const remixUrl = searchParams.get('remixUrl');

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setInitialImage(event.target?.result as string);
      setShowPicker(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const openImaginarium = async () => {
    setShowImaginarium(true);
    if (imaginariumImages.length === 0) {
      setLoadingImaginarium(true);
      try {
        const res = await fetch('/api/play/images');
        const data = await res.json();
        setImaginariumImages(Array.isArray(data) ? data : []);
      } catch {
        // ignore
      } finally {
        setLoadingImaginarium(false);
      }
    }
  };

  const pickImaginarium = (img: PlayImage) => {
    setInitialImage(img.imageUrl);
    setShowPicker(false);
    setShowImaginarium(false);
  };

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
        headers: { 'Content-Type': 'application/json' },
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
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startOver = () => {
    setInitialImage(null);
    setShowPicker(true);
    setStep(1);
    setImages(null);
  };

  const showSourcePicker = showPicker && !remixUrl;

  return (
    <div className="min-h-screen bg-black pt-24 pb-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto flex flex-col items-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 text-center">
          {t('create.title1')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">{t('create.title2')}</span>
        </h1>

        {/* Step 0: Source picker */}
        {showSourcePicker && (
          <>
            <p className="text-gray-400 text-lg mb-10 text-center max-w-2xl">
              {t('create.step1.desc')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
              <button onClick={() => uploadRef.current?.click()} className="glass-panel p-6 sm:p-8 rounded-2xl border border-dark-glass-border hover:border-brand-primary/50 transition-all flex flex-col items-center gap-4 group">
                <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center group-hover:bg-brand-primary/20 transition-colors">
                  <Upload className="w-8 h-8 text-brand-primary" />
                </div>
                <div>
                  <p className="text-white font-bold text-lg">Upload Photo</p>
                  <p className="text-gray-400 text-sm mt-1">Select an image from your device</p>
                </div>
              </button>
              <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

              <button onClick={() => cameraRef.current?.click()} className="glass-panel p-6 sm:p-8 rounded-2xl border border-dark-glass-border hover:border-brand-primary/50 transition-all flex flex-col items-center gap-4 group">
                <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center group-hover:bg-brand-primary/20 transition-colors">
                  <Camera className="w-8 h-8 text-brand-primary" />
                </div>
                <div>
                  <p className="text-white font-bold text-lg">Take Photo</p>
                  <p className="text-gray-400 text-sm mt-1">Capture with your camera</p>
                </div>
              </button>
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />

              <button onClick={openImaginarium} className="glass-panel p-6 sm:p-8 rounded-2xl border border-dark-glass-border hover:border-brand-primary/50 transition-all flex flex-col items-center gap-4 group">
                <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center group-hover:bg-brand-primary/20 transition-colors">
                  <LayoutGrid className="w-8 h-8 text-brand-primary" />
                </div>
                <div>
                  <p className="text-white font-bold text-lg">Browse Imaginarium</p>
                  <p className="text-gray-400 text-sm mt-1">Pick from our gallery</p>
                </div>
              </button>
            </div>

            {/* Imaginarium modal */}
            {showImaginarium && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-dark-surface border border-dark-glass-border rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between p-4 sm:p-6 border-b border-dark-glass-border">
                    <h2 className="text-xl font-bold text-white">Select an image from Imaginarium</h2>
                    <button onClick={() => setShowImaginarium(false)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    {loadingImaginarium ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
                      </div>
                    ) : imaginariumImages.length === 0 ? (
                      <p className="text-gray-400 text-center py-12">No images found</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                        {imaginariumImages.map((img) => (
                          <button key={img.id} onClick={() => pickImaginarium(img)} className="group relative aspect-square rounded-xl overflow-hidden border border-dark-glass-border hover:border-brand-primary/50 transition-all">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img.imageUrl} alt={img.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                              <span className="text-white font-semibold opacity-0 group-hover:opacity-100 transition-opacity text-sm px-2 text-center">{img.title}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Step 1: Canvas */}
        {(!showSourcePicker || remixUrl) && step === 1 && (
          <>
            <p className="text-gray-400 text-lg mb-12 text-center max-w-2xl">
              {t('create.step1.desc')}
            </p>
            {showPicker && !remixUrl && (
              <button onClick={startOver} className="mb-4 text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1">
                &larr; Choose a different image
              </button>
            )}
            <Suspense fallback={<div className="p-12"><Loader2 className="w-8 h-8 animate-spin text-brand-primary" /></div>}>
              <CanvasWrapper onSave={handleCanvasSave} initialImage={initialImage || undefined} />
            </Suspense>
          </>
        )}

        {/* Step 2: Publish */}
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

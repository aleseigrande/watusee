'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Check, ImagePlus, Trash2, Sparkles, Loader2, Upload } from 'lucide-react';
import { useT } from '@/lib/i18n/context';

interface RoundData {
  clue: string;
  images: string[];
  correctIndex: number;
  explanation: string;
}

export default function CreateMindReaderPage() {
  const t = useT();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [rounds, setRounds] = useState<RoundData[]>(
    Array.from({ length: 5 }, () => ({ clue: '', images: ['', '', ''], correctIndex: -1, explanation: '' }))
  );
  const [currentRound, setCurrentRound] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryTab, setGalleryTab] = useState<'upload' | 'gallery'>('gallery');
  const [gallerySlot, setGallerySlot] = useState<{ round: number; slot: number } | null>(null);
  const [galleryImages, setGalleryImages] = useState<{ imageUrl: string; title: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/play/images')
      .then((r) => r.json())
      .then((d) => setGalleryImages(Array.isArray(d) ? d : d.images || []))
      .catch(() => {});
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !gallerySlot) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      pickImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const updateRound = (idx: number, field: keyof RoundData, value: any) => {
    const copy = [...rounds];
    (copy[idx] as any)[field] = value;
    setRounds(copy);
  };

  const pickImage = (url: string) => {
    if (!gallerySlot) return;
    updateRound(gallerySlot.round, 'images', rounds[gallerySlot.round].images.map((img, i) => i === gallerySlot.slot ? url : img));
    setGalleryOpen(false);
    setGallerySlot(null);
  };

  const handleSubmit = async () => {
    if (!title.trim()) { setError('Title required'); return; }
    for (let i = 0; i < 5; i++) {
      const r = rounds[i];
      if (!r.clue.trim()) { setError(`Round ${i + 1}: clue required`); return; }
      if (r.images.some((img) => !img)) { setError(`Round ${i + 1}: all 3 images required`); return; }
      if (r.correctIndex < 0) { setError(`Round ${i + 1}: select correct image`); return; }
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/mind-reader/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), rounds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push('/mind-reader');
    } catch (err: any) {
      setError(err.message || 'Error creating challenge');
    }
    setSubmitting(false);
  };

  const r = rounds[currentRound];

  return (
    <div className="min-h-screen bg-black pt-20 pb-24 px-4 max-w-lg mx-auto">
      <button onClick={() => router.push('/mind-reader')} className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors">
        <ArrowLeft className="w-5 h-5" /><span>{t('mindreader.back')}</span>
      </button>

      <h1 className="text-2xl font-bold text-white mb-6">{t('mindreader.createTitle')}</h1>

      {/* Title */}
      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('mindreader.titlePlaceholder')} className="w-full bg-zinc-800 border border-dark-glass-border rounded-xl px-4 py-3 text-white placeholder-gray-500 mb-6 focus:outline-none focus:ring-2 focus:ring-brand-primary/50" />

      {/* Round selector tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {rounds.map((_, i) => (
          <button key={i} onClick={() => setCurrentRound(i)} className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${currentRound === i ? 'bg-brand-primary text-white' : 'bg-zinc-800 text-gray-400 border border-dark-glass-border/50'}`}>
            {i + 1}
          </button>
        ))}
      </div>

      {/* Current round form */}
      <div className="glass-panel rounded-2xl p-5 border border-dark-glass-border/50 mb-6 space-y-4">
        <h3 className="text-white font-bold">
          {t('mindreader.round')} {currentRound + 1}
        </h3>

        <input type="text" value={r.clue} onChange={(e) => updateRound(currentRound, 'clue', e.target.value)} placeholder={t('mindreader.cluePlaceholder')} className="w-full bg-zinc-800 border border-dark-glass-border rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50" />

        <div className="grid grid-cols-3 gap-2">
          {r.images.map((img, slot) => (
            <div key={slot} className="relative aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-dark-glass-border/50">
              {img ? (
                <>
                  <img src={img} alt="" className="w-full h-full object-cover cursor-pointer" onClick={() => { setGallerySlot({ round: currentRound, slot }); setGalleryOpen(true); }} />
                  {r.correctIndex === slot && <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
                  <button onClick={() => { updateRound(currentRound, 'images', r.images.map((x, j) => j === slot ? '' : x)); if (r.correctIndex === slot) updateRound(currentRound, 'correctIndex', -1); }} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500/80 flex items-center justify-center"><Trash2 className="w-3 h-3 text-white" /></button>
                  <button onClick={() => updateRound(currentRound, 'correctIndex', slot)} className="absolute bottom-1 left-1 right-1 bg-black/70 text-[9px] text-white py-1 rounded-lg font-semibold">
                    {r.correctIndex === slot ? '✓ Correct' : t('mindreader.markCorrect')}
                  </button>
                </>
              ) : (
                <button onClick={() => { setGallerySlot({ round: currentRound, slot }); setGalleryOpen(true); }} className="w-full h-full flex items-center justify-center text-gray-600 hover:text-gray-400 transition-colors">
                  <ImagePlus className="w-6 h-6" />
                </button>
              )}
            </div>
          ))}
        </div>

        <textarea value={r.explanation} onChange={(e) => updateRound(currentRound, 'explanation', e.target.value)} placeholder={t('mindreader.explanationPlaceholder')} rows={2} className="w-full bg-zinc-800 border border-dark-glass-border rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50 resize-none" />
      </div>

      {/* Image picker modal */}
      {galleryOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setGalleryOpen(false)}>
          <div className="w-full max-w-lg max-h-[80vh] bg-zinc-900 rounded-2xl overflow-hidden border border-dark-glass-border" onClick={(e) => e.stopPropagation()}>
            <div className="flex border-b border-dark-glass-border/50">
              <button onClick={() => setGalleryTab('upload')} className={`flex-1 py-3 text-sm font-semibold transition-colors ${galleryTab === 'upload' ? 'text-white border-b-2 border-brand-primary' : 'text-gray-500'}`}>
                <Upload className="w-4 h-4 inline mr-1" /> Upload
              </button>
              <button onClick={() => setGalleryTab('gallery')} className={`flex-1 py-3 text-sm font-semibold transition-colors ${galleryTab === 'gallery' ? 'text-white border-b-2 border-brand-primary' : 'text-gray-500'}`}>
                <ImagePlus className="w-4 h-4 inline mr-1" /> Imaginarium
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[65vh]">
              {galleryTab === 'upload' ? (
                <div className="text-center py-12">
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                  <button onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-dashed border-dark-glass-border/50 rounded-2xl py-12 px-4 hover:border-brand-primary/50 transition-all cursor-pointer">
                    <Upload className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">{t('mindreader.upload')}</p>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {galleryImages.length === 0 ? (
                    <p className="col-span-3 text-center text-gray-600 text-sm py-8">{t('mindreader.noImages')}</p>
                  ) : (
                    galleryImages.map((img, i) => (
                      <button key={i} onClick={() => pickImage(img.imageUrl)} className="aspect-square rounded-xl overflow-hidden border border-dark-glass-border/50 hover:border-brand-primary/50 transition-all">
                        <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}

      <button onClick={handleSubmit} disabled={submitting} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-brand-primary text-white px-4 py-3.5 rounded-xl font-bold hover:scale-[1.02] transition-all disabled:opacity-50">
        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
        {t('mindreader.publish')}
      </button>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Eye, Plus, X, Upload, Camera, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import ResonanceSignalCard from '@/components/ResonanceSignalCard';

const SORT_TABS = [
  { id: 'latest', label: 'Latest' },
  { id: 'resonance', label: 'Top Resonance' },
  { id: 'answered', label: 'Most Answered' },
];

type ImageSource = 'imaginarium' | 'upload' | 'camera';

export default function ResonancePage() {
  const router = useRouter();
  const [signals, setSignals] = useState<any[]>([]);
  const [sort, setSort] = useState('latest');
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [question, setQuestion] = useState('What do you see?');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageSource, setImageSource] = useState<ImageSource>('upload');
  const [imaginariumImages, setImaginariumImages] = useState<any[]>([]);
  const [loadingImaginarium, setLoadingImaginarium] = useState(false);

  const loadSignals = async (s: string) => {
    setSort(s);
    try {
      const res = await fetch(`/api/resonance?sort=${s}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setSignals(data.signals);
      }
    } catch {}
  };

  useEffect(() => { loadSignals('latest'); }, []);

  const handleUploadImage = async () => {
    if (!uploadFile) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', uploadFile);
      const res = await fetch('/api/play/upload', { method: 'POST', body: fd });
      if (res.ok) {
        const data = await res.json();
        setImageUrl(data.imageUrl);
      }
    } catch {}
    setUploading(false);
  };

  const handleCreate = async () => {
    if (!title.trim() || !imageUrl) return;
    try {
      const res = await fetch('/api/resonance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          question: question.trim() || 'What do you see?',
          imageUrl,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/resonance/${data.signal.id}`);
      }
    } catch {}
  };

  return (
    <div className="min-h-screen pt-20 pb-16 px-4 max-w-5xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-amber-500 mb-4 shadow-[0_0_40px_rgba(5,150,105,0.2)]">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Resonance Master</h1>
        <p className="text-gray-400 max-w-lg mx-auto mb-2">
          Post an image. Ask a question. Discover how the world sees what you see.
        </p>
        <p className="text-gray-600 text-sm mb-8 italic">
          &ldquo;How many people truly saw what I saw?&rdquo;
        </p>

        <button
          onClick={() => setShowCreate(true)}
          className="bg-gradient-to-r from-purple-600 to-brand-primary text-white px-8 py-3 rounded-full font-bold flex items-center gap-2 mx-auto hover:scale-105 transition-all shadow-[0_0_30px_rgba(5,150,105,0.2)]"
        >
          <Plus className="w-5 h-5" />
          Send a Signal
        </button>
      </div>

      {/* Sort tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {SORT_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => loadSignals(tab.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${sort === tab.id ? 'bg-brand-primary text-white' : 'bg-zinc-800 text-gray-400 hover:text-white'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Feed */}
      {signals.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-3xl border-dark-glass-border">
          <Eye className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No signals yet. Be the first to send one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {signals.map((s) => (
            <ResonanceSignalCard key={s.id} signal={s} />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-lg bg-zinc-900 rounded-2xl p-6 border border-dark-glass-border shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-white mb-4">Send a Signal</h2>

            {/* Image source tabs */}
            {!imageUrl && (
              <div className="flex gap-2 mb-4">
                <button onClick={() => setImageSource('upload')} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${imageSource === 'upload' ? 'bg-brand-primary text-white' : 'bg-zinc-800 text-gray-400 hover:text-white'}`}>
                  <Upload className="w-3.5 h-3.5" /> Upload
                </button>
                <button onClick={() => { setImageSource('imaginarium'); if (imaginariumImages.length === 0) { setLoadingImaginarium(true); fetch('/api/play/images').then(r => r.json()).then(d => { setImaginariumImages(Array.isArray(d) ? d : []); setLoadingImaginarium(false); }).catch(() => setLoadingImaginarium(false)); } }} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${imageSource === 'imaginarium' ? 'bg-brand-primary text-white' : 'bg-zinc-800 text-gray-400 hover:text-white'}`}>
                  <ImageIcon className="w-3.5 h-3.5" /> Imaginarium
                </button>
                <button onClick={() => setImageSource('camera')} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${imageSource === 'camera' ? 'bg-brand-primary text-white' : 'bg-zinc-800 text-gray-400 hover:text-white'}`}>
                  <Camera className="w-3.5 h-3.5" /> Camera
                </button>
              </div>
            )}

            <div className="space-y-4">
              {!imageUrl ? (
                <>
                  {imageSource === 'upload' && (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                        className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-primary file:text-white hover:file:bg-brand-primary/80"
                      />
                      <button
                        onClick={handleUploadImage}
                        disabled={!uploadFile || uploading}
                        className="mt-2 w-full bg-zinc-800 text-gray-300 px-4 py-2 rounded-xl border border-dark-glass-border hover:border-brand-primary/50 transition-colors disabled:opacity-40"
                      >
                        {uploading ? 'Uploading...' : 'Upload'}
                      </button>
                    </div>
                  )}

                  {imageSource === 'camera' && (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                        className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-primary file:text-white hover:file:bg-brand-primary/80"
                      />
                      <button
                        onClick={handleUploadImage}
                        disabled={!uploadFile || uploading}
                        className="mt-2 w-full bg-zinc-800 text-gray-300 px-4 py-2 rounded-xl border border-dark-glass-border hover:border-brand-primary/50 transition-colors disabled:opacity-40"
                      >
                        {uploading ? 'Uploading...' : 'Take Photo'}
                      </button>
                    </div>
                  )}

                  {imageSource === 'imaginarium' && (
                    <div className="max-h-60 overflow-y-auto">
                      {loadingImaginarium ? (
                        <p className="text-gray-500 text-sm text-center py-8">Loading...</p>
                      ) : imaginariumImages.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-8">No images in Imaginarium yet</p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {imaginariumImages.map((img: any) => (
                            <button
                              key={img.id}
                              onClick={() => setImageUrl(img.imageUrl)}
                              className="relative aspect-square rounded-lg overflow-hidden bg-zinc-800 border border-dark-glass-border/50 hover:border-brand-primary/50 transition-all"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={img.imageUrl} alt={img.title} className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => setImageUrl('')} className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your signal a title..."
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-dark-glass-border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Question</label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="What do you see?"
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-dark-glass-border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-800 text-gray-300 hover:text-white border border-dark-glass-border transition-colors">
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!title.trim() || !imageUrl}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-brand-primary text-white font-semibold disabled:opacity-40 hover:shadow-lg transition-all"
              >
                Send Signal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

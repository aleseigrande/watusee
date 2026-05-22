'use client';

import { useEffect, useState } from 'react';
import { Sparkles, PenTool, ArrowLeft, Upload, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useT } from '@/lib/i18n/context';

// Una imagen subida por usuarios en la página Play (para que otros dibujen sobre ella)
interface PlayImage {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  author: { username: string };
  createdAt: string;
}

// Página Play: IMAGINARIUM.
// Los usuarios pueden subir imágenes para que otros dibujen sobre ellas,
// o elegir una de las imágenes predeterminadas.
export default function PlayPage() {
  const t = useT();
  const router = useRouter();
  const [uploadedImages, setUploadedImages] = useState<PlayImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch('/api/play/images')
      .then((r) => r.json())
      .then((data) => setUploadedImages(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Redirige a /create con la imagen seleccionada como remixUrl
  const handlePlay = (src: string) => {
    router.push(`/create?remixUrl=${encodeURIComponent(src)}`);
  };

  // Sube una nueva imagen: envía FormData a /api/play/upload
  const handleUpload = async () => {
    if (!uploadFile || !uploadTitle.trim()) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', uploadFile);
      fd.append('title', uploadTitle.trim());
      fd.append('description', uploadDesc.trim());
      const res = await fetch('/api/play/upload', { method: 'POST', body: fd });
      if (res.ok) {
        const img = await res.json();
        setUploadedImages((prev) => [img, ...prev]); // agrega al inicio
        setShowModal(false);
        setUploadTitle('');
        setUploadDesc('');
        setUploadFile(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Botón volver al home */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>HOME</span>
      </Link>

      {/* Encabezado: badge, IMAGINARIUM, botón Up Load, eslogan y descripción */}
      <div className="text-center mb-8 sm:mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-dark-surface/50 border border-dark-glass-border text-sm text-gray-300 mb-4 sm:mb-6 backdrop-blur-sm">
          <Sparkles className="h-4 w-4 text-brand-accent" />
          <span>Upload an image and awaken the power of your imagination</span>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 sm:mb-8 tracking-tight">
          {t('play.title')}
        </h1>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary hover:bg-brand-primary/80 text-white font-bold rounded-full transition-all hover:scale-105 shadow-lg shadow-brand-primary/30 mb-8"
        >
          <Upload className="w-5 h-5" />
          Upload
        </button>


      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-12">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] rounded-2xl bg-zinc-900 animate-pulse border border-dark-glass-border/50" />
          ))}
        </div>
      )}

      {/* Sección: imágenes subidas por usuarios */}
      {!loading && uploadedImages.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-12">
            {uploadedImages.map((img) => (
              <div
                key={img.id}
                className="group relative glass-panel rounded-2xl overflow-hidden border border-dark-glass-border/50 active:scale-[0.97] transition-transform cursor-pointer"
                onClick={() => handlePlay(img.imageUrl)}
              >
                <div className="aspect-[4/3] relative overflow-hidden bg-zinc-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.imageUrl}
                    alt={img.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  {/* Título, descripción y autor (nickname) sobre la imagen */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-5">
                    <h3 className="text-sm sm:text-xl font-bold text-white mb-0.5 sm:mb-1">{img.title}</h3>
                    {img.description && (
                      <p className="text-xs sm:text-sm text-gray-300 hidden sm:block">{img.description}</p>
                    )}
                    <p className="text-[10px] text-gray-400 mt-1">{t('play.by')} <span className="text-brand-accent">@{img.author.username}</span></p>
                  </div>
                  <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
                    <span className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-1.5 sm:py-2.5 bg-brand-primary text-white text-xs sm:text-sm rounded-full font-bold shadow-lg shadow-brand-primary/30">
                      <PenTool className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="sm:inline">{t('play.draw')}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal para subir imagen: título, descripción, archivo */}
      {showModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 cursor-default"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative w-full max-w-md bg-zinc-900 rounded-2xl p-6 sm:p-8 border border-dark-glass-border shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-white mb-6">{t('play.uploadModal.title')}</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">{t('play.uploadModal.titleLabel')}</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder={t('play.uploadModal.titlePlaceholder')}
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-dark-glass-border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">{t('play.uploadModal.descLabel')}</label>
                <textarea
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  placeholder={t('play.uploadModal.descPlaceholder')}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-dark-glass-border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-primary file:text-white hover:file:bg-brand-primary/80"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-800 text-gray-300 hover:text-white border border-dark-glass-border transition-colors"
              >
                {t('play.uploadModal.cancel')}
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || !uploadFile || !uploadTitle.trim()}
                className="flex-1 px-4 py-2.5 rounded-xl bg-brand-primary text-white font-semibold hover:bg-brand-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? '...' : t('play.uploadModal.submit')}
              </button>
            </div>

            <button
              className="absolute top-4 right-4 p-1.5 bg-black/60 hover:bg-brand-primary rounded-full text-white transition-all hover:scale-110"
              onClick={() => setShowModal(false)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

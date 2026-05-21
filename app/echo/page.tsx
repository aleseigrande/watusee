'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, RefreshCw, Share2, ArrowLeft, MessageCircle } from 'lucide-react';
import EchoCanvas from '@/components/EchoCanvas';

interface EchoImage {
  id: string;
  imageUrl: string;
  title: string;
}

interface EchoDrawing {
  id: string;
  imageUrl: string;
  drawingData: string;
  createdAt: string;
  user: { username: string; image: string | null };
  _count?: { reactions: number };
}

type Phase = 'start' | 'countdown' | 'flash' | 'draw' | 'reveal';

export default function EchoPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('start');
  const [image, setImage] = useState<EchoImage | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [myDrawing, setMyDrawing] = useState<string | null>(null);
  const [otherDrawings, setOtherDrawings] = useState<EchoDrawing[]>([]);
  const [drawingId, setDrawingId] = useState<string | null>(null);

  // Countdown logic
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown <= 0) {
      setPhase('flash');
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 700);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  // Flash duration: 2 seconds
  useEffect(() => {
    if (phase !== 'flash') return;
    const t = setTimeout(() => setPhase('draw'), 2000);
    return () => clearTimeout(t);
  }, [phase]);

  const handleStart = async () => {
    try {
      const res = await fetch('/api/echo/start');
      if (res.ok) {
        const data = await res.json();
        setImage(data.image);
        setCountdown(3);
        setPhase('countdown');
      }
    } catch {}
  };

  const handleDrawingSave = async (dataUrl: string) => {
    if (!image) return;
    try {
      const res = await fetch('/api/echo/drawings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: image.imageUrl, drawingData: dataUrl }),
      });
      if (res.ok) {
        const data = await res.json();
        setDrawingId(data.drawing.id);
        setMyDrawing(dataUrl);
        // Fetch other drawings
        const others = await fetch(`/api/echo/drawings?imageUrl=${encodeURIComponent(image.imageUrl)}`);
        if (others.ok) {
          const othersData = await others.json();
          setOtherDrawings(othersData.drawings.filter((d: EchoDrawing) => d.user.username !== 'you'));
        }
        setPhase('reveal');
      }
    } catch {}
  };

  const handlePlayAgain = () => {
    setPhase('start');
    setImage(null);
    setMyDrawing(null);
    setOtherDrawings([]);
    setDrawingId(null);
    setCountdown(3);
  };

  if (phase === 'countdown') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center animate-in fade-in duration-300">
          <div className="text-8xl font-bold text-white mb-4 animate-pulse">{countdown}</div>
          <p className="text-gray-500 text-sm uppercase tracking-widest">Prepare your vision...</p>
        </div>
      </div>
    );
  }

  if (phase === 'flash') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        {image && (
          <div className="max-w-2xl w-full animate-in zoom-in-50 duration-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.imageUrl} alt={image.title} className="w-full aspect-square object-cover rounded-3xl shadow-[0_0_80px_rgba(255,255,255,0.1)]" />
          </div>
        )}
      </div>
    );
  }

  if (phase === 'draw') {
    return (
      <div className="min-h-screen bg-black pt-4 pb-8 px-4 max-w-2xl mx-auto flex flex-col">
        <div className="text-center mb-4">
          <p className="text-gray-400 text-sm uppercase tracking-widest flex items-center justify-center gap-2">
            <EyeOff className="w-4 h-4 text-brand-primary" />
            Draw what you saw
          </p>
        </div>
        <div className="flex-1">
          <EchoCanvas onSave={handleDrawingSave} />
        </div>
      </div>
    );
  }

  if (phase === 'reveal' && image) {
    return (
      <div className="min-h-screen bg-black pt-6 pb-16 px-4 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-1">The Reveal</h2>
          <p className="text-gray-500 text-sm">Memory is an imperfect art</p>
        </div>

        {/* Original vs My Drawing */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-2 text-center">Original</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.imageUrl} alt="Original" className="w-full aspect-square object-cover rounded-2xl border border-dark-glass-border/50" />
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-2 text-center">You remembered</p>
            {myDrawing && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={myDrawing} alt="Your drawing" className="w-full aspect-square object-cover rounded-2xl border border-brand-primary/30 bg-black" />
            )}
          </div>
        </div>

        {/* Other interpretations */}
        {otherDrawings.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-brand-primary" />
              What others saw
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {otherDrawings.map((d) => (
                <div key={d.id} className="bg-zinc-900 rounded-2xl overflow-hidden border border-dark-glass-border/50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={d.drawingData} alt="" className="w-full aspect-square object-contain bg-black" />
                  <div className="p-2 flex items-center justify-between">
                    <span className="text-xs text-gray-400 truncate">@{d.user.username}</span>
                    {d._count && <span className="text-xs text-gray-500">{d._count.reactions}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 items-center">
          <button
            onClick={handlePlayAgain}
            className="bg-gradient-to-r from-brand-primary to-purple-600 text-white px-8 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-all"
          >
            <RefreshCw className="w-5 h-5" />
            Try Another Image
          </button>
          <div className="flex items-center gap-4 text-gray-400 text-sm">
            <button onClick={() => { if (drawingId) router.push(`/echo/${drawingId}`); }} className="flex items-center gap-1.5 hover:text-white transition-colors">
              <MessageCircle className="w-4 h-4" /> View details
            </button>
            <button onClick={() => { if (navigator.share) navigator.share({ title: 'Echo Vision', url: window.location.href }); }} className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Share2 className="w-4 h-4" /> Share
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Start phase
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-brand-primary flex items-center justify-center mx-auto mb-6 shadow-[0_0_50px_rgba(5,150,105,0.2)]">
          <Eye className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Echo Vision</h1>
        <p className="text-gray-400 mb-2">A visual memory experiment.</p>
        <p className="text-gray-600 text-sm mb-8">See an image for 2 seconds. Recreate it from memory. Compare with others.</p>

        <button
          onClick={handleStart}
          className="bg-gradient-to-r from-purple-600 to-brand-primary text-white px-10 py-4 rounded-2xl font-bold text-lg flex items-center gap-3 mx-auto hover:scale-105 transition-all shadow-[0_0_40px_rgba(5,150,105,0.2)]"
        >
          <Eye className="w-6 h-6" />
          Show me
        </button>
      </div>
    </div>
  );
}

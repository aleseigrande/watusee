'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Pencil, Eraser, Sparkles, Undo2, Trash2 } from 'lucide-react';

interface EchoCanvasProps {
  onSave: (dataUrl: string) => void;
}

type Tool = 'brush' | 'erase' | 'glow';

export default function EchoCanvas({ onSave }: EchoCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>('brush');
  const [color, setColor] = useState('#ffffff');
  const [size, setSize] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const history = useRef<string[]>([]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    lastPos.current = getPos(e);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'erase') {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = size * 3;
    } else if (tool === 'glow') {
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      ctx.shadowBlur = 0;
    }

    ctx.stroke();
    ctx.shadowBlur = 0;
    lastPos.current = pos;
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (isDrawing && canvasRef.current) {
      history.current.push(canvasRef.current.toDataURL());
    }
    setIsDrawing(false);
  };

  const undo = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas || history.current.length === 0) return;
    history.current.pop();
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setHasDrawn(history.current.length > 0);
    };
    img.src = history.current.length > 0 ? history.current[history.current.length - 1] : '';
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    history.current = [];
    setHasDrawn(false);
  };

  const save = () => {
    if (canvasRef.current && hasDrawn) {
      onSave(canvasRef.current.toDataURL('image/png'));
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    canvas.style.width = canvas.offsetWidth + 'px';
    canvas.style.height = canvas.offsetHeight + 'px';
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(2, 2);
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 p-3 bg-zinc-900 rounded-t-2xl border-b border-dark-glass-border/50">
        <div className="flex items-center gap-1.5">
          <button onClick={() => setTool('brush')} className={`p-2 rounded-lg transition-colors ${tool === 'brush' ? 'bg-brand-primary text-white' : 'text-gray-400 hover:text-white hover:bg-zinc-800'}`}>
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => setTool('erase')} className={`p-2 rounded-lg transition-colors ${tool === 'erase' ? 'bg-brand-primary text-white' : 'text-gray-400 hover:text-white hover:bg-zinc-800'}`}>
            <Eraser className="w-4 h-4" />
          </button>
          <button onClick={() => setTool('glow')} className={`p-2 rounded-lg transition-colors ${tool === 'glow' ? 'bg-brand-primary text-white' : 'text-gray-400 hover:text-white hover:bg-zinc-800'}`}>
            <Sparkles className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-dark-glass-border mx-1" />
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-7 h-7 rounded cursor-pointer bg-transparent border-0" />
        </div>
        <div className="flex items-center gap-2">
          <input type="range" min="2" max="20" value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-16 accent-brand-primary" />
          <button onClick={undo} disabled={!hasDrawn} className="p-2 text-gray-400 hover:text-white disabled:opacity-30 transition-colors">
            <Undo2 className="w-4 h-4" />
          </button>
          <button onClick={clear} disabled={!hasDrawn} className="p-2 text-gray-400 hover:text-red-400 disabled:opacity-30 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative bg-black rounded-b-2xl overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-full cursor-crosshair touch-none"
          style={{ minHeight: '300px' }}
        />
        {!hasDrawn && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-gray-600 text-sm">Draw what you remember...</p>
          </div>
        )}
      </div>

      {/* Save button */}
      <button
        onClick={save}
        disabled={!hasDrawn}
        className="w-full mt-3 bg-brand-primary hover:bg-brand-secondary disabled:opacity-40 text-white py-3 rounded-xl font-bold text-sm transition-all"
      >
        Submit My Interpretation
      </button>
    </div>
  );
}

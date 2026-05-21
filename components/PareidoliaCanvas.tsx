'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, Eraser, Undo, Save, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useT } from '@/lib/i18n/context';

interface PareidoliaCanvasProps {
  onSave: (originalDataUrl: string, drawingDataUrl: string) => void;
  initialImage?: string; // ruta o data URL de imagen precargada (ej: desde Play)
}

// Lienzo de dibujo para crear pareidolias.
// El usuario sube/carga una imagen, dibuja sobre ella con pincel configurable,
// y al guardar se genera un data URL del dibujo sobre fondo de color sólido.
export default function PareidoliaCanvas({ onSave, initialImage }: PareidoliaCanvasProps) {
  const t = useT();
  const [image, setImage] = useState<string | null>(null); // imagen original (data URL o ruta)
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#6B4EFF'); // violeta (primary)
  const [brushSize, setBrushSize] = useState(5);
  const [bgColor, setBgColor] = useState('#000000'); // fondo del drawing exportado
  
  const [history, setHistory] = useState<ImageData[]>([]); // para deshacer (undo)

  // Carga una imagen al canvas: ajusta dimensiones y, si es una URL (no data:),
  // la convierte a data URL para que la API pueda guardarla correctamente.
  const loadImageToCanvas = (src: string) => {
    setImage(src);
    
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
        setHistory([]);
      }
      // Si la fuente es una ruta (p. ej. /play/clouds1.jpg), la convertimos a data URL
      // porque la API espera base64 para guardar el archivo.
      if (!src.startsWith('data:')) {
        const c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        setImage(c.toDataURL('image/png'));
      }
    };
    img.src = src;
  };

  // Carga la imagen inicial si se proporciona (ej: desde Play con remixUrl)
  useEffect(() => {
    if (initialImage && !image) {
      loadImageToCanvas(initialImage);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialImage]);

  // Maneja la subida de imagen desde el input file
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        loadImageToCanvas(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  // Guarda el estado actual del canvas en el historial (para undo)
  const saveHistoryState = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setHistory((prev) => [...prev, imageData]);
      }
    }
  };

  // Inicia el trazo en coordenadas mouse/touch
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    saveHistoryState();
    setIsDrawing(true);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { offsetX, offsetY } = getCoordinates(e, canvas);
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  // Dibuja mientras se arrastra el mouse/dedo
  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { offsetX, offsetY } = getCoordinates(e, canvas);
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  // Traduce coordenadas del evento a coordenadas del canvas (considerando escala)
  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        offsetX: (touch.clientX - rect.left) * (canvas.width / rect.width),
        offsetY: (touch.clientY - rect.top) * (canvas.height / rect.height),
      };
    }

    return {
      offsetX: (e.clientX - rect.left) * (canvas.width / rect.width),
      offsetY: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  // Limpia todo el canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      saveHistoryState();
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Deshace el último trazo
  const undo = () => {
    if (history.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (ctx && canvas) {
      const newHistory = [...history];
      const previousState = newHistory.pop();
      setHistory(newHistory);
      
      if (previousState) {
        ctx.putImageData(previousState, 0, 0);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  // Exporta el dibujo: combina los trazos sobre un fondo de color sólido (sin la imagen original)
  // y llama a onSave con ambos: imagen original + dibujo exportado.
  const handleSave = () => {
    if (!image) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const offscreen = document.createElement('canvas');
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    const offCtx = offscreen.getContext('2d');
    if (offCtx) {
      offCtx.fillStyle = bgColor;
      offCtx.fillRect(0, 0, offscreen.width, offscreen.height);
      offCtx.drawImage(canvas, 0, 0);
    }
    const drawingDataUrl = offscreen.toDataURL('image/png');
    onSave(image, drawingDataUrl);
  };

  return (
    <div className="w-full flex flex-col items-center gap-6">
      {!image ? (
        // Estado inicial: selector de imagen
        <div className="w-full max-w-2xl aspect-video rounded-2xl glass-panel flex flex-col items-center justify-center p-8 border-dashed border-2 border-dark-glass-border hover:border-brand-primary transition-colors">
          <Upload className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">{t('canvas.heading')}</h3>
          <p className="text-gray-400 text-center mb-6">{t('canvas.desc')}</p>
          <label className="bg-brand-primary hover:bg-brand-primary/90 text-white px-6 py-3 rounded-full font-semibold cursor-pointer transition-colors shadow-lg shadow-brand-primary/20">
            {t('canvas.upload')}
            <input 
              type="file" 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageUpload} 
            />
          </label>
        </div>
      ) : (
        <div className="w-full max-w-4xl flex flex-col gap-4">
          {/* Barra de herramientas: color trazo, color fondo, tamaño pincel, undo, clear, cambiar imagen */}
          <div className="glass-panel p-3 sm:p-4 rounded-xl flex flex-wrap items-center justify-between gap-2 sm:gap-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-[11px] sm:text-sm text-gray-300 hidden sm:inline">{t('canvas.tool.stroke')}</span>
                <input 
                  type="color" 
                  value={color} 
                  onChange={(e) => setColor(e.target.value)}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                />
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-[11px] sm:text-sm text-gray-300 hidden sm:inline">{t('canvas.tool.bg')}</span>
                <input 
                  type="color" 
                  value={bgColor} 
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                />
              </div>
              
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-[11px] sm:text-sm text-gray-300 hidden sm:inline">{t('canvas.tool.size')}</span>
                <input 
                  type="range" 
                  min="1" 
                  max="20" 
                  value={brushSize} 
                  onChange={(e) => setBrushSize(parseInt(e.target.value))}
                  className="w-16 sm:w-24 accent-brand-secondary"
                />
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <button 
                onClick={undo}
                disabled={history.length === 0}
                className="p-1.5 sm:p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={t('canvas.undo')}
              >
                <Undo className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button 
                onClick={clearCanvas}
                className="p-1.5 sm:p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title={t('canvas.clear')}
              >
                <Eraser className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button 
                onClick={() => setImage(null)}
                className="p-1.5 sm:p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                title={t('canvas.change')}
              >
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Área del canvas: imagen de fondo + canvas para dibujo */}
          <div className="w-full flex justify-center bg-black/20 rounded-2xl p-4 border border-dark-glass-border overflow-hidden">
            <div className="relative touch-none">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={image} 
                alt={t('canvas.alt')} 
                className="max-w-full max-h-[60vh] block rounded-lg shadow-2xl"
              />
              
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                onTouchCancel={stopDrawing}
                className="absolute inset-0 w-full h-full cursor-crosshair rounded-lg"
                style={{ touchAction: 'none' }}
              />
            </div>
          </div>

          {/* Botón para continuar al paso 2 (título, descripción, audience) */}
          <div className="flex justify-end mt-4">
            <button 
              onClick={handleSave}
              className="bg-brand-primary hover:bg-brand-primary/90 text-white px-8 py-3 rounded-full font-bold flex items-center gap-2 transition-colors shadow-lg shadow-brand-primary/20"
            >
              <Save className="w-5 h-5" />
              {t('canvas.continue')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, Eraser, Undo, Save, Trash2, Pencil, Circle, Square, Triangle, X, PaintBucket, Droplets } from 'lucide-react';
import { useT } from '@/lib/i18n/context';

interface PareidoliaCanvasProps {
  onSave: (originalDataUrl: string, drawingDataUrl: string) => void;
  initialImage?: string;
}

type Tool = 'brush' | 'circle' | 'rect' | 'triangle' | 'fill';

interface ShapeObject {
  id: string;
  type: 'circle' | 'rect' | 'triangle';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  lineWidth: number;
  fill?: string;
}

const HANDLE_HIT = 10;

export default function PareidoliaCanvas({ onSave, initialImage }: PareidoliaCanvasProps) {
  const t = useT();
  const [image, setImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const brushCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [tool, setTool] = useState<Tool>('brush');
  const [color, setColor] = useState('#6B4EFF');
  const [brushSize, setBrushSize] = useState(5);
  const [fillEnabled, setFillEnabled] = useState(false);

  const PRESET_COLORS = ['#FF0000', '#FF6B00', '#FFD700', '#00FF00', '#00BFFF', '#6B4EFF', '#FF69B4', '#FFFFFF', '#888888', '#000000'];

  const historyRef = useRef<ImageData[]>([]);
  const shapesRef = useRef<ShapeObject[]>([]);
  const selectedIdRef = useRef<string | null>(null);
  const isDrawingRef = useRef(false);
  const isCreatingRef = useRef(false);
  const createStartRef = useRef({ x: 0, y: 0 });
  const isResizingRef = useRef(false);
  const resizeHandleRef = useRef('');
  const resizeOrigRef = useRef<ShapeObject | null>(null);
  const resizeStartRef = useRef({ x: 0, y: 0 });

  // Force re-render for UI
  const [, forceRender] = useState(0);
  const rerender = () => forceRender(n => n + 1);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);

  const nextId = useRef(1);
  const genId = () => `s${nextId.current++}`;

  // --- Coordinate helpers ---
  const getPos = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const pt = 'touches' in e ? e.touches[0] : e;
    return {
      x: (pt.clientX - rect.left) * (canvas.width / rect.width),
      y: (pt.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const hitHandle = (mx: number, my: number, shape: ShapeObject) => {
    const hs = HANDLE_HIT;
    const corners = [
      { id: 'tl', x: shape.x, y: shape.y },
      { id: 'tr', x: shape.x + shape.width, y: shape.y },
      { id: 'bl', x: shape.x, y: shape.y + shape.height },
      { id: 'br', x: shape.x + shape.width, y: shape.y + shape.height },
    ];
    for (const c of corners) {
      if (Math.abs(mx - c.x) < hs && Math.abs(my - c.y) < hs) return c.id;
    }
    return null;
  };

  const hitShape = (mx: number, my: number, shape: ShapeObject) => {
    const { x, y, width: w, height: h } = shape;
    if (shape.type === 'rect') {
      return mx >= Math.min(x, x + w) && mx <= Math.max(x, x + w) &&
             my >= Math.min(y, y + h) && my <= Math.max(y, y + h);
    }
    if (shape.type === 'circle') {
      const cx = x + w / 2, cy = y + h / 2;
      const r = Math.min(Math.abs(w), Math.abs(h)) / 2;
      return (mx - cx) ** 2 + (my - cy) ** 2 <= r * r;
    }
    if (shape.type === 'triangle') {
      const x1 = x + w / 2, y1 = y;
      const x2 = x, y2 = y + h;
      const x3 = x + w, y3 = y + h;
      const d1 = (mx - x2) * (y1 - y2) - (x1 - x2) * (my - y2);
      const d2 = (mx - x3) * (y2 - y3) - (x2 - x3) * (my - y3);
      const d3 = (mx - x1) * (y3 - y1) - (x3 - x1) * (my - y1);
      const neg = (d1 < 0) || (d2 < 0) || (d3 < 0);
      const pos = (d1 > 0) || (d2 > 0) || (d3 > 0);
      return !(neg && pos);
    }
    return false;
  };

  // --- Drawing functions ---
  const paintCanvas = (previewShape?: ShapeObject | null) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background image
    if (bgImageRef.current) {
      ctx.drawImage(bgImageRef.current, 0, 0, canvas.width, canvas.height);
    }

    // Brush layer
    if (brushCanvasRef.current) {
      ctx.drawImage(brushCanvasRef.current, 0, 0);
    }

    // Shapes
    for (const s of shapesRef.current) {
      drawShape(ctx, s);
    }

    // Preview shape (during creation)
    if (previewShape) {
      drawShape(ctx, previewShape);
    }

    // Selection handles
    const selId = selectedIdRef.current;
    if (selId && !previewShape) {
      const shape = shapesRef.current.find(s => s.id === selId);
      if (shape) drawHandles(ctx, shape);
    }
  };

  const drawShape = (ctx: CanvasRenderingContext2D, s: ShapeObject) => {
    ctx.save();
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const { x, y, width: w, height: h } = s;

    const doFill = s.fill && s.fill !== 'transparent';

    const drawPath = () => {
      if (s.type === 'rect') {
        if (doFill) { ctx.fillStyle = s.fill!; ctx.fillRect(x, y, w, h); }
        ctx.strokeRect(x, y, w, h);
      } else if (s.type === 'circle') {
        const cx = x + w / 2, cy = y + h / 2;
        const r = Math.min(Math.abs(w), Math.abs(h)) / 2;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(r, 1), 0, Math.PI * 2);
        if (doFill) { ctx.fillStyle = s.fill!; ctx.fill(); }
        ctx.stroke();
      } else if (s.type === 'triangle') {
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y);
        ctx.lineTo(x, y + h);
        ctx.lineTo(x + w, y + h);
        ctx.closePath();
        if (doFill) { ctx.fillStyle = s.fill!; ctx.fill(); }
        ctx.stroke();
      }
    };
    drawPath();
    ctx.restore();
  };

  const drawHandles = (ctx: CanvasRenderingContext2D, s: ShapeObject) => {
    const corners = [
      { x: s.x, y: s.y },
      { x: s.x + s.width, y: s.y },
      { x: s.x, y: s.y + s.height },
      { x: s.x + s.width, y: s.y + s.height },
    ];
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#6B4EFF';
    ctx.lineWidth = 2;
    for (const c of corners) {
      ctx.fillRect(c.x - 4, c.y - 4, 8, 8);
      ctx.strokeRect(c.x - 4, c.y - 4, 8, 8);
    }
  };

  // --- Brush layer ---
  const initBrushCanvas = (w: number, h: number) => {
    if (!brushCanvasRef.current) {
      brushCanvasRef.current = document.createElement('canvas');
    }
    brushCanvasRef.current.width = w;
    brushCanvasRef.current.height = h;
    historyRef.current = [];
  };

  const saveBrushState = () => {
    if (!brushCanvasRef.current) return;
    const ctx = brushCanvasRef.current.getContext('2d');
    if (!ctx) return;
    historyRef.current = [
      ...historyRef.current,
      ctx.getImageData(0, 0, brushCanvasRef.current.width, brushCanvasRef.current.height),
    ];
  };

  // --- Resize canvas to container ---
  const resizeCanvas = () => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w === 0 || h === 0) return;

    // Check if size actually changed
    if (canvas.width === w && canvas.height === h) return;

    // Save brush contents
    let brushData: ImageData | null = null;
    if (brushCanvasRef.current) {
      const bc = brushCanvasRef.current;
      if (bc.width > 0 && bc.height > 0) {
        const bctx = bc.getContext('2d');
        if (bctx) brushData = bctx.getImageData(0, 0, bc.width, bc.height);
      }
    }

    canvas.width = w;
    canvas.height = h;

    initBrushCanvas(w, h);
    const bctx = brushCanvasRef.current!.getContext('2d');
    if (bctx && brushData) {
      bctx.putImageData(brushData, 0, 0);
    }

    paintCanvas();
  };

  // --- Load image ---
  const loadImage = (src: string) => {
    setImage(src);
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      bgImageRef.current = img;
      // Wait for container to be laid out
      requestAnimationFrame(() => {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        if (!container || !canvas) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (w === 0 || h === 0) {
          // Try again after layout
          setTimeout(() => {
            if (!container || !canvas) return;
            const w2 = container.clientWidth;
            const h2 = container.clientHeight;
            canvas.width = w2;
            canvas.height = h2;
            initBrushCanvas(w2, h2);
            paintCanvas();
          }, 100);
          return;
        }
        canvas.width = w;
        canvas.height = h;
        initBrushCanvas(w, h);
        paintCanvas();
      });
    };
    img.src = src;
  };

  useEffect(() => {
    if (initialImage && !image) loadImage(initialImage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialImage]);

  useEffect(() => {
    const ro = new ResizeObserver(() => resizeCanvas());
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener('resize', resizeCanvas);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', resizeCanvas);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Flood fill ---
  const floodFill = (startX: number, startY: number, fillColor: string) => {
    const brushCanvas = brushCanvasRef.current;
    if (!brushCanvas) return;
    const bctx = brushCanvas.getContext('2d');
    if (!bctx) return;

    const w = brushCanvas.width, h = brushCanvas.height;
    if (w === 0 || h === 0) return;

    // Composite brush + shapes (strokes only) onto offscreen canvas for boundary detection
    const offscreen = document.createElement('canvas');
    offscreen.width = w;
    offscreen.height = h;
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return;
    offCtx.drawImage(brushCanvas, 0, 0);
    for (const s of shapesRef.current) {
      drawShape(offCtx, s);
    }
    const compData = offCtx.getImageData(0, 0, w, h);
    const comp = compData.data;

    // Start pixel color (on the composite = brush + shapes)
    const sx = Math.floor(startX), sy = Math.floor(startY);
    if (sx < 0 || sx >= w || sy < 0 || sy >= h) return;
    const si = sy * w + sx;
    const sr = comp[si * 4], sg = comp[si * 4 + 1], sb = comp[si * 4 + 2], sa = comp[si * 4 + 3];

    // Parse fill color
    const fr = parseInt(fillColor.slice(1, 3), 16);
    const fg = parseInt(fillColor.slice(3, 5), 16);
    const fb = parseInt(fillColor.slice(5, 7), 16);

    const isTransparent = sa === 0;

    const visited = new Uint8Array(w * h);
    const stack: [number, number][] = [[sx, sy]];
    const tol = isTransparent ? 0 : 30;

    const match = (idx: number) => {
      if (isTransparent) {
        return comp[idx + 3] === 0;
      }
      return Math.abs(comp[idx] - sr) <= tol &&
             Math.abs(comp[idx + 1] - sg) <= tol &&
             Math.abs(comp[idx + 2] - sb) <= tol &&
             Math.abs(comp[idx + 3] - sa) <= tol;
    };

    while (stack.length) {
      const [x, y] = stack.pop()!;
      if (x < 0 || x >= w || y < 0 || y >= h) continue;
      const vi = y * w + x;
      if (visited[vi]) continue;
      const di = vi * 4;
      if (!match(di)) continue;
      visited[vi] = 1;
      comp[di] = fr; comp[di + 1] = fg; comp[di + 2] = fb; comp[di + 3] = 255;
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }

    // Write fill result to brush canvas
    const brushData = bctx.getImageData(0, 0, w, h);
    const bd = brushData.data;
    for (let i = 0; i < w * h; i++) {
      if (visited[i]) {
        bd[i * 4] = fr;
        bd[i * 4 + 1] = fg;
        bd[i * 4 + 2] = fb;
        bd[i * 4 + 3] = 255;
      }
    }
    bctx.putImageData(brushData, 0, 0);
    paintCanvas();
  };

  // --- Event handlers ---
  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    const bc = brushCanvasRef.current?.getContext('2d');

    if (tool === 'fill') {
      saveBrushState();
      floodFill(pos.x, pos.y, color);
      return;
    }

    if (tool === 'brush') {
      saveBrushState();
      isDrawingRef.current = true;
      if (bc) {
        bc.beginPath();
        bc.moveTo(pos.x, pos.y);
        bc.strokeStyle = color;
        bc.lineWidth = brushSize;
        bc.lineCap = 'round';
        bc.lineJoin = 'round';
      }
      return;
    }

    // Shape tools — check if clicking on a handle to resize
    if (selectedIdRef.current) {
      const sel = shapesRef.current.find(s => s.id === selectedIdRef.current);
      if (sel) {
        const handle = hitHandle(pos.x, pos.y, sel);
        if (handle) {
          isResizingRef.current = true;
          resizeHandleRef.current = handle;
          resizeOrigRef.current = { ...sel };
          resizeStartRef.current = pos;
          return;
        }
      }
    }

    // Check if clicking on a shape (for selection)
    for (let i = shapesRef.current.length - 1; i >= 0; i--) {
      const s = shapesRef.current[i];
      if (hitShape(pos.x, pos.y, s)) {
        selectedIdRef.current = s.id;
        setSelectedShapeId(s.id);
        paintCanvas();
        return;
      }
    }

    // Deselect
    selectedIdRef.current = null;
    setSelectedShapeId(null);

    // Start creating a new shape
    isCreatingRef.current = true;
    createStartRef.current = pos;
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    const bc = brushCanvasRef.current?.getContext('2d');

    if (tool === 'brush' && isDrawingRef.current && bc) {
      bc.lineTo(pos.x, pos.y);
      bc.stroke();
      // Render brush progress onto main canvas
      paintCanvas();
      return;
    }

    // Resize
    if (isResizingRef.current && resizeOrigRef.current) {
      const orig = resizeOrigRef.current;
      const dx = pos.x - resizeStartRef.current.x;
      const dy = pos.y - resizeStartRef.current.y;
      const h = resizeHandleRef.current;
      let nx = orig.x, ny = orig.y, nw = orig.width, nh = orig.height;

      if (h === 'tl') { nx = orig.x + dx; ny = orig.y + dy; nw = orig.width - dx; nh = orig.height - dy; }
      else if (h === 'tr') { ny = orig.y + dy; nw = orig.width + dx; nh = orig.height - dy; }
      else if (h === 'bl') { nx = orig.x + dx; nw = orig.width - dx; nh = orig.height + dy; }
      else if (h === 'br') { nw = orig.width + dx; nh = orig.height + dy; }

      // Normalize negative dimensions
      if (nw < 0) { nw = -nw; nx -= nw; }
      if (nh < 0) { nh = -nh; ny -= nh; }

      const idx = shapesRef.current.findIndex(s => s.id === orig.id);
      if (idx !== -1) {
        shapesRef.current[idx] = { ...orig, x: nx, y: ny, width: nw, height: nh };
        paintCanvas();
      }
      return;
    }

    // Shape creation preview
    if (isCreatingRef.current) {
      const sx = createStartRef.current.x;
      const sy = createStartRef.current.y;
      let x = Math.min(sx, pos.x);
      let y = Math.min(sy, pos.y);
      let w = Math.abs(pos.x - sx);
      let h = Math.abs(pos.y - sy);

      if (tool === 'circle') {
        const r = Math.max(w, h);
        x = sx - r;
        y = sy - r;
        w = r * 2;
        h = r * 2;
      }

      const preview: ShapeObject = {
        id: '__preview__',
        type: tool as ShapeObject['type'],
        x, y, width: w, height: h,
        color,
        lineWidth: brushSize,
      };
      paintCanvas(preview);
      return;
    }

    // Hover cursor for handles
    if (selectedIdRef.current) {
      const sel = shapesRef.current.find(s => s.id === selectedIdRef.current);
      if (sel && hitHandle(pos.x, pos.y, sel)) {
        canvas.style.cursor = 'pointer';
        return;
      }
      canvas.style.cursor = 'crosshair';
    }
  };

  const handlePointerUp = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      return;
    }

    if (isResizingRef.current) {
      isResizingRef.current = false;
      resizeOrigRef.current = null;
      // Sync state for undo
      rerender();
      return;
    }

    if (isCreatingRef.current) {
      isCreatingRef.current = false;
      const pos = getPos(e);
      const sx = createStartRef.current.x;
      const sy = createStartRef.current.y;
      let x = Math.min(sx, pos.x);
      let y = Math.min(sy, pos.y);
      let w = Math.abs(pos.x - sx);
      let h = Math.abs(pos.y - sy);

      // Minimum size check
      if (w < 5 && h < 5) {
        paintCanvas();
        return;
      }

      if (tool === 'circle') {
        const r = Math.max(w, h);
        x = sx - r;
        y = sy - r;
        w = r * 2;
        h = r * 2;
      }

      const shape: ShapeObject = {
        id: genId(),
        type: tool as ShapeObject['type'],
        x, y, width: w, height: h,
        color,
        lineWidth: brushSize,
        fill: fillEnabled ? color : undefined,
      };

      shapesRef.current = [...shapesRef.current, shape];
      paintCanvas();
      rerender();
    }
  };

  // --- Actions ---
  const undo = () => {
    const h = historyRef.current;
    if (h.length === 0) return;
    const prev = h.pop()!;
    const bc = brushCanvasRef.current?.getContext('2d');
    if (bc && brushCanvasRef.current) {
      bc.putImageData(prev, 0, 0);
    }
    paintCanvas();
    rerender();
  };

  const clearCanvas = () => {
    saveBrushState();
    shapesRef.current = [];
    selectedIdRef.current = null;
    setSelectedShapeId(null);
    const bc = brushCanvasRef.current?.getContext('2d');
    if (bc && brushCanvasRef.current) {
      bc.clearRect(0, 0, brushCanvasRef.current.width, brushCanvasRef.current.height);
    }
    paintCanvas();
    rerender();
  };

  const deleteSelected = () => {
    if (!selectedIdRef.current) return;
    shapesRef.current = shapesRef.current.filter(s => s.id !== selectedIdRef.current);
    selectedIdRef.current = null;
    setSelectedShapeId(null);
    paintCanvas();
    rerender();
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIdRef.current) {
          e.preventDefault();
          deleteSelected();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = () => {
    if (!bgImageRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const offscreen = document.createElement('canvas');
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    const offCtx = offscreen.getContext('2d');
    if (offCtx) {
      offCtx.drawImage(bgImageRef.current, 0, 0, offscreen.width, offscreen.height);
      if (brushCanvasRef.current) {
        offCtx.drawImage(brushCanvasRef.current, 0, 0);
      }
      for (const s of shapesRef.current) {
        drawShape(offCtx, s);
      }
    }
    onSave(image!, offscreen.toDataURL('image/png'));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => loadImage(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  // --- Render ---
  const TOOLS: { id: Tool; icon: React.ReactNode }[] = [
    { id: 'brush', icon: <Pencil className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { id: 'fill', icon: <Droplets className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { id: 'circle', icon: <Circle className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { id: 'rect', icon: <Square className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { id: 'triangle', icon: <Triangle className="w-4 h-4 sm:w-5 sm:h-5" /> },
  ];

  return (
    <div className="w-full flex flex-col items-center gap-6">
      {!image ? (
        <div className="w-full max-w-2xl aspect-video rounded-2xl glass-panel flex flex-col items-center justify-center p-8 border-dashed border-2 border-dark-glass-border hover:border-brand-primary transition-colors">
          <Upload className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">{t('canvas.heading')}</h3>
          <p className="text-gray-400 text-center mb-6">{t('canvas.desc')}</p>
          <label className="bg-brand-primary hover:bg-brand-primary/90 text-white px-6 py-3 rounded-full font-semibold cursor-pointer transition-colors shadow-lg shadow-brand-primary/20">
            {t('canvas.upload')}
            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
          </label>
        </div>
      ) : (
        <div className="w-full max-w-4xl flex flex-col gap-4">
          {/* Toolbar */}
          <div className="glass-panel p-3 sm:p-4 rounded-xl flex flex-wrap items-center justify-between gap-2 sm:gap-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              {/* Tool selector */}
              <div className="flex items-center gap-1 bg-black/30 rounded-xl p-1">
                {TOOLS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTool(t.id)}
                    className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                      tool === t.id ? 'bg-brand-primary text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {t.icon}
                  </button>
                ))}
              </div>

              {(tool === 'circle' || tool === 'rect' || tool === 'triangle') && (
                <button
                  onClick={() => setFillEnabled(!fillEnabled)}
                  className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                    fillEnabled ? 'bg-brand-primary text-white' : 'bg-black/30 text-gray-400 hover:text-white'
                  }`}
                  title={t('canvas.tool.fill')}
                >
                  <PaintBucket className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}

              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-[11px] sm:text-sm text-gray-300 hidden sm:inline">{t('canvas.tool.stroke')}</span>
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-7 h-7 sm:w-8 sm:h-8 rounded cursor-pointer bg-transparent border-0 p-0" />
              </div>

              <div className="w-full sm:w-auto flex flex-wrap justify-center gap-1 sm:gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 transition-all ${
                      color === c ? 'border-white scale-125' : 'border-transparent hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-[11px] sm:text-sm text-gray-300 hidden sm:inline">{t('canvas.tool.size')}</span>
                <input type="range" min="1" max="20" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="w-16 sm:w-24 accent-brand-secondary" />
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              {selectedShapeId && (
                <button onClick={deleteSelected} className="p-1.5 sm:p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors" title="Delete shape">
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
              <button onClick={undo} disabled={historyRef.current.length === 0} className="p-1.5 sm:p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title={t('canvas.undo')}>
                <Undo className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button onClick={clearCanvas} className="p-1.5 sm:p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title={t('canvas.clear')}>
                <Eraser className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button onClick={() => setImage(null)} className="p-1.5 sm:p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors" title={t('canvas.change')}>
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Canvas area */}
          <div className="w-full flex justify-center bg-black/20 rounded-2xl p-4 border border-dark-glass-border overflow-hidden">
            <div ref={containerRef} className="relative touch-none" style={{ maxHeight: '60vh' }}>
              {/* invisible img to maintain aspect ratio and constraints */}
              <img src={image} alt="" className="max-w-full max-h-[60vh] block rounded-lg opacity-0" />
              <canvas
                ref={canvasRef}
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onMouseLeave={handlePointerUp}
                onTouchStart={handlePointerDown}
                onTouchMove={handlePointerMove}
                onTouchEnd={handlePointerUp}
                onTouchCancel={handlePointerUp}
                className="absolute inset-0 w-full h-full cursor-crosshair rounded-lg"
                style={{ touchAction: 'none' }}
              />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button onClick={handleSave} className="bg-brand-primary hover:bg-brand-primary/90 text-white px-8 py-3 rounded-full font-bold flex items-center gap-2 transition-colors shadow-lg shadow-brand-primary/20">
              <Save className="w-5 h-5" />
              {t('canvas.continue')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

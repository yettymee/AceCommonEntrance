import React, { useRef, useState, useEffect } from 'react';
import { PenTool, Eraser, RotateCcw, Trash2, X, Grid, FileText, Minimize2, Maximize2 } from 'lucide-react';

interface ScratchpadProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export const Scratchpad: React.FC<ScratchpadProps> = ({ isOpen, onClose, title = 'Rough Work Scratchpad' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#1e293b');
  const [lineWidth, setLineWidth] = useState(3);
  const [isEraser, setIsEraser] = useState(false);
  const [bgPattern, setBgPattern] = useState<'grid' | 'ruled' | 'blank'>('grid');
  const [isExpanded, setIsExpanded] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);

  // Redraw canvas background pattern and restore drawing
  const setupCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // Set actual canvas resolution for crisp lines on high-dpi displays
    canvas.width = rect.width * dpr;
    canvas.height = (isExpanded ? 600 : 380) * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${isExpanded ? 600 : 380}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Save initial state
    saveState();
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(setupCanvas, 50);
    }
  }, [isOpen, isExpanded]);

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-15), imageData]);
  };

  const undo = () => {
    const canvas = canvasRef.current;
    if (!canvas || history.length <= 1) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newHistory = [...history];
    newHistory.pop(); // Remove current
    const previous = newHistory[newHistory.length - 1];
    if (previous) {
      ctx.putImageData(previous, 0, 0);
      setHistory(newHistory);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveState();
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e && e.touches[0]) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else if ('clientX' in e) {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
    return { x: 0, y: 0 };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.strokeStyle = isEraser ? '#ffffff' : color;
    ctx.lineWidth = isEraser ? lineWidth * 4 : lineWidth;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveState();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div
        className={`bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transition-all duration-200 ${
          isExpanded ? 'w-full max-w-4xl h-[85vh]' : 'w-full max-w-2xl h-[520px]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-100 border-b border-slate-200 select-none">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">{title}</h3>
              <p className="text-xs text-slate-500">Calculate math steps, rough notes & diagrams</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200"
              title={isExpanded ? 'Restore size' : 'Expand size'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200"
              title="Close scratchpad"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs">
          {/* Tool mode */}
          <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-lg">
            <button
              onClick={() => setIsEraser(false)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors ${
                !isEraser ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              Pen
            </button>
            <button
              onClick={() => setIsEraser(true)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors ${
                isEraser ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eraser className="w-3.5 h-3.5" />
              Eraser
            </button>
          </div>

          {/* Color palette */}
          {!isEraser && (
            <div className="flex items-center gap-1.5">
              {[
                { hex: '#1e293b', label: 'Dark' },
                { hex: '#2563eb', label: 'Blue' },
                { hex: '#dc2626', label: 'Red' },
                { hex: '#059669', label: 'Green' },
              ].map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setColor(c.hex)}
                  className={`w-5 h-5 rounded-full border-2 transition-transform ${
                    color === c.hex ? 'scale-125 border-slate-900 shadow-xs' : 'border-white hover:scale-110'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                />
              ))}
            </div>
          )}

          {/* Stroke thickness */}
          <div className="flex items-center gap-1 text-slate-500">
            <span className="text-[11px] font-medium">Size:</span>
            {[2, 4, 7].map((size) => (
              <button
                key={size}
                onClick={() => setLineWidth(size)}
                className={`w-6 h-6 flex items-center justify-center rounded-md border text-[11px] font-mono ${
                  lineWidth === size ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold' : 'border-slate-200 bg-white'
                }`}
              >
                {size}
              </button>
            ))}
          </div>

          {/* Paper Style */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setBgPattern('grid')}
              className={`p-1.5 rounded-md border ${
                bgPattern === 'grid' ? 'bg-indigo-50 border-indigo-400 text-indigo-700' : 'bg-white border-slate-200 text-slate-500'
              }`}
              title="Grid Math Paper"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setBgPattern('ruled')}
              className={`p-1.5 rounded-md border ${
                bgPattern === 'ruled' ? 'bg-indigo-50 border-indigo-400 text-indigo-700' : 'bg-white border-slate-200 text-slate-500'
              }`}
              title="Lined Ruled Paper"
            >
              <FileText className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={undo}
              disabled={history.length <= 1}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              title="Undo last stroke"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Undo
            </button>
            <button
              onClick={clearCanvas}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100"
              title="Clear all drawings"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          </div>
        </div>

        {/* Canvas Area with Paper Background */}
        <div
          className={`relative flex-1 w-full overflow-hidden select-none scratchpad-canvas ${
            bgPattern === 'grid'
              ? 'bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:24px_24px] bg-white'
              : bgPattern === 'ruled'
              ? 'bg-[linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:100%_28px] bg-white'
              : 'bg-white'
          }`}
        >
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
          />
        </div>

        {/* Footer tip */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Tip: Work out long divisions, fraction additions, and quantitative logic here!</span>
          <button
            onClick={onClose}
            className="font-medium text-indigo-600 hover:text-indigo-800"
          >
            Done Working
          </button>
        </div>
      </div>
    </div>
  );
};

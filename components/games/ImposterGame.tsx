'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { generateQRMatrix } from '@/lib/qrMatrix';

interface ImposterGameProps {
  onWin: () => void;
  qrUrl: string;
}

interface Imposter {
  emoji: string;
  row: number;
  col: number;
  found: boolean;
}

const IMPOSTER_EMOJIS = ['👽', '🤡', '👻'];

export default function ImposterGame({ onWin, qrUrl }: ImposterGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [matrix, setMatrix] = useState<boolean[][] | null>(null);
  const [imposters, setImposters] = useState<Imposter[]>([]);
  const [cellSize, setCellSize] = useState(12);

  // Generate QR Maze on mount
  useEffect(() => {
    const m = generateQRMatrix(qrUrl);
    setMatrix(m);
    
    // Spawn 3 imposters randomly on black modules
    const size = m.length;
    const candidates: {r: number, c: number}[] = [];
    
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const isFinder = (r < 8 && c < 8) || (r < 8 && c > size - 9) || (r > size - 9 && c < 8);
        if (m[r][c] && !isFinder) {
          candidates.push({ r, c });
        }
      }
    }
    
    // Shuffle and pick 3
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    
    const picked = candidates.slice(0, 3).map((coord, i) => ({
      row: coord.r,
      col: coord.c,
      emoji: IMPOSTER_EMOJIS[i],
      found: false
    }));
    
    setImposters(picked);
  }, [qrUrl]);

  // Responsive cell size (Scale it up a bit more for this game to make it playable)
  useEffect(() => {
    if (!matrix) return;
    const updateSize = () => {
      const size = matrix.length;
      const maxW = Math.min(window.innerWidth - 20, 400);
      const maxH = Math.min(window.innerHeight - 200, 400);
      const s = Math.floor(Math.min(maxW / size, maxH / size));
      setCellSize(Math.max(s, 12));
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [matrix]);

  // Handle tap / click
  const handleInteraction = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !matrix) return;
    
    if (e.type === 'touchstart' && e.cancelable) {
      e.preventDefault();
    }
    
    const rect = canvasRef.current.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const c = Math.floor(x / cellSize);
    const r = Math.floor(y / cellSize);

    setImposters(prev => {
      let changed = false;
      const next = prev.map(imp => {
        if (!imp.found && Math.abs(imp.row - r) <= 1 && Math.abs(imp.col - c) <= 1) {
          changed = true;
          return { ...imp, found: true };
        }
        return imp;
      });
      
      if (changed) {
        if (next.every(imp => imp.found)) {
          setTimeout(onWin, 500);
        }
        return next;
      }
      
      return prev;
    });
  }, [cellSize, matrix, onWin]);

  // Draw
  useEffect(() => {
    if (!matrix || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = matrix.length;
    const w = size * cellSize;
    const h = size * cellSize;
    canvas.width = w;
    canvas.height = h;

    // Background (White modules)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, w - 2, h - 2);

    // Draw walls (Black modules)
    ctx.fillStyle = '#000000';
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (matrix[r][c]) {
          ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
        }
      }
    }

    // Draw finder patterns
    const drawFinder = (rowOffset: number, colOffset: number) => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(colOffset * cellSize, rowOffset * cellSize, 7 * cellSize, 7 * cellSize);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect((colOffset + 1) * cellSize, (rowOffset + 1) * cellSize, 5 * cellSize, 5 * cellSize);
      ctx.fillStyle = '#000000';
      ctx.fillRect((colOffset + 2) * cellSize, (rowOffset + 2) * cellSize, 3 * cellSize, 3 * cellSize);
    };
    
    drawFinder(2, 2);
    drawFinder(2, size - 9);
    drawFinder(size - 9, 2);
    
    // Draw imposters
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    imposters.forEach(imp => {
      const bx = imp.col * cellSize + cellSize / 2;
      const by = imp.row * cellSize + cellSize / 2;
      
      if (imp.found) {
        // Draw green circle around found imposters
        ctx.fillStyle = '#27ae60';
        ctx.beginPath();
        ctx.arc(bx, by, cellSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = `${cellSize * 1.5}px sans-serif`;
      } else {
        // Unfound imposter - make it tiny to hide!
        ctx.font = `${cellSize * 1.1}px sans-serif`;
      }
      
      ctx.fillText(imp.emoji, bx, by);
    });

  }, [matrix, imposters, cellSize]);

  const foundCount = imposters.filter(i => i.found).length;

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <h2 className="font-[family-name:var(--font-rubik)] text-xl text-[#0e0e0d] text-center lowercase">🕵️‍♂️ find the imposters!</h2>
      <p className="font-bold text-sm text-[#242525]">
        Find 3 emojis hiding in the pixels: <strong className="text-[#ea34df]">{foundCount}/3</strong>
      </p>
      
      <div 
        className="p-2 bg-white rounded-md border-2 border-[#0e0e0d] shadow-[4px_4px_0px_#0e0e0d] cursor-crosshair touch-none" 
      >
        <canvas 
          ref={canvasRef} 
          onClick={handleInteraction}
          onTouchStart={handleInteraction}
        />
      </div>
      
      <div className="flex gap-4 mt-2">
        {imposters.map((imp, idx) => (
          <div 
            key={idx}
            className={`w-12 h-12 rounded-md border-2 border-[#0e0e0d] flex items-center justify-center text-2xl transition-all ${
              imp.found 
                ? 'bg-[#ea34df] shadow-[2px_2px_0px_#0e0e0d]' 
                : 'bg-white shadow-[2px_2px_0px_#0e0e0d] opacity-50 grayscale'
            }`}
          >
            {imp.emoji}
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { generateQRMatrix } from '@/lib/qrMatrix';

interface MazeGameProps {
  onWin: () => void;
  qrUrl: string;
}

export default function MazeGame({ onWin, qrUrl }: MazeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [matrix, setMatrix] = useState<boolean[][] | null>(null);
  const [playerPos, setPlayerPos] = useState({ row: 4, col: 4 });
  const [cellSize, setCellSize] = useState(12);

  // Generate QR Maze on mount
  useEffect(() => {
    const m = generateQRMatrix(qrUrl);
    setMatrix(m);
    setPlayerPos({ row: 4, col: 4 });
  }, [qrUrl]);

  // Responsive cell size
  useEffect(() => {
    if (!matrix) return;
    const updateSize = () => {
      const size = matrix.length;
      const maxW = Math.min(window.innerWidth - 40, 400);
      const maxH = Math.min(window.innerHeight - 200, 400);
      const s = Math.floor(Math.min(maxW / size, maxH / size));
      setCellSize(Math.max(s, 8));
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [matrix]);

  // Draw maze
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
    
    // Add quiet zone border
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
    
    // Draw Finder Patterns (Corners)
    const drawFinder = (rowOffset: number, colOffset: number) => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(colOffset * cellSize, rowOffset * cellSize, 7 * cellSize, 7 * cellSize);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect((colOffset + 1) * cellSize, (rowOffset + 1) * cellSize, 5 * cellSize, 5 * cellSize);
      ctx.fillStyle = '#000000';
      ctx.fillRect((colOffset + 2) * cellSize, (rowOffset + 2) * cellSize, 3 * cellSize, 3 * cellSize);
    };
    
    // Top-Right finder pattern (The other two are hollowed out for Start/Exit)
    drawFinder(2, size - 9);

    // End marker (Bottom-Right finder area)
    const ex = (size - 4.5) * cellSize;
    const ey = (size - 4.5) * cellSize;
    ctx.fillStyle = '#27ae60';
    ctx.font = `${cellSize * 3}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⭐', ex, ey);

    // Draw player (Top-Left finder area)
    const px = playerPos.col * cellSize + cellSize / 2;
    const py = playerPos.row * cellSize + cellSize / 2;
    const radius = cellSize * 0.8;

    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 2;
    ctx.stroke();

  }, [matrix, playerPos, cellSize]);

  // Move logic
  const move = useCallback(
    (dir: 'up' | 'down' | 'left' | 'right') => {
      if (!matrix) return;
      const size = matrix.length;
      const { row, col } = playerPos;
      
      let newRow = row;
      let newCol = col;

      if (dir === 'up' && row > 0) newRow--;
      else if (dir === 'down' && row < size - 1) newRow++;
      else if (dir === 'left' && col > 0) newCol--;
      else if (dir === 'right' && col < size - 1) newCol++;

      // Check collision with walls (black modules)
      if (!matrix[newRow][newCol]) {
        if (newRow !== row || newCol !== col) {
          setPlayerPos({ row: newRow, col: newCol });

          // Check win condition (reached bottom-right area)
          if (newRow >= size - 6 && newCol >= size - 6) {
            setTimeout(onWin, 200);
          }
        }
      }
    },
    [matrix, playerPos, onWin]
  );

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':    e.preventDefault(); move('up'); break;
        case 'ArrowDown':  e.preventDefault(); move('down'); break;
        case 'ArrowLeft':  e.preventDefault(); move('left'); break;
        case 'ArrowRight': e.preventDefault(); move('right'); break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [move]);

  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-xl font-bold text-[#5c4a3a]">🏰 Escape the QR Maze!</h2>
      <p className="text-sm text-[#8b7d6b]">Navigate the code to reach the ⭐</p>
      <div className="p-2 bg-white rounded-2xl" style={{ boxShadow: '4px 4px 12px rgba(163,177,198,0.6), -4px -4px 12px rgba(255,255,255,0.8)' }}>
        <canvas ref={canvasRef} />
      </div>
      {/* D-Pad for mobile */}
      <div className="grid grid-cols-3 gap-2 w-[180px] mt-2">
        <div />
        <button
          onClick={() => move('up')}
          className="clay-btn h-14 rounded-2xl text-2xl active:scale-95 transition-transform"
          aria-label="Move up"
        >
          ▲
        </button>
        <div />
        <button
          onClick={() => move('left')}
          className="clay-btn h-14 rounded-2xl text-2xl active:scale-95 transition-transform"
          aria-label="Move left"
        >
          ◀
        </button>
        <div className="h-14" />
        <button
          onClick={() => move('right')}
          className="clay-btn h-14 rounded-2xl text-2xl active:scale-95 transition-transform"
          aria-label="Move right"
        >
          ▶
        </button>
        <div />
        <button
          onClick={() => move('down')}
          className="clay-btn h-14 rounded-2xl text-2xl active:scale-95 transition-transform"
          aria-label="Move down"
        >
          ▼
        </button>
        <div />
      </div>
    </div>
  );
}

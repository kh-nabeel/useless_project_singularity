'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { generateQRMatrix } from '@/lib/qrMatrix';
import { BrutalistButton } from '@/components/ui/BrutalistButton';

interface MazeGameProps {
  onWin: () => void;
  qrUrl: string;
}

export default function MazeGame({ onWin, qrUrl }: MazeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [matrix, setMatrix] = useState<boolean[][] | null>(null);
  const [playerPos, setPlayerPos] = useState({ row: 5, col: 5 });
  const [cellSize, setCellSize] = useState(12);

  // Generate QR Maze on mount
  useEffect(() => {
    const m = generateQRMatrix(qrUrl);
    setMatrix(m);
    setPlayerPos({ row: 5, col: 5 });
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
    
    // We no longer draw the custom finder patterns to hollow them out.
    // The original QR code's finder patterns remain intact.

    // End marker
    const ex = (size - 6) * cellSize + cellSize / 2;
    const ey = (size - 6) * cellSize + cellSize / 2;
    ctx.fillStyle = '#27ae60';
    ctx.font = `${cellSize * 1.5}px sans-serif`;
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

      // Check collision with walls (black modules) and prevent walking on the quiet zone margin
      const margin = 2;
      if (!matrix[newRow][newCol] && newRow >= margin && newRow < size - margin && newCol >= margin && newCol < size - margin) {
        if (newRow !== row || newCol !== col) {
          setPlayerPos({ row: newRow, col: newCol });

          // Check win condition
          if (newRow === size - 6 && newCol === size - 6) {
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
    <div className="flex flex-col items-center gap-4 w-full">
      <h2 className="font-[family-name:var(--font-rubik)] text-xl text-[#0e0e0d] text-center lowercase">🏰 escape the qr maze!</h2>
      <p className="font-bold text-sm text-[#242525]">Navigate the code to reach the ⭐</p>
      <div className="p-2 bg-white rounded-md border-2 border-[#0e0e0d] shadow-[4px_4px_0px_#0e0e0d]">
        <canvas ref={canvasRef} />
      </div>
      {/* D-Pad for mobile */}
      <div className="grid grid-cols-3 gap-2 w-[180px] mt-4">
        <div />
        <BrutalistButton
          onClick={() => move('up')}
          className="h-14 px-0 py-0 text-2xl"
          aria-label="Move up"
        >
          ▲
        </BrutalistButton>
        <div />
        <BrutalistButton
          onClick={() => move('left')}
          className="h-14 px-0 py-0 text-2xl"
          aria-label="Move left"
        >
          ◀
        </BrutalistButton>
        <div className="h-14" />
        <BrutalistButton
          onClick={() => move('right')}
          className="h-14 px-0 py-0 text-2xl"
          aria-label="Move right"
        >
          ▶
        </BrutalistButton>
        <div />
        <BrutalistButton
          onClick={() => move('down')}
          className="h-14 px-0 py-0 text-2xl"
          aria-label="Move down"
        >
          ▼
        </BrutalistButton>
        <div />
      </div>
    </div>
  );
}

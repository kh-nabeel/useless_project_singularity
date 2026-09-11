'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { generateQRMatrix } from '@/lib/qrMatrix';

interface ChaseGameProps {
  onWin: () => void;
  qrUrl: string;
}

interface Pos {
  row: number;
  col: number;
}

export default function ChaseGame({ onWin, qrUrl }: ChaseGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [matrix, setMatrix] = useState<boolean[][] | null>(null);
  const [player, setPlayer] = useState<Pos>({ row: 4, col: 4 });
  const [ghost, setGhost] = useState<Pos>({ row: 10, col: 10 });
  const [dots, setDots] = useState<boolean[][]>([]);
  const [dotsLeft, setDotsLeft] = useState(0);
  const [cellSize, setCellSize] = useState(12);

  const ghostRef = useRef(ghost);
  const playerRef = useRef(player);

  useEffect(() => { ghostRef.current = ghost; }, [ghost]);
  useEffect(() => { playerRef.current = player; }, [player]);

  // Generate QR Maze on mount
  useEffect(() => {
    const m = generateQRMatrix(qrUrl);
    setMatrix(m);
    setPlayer({ row: 4, col: 4 });
    const size = m.length;
    
    // Ghost starts in the bottom right corner (the hollowed out area)
    setGhost({ row: size - 5, col: size - 5 });
    
    // Initialize dots on all white cells
    let dotCount = 0;
    const initialDots: boolean[][] = [];
    for (let r = 0; r < size; r++) {
      const rowDots: boolean[] = [];
      for (let c = 0; c < size; c++) {
        // Dot on false (white) modules, except player start and ghost start
        const isWhite = !m[r][c];
        const isStart = (r >= 2 && r <= 6 && c >= 2 && c <= 6);
        const isGhost = (r >= size - 7 && r <= size - 3 && c >= size - 7 && c <= size - 3);
        
        // Let's only place dots in corridors, not in the big spawn/exit boxes
        const hasDot = isWhite && !isStart && !isGhost;
        rowDots.push(hasDot);
        if (hasDot) dotCount++;
      }
      initialDots.push(rowDots);
    }
    setDots(initialDots);
    setDotsLeft(dotCount);
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
    ctx.fillStyle = '#1a1a2e'; // Dark cyber theme
    ctx.fillRect(0, 0, w, h);
    
    // Draw walls (Black modules)
    ctx.fillStyle = '#0f3460';
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (matrix[r][c]) {
          ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
        }
      }
    }
    
    // Draw dots
    ctx.fillStyle = '#e94560';
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (dots[r] && dots[r][c]) {
          ctx.beginPath();
          ctx.arc(c * cellSize + cellSize / 2, r * cellSize + cellSize / 2, cellSize * 0.25, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Draw ghost
    const gx = ghost.col * cellSize + cellSize / 2;
    const gy = ghost.row * cellSize + cellSize / 2;
    ctx.fillStyle = '#e74c3c';
    ctx.font = `${cellSize * 1.5}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👾', gx, gy);

    // Draw player
    const px = player.col * cellSize + cellSize / 2;
    const py = player.row * cellSize + cellSize / 2;
    ctx.fillStyle = '#4ecdc4';
    ctx.beginPath();
    ctx.arc(px, py, cellSize * 0.4, 0, Math.PI * 2);
    ctx.fill();

  }, [matrix, player, ghost, dots, cellSize]);

  // Move player
  const movePlayer = useCallback(
    (dir: 'up' | 'down' | 'left' | 'right') => {
      if (!matrix) return;
      const size = matrix.length;
      
      setPlayer((prev) => {
        let { row, col } = prev;
        
        let nr = row;
        let nc = col;
        
        if (dir === 'up' && row > 0) nr--;
        else if (dir === 'down' && row < size - 1) nr++;
        else if (dir === 'left' && col > 0) nc--;
        else if (dir === 'right' && col < size - 1) nc++;

        if (!matrix[nr][nc]) {
          row = nr;
          col = nc;
        }

        // Eat dot
        if (dots[row] && dots[row][col]) {
          const newDots = dots.map((r) => [...r]);
          newDots[row][col] = false;
          setDots(newDots);
          const remaining = dotsLeft - 1;
          setDotsLeft(remaining);
          if (remaining <= 0) {
            setTimeout(onWin, 200);
          }
        }

        return { row, col };
      });
    },
    [matrix, dots, dotsLeft, onWin]
  );

  // Ghost AI
  useEffect(() => {
    if (!matrix) return;
    const size = matrix.length;
    
    const interval = setInterval(() => {
      setGhost((prev) => {
        const p = playerRef.current;
        // 60% chase, 40% random
        const chase = Math.random() < 0.6;
        const directions: Pos[] = [];

        const tryAdd = (r: number, c: number) => {
          if (r >= 0 && r < size && c >= 0 && c < size && !matrix[r][c]) {
            directions.push({ row: r, col: c });
          }
        };

        tryAdd(prev.row - 1, prev.col);
        tryAdd(prev.row + 1, prev.col);
        tryAdd(prev.row, prev.col - 1);
        tryAdd(prev.row, prev.col + 1);

        if (directions.length === 0) return prev;

        if (chase) {
          // Sort by distance to player
          directions.sort(
            (a, b) =>
              Math.abs(a.row - p.row) +
              Math.abs(a.col - p.col) -
              (Math.abs(b.row - p.row) + Math.abs(b.col - p.col))
          );
          return directions[0];
        }

        return directions[Math.floor(Math.random() * directions.length)];
      });

      // Check collision
      setTimeout(() => {
        const g = ghostRef.current;
        const p = playerRef.current;
        if (Math.abs(g.row - p.row) <= 1 && Math.abs(g.col - p.col) <= 1) {
           // To be forgiving, only kill if they are exactly on same tile
           if (g.row === p.row && g.col === p.col) {
              setPlayer({ row: 4, col: 4 });
           }
        }
      }, 50);
    }, 400);

    return () => clearInterval(interval);
  }, [matrix]);

  // Keyboard
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':    e.preventDefault(); movePlayer('up'); break;
        case 'ArrowDown':  e.preventDefault(); movePlayer('down'); break;
        case 'ArrowLeft':  e.preventDefault(); movePlayer('left'); break;
        case 'ArrowRight': e.preventDefault(); movePlayer('right'); break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [movePlayer]);

  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-xl font-bold text-[#5c4a3a]">👾 Eat the Data Packets!</h2>
      <p className="text-sm text-[#8b7d6b]">
        Avoid the glitch bug! {dotsLeft} packets left
      </p>
      <div className="p-2 bg-[#1a1a2e] rounded-2xl" style={{ boxShadow: '4px 4px 12px rgba(163,177,198,0.6), -4px -4px 12px rgba(255,255,255,0.8)' }}>
        <canvas ref={canvasRef} />
      </div>
      {/* D-Pad */}
      <div className="grid grid-cols-3 gap-2 w-[180px] mt-2">
        <div />
        <button onClick={() => movePlayer('up')} className="clay-btn h-14 rounded-2xl text-2xl active:scale-95 transition-transform" aria-label="Move up">▲</button>
        <div />
        <button onClick={() => movePlayer('left')} className="clay-btn h-14 rounded-2xl text-2xl active:scale-95 transition-transform" aria-label="Move left">◀</button>
        <div className="h-14" />
        <button onClick={() => movePlayer('right')} className="clay-btn h-14 rounded-2xl text-2xl active:scale-95 transition-transform" aria-label="Move right">▶</button>
        <div />
        <button onClick={() => movePlayer('down')} className="clay-btn h-14 rounded-2xl text-2xl active:scale-95 transition-transform" aria-label="Move down">▼</button>
        <div />
      </div>
    </div>
  );
}

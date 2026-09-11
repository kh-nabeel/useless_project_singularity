'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { generateQRMatrix } from '@/lib/qrMatrix';
import { BrutalistButton } from '@/components/ui/BrutalistButton';

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
  const [player, setPlayer] = useState<Pos>({ row: 5, col: 5 });
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
    setPlayer({ row: 5, col: 5 });
    const size = m.length;
    
    // Ghost starts near the bottom right corner
    setGhost({ row: size - 6, col: size - 6 });
    
    // Flood fill to find all accessible white cells from player start (5,5)
    const accessible = Array.from({ length: size }, () => Array(size).fill(false));
    const q: {r: number, c: number}[] = [{ r: 5, c: 5 }];
    accessible[5][5] = true;
    
    while (q.length > 0) {
      const curr = q.shift()!;
      const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (const [dr, dc] of dirs) {
        const nr = curr.r + dr;
        const nc = curr.c + dc;
        const margin = 2;
        if (nr >= margin && nr < size - margin && nc >= margin && nc < size - margin && !m[nr][nc] && !accessible[nr][nc]) {
          accessible[nr][nc] = true;
          q.push({ r: nr, c: nc });
        }
      }
    }

    // Gather all valid candidates for dots, excluding margins
    const candidates: {r: number, c: number}[] = [];
    const margin = 2;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const isStart = (r >= 2 && r <= 6 && c >= 2 && c <= 6);
        const isGhost = (r >= size - 7 && r <= size - 3 && c >= size - 7 && c <= size - 3);
        const isMargin = (r < margin || r >= size - margin || c < margin || c >= size - margin);
        
        if (accessible[r][c] && !isStart && !isGhost && !isMargin) {
          candidates.push({ r, c });
        }
      }
    }

    // Pick 5 dots with relatively less distance (clustered)
    const selected: {r: number, c: number}[] = [];
    const targetDots = Math.min(5, candidates.length);
    
    if (candidates.length > 0) {
      // Pick the first one randomly
      const firstIdx = Math.floor(Math.random() * candidates.length);
      selected.push(candidates[firstIdx]);
      candidates.splice(firstIdx, 1);
      
      while (selected.length < targetDots && candidates.length > 0) {
        const center = selected[0];
        // Find candidates within a small distance to cluster them
        const nearby = candidates.filter(c => Math.abs(c.r - center.r) + Math.abs(c.c - center.c) <= 12);
        
        if (nearby.length > 0) {
          const idx = Math.floor(Math.random() * nearby.length);
          const chosen = nearby[idx];
          selected.push(chosen);
          const cIdx = candidates.findIndex(c => c.r === chosen.r && c.c === chosen.c);
          candidates.splice(cIdx, 1);
        } else {
          // Fallback if no nearby candidates are left
          const idx = Math.floor(Math.random() * candidates.length);
          selected.push(candidates[idx]);
          candidates.splice(idx, 1);
        }
      }
    }

    const initialDots: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
    for (const s of selected) {
      initialDots[s.r][s.c] = true;
    }

    setDots(initialDots);
    setDotsLeft(selected.length);
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

        const margin = 2;
        if (!matrix[nr][nc] && nr >= margin && nr < size - margin && nc >= margin && nc < size - margin) {
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
          const margin = 2;
          if (r >= margin && r < size - margin && c >= margin && c < size - margin && !matrix[r][c]) {
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
              setPlayer({ row: 5, col: 5 });
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
    <div className="flex flex-col items-center gap-4 w-full">
      <h2 className="font-[family-name:var(--font-rubik)] text-xl text-[#0e0e0d] text-center lowercase">👾 eat the data packets!</h2>
      <p className="font-bold text-sm text-[#242525]">
        Avoid the glitch bug! {dotsLeft} packets left
      </p>
      <div className="p-2 bg-[#1a1a2e] rounded-md border-2 border-[#0e0e0d] shadow-[4px_4px_0px_#0e0e0d]">
        <canvas ref={canvasRef} />
      </div>
      {/* D-Pad */}
      <div className="grid grid-cols-3 gap-2 w-[180px] mt-4">
        <div />
        <BrutalistButton onClick={() => movePlayer('up')} className="h-14 px-0 py-0 text-2xl" aria-label="Move up">▲</BrutalistButton>
        <div />
        <BrutalistButton onClick={() => movePlayer('left')} className="h-14 px-0 py-0 text-2xl" aria-label="Move left">◀</BrutalistButton>
        <div className="h-14" />
        <BrutalistButton onClick={() => movePlayer('right')} className="h-14 px-0 py-0 text-2xl" aria-label="Move right">▶</BrutalistButton>
        <div />
        <BrutalistButton onClick={() => movePlayer('down')} className="h-14 px-0 py-0 text-2xl" aria-label="Move down">▼</BrutalistButton>
        <div />
      </div>
    </div>
  );
}

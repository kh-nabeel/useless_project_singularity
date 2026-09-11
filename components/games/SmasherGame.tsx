'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { generateQRMatrix } from '@/lib/qrMatrix';

interface SmasherGameProps {
  onWin: () => void;
  qrUrl: string;
}

interface Bug {
  id: number;
  row: number;
  col: number;
  createdAt: number;
}

export default function SmasherGame({ onWin, qrUrl }: SmasherGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [matrix, setMatrix] = useState<boolean[][] | null>(null);
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [score, setScore] = useState(0);
  const [cellSize, setCellSize] = useState(12);
  const TARGET_SCORE = 15;

  const bugsRef = useRef(bugs);
  const scoreRef = useRef(score);

  useEffect(() => { bugsRef.current = bugs; }, [bugs]);
  useEffect(() => { scoreRef.current = score; }, [score]);

  // Generate QR Maze on mount
  useEffect(() => {
    const m = generateQRMatrix(qrUrl);
    setMatrix(m);
  }, [qrUrl]);

  // Responsive cell size
  useEffect(() => {
    if (!matrix) return;
    const updateSize = () => {
      const size = matrix.length;
      const maxW = Math.min(window.innerWidth - 40, 400);
      const maxH = Math.min(window.innerHeight - 200, 400);
      const s = Math.floor(Math.min(maxW / size, maxH / size));
      setCellSize(Math.max(s, 10));
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [matrix]);

  // Bug Spawner
  useEffect(() => {
    if (!matrix) return;
    const size = matrix.length;
    
    // Find all black modules where bugs can spawn
    const wallCoords: {r: number, c: number}[] = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        // Exclude the finder patterns from bug spawns
        const isFinder = (r < 8 && c < 8) || (r < 8 && c > size - 9) || (r > size - 9 && c < 8);
        if (matrix[r][c] && !isFinder) {
          wallCoords.push({ r, c });
        }
      }
    }

    const interval = setInterval(() => {
      if (scoreRef.current >= TARGET_SCORE) return;
      
      setBugs((prev) => {
        // Remove expired bugs (older than 1.5s)
        const now = Date.now();
        const activeBugs = prev.filter(b => now - b.createdAt < 1500);
        
        // Spawn 1-2 new bugs if we have fewer than 4 on screen
        if (activeBugs.length < 4) {
          const spawnCount = Math.floor(Math.random() * 2) + 1;
          for (let i = 0; i < spawnCount; i++) {
            const coord = wallCoords[Math.floor(Math.random() * wallCoords.length)];
            // Ensure no duplicate bug at same spot
            if (!activeBugs.some(b => b.row === coord.r && b.col === coord.c)) {
              activeBugs.push({
                id: Math.random(),
                row: coord.r,
                col: coord.c,
                createdAt: now
              });
            }
          }
        }
        return activeBugs;
      });
    }, 600);

    return () => clearInterval(interval);
  }, [matrix]);

  // Handle tap / click
  const handleInteraction = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !matrix) return;
    
    // Prevent default touch behavior to avoid scrolling while tapping
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

    // Check if we hit a bug
    setBugs(prev => {
      const hitIndex = prev.findIndex(b => Math.abs(b.row - r) <= 1 && Math.abs(b.col - c) <= 1);
      if (hitIndex !== -1) {
        const newScore = score + 1;
        setScore(newScore);
        
        if (newScore >= TARGET_SCORE) {
          setTimeout(onWin, 300);
        }
        
        const nextBugs = [...prev];
        nextBugs.splice(hitIndex, 1);
        return nextBugs;
      }
      return prev;
    });
  }, [cellSize, matrix, score, onWin]);

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
    
    // Draw bugs (slightly larger than cell so they pop out)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${cellSize * 1.8}px sans-serif`;
    
    bugs.forEach(bug => {
      const bx = bug.col * cellSize + cellSize / 2;
      const by = bug.row * cellSize + cellSize / 2;
      ctx.fillText('👾', bx, by);
    });

  }, [matrix, bugs, cellSize]);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <h2 className="font-[family-name:var(--font-rubik)] text-xl text-[#0e0e0d] text-center lowercase">🔨 glitch smasher!</h2>
      <p className="font-bold text-sm text-[#242525]">
        Smash {TARGET_SCORE} bugs to repair the code: <strong className="text-[#ea34df]">{score}/{TARGET_SCORE}</strong>
      </p>
      
      {/* Progress bar */}
      <div className="w-full h-4 bg-white rounded-md border-2 border-[#0e0e0d] shadow-[4px_4px_0px_#0e0e0d] overflow-hidden mb-2">
        <div 
          className="h-full bg-[#ea34df] transition-all duration-300 border-r-2 border-[#0e0e0d]"
          style={{ width: `${(score / TARGET_SCORE) * 100}%` }}
        />
      </div>

      <div 
        className="p-2 bg-white rounded-md border-2 border-[#0e0e0d] shadow-[4px_4px_0px_#0e0e0d] cursor-pointer touch-none" 
      >
        <canvas 
          ref={canvasRef} 
          onClick={handleInteraction}
          onTouchStart={handleInteraction}
        />
      </div>
      
      <p className="font-[family-name:var(--font-nanum)] text-xl text-[#0e0e0d] mt-2">Tap quickly before they disappear!</p>
    </div>
  );
}

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface ChaseGameProps {
  onWin: () => void;
}

const GRID = 10;
const CELL = 36;

interface Pos {
  row: number;
  col: number;
}

// Generate a simple open grid with scattered walls
function generateLevel(): { walls: boolean[][]; dots: boolean[][] } {
  const walls: boolean[][] = [];
  const dots: boolean[][] = [];

  for (let r = 0; r < GRID; r++) {
    walls.push([]);
    dots.push([]);
    for (let c = 0; c < GRID; c++) {
      // Border walls + scattered interior walls (~15%)
      const isBorder = r === 0 || r === GRID - 1 || c === 0 || c === GRID - 1;
      const isWall = isBorder
        ? false
        : Math.random() < 0.15 && !(r <= 1 && c <= 1) && !(r >= GRID - 2 && c >= GRID - 2);
      walls[r].push(isWall);
      dots[r].push(!isWall); // dots on all non-wall cells
    }
  }

  // Clear player start and ghost start
  dots[0][0] = false;
  dots[GRID - 1][GRID - 1] = false;

  return { walls, dots };
}

export default function ChaseGame({ onWin }: ChaseGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [level] = useState(() => generateLevel());
  const [player, setPlayer] = useState<Pos>({ row: 0, col: 0 });
  const [ghost, setGhost] = useState<Pos>({ row: GRID - 1, col: GRID - 1 });
  const [dots, setDots] = useState<boolean[][]>(level.dots.map((r) => [...r]));
  const [dotsLeft, setDotsLeft] = useState(() =>
    level.dots.flat().filter(Boolean).length
  );
  const ghostRef = useRef(ghost);
  const playerRef = useRef(player);

  useEffect(() => {
    ghostRef.current = ghost;
  }, [ghost]);
  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = GRID * CELL;
    canvas.width = w;
    canvas.height = w;

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, w, w);

    // Draw grid
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        const x = c * CELL;
        const y = r * CELL;

        if (level.walls[r][c]) {
          ctx.fillStyle = '#16213e';
          ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);
        }

        // Dots
        if (dots[r][c]) {
          ctx.fillStyle = '#f5c542';
          ctx.beginPath();
          ctx.arc(x + CELL / 2, y + CELL / 2, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Draw ghost
    const gx = ghost.col * CELL + CELL / 2;
    const gy = ghost.row * CELL + CELL / 2;
    ctx.fillStyle = '#e74c3c';
    ctx.font = `${CELL * 0.7}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👻', gx, gy);

    // Draw player
    const px = player.col * CELL + CELL / 2;
    const py = player.row * CELL + CELL / 2;
    ctx.fillText('😋', px, py);
  }, [player, ghost, dots, level]);

  // Move player
  const movePlayer = useCallback(
    (dir: 'up' | 'down' | 'left' | 'right') => {
      setPlayer((prev) => {
        let { row, col } = prev;
        if (dir === 'up' && row > 0 && !level.walls[row - 1][col]) row--;
        else if (dir === 'down' && row < GRID - 1 && !level.walls[row + 1][col]) row++;
        else if (dir === 'left' && col > 0 && !level.walls[row][col - 1]) col--;
        else if (dir === 'right' && col < GRID - 1 && !level.walls[row][col + 1]) col++;

        // Eat dot
        if (dots[row][col]) {
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
    [dots, dotsLeft, level, onWin]
  );

  // Ghost AI — moves every 400ms
  useEffect(() => {
    const interval = setInterval(() => {
      setGhost((prev) => {
        const p = playerRef.current;
        // 60% chase, 40% random
        const chase = Math.random() < 0.6;
        const directions: Pos[] = [];

        const tryAdd = (r: number, c: number) => {
          if (r >= 0 && r < GRID && c >= 0 && c < GRID && !level.walls[r][c]) {
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
        if (g.row === p.row && g.col === p.col) {
          setPlayer({ row: 0, col: 0 });
        }
      }, 50);
    }, 400);

    return () => clearInterval(interval);
  }, [level]);

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
      <h2 className="text-xl font-bold text-[#5c4a3a]">👾 Eat All the Dots!</h2>
      <p className="text-sm text-[#8b7d6b]">
        Avoid the ghost! {dotsLeft} dots left
      </p>
      <canvas
        ref={canvasRef}
        className="rounded-2xl"
        style={{
          boxShadow:
            '4px 4px 12px rgba(163,177,198,0.6), -4px -4px 12px rgba(255,255,255,0.8)',
        }}
      />
      {/* D-Pad */}
      <div className="grid grid-cols-3 gap-2 w-[180px]">
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

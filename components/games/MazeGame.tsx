'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { generateMaze, Maze } from '@/lib/maze';

interface MazeGameProps {
  onWin: () => void;
}

const ROWS = 8;
const COLS = 8;

export default function MazeGame({ onWin }: MazeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [maze, setMaze] = useState<Maze | null>(null);
  const [playerPos, setPlayerPos] = useState({ row: 0, col: 0 });
  const [cellSize, setCellSize] = useState(40);

  // Generate maze on mount
  useEffect(() => {
    const m = generateMaze(ROWS, COLS);
    setMaze(m);
    setPlayerPos({ row: 0, col: 0 });
  }, []);

  // Responsive cell size
  useEffect(() => {
    const updateSize = () => {
      const maxW = Math.min(window.innerWidth - 40, 400);
      const maxH = Math.min(window.innerHeight - 200, 400);
      const size = Math.floor(Math.min(maxW / COLS, maxH / ROWS));
      setCellSize(Math.max(size, 25));
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Draw maze
  useEffect(() => {
    if (!maze || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = COLS * cellSize;
    const h = ROWS * cellSize;
    canvas.width = w;
    canvas.height = h;

    // Background
    ctx.fillStyle = '#f0e6d3';
    ctx.fillRect(0, 0, w, h);

    // End cell highlight
    ctx.fillStyle = '#a8e6a3';
    ctx.fillRect((COLS - 1) * cellSize, (ROWS - 1) * cellSize, cellSize, cellSize);

    // Draw walls
    ctx.strokeStyle = '#5c4a3a';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = maze[r][c];
        const x = c * cellSize;
        const y = r * cellSize;

        if (cell.walls.top) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + cellSize, y);
          ctx.stroke();
        }
        if (cell.walls.right) {
          ctx.beginPath();
          ctx.moveTo(x + cellSize, y);
          ctx.lineTo(x + cellSize, y + cellSize);
          ctx.stroke();
        }
        if (cell.walls.bottom) {
          ctx.beginPath();
          ctx.moveTo(x, y + cellSize);
          ctx.lineTo(x + cellSize, y + cellSize);
          ctx.stroke();
        }
        if (cell.walls.left) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + cellSize);
          ctx.stroke();
        }
      }
    }

    // Draw player
    const px = playerPos.col * cellSize + cellSize / 2;
    const py = playerPos.row * cellSize + cellSize / 2;
    const radius = cellSize * 0.3;

    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 2;
    ctx.stroke();

    // End marker
    const ex = (COLS - 1) * cellSize + cellSize / 2;
    const ey = (ROWS - 1) * cellSize + cellSize / 2;
    ctx.fillStyle = '#27ae60';
    ctx.font = `${cellSize * 0.5}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⭐', ex, ey);
  }, [maze, playerPos, cellSize]);

  // Move logic
  const move = useCallback(
    (dir: 'up' | 'down' | 'left' | 'right') => {
      if (!maze) return;
      const { row, col } = playerPos;
      const cell = maze[row][col];

      let newRow = row;
      let newCol = col;

      if (dir === 'up' && !cell.walls.top) newRow--;
      else if (dir === 'down' && !cell.walls.bottom) newRow++;
      else if (dir === 'left' && !cell.walls.left) newCol--;
      else if (dir === 'right' && !cell.walls.right) newCol++;

      if (newRow !== row || newCol !== col) {
        setPlayerPos({ row: newRow, col: newCol });

        if (newRow === ROWS - 1 && newCol === COLS - 1) {
          setTimeout(onWin, 200);
        }
      }
    },
    [maze, playerPos, onWin]
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
      <h2 className="text-xl font-bold text-[#5c4a3a]">🏰 Escape the Maze!</h2>
      <p className="text-sm text-[#8b7d6b]">Reach the ⭐ to unlock your link</p>
      <canvas
        ref={canvasRef}
        className="rounded-2xl"
        style={{ boxShadow: '4px 4px 12px rgba(163,177,198,0.6), -4px -4px 12px rgba(255,255,255,0.8)' }}
      />
      {/* D-Pad for mobile */}
      <div className="grid grid-cols-3 gap-2 w-[180px]">
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

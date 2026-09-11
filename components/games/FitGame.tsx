'use client';

import { useState, useCallback } from 'react';

interface FitGameProps {
  onWin: () => void;
}

// Tetromino shapes (relative coordinates from anchor)
interface Piece {
  id: string;
  color: string;
  cells: [number, number][]; // [row, col] offsets
  label: string;
}

interface Puzzle {
  target: boolean[][]; // 5x5 target silhouette
  pieces: Piece[];
}

// Define a few puzzle templates
const PUZZLES: Puzzle[] = [
  {
    // L-shape + T-shape + line
    target: [
      [true, false, false, false, false],
      [true, false, true, true, true],
      [true, true, false, false, true],
      [false, false, false, false, false],
      [false, false, false, false, false],
    ],
    pieces: [
      { id: 'L', color: '#ff6b6b', cells: [[0, 0], [1, 0], [2, 0], [2, 1]], label: 'L' },
      { id: 'T', color: '#4ecdc4', cells: [[0, 0], [0, 1], [0, 2], [1, 2]], label: 'J' },
      { id: 'I', color: '#f5c542', cells: [[0, 0], [0, 1], [0, 2]], label: 'I' },
    ],
  },
  {
    // Square + S-shape + dot
    target: [
      [false, true, true, false, false],
      [false, true, true, false, false],
      [false, false, true, true, false],
      [false, false, false, true, false],
      [false, false, false, false, false],
    ],
    pieces: [
      { id: 'O', color: '#ff6b6b', cells: [[0, 0], [0, 1], [1, 0], [1, 1]], label: 'O' },
      { id: 'S', color: '#4ecdc4', cells: [[0, 0], [0, 1], [1, 1]], label: 'S' },
      { id: 'D', color: '#f5c542', cells: [[0, 0]], label: '•' },
    ],
  },
  {
    // Z-shape + bar
    target: [
      [false, false, false, false, false],
      [true, true, false, false, false],
      [false, true, true, false, false],
      [false, false, true, true, true],
      [false, false, false, false, false],
    ],
    pieces: [
      { id: 'Z', color: '#ff6b6b', cells: [[0, 0], [0, 1], [1, 1], [1, 2]], label: 'Z' },
      { id: 'I2', color: '#4ecdc4', cells: [[0, 0], [0, 1], [0, 2]], label: 'I' },
      { id: 'D2', color: '#f5c542', cells: [[0, 0]], label: '•' },
    ],
  },
];

const BOARD_SIZE = 5;

function rotateCells(cells: [number, number][]): [number, number][] {
  // 90° clockwise rotation: (r, c) → (c, -r), then normalize to positive
  const rotated = cells.map(([r, c]) => [c, -r] as [number, number]);
  const minR = Math.min(...rotated.map(([r]) => r));
  const minC = Math.min(...rotated.map(([, c]) => c));
  return rotated.map(([r, c]) => [r - minR, c - minC] as [number, number]);
}

export default function FitGame({ onWin }: FitGameProps) {
  const [puzzle] = useState(() => PUZZLES[Math.floor(Math.random() * PUZZLES.length)]);
  const [board, setBoard] = useState<(string | null)[][]>(() =>
    Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null))
  );
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [placedPieces, setPlacedPieces] = useState<Set<string>>(new Set());
  const [currentRotation, setCurrentRotation] = useState<[number, number][]>([]);
  const [hoverCell, setHoverCell] = useState<[number, number] | null>(null);

  // Get a piece's current cells (with rotation applied)
  const getSelectedPieceDef = useCallback(() => {
    return puzzle.pieces.find((p) => p.id === selectedPiece);
  }, [puzzle, selectedPiece]);

  // Select piece
  const handleSelectPiece = (piece: Piece) => {
    if (placedPieces.has(piece.id)) return;
    setSelectedPiece(piece.id);
    setCurrentRotation(piece.cells);
    setHoverCell(null);
  };

  // Rotate
  const handleRotate = () => {
    if (!selectedPiece) return;
    setCurrentRotation((prev) => rotateCells(prev));
  };

  // Preview cells
  const getPreviewCells = (anchorRow: number, anchorCol: number): [number, number][] | null => {
    if (!selectedPiece) return null;
    const cells = currentRotation.map(
      ([r, c]) => [anchorRow + r, anchorCol + c] as [number, number]
    );

    // Check bounds and no overlap with placed pieces
    for (const [r, c] of cells) {
      if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return null;
      if (board[r][c] !== null) return null;
    }
    return cells;
  };

  // Place piece
  const handlePlacePiece = (row: number, col: number) => {
    if (!selectedPiece) return;
    const cells = getPreviewCells(row, col);
    if (!cells) return;

    const newBoard = board.map((r) => [...r]);
    for (const [r, c] of cells) {
      newBoard[r][c] = selectedPiece;
    }
    setBoard(newBoard);

    const newPlaced = new Set(placedPieces);
    newPlaced.add(selectedPiece);
    setPlacedPieces(newPlaced);
    setSelectedPiece(null);
    setHoverCell(null);

    // Check win
    if (newPlaced.size === puzzle.pieces.length) {
      // Verify board matches target
      let match = true;
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          const hasBlock = newBoard[r][c] !== null;
          if (hasBlock !== puzzle.target[r][c]) {
            match = false;
            break;
          }
        }
        if (!match) break;
      }
      if (match) {
        setTimeout(onWin, 300);
      }
    }
  };

  // Undo all
  const handleReset = () => {
    setBoard(Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null)));
    setPlacedPieces(new Set());
    setSelectedPiece(null);
    setHoverCell(null);
  };

  const previewCells = hoverCell ? getPreviewCells(hoverCell[0], hoverCell[1]) : null;
  const pieceDef = getSelectedPieceDef();

  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-xl font-bold text-[#5c4a3a]">🧩 Fill the Shape!</h2>
      <p className="text-sm text-[#8b7d6b]">
        Tap a piece, rotate, then tap the board to place it
      </p>

      {/* Board */}
      <div className="inline-grid gap-[2px] p-2 rounded-2xl" style={{
        gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
        background: '#d0c8b8',
        boxShadow: '4px 4px 12px rgba(163,177,198,0.6), -4px -4px 12px rgba(255,255,255,0.8)',
      }}>
        {Array.from({ length: BOARD_SIZE }, (_, r) =>
          Array.from({ length: BOARD_SIZE }, (_, c) => {
            const isTarget = puzzle.target[r][c];
            const placed = board[r][c];
            const placedPiece = placed ? puzzle.pieces.find((p) => p.id === placed) : null;
            const isPreview = previewCells?.some(([pr, pc]) => pr === r && pc === c);

            return (
              <button
                key={`${r}-${c}`}
                className="w-14 h-14 rounded-lg transition-all duration-150"
                style={{
                  background: placedPiece
                    ? placedPiece.color
                    : isPreview && pieceDef
                    ? pieceDef.color + '66'
                    : isTarget
                    ? '#c8bfb0'
                    : '#e8e0d0',
                  border: isTarget && !placed ? '2px dashed #a09080' : '2px solid transparent',
                }}
                onMouseEnter={() => selectedPiece && setHoverCell([r, c])}
                onTouchStart={() => selectedPiece && setHoverCell([r, c])}
                onClick={() => handlePlacePiece(r, c)}
              />
            );
          })
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-3 items-center">
        <button
          onClick={handleRotate}
          disabled={!selectedPiece}
          className="clay-btn px-5 py-3 rounded-2xl text-lg font-semibold disabled:opacity-40 active:scale-95 transition-transform"
        >
          🔄 Rotate
        </button>
        <button
          onClick={handleReset}
          className="clay-btn px-5 py-3 rounded-2xl text-lg font-semibold active:scale-95 transition-transform"
        >
          ↩️ Reset
        </button>
      </div>

      {/* Piece tray */}
      <div className="flex gap-3 flex-wrap justify-center">
        {puzzle.pieces.map((piece) => {
          const isPlaced = placedPieces.has(piece.id);
          const isSelected = selectedPiece === piece.id;

          // Compute piece bounding box for preview
          const maxR = Math.max(...piece.cells.map(([r]) => r)) + 1;
          const maxC = Math.max(...piece.cells.map(([, c]) => c)) + 1;

          return (
            <button
              key={piece.id}
              onClick={() => handleSelectPiece(piece)}
              disabled={isPlaced}
              className={`p-2 rounded-xl transition-all duration-150 ${
                isSelected
                  ? 'ring-3 ring-[#5c4a3a] scale-105'
                  : isPlaced
                  ? 'opacity-30'
                  : 'hover:scale-105'
              }`}
              style={{
                background: '#e0d8c8',
                boxShadow: isSelected
                  ? 'inset 4px 4px 8px rgba(163,177,198,0.6), inset -4px -4px 8px rgba(255,255,255,0.8)'
                  : '3px 3px 8px rgba(163,177,198,0.6), -3px -3px 8px rgba(255,255,255,0.8)',
              }}
            >
              <div
                className="inline-grid gap-[1px]"
                style={{ gridTemplateColumns: `repeat(${maxC}, 20px)` }}
              >
                {Array.from({ length: maxR }, (_, r) =>
                  Array.from({ length: maxC }, (_, c) => {
                    const filled = piece.cells.some(([pr, pc]) => pr === r && pc === c);
                    return (
                      <div
                        key={`${r}-${c}`}
                        className="w-5 h-5 rounded-sm"
                        style={{
                          background: filled ? piece.color : 'transparent',
                        }}
                      />
                    );
                  })
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

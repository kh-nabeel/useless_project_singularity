import qrcode from 'qrcode';
import { Maze, Cell } from './maze';

/**
 * Generates a 2D boolean matrix representing the QR code for a given URL.
 * true = black module (wall)
 * false = white module (path)
 */
export function generateQRMatrix(url: string): boolean[][] {
  const qr = qrcode.create(url, { errorCorrectionLevel: 'M' });
  const originalSize = qr.modules.size;
  const data = qr.modules.data;
  const margin = 2;
  const size = originalSize + margin * 2;
  
  let matrix: boolean[][] = [];
  for (let r = 0; r < size; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < size; c++) {
      if (r >= margin && r < size - margin && c >= margin && c < size - margin) {
        row.push(data[(r - margin) * originalSize + (c - margin)] === 1);
      } else {
        row.push(false); // White margin
      }
    }
    matrix.push(row);
  }
  
  // Ensure there is a solvable path from top-left to bottom-right
  matrix = ensureSolvable(matrix, margin);
  
  return matrix;
}

/**
 * Guarantees a path exists from (5,5) to (size-6, size-6).
 * Uses Dijkstra's algorithm where breaking a wall costs 100, and walking on empty path costs 1.
 */
function ensureSolvable(matrix: boolean[][], margin: number): boolean[][] {
  const size = matrix.length;
  const dist: number[][] = Array.from({ length: size }, () => Array(size).fill(Infinity));
  const parent: {r: number, c: number}[][] = Array.from({ length: size }, () => Array(size).fill(null));
  
  const start = { r: margin + 3, c: margin + 3 };
  const end = { r: size - margin - 4, c: size - margin - 4 };
  
  dist[start.r][start.c] = 0;
  
  // Simple priority queue using array (fine for 29x29)
  const q: {r: number, c: number, cost: number}[] = [{ r: start.r, c: start.c, cost: 0 }];
  
  while (q.length > 0) {
    q.sort((a, b) => a.cost - b.cost);
    const curr = q.shift()!;
    
    if (curr.r === end.r && curr.c === end.c) break;
    if (curr.cost > dist[curr.r][curr.c]) continue;
    
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dr, dc] of dirs) {
      const nr = curr.r + dr;
      const nc = curr.c + dc;
      
      if (nr >= margin && nr < size - margin && nc >= margin && nc < size - margin) {
        const costToMove = matrix[nr][nc] ? 100 : 1; // Breaking a wall is expensive
        const newCost = curr.cost + costToMove;
        
        if (newCost < dist[nr][nc]) {
          dist[nr][nc] = newCost;
          parent[nr][nc] = { r: curr.r, c: curr.c };
          q.push({ r: nr, c: nc, cost: newCost });
        }
      }
    }
  }
  
  // Backtrack and break walls
  let curr: {r: number, c: number} | null = end;
  while (curr !== null) {
    matrix[curr.r][curr.c] = false; // Ensure it is a path
    curr = parent[curr.r][curr.c];
  }
  
  return matrix;
}

/**
 * Converts the raw boolean matrix into our Cell[][] structure for the Maze game.
 */
export function convertToMazeCells(matrix: boolean[][]): Maze {
  const rows = matrix.length;
  const cols = matrix[0].length;
  
  const grid: Maze = [];
  for (let r = 0; r < rows; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < cols; c++) {
      const isWall = matrix[r][c];
      
      row.push({
        row: r,
        col: c,
        isWall: isWall,
        walls: {
          top: r === 0 || matrix[r - 1][c],
          right: c === cols - 1 || matrix[r][c + 1],
          bottom: r === rows - 1 || matrix[r + 1][c],
          left: c === 0 || matrix[r][c - 1],
        },
        visited: false,
      });
    }
    grid.push(row);
  }
  
  return grid;
}

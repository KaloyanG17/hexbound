// Pointy-top hexes in "odd-r" offset layout (odd rows shifted right).
// Distances go through axial coordinates: https://www.redblobgames.com/grids/hexagons/

export interface Cell {
  col: number;
  row: number;
}

const EVEN_ROW_NEIGHBORS = [[1, 0], [0, -1], [-1, -1], [-1, 0], [-1, 1], [0, 1]] as const;
const ODD_ROW_NEIGHBORS = [[1, 0], [1, -1], [0, -1], [-1, 0], [0, 1], [1, 1]] as const;

export function toAxial({ col, row }: Cell): { q: number; r: number } {
  return { q: col - (row - (row & 1)) / 2, r: row };
}

export function hexDistance(a: Cell, b: Cell): number {
  const A = toAxial(a);
  const B = toAxial(b);
  const dq = A.q - B.q;
  const dr = A.r - B.r;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}

/** In-bounds neighbours, always in the same order. */
export function neighbors(cell: Cell, cols: number, rows: number): Cell[] {
  const offsets = cell.row & 1 ? ODD_ROW_NEIGHBORS : EVEN_ROW_NEIGHBORS;
  const out: Cell[] = [];
  for (const [dc, dr] of offsets) {
    const col = cell.col + dc;
    const row = cell.row + dr;
    if (col >= 0 && col < cols && row >= 0 && row < rows) out.push({ col, row });
  }
  return out;
}

export function cellIndex(cell: Cell, cols: number): number {
  return cell.row * cols + cell.col;
}

export function cellFromIndex(index: number, cols: number): Cell {
  return { col: index % cols, row: Math.floor(index / cols) };
}

export function sameCell(a: Cell, b: Cell): boolean {
  return a.col === b.col && a.row === b.row;
}

import type { Cell } from "@hexbound/game-core";

// World layout of the arena. Board rows run along -Z (row 0 is nearest the camera),
// columns along +X, matching game-core's pointy-top odd-r offset grid.
export const HEX_R = 0.6;
export const HEX_W = Math.sqrt(3) * HEX_R;
export const ROW_STEP = 1.5 * HEX_R;
export const BENCH_GAP = 0.86;
/** Height of the tile surface; units stand on it. */
export const TILE_TOP = 0.18;

export type Vec2 = [x: number, z: number];

export function cellToWorld(cell: Cell, cols: number, rows: number): Vec2 {
  const x = (cell.col + (cell.row & 1 ? 0.5 : 0)) * HEX_W - ((cols - 0.5) * HEX_W) / 2;
  const z = ((rows - 1) / 2 - cell.row) * ROW_STEP;
  return [x, z];
}

export function benchToWorld(index: number, benchSize: number, rows: number): Vec2 {
  return [(index - (benchSize - 1) / 2) * BENCH_GAP, ((rows - 1) / 2) * ROW_STEP + 1.3];
}

import type { Cell } from "./hex";

export type Side = 0 | 1;
export type Star = 1 | 2 | 3;

export interface OwnedUnit {
  unitId: string;
  star: Star;
}

/**
 * A unit placed on its owner's half of the board, in side-local coordinates:
 * row 0 is the back row, row rowsPerSide - 1 is the front row facing the enemy.
 */
export interface BoardUnit extends OwnedUnit {
  cell: Cell;
}

import type { Cell, Star } from "@hexbound/game-core";
import type { Vec2 } from "./layout";

/** Where a unit is picked up from: its bench slot or its board index. */
export type DragSource = { from: "bench" | "board"; index: number };
export type DropTarget = { kind: "cell"; cell: Cell } | { kind: "bench"; index: number };

export interface ArenaUnit {
  key: string;
  unitId: string;
  star: Star;
  /** World position on the XZ plane. The arena eases the unit towards it. */
  pos: Vec2;
  enemy: boolean;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  dead: boolean;
  selected: boolean;
  /** Bumps each time the unit acts; the figure lunges. */
  pulse: number;
  /** Bumps each time the unit takes damage; the figure flashes. */
  hit: number;
  /** Set only for units the player can move during planning. */
  source?: DragSource;
}

export interface Floater {
  id: number;
  pos: Vec2;
  text: string;
  tone: "damage" | "heal" | "cast";
}

export interface ArenaProps {
  cols: number;
  /** Rows drawn. Planning draws your half; the fight draws both. */
  rows: number;
  /** Rows from the bottom of the screen that belong to the player. */
  ownRows: number;
  benchCount: number;
  framing: "plan" | "fight";
  units: ArenaUnit[];
  floaters: Floater[];
  interactive: boolean;
  dropHint?: boolean;
  onCellClick?: (cell: Cell) => void;
  onSelect?: (src: DragSource) => void;
  onDrop?: (src: DragSource, target: DropTarget) => void;
  /** Right-click on a unit. Both sides of a fight can be inspected. */
  onInspect?: (unitId: string, star: Star) => void;
}

export function sameSource(a: DragSource, b: DragSource): boolean {
  return a.from === b.from && a.index === b.index;
}

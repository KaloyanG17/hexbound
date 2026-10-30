// All numbers are integers so the simulation stays deterministic across JS engines.

export type Cost = 1 | 2 | 3 | 4 | 5;
export type StatKey = "hp" | "attack" | "armor";

export type Effect =
  | { kind: "damage"; amount: number; target: "current" | "farthest" | "lowestHp" }
  | { kind: "heal"; amount: number; target: "self" | "lowestAlly" }
  | { kind: "stun"; ticks: number; target: "current" };

export interface UnitStats {
  hp: number;
  attack: number;
  /** Damage taken is multiplied by 100 / (100 + armor). */
  armor: number;
  /** Ticks between basic attacks (30 ticks = 1 second). */
  attackTicks: number;
  /** Attack range in hexes. */
  range: number;
  maxMana: number;
  startMana: number;
}

export type UnitRole = "Guardian" | "Bruiser" | "Skirmisher" | "Marksman" | "Caster";

export interface UnitDef {
  id: string;
  name: string;
  cost: Cost;
  role: UnitRole;
  /** One line of flavour text for the inspector. */
  lore: string;
  traits: readonly string[];
  stats: UnitStats;
  ability: { name: string; effect: Effect };
}

export interface TraitBreakpoint {
  /** Distinct units with this trait needed to activate. */
  count: number;
  bonus: { stat: StatKey; amount: number };
}

export interface TraitDef {
  id: string;
  name: string;
  breakpoints: readonly TraitBreakpoint[];
}

export interface Rules {
  board: { cols: number; rowsPerSide: number };
  benchSize: number;
  shopSize: number;
  rerollCost: number;
  xpBuyCost: number;
  xpBuyAmount: number;
  /** xpToNext[level - 1] is the XP needed to go from that level to the next. */
  xpToNext: readonly number[];
  maxLevel: number;
  /** Copies of each unit in a full 8-player lobby, by cost. */
  poolCopies: Readonly<Record<Cost, number>>;
  /** shopOdds[level - 1] = percent chance for cost 1..5; each row sums to 100. */
  shopOdds: readonly (readonly [number, number, number, number, number])[];
  /** Stat multiplier in percent for star 1, 2, 3. */
  starMultiplier: readonly [number, number, number];
  economy: { baseIncome: number; interestPer: number; interestCap: number; passiveXp: number };
  /** Gold bonus by win/loss streak length: the last entry whose `streak` <= current streak applies. */
  streakBonus: readonly { streak: number; gold: number }[];
  start: { hp: number; gold: number; level: number };
  /** Loser takes min(base + floor(round / perRounds), max) + surviving enemy units. */
  damage: { base: number; perRounds: number; max: number };
  combat: { tickRate: number; maxTicks: number; moveTicks: number; manaPerAttack: number; manaPerHitTaken: number };
}

export interface ContentSet {
  units: readonly UnitDef[];
  traits: readonly TraitDef[];
  rules: Rules;
}

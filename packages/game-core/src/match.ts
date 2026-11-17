import type { ContentSet } from "@hexbound/content";
import { type CombatResult, simulateCombat } from "./combat";
import { copiesForStar, getItem, getUnit, recipeFor } from "./content";
import { type Cell, sameCell } from "./hex";
import { createPool, type Pool, returnShop, returnToPool, rollShop } from "./pool";
import { createRng, nextInt, nextU32, type Rng, shuffle } from "./rng";
import type { BoardUnit, OwnedUnit, Star } from "./types";

export interface PlayerState {
  id: number;
  name: string;
  hp: number;
  gold: number;
  level: number;
  xp: number;
  /** Positive = win streak, negative = loss streak. */
  streak: number;
  bench: (OwnedUnit | null)[];
  board: BoardUnit[];
  shop: (string | null)[];
  /** Item ids not yet given to a unit: loot from monster rounds and items back from sold units. */
  items: string[];
  lastOpponent: number | null;
  eliminatedRound: number | null;
}

export interface MatchState {
  round: number;
  phase: "planning" | "ended";
  players: PlayerState[];
  pool: Pool;
  rng: Rng;
}

export interface MatchConfig {
  seed: number;
  /** One entry per seat; the length is the lobby size. */
  playerNames: readonly string[];
}

export type Command =
  | { type: "buy"; slot: number }
  | { type: "sell"; from: "bench" | "board"; index: number }
  | { type: "reroll" }
  | { type: "buyXp" }
  | { type: "place"; benchIndex: number; cell: Cell }
  | { type: "move"; boardIndex: number; cell: Cell }
  | { type: "bench"; boardIndex: number }
  /** Give an inventory item to a unit. A component meeting its recipe partner on the unit completes the item. */
  | { type: "equip"; itemIndex: number; from: "bench" | "board"; index: number }
  /** Combine two inventory components into the finished item of their recipe. */
  | { type: "combine"; first: number; second: number };

export type CommandResult = { ok: true; state: MatchState } | { ok: false; error: string };

export interface FightRecord {
  /** Player ids. When ghostOf is set, b is a copy of that player's board and takes no damage. In a creep fight b is -1. */
  a: number;
  b: number;
  ghostOf: number | null;
  /** True for a monster round: side 1 is a wave of monsters. */
  creep: boolean;
  /** Items player a won and kept from this fight. */
  loot: string[];
  seed: number;
  boards: [BoardUnit[], BoardUnit[]];
  result: CombatResult;
  damageToA: number;
  damageToB: number;
}

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 16;

// Game state is plain data, so a JSON round-trip is a safe deep copy.
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export function createMatch(config: MatchConfig, content: ContentSet): MatchState {
  const count = config.playerNames.length;
  if (count < MIN_PLAYERS || count > MAX_PLAYERS) throw new Error(`Lobby size must be ${MIN_PLAYERS}-${MAX_PLAYERS}, got ${count}`);
  const { rules } = content;
  const rng = createRng(config.seed);
  const pool = createPool(content, count);
  const players = config.playerNames.map((name, id): PlayerState => ({
    id, name,
    hp: rules.start.hp, gold: rules.start.gold, level: rules.start.level, xp: 0, streak: 0,
    bench: Array.from({ length: rules.benchSize }, () => null),
    board: [],
    shop: rollShop(pool, rules.start.level, rng, content),
    items: [],
    lastOpponent: null, eliminatedRound: null,
  }));
  return { round: 1, phase: "planning", players, pool, rng };
}

export function isAlive(p: PlayerState): boolean {
  return p.eliminatedRound === null;
}

/** Pure: returns a new state, or an error and leaves the input untouched. */
export function applyCommand(prev: MatchState, playerId: number, cmd: Command, content: ContentSet): CommandResult {
  if (prev.phase !== "planning") return { ok: false, error: "Not in planning phase" };
  const state = clone(prev);
  const p = state.players[playerId];
  if (!p || !isAlive(p)) return { ok: false, error: "No such active player" };
  const { rules } = content;
  const freeBench = () => p.bench.findIndex((s) => s === null);

  switch (cmd.type) {
    case "buy": {
      const unitId = p.shop[cmd.slot];
      if (!unitId) return { ok: false, error: "Empty shop slot" };
      const cost = getUnit(content, unitId).cost;
      if (p.gold < cost) return { ok: false, error: "Not enough gold" };
      const slot = freeBench();
      if (slot < 0) return { ok: false, error: "Bench is full" };
      p.gold -= cost;
      p.shop[cmd.slot] = null;
      p.bench[slot] = { unitId, star: 1 };
      mergeUnits(p, rules.maxItemsPerUnit);
      break;
    }
    case "sell": {
      const unit = cmd.from === "bench" ? p.bench[cmd.index] : p.board[cmd.index];
      if (!unit) return { ok: false, error: "Nothing to sell" };
      const copies = copiesForStar(unit.star);
      p.gold += getUnit(content, unit.unitId).cost * copies;
      returnToPool(state.pool, unit.unitId, copies);
      // Items are never lost: a sold unit hands them back to the inventory.
      p.items.push(...(unit.items ?? []));
      if (cmd.from === "bench") p.bench[cmd.index] = null;
      else p.board.splice(cmd.index, 1);
      break;
    }
    case "reroll": {
      if (p.gold < rules.rerollCost) return { ok: false, error: "Not enough gold" };
      p.gold -= rules.rerollCost;
      returnShop(state.pool, p.shop);
      p.shop = rollShop(state.pool, p.level, state.rng, content);
      break;
    }
    case "buyXp": {
      if (p.level >= rules.maxLevel) return { ok: false, error: "Already max level" };
      if (p.gold < rules.xpBuyCost) return { ok: false, error: "Not enough gold" };
      p.gold -= rules.xpBuyCost;
      addXp(p, rules.xpBuyAmount, content);
      break;
    }
    case "place": {
      const unit = p.bench[cmd.benchIndex];
      if (!unit) return { ok: false, error: "No unit on that bench slot" };
      if (!validCell(cmd.cell, content)) return { ok: false, error: "Cell out of bounds" };
      const occupant = p.board.findIndex((u) => sameCell(u.cell, cmd.cell));
      if (occupant >= 0) {
        const swapped = p.board[occupant]!;
        p.board[occupant] = { ...unit, cell: cmd.cell };
        p.bench[cmd.benchIndex] = toOwned(swapped);
      } else {
        if (p.board.length >= p.level) return { ok: false, error: "Board is full for your level" };
        p.board.push({ ...unit, cell: cmd.cell });
        p.bench[cmd.benchIndex] = null;
      }
      break;
    }
    case "move": {
      const unit = p.board[cmd.boardIndex];
      if (!unit) return { ok: false, error: "No unit at that board index" };
      if (!validCell(cmd.cell, content)) return { ok: false, error: "Cell out of bounds" };
      const occupant = p.board.find((u) => sameCell(u.cell, cmd.cell));
      if (occupant) occupant.cell = unit.cell;
      unit.cell = cmd.cell;
      break;
    }
    case "bench": {
      const unit = p.board[cmd.boardIndex];
      if (!unit) return { ok: false, error: "No unit at that board index" };
      const slot = freeBench();
      if (slot < 0) return { ok: false, error: "Bench is full" };
      p.bench[slot] = toOwned(unit);
      p.board.splice(cmd.boardIndex, 1);
      break;
    }
    case "equip": {
      const itemId = p.items[cmd.itemIndex];
      if (!itemId) return { ok: false, error: "No item in that slot" };
      const unit = cmd.from === "bench" ? p.bench[cmd.index] : p.board[cmd.index];
      if (!unit) return { ok: false, error: "No unit there" };
      const carried = unit.items ?? [];
      // A component meeting its recipe partner on the unit completes the item in place, so it takes no extra slot.
      const partner = getItem(content, itemId).kind === "component"
        ? carried.findIndex((c) => recipeFor(content, c, itemId) !== null)
        : -1;
      if (partner >= 0) {
        carried[partner] = recipeFor(content, carried[partner]!, itemId)!.id;
      } else {
        if (carried.length >= rules.maxItemsPerUnit) return { ok: false, error: "That unit is already carrying the most items it can" };
        carried.push(itemId);
      }
      unit.items = carried;
      p.items.splice(cmd.itemIndex, 1);
      break;
    }
    case "combine": {
      if (cmd.first === cmd.second) return { ok: false, error: "Pick two different items" };
      const a = p.items[cmd.first];
      const b = p.items[cmd.second];
      if (!a || !b) return { ok: false, error: "Pick two items from your inventory" };
      const result = recipeFor(content, a, b);
      if (!result) return { ok: false, error: "Those two items don't combine" };
      p.items.splice(Math.max(cmd.first, cmd.second), 1);
      p.items.splice(Math.min(cmd.first, cmd.second), 1);
      p.items.push(result.id);
      break;
    }
  }
  return { ok: true, state };
}

/**
 * Ends the planning phase. On a monster round every living player fights the round's wave and
 * wins random components. Otherwise players are paired, fights run, and losers take damage; with
 * an odd number alive, one player fights a ghost copy of another board and the ghost's owner
 * takes no damage. Then come eliminations, income and fresh shops.
 */
export function resolveRound(prev: MatchState, content: ContentSet): { state: MatchState; fights: FightRecord[] } {
  if (prev.phase !== "planning") throw new Error("Match is over");
  const state = clone(prev);
  const { rules } = content;
  const alive = state.players.filter(isAlive);
  const fights: FightRecord[] = [];
  const baseDamage = Math.min(rules.damage.base + Math.floor(state.round / rules.damage.perRounds), rules.damage.max);
  const wave = rules.creepRounds.find((w) => w.round === state.round);

  if (wave) {
    for (const p of alive) {
      const seed = nextU32(state.rng);
      const boards: [BoardUnit[], BoardUnit[]] = [clone(p.board), creepBoard(wave.monsters, content)];
      const result = simulateCombat(boards, seed, content);
      // Only a win drops loot, and only as much as the inventory can hold.
      const won = result.winner === 0 ? rollLoot(wave.monsters, state.rng, content) : [];
      const loot = won.slice(0, Math.max(0, rules.maxInventory - p.items.length));
      p.items.push(...loot);
      fights.push({ a: p.id, b: -1, ghostOf: null, creep: true, loot, seed, boards, result, damageToA: 0, damageToB: 0 });
    }
  } else {
    for (const [pa, pb, ghost] of pairPlayers(alive, state.rng)) {
      const seed = nextU32(state.rng);
      const boards: [BoardUnit[], BoardUnit[]] = [clone(pa.board), clone(pb.board)];
      const result = simulateCombat(boards, seed, content);
      const loserDamage = baseDamage + result.survivors.length;
      const damageToA = result.winner === 0 ? 0 : result.winner === 1 ? loserDamage : baseDamage;
      const damageToB = ghost || result.winner === 1 ? 0 : result.winner === 0 ? loserDamage : baseDamage;
      pa.hp -= damageToA;
      pb.hp -= damageToB;
      updateStreak(pa, result.winner === null ? null : result.winner === 0);
      if (!ghost) updateStreak(pb, result.winner === null ? null : result.winner === 1);
      pa.lastOpponent = pb.id;
      if (!ghost) pb.lastOpponent = pa.id;
      fights.push({ a: pa.id, b: pb.id, ghostOf: ghost ? pb.id : null, creep: false, loot: [], seed, boards, result, damageToA, damageToB });
    }
  }

  for (const p of alive) {
    if (p.hp > 0) continue;
    p.hp = 0;
    p.eliminatedRound = state.round;
    for (const u of [...p.board, ...p.bench]) if (u) returnToPool(state.pool, u.unitId, copiesForStar(u.star));
    returnShop(state.pool, p.shop);
    p.board = [];
    p.bench = p.bench.map(() => null);
    p.shop = [];
    p.items = [];
  }

  const survivors = state.players.filter(isAlive);
  for (const p of survivors) {
    const interest = Math.min(Math.floor(p.gold / rules.economy.interestPer), rules.economy.interestCap);
    const streakGold = rules.streakBonus.reduce((g, s) => (Math.abs(p.streak) >= s.streak ? s.gold : g), 0);
    p.gold += rules.economy.baseIncome + interest + streakGold;
    addXp(p, rules.economy.passiveXp, content);
    returnShop(state.pool, p.shop);
    p.shop = rollShop(state.pool, p.level, state.rng, content);
  }

  state.round++;
  if (survivors.length <= 1) state.phase = "ended";
  return { state, fights };
}

/** A monster wave on the opponent's side: front row, filled from the centre outwards. */
export function creepBoard(monsterIds: readonly string[], content: ContentSet): BoardUnit[] {
  const { cols, rowsPerSide } = content.rules.board;
  const centreOut = Array.from({ length: cols }, (_, i) => i).sort((a, b) => Math.abs(a - (cols - 1) / 2) - Math.abs(b - (cols - 1) / 2) || a - b);
  return monsterIds.map((unitId, i) => ({
    unitId,
    star: 1 as Star,
    cell: { col: centreOut[i % cols]!, row: rowsPerSide - 1 - Math.floor(i / cols) },
  }));
}

/** Random components, one per drop point of every monster in the wave. */
function rollLoot(monsterIds: readonly string[], rng: Rng, content: ContentSet): string[] {
  const components = content.items.filter((i) => i.kind === "component");
  const drops = monsterIds.reduce((n, id) => n + (content.monsters.find((m) => m.id === id)?.drops ?? 0), 0);
  return Array.from({ length: drops }, () => components[nextInt(rng, components.length)]!.id);
}

/** Random pairing that avoids last round's opponent when the lobby is big enough. */
function pairPlayers(alive: PlayerState[], rng: Rng): [PlayerState, PlayerState, boolean][] {
  let order = shuffle(rng, alive);
  for (let attempt = 0; attempt < 8 && alive.length > 3; attempt++) {
    let repeats = false;
    for (let i = 0; i + 1 < order.length; i += 2) {
      if (order[i]!.lastOpponent === order[i + 1]!.id) repeats = true;
    }
    if (!repeats) break;
    order = shuffle(rng, alive);
  }
  const pairs: [PlayerState, PlayerState, boolean][] = [];
  for (let i = 0; i + 1 < order.length; i += 2) pairs.push([order[i]!, order[i + 1]!, false]);
  if (order.length % 2 === 1) {
    const odd = order[order.length - 1]!;
    const others = alive.filter((p) => p.id !== odd.id);
    pairs.push([odd, others[nextInt(rng, others.length)]!, true]);
  }
  return pairs;
}

function updateStreak(p: PlayerState, won: boolean | null) {
  if (won === null) return;
  if (won) p.streak = p.streak > 0 ? p.streak + 1 : 1;
  else p.streak = p.streak < 0 ? p.streak - 1 : -1;
}

function addXp(p: PlayerState, amount: number, content: ContentSet) {
  const { xpToNext, maxLevel } = content.rules;
  p.xp += amount;
  while (p.level < maxLevel && p.xp >= xpToNext[p.level - 1]!) {
    p.xp -= xpToNext[p.level - 1]!;
    p.level++;
  }
  if (p.level >= maxLevel) p.xp = 0;
}

function validCell(cell: Cell, content: ContentSet): boolean {
  const { cols, rowsPerSide } = content.rules.board;
  return Number.isInteger(cell.col) && Number.isInteger(cell.row) && cell.col >= 0 && cell.col < cols && cell.row >= 0 && cell.row < rowsPerSide;
}

/** A board unit without its cell, keeping its items, for moving it to the bench. */
function toOwned(unit: BoardUnit): OwnedUnit {
  return unit.items ? { unitId: unit.unitId, star: unit.star, items: unit.items } : { unitId: unit.unitId, star: unit.star };
}

/**
 * Three copies of the same unit and star combine into one of the next star, repeatedly.
 * The upgraded unit keeps the copies' items up to the carry limit; the rest go back to the inventory.
 */
export function mergeUnits(p: PlayerState, maxItems = 3): void {
  for (;;) {
    const owned = [
      ...p.board.map((u, index) => ({ unit: u as OwnedUnit, where: "board" as const, index })),
      ...p.bench.flatMap((u, index) => (u ? [{ unit: u, where: "bench" as const, index }] : [])),
    ];
    const group = owned.find((o) => o.unit.star < 3 && owned.filter((x) => x.unit.unitId === o.unit.unitId && x.unit.star === o.unit.star).length >= 3);
    if (!group) return;
    const copies = owned.filter((x) => x.unit.unitId === group.unit.unitId && x.unit.star === group.unit.star).slice(0, 3);
    const carried = copies.flatMap((c) => c.unit.items ?? []);
    const upgraded: OwnedUnit = { unitId: group.unit.unitId, star: (group.unit.star + 1) as Star };
    if (carried.length > 0) upgraded.items = carried.slice(0, maxItems);
    if (carried.length > maxItems) p.items.push(...carried.slice(maxItems));
    const onBoard = copies.find((c) => c.where === "board");
    const keep = onBoard ?? copies[0]!;
    for (const c of copies) {
      if (c === keep) continue;
      if (c.where === "bench") p.bench[c.index] = null;
    }
    const boardRemovals = copies.filter((c) => c.where === "board" && c !== keep).map((c) => c.index).sort((a, b) => b - a);
    if (keep.where === "board") p.board[keep.index] = { ...upgraded, cell: p.board[keep.index]!.cell };
    else p.bench[keep.index] = upgraded;
    for (const i of boardRemovals) p.board.splice(i, 1);
  }
}

import type { ContentSet, Effect, UnitDef } from "@hexbound/content";
import { activeTraits, compareIds, getUnit, scaleByStar } from "./content";
import { type Cell, cellFromIndex, cellIndex, hexDistance, neighbors } from "./hex";
import { createRng, nextInt } from "./rng";
import type { BoardUnit, OwnedUnit, Side, Star } from "./types";

// Event cells are global board coordinates: side 0 owns rows 0..rowsPerSide-1,
// side 1 is mirrored onto the rows above it. The renderer only replays these.
export type CombatEvent =
  | { t: number; type: "spawn"; uid: number; side: Side; unitId: string; star: Star; cell: Cell; hp: number; maxHp: number; maxMana: number }
  | { t: number; type: "move"; uid: number; to: Cell }
  | { t: number; type: "attack"; uid: number; target: number }
  | { t: number; type: "cast"; uid: number; ability: string }
  | { t: number; type: "damage"; uid: number; source: number; amount: number; hp: number }
  | { t: number; type: "heal"; uid: number; amount: number; hp: number }
  | { t: number; type: "stun"; uid: number; ticks: number }
  | { t: number; type: "mana"; uid: number; mana: number }
  | { t: number; type: "death"; uid: number }
  | { t: number; type: "end"; winner: Side | null };

export interface CombatResult {
  /** null = timeout draw. */
  winner: Side | null;
  /** The winner's units still standing. */
  survivors: OwnedUnit[];
  ticks: number;
  events: CombatEvent[];
}

interface Fighter {
  uid: number;
  side: Side;
  def: UnitDef;
  star: Star;
  cell: Cell;
  hp: number;
  maxHp: number;
  attack: number;
  armor: number;
  mana: number;
  attackCd: number;
  moveCd: number;
  stunned: number;
  target: number | null;
  alive: boolean;
}

export function toGlobalCell(cell: Cell, side: Side, content: ContentSet): Cell {
  const { cols, rowsPerSide } = content.rules.board;
  return side === 0 ? cell : { col: cols - 1 - cell.col, row: rowsPerSide * 2 - 1 - cell.row };
}

/**
 * Pure and deterministic: the same boards, seed and content always produce the same events,
 * on the server, in a Web Worker, or in any browser.
 */
export function simulateCombat(
  boards: readonly [readonly BoardUnit[], readonly BoardUnit[]],
  seed: number,
  content: ContentSet,
): CombatResult {
  const { rules } = content;
  const { cols, rowsPerSide } = rules.board;
  const rows = rowsPerSide * 2;
  const rng = createRng(seed);
  const events: CombatEvent[] = [];
  const fighters: Fighter[] = [];
  const occupied = new Map<number, number>(); // cell index -> uid

  for (const side of [0, 1] as const) {
    // Sort so the caller's array order never changes the outcome.
    const sorted = [...boards[side]].sort(
      (a, b) => cellIndex(a.cell, cols) - cellIndex(b.cell, cols) || compareIds(a.unitId, b.unitId),
    );
    const traitsActive = activeTraits(sorted.map((u) => u.unitId), content);
    for (const unit of sorted) {
      const def = getUnit(content, unit.unitId);
      const stats = { hp: scaleByStar(def.stats.hp, unit.star, content), attack: scaleByStar(def.stats.attack, unit.star, content), armor: def.stats.armor };
      for (const trait of traitsActive) {
        if (trait.bonus && def.traits.includes(trait.traitId)) stats[trait.bonus.stat] += trait.bonus.amount;
      }
      const cell = toGlobalCell(unit.cell, side, content);
      const idx = cellIndex(cell, cols);
      if (occupied.has(idx)) throw new Error(`Two units on cell ${cell.col},${cell.row}`);
      const uid = fighters.length;
      fighters.push({
        uid, side, def, star: unit.star, cell,
        hp: stats.hp, maxHp: stats.hp, attack: stats.attack, armor: stats.armor,
        mana: def.stats.startMana,
        attackCd: nextInt(rng, Math.floor(def.stats.attackTicks / 2) + 1),
        moveCd: 0, stunned: 0, target: null, alive: true,
      });
      occupied.set(idx, uid);
      events.push({ t: 0, type: "spawn", uid, side, unitId: def.id, star: unit.star, cell, hp: stats.hp, maxHp: stats.hp, maxMana: def.stats.maxMana });
    }
  }

  const enemiesOf = (f: Fighter) => fighters.filter((o) => o.alive && o.side !== f.side);
  const alliesOf = (f: Fighter) => fighters.filter((o) => o.alive && o.side === f.side);

  function acquireTarget(f: Fighter): Fighter | null {
    const current = f.target === null ? null : fighters[f.target]!;
    if (current?.alive) return current;
    const enemies = enemiesOf(f);
    if (enemies.length === 0) return null;
    let best = Infinity;
    let ties: Fighter[] = [];
    for (const e of enemies) {
      const d = hexDistance(f.cell, e.cell);
      if (d < best) {
        best = d;
        ties = [e];
      } else if (d === best) ties.push(e);
    }
    const chosen = ties[nextInt(rng, ties.length)]!;
    f.target = chosen.uid;
    return chosen;
  }

  // Breadth-first search over free cells to the nearest cell within range of the target.
  function nextStep(f: Fighter, target: Fighter): Cell | null {
    const start = cellIndex(f.cell, cols);
    const prev = new Map<number, number>([[start, -1]]);
    const queue = [start];
    for (let head = 0; head < queue.length; head++) {
      const cur = queue[head]!;
      if (cur !== start && hexDistance(cellFromIndex(cur, cols), target.cell) <= f.def.stats.range) {
        let step = cur;
        while (prev.get(step) !== start) step = prev.get(step)!;
        return cellFromIndex(step, cols);
      }
      for (const n of neighbors(cellFromIndex(cur, cols), cols, rows)) {
        const ni = cellIndex(n, cols);
        if (prev.has(ni) || occupied.has(ni)) continue;
        prev.set(ni, cur);
        queue.push(ni);
      }
    }
    return null;
  }

  function damage(t: number, source: Fighter, target: Fighter, raw: number) {
    const amount = Math.max(1, Math.floor((raw * 100) / (100 + target.armor)));
    target.hp -= amount;
    events.push({ t, type: "damage", uid: target.uid, source: source.uid, amount, hp: Math.max(0, target.hp) });
    if (target.hp <= 0) {
      target.alive = false;
      occupied.delete(cellIndex(target.cell, cols));
      events.push({ t, type: "death", uid: target.uid });
      return;
    }
    target.mana = Math.min(target.def.stats.maxMana, target.mana + rules.combat.manaPerHitTaken);
  }

  function heal(t: number, target: Fighter, raw: number) {
    const amount = Math.min(raw, target.maxHp - target.hp);
    target.hp += amount;
    events.push({ t, type: "heal", uid: target.uid, amount, hp: target.hp });
  }

  function cast(t: number, f: Fighter, current: Fighter) {
    const effect: Effect = f.def.ability.effect;
    events.push({ t, type: "cast", uid: f.uid, ability: f.def.ability.name });
    switch (effect.kind) {
      case "damage": {
        const enemies = enemiesOf(f);
        const target =
          effect.target === "current" ? current
          : effect.target === "farthest" ? pickBy(enemies, (e) => hexDistance(f.cell, e.cell))
          : pickBy(enemies, (e) => -e.hp);
        damage(t, f, target, scaleByStar(effect.amount, f.star, content));
        break;
      }
      case "heal": {
        const target = effect.target === "self" ? f : pickBy(alliesOf(f), (a) => -Math.floor((a.hp * 1000) / a.maxHp));
        heal(t, target, scaleByStar(effect.amount, f.star, content));
        break;
      }
      case "stun": {
        current.stunned = Math.max(current.stunned, effect.ticks);
        events.push({ t, type: "stun", uid: current.uid, ticks: effect.ticks });
        break;
      }
    }
  }

  const aliveOn = (side: Side) => fighters.some((f) => f.alive && f.side === side);
  let t = 0;
  while (t < rules.combat.maxTicks && aliveOn(0) && aliveOn(1)) {
    t++;
    for (const f of fighters) {
      if (!f.alive) continue;
      if (f.stunned > 0) {
        f.stunned--;
        continue;
      }
      const target = acquireTarget(f);
      if (!target) break;
      if (hexDistance(f.cell, target.cell) <= f.def.stats.range) {
        if (f.attackCd > 0) {
          f.attackCd--;
          continue;
        }
        f.attackCd = f.def.stats.attackTicks;
        if (f.mana >= f.def.stats.maxMana) {
          f.mana = 0;
          cast(t, f, target);
        } else {
          events.push({ t, type: "attack", uid: f.uid, target: target.uid });
          damage(t, f, target, f.attack);
          f.mana = Math.min(f.def.stats.maxMana, f.mana + rules.combat.manaPerAttack);
        }
        events.push({ t, type: "mana", uid: f.uid, mana: f.mana });
      } else if (f.moveCd > 0) {
        f.moveCd--;
      } else {
        const step = nextStep(f, target);
        if (step) {
          occupied.delete(cellIndex(f.cell, cols));
          occupied.set(cellIndex(step, cols), f.uid);
          f.cell = step;
          f.moveCd = rules.combat.moveTicks;
          events.push({ t, type: "move", uid: f.uid, to: step });
        }
      }
    }
  }

  const winner: Side | null = aliveOn(0) && !aliveOn(1) ? 0 : aliveOn(1) && !aliveOn(0) ? 1 : null;
  events.push({ t, type: "end", winner });
  const survivors = winner === null ? [] : fighters.filter((f) => f.alive && f.side === winner).map((f) => ({ unitId: f.def.id, star: f.star }));
  return { winner, survivors, ticks: t, events };
}

/** Highest score wins; ties go to the lowest uid (the list is already in uid order). */
function pickBy(list: Fighter[], score: (f: Fighter) => number): Fighter {
  let best = list[0]!;
  let bestScore = score(best);
  for (const f of list.slice(1)) {
    const s = score(f);
    if (s > bestScore) {
      best = f;
      bestScore = s;
    }
  }
  return best;
}

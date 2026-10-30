import type { ContentSet } from "@hexbound/content";
import { nextInt, type Rng } from "./rng";

/** Remaining copies per unit id, shared by every player in the lobby. */
export type Pool = Record<string, number>;

/**
 * Copies scale with lobby size (the rules table is tuned for 8 players),
 * with a floor of 9 so every unit can still reach 3 stars in small lobbies.
 */
export function createPool(content: ContentSet, playerCount: number): Pool {
  const pool: Pool = {};
  for (const unit of content.units) {
    const base = content.rules.poolCopies[unit.cost];
    pool[unit.id] = Math.max(9, Math.ceil((base * playerCount) / 8));
  }
  return pool;
}

export function poolTotal(pool: Pool): number {
  return Object.values(pool).reduce((a, b) => a + b, 0);
}

export function returnToPool(pool: Pool, unitId: string, copies: number): void {
  pool[unitId] = (pool[unitId] ?? 0) + copies;
}

/** Rolls a fresh shop, taking the offered units out of the pool. Empty slots are null. */
export function rollShop(pool: Pool, level: number, rng: Rng, content: ContentSet): (string | null)[] {
  const odds = content.rules.shopOdds[level - 1]!;
  const shop: (string | null)[] = [];
  for (let slot = 0; slot < content.rules.shopSize; slot++) {
    let roll = nextInt(rng, 100);
    let cost = 1;
    while (cost < 5 && roll >= odds[cost - 1]!) {
      roll -= odds[cost - 1]!;
      cost++;
    }
    shop.push(drawUnit(pool, cost, rng, content));
  }
  return shop;
}

/** Puts unbought shop units back into the pool. */
export function returnShop(pool: Pool, shop: readonly (string | null)[]): void {
  for (const id of shop) if (id) returnToPool(pool, id, 1);
}

// Weighted by remaining copies; falls back to cheaper tiers when a tier is empty.
function drawUnit(pool: Pool, cost: number, rng: Rng, content: ContentSet): string | null {
  for (let c = cost; c >= 1; c--) {
    const candidates = content.units.filter((u) => u.cost === c && (pool[u.id] ?? 0) > 0);
    const total = candidates.reduce((sum, u) => sum + pool[u.id]!, 0);
    if (total === 0) continue;
    let pick = nextInt(rng, total);
    for (const u of candidates) {
      pick -= pool[u.id]!;
      if (pick < 0) {
        pool[u.id] = pool[u.id]! - 1;
        return u.id;
      }
    }
  }
  return null;
}

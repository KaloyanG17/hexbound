import type { ContentSet, ItemDef, StatKey, UnitDef } from "@hexbound/content";
import type { Star } from "./types";

/** Characters and monsters share one lookup, so combat treats them the same way. */
export function getUnit(content: ContentSet, unitId: string): UnitDef {
  const def = content.units.find((u) => u.id === unitId) ?? content.monsters.find((m) => m.id === unitId);
  if (!def) throw new Error(`Unknown unit: ${unitId}`);
  return def;
}

export function getItem(content: ContentSet, itemId: string): ItemDef {
  const def = content.items.find((i) => i.id === itemId);
  if (!def) throw new Error(`Unknown item: ${itemId}`);
  return def;
}

/** The finished item two components make, in either order, or null when they don't combine. */
export function recipeFor(content: ContentSet, a: string, b: string): ItemDef | null {
  return content.items.find((i) => i.recipe && ((i.recipe[0] === a && i.recipe[1] === b) || (i.recipe[0] === b && i.recipe[1] === a))) ?? null;
}

export interface ItemTotals {
  hp: number;
  attack: number;
  armor: number;
  attackTicks: number;
  maxMana: number;
  startMana: number;
}

/** The summed stat changes of a list of item ids. */
export function itemTotals(content: ContentSet, itemIds: readonly string[]): ItemTotals {
  const total: ItemTotals = { hp: 0, attack: 0, armor: 0, attackTicks: 0, maxMana: 0, startMana: 0 };
  for (const id of itemIds) {
    const stats = getItem(content, id).stats;
    for (const key of Object.keys(total) as (keyof ItemTotals)[]) total[key] += stats[key] ?? 0;
  }
  return total;
}

export function scaleByStar(value: number, star: Star, content: ContentSet): number {
  return Math.floor((value * content.rules.starMultiplier[star - 1]!) / 100);
}

/** How many base copies a unit of this star level is made of. */
export function copiesForStar(star: Star): number {
  return star === 1 ? 1 : star === 2 ? 3 : 9;
}

export interface ActiveTrait {
  traitId: string;
  count: number;
  /** Index of the highest breakpoint reached, or -1 if none. */
  level: number;
  bonus: { stat: StatKey; amount: number } | null;
}

/** Traits count distinct units, so two copies of the same unit count once. */
export function activeTraits(unitIds: readonly string[], content: ContentSet): ActiveTrait[] {
  const distinct = [...new Set(unitIds)].map((id) => getUnit(content, id));
  return content.traits.map((trait) => {
    const count = distinct.filter((u) => u.traits.includes(trait.id)).length;
    let level = -1;
    trait.breakpoints.forEach((bp, i) => {
      if (count >= bp.count) level = i;
    });
    return { traitId: trait.id, count, level, bonus: level >= 0 ? trait.breakpoints[level]!.bonus : null };
  });
}

/** Stable string order that does not depend on the runtime's locale. */
export function compareIds(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

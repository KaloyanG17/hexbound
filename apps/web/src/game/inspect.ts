import type { ContentSet, Effect, StatKey, UnitDef } from "@hexbound/content";
import { scaleByStar, type Star } from "@hexbound/game-core";

// Derived numbers for the inspector. Pure functions over content, so they match what the
// simulation actually uses (star scaling, armour formula, attack timing).

export interface DerivedStats {
  hp: number;
  attack: number;
  armor: number;
  damageReduction: number;
  attacksPerSecond: number;
  damagePerSecond: number;
  range: number;
  maxMana: number;
  startMana: number;
  abilityText: string;
}

export function derivedStats(def: UnitDef, star: Star, content: ContentSet): DerivedStats {
  const hp = scaleByStar(def.stats.hp, star, content);
  const attack = scaleByStar(def.stats.attack, star, content);
  const attacksPerSecond = content.rules.combat.tickRate / def.stats.attackTicks;
  return {
    hp,
    attack,
    armor: def.stats.armor,
    damageReduction: Math.round((100 * def.stats.armor) / (100 + def.stats.armor)),
    attacksPerSecond,
    damagePerSecond: Math.round(attack * attacksPerSecond),
    range: def.stats.range,
    maxMana: def.stats.maxMana,
    startMana: def.stats.startMana,
    abilityText: describeEffect(def.ability.effect, star, content),
  };
}

export function describeEffect(effect: Effect, star: Star, content: ContentSet): string {
  switch (effect.kind) {
    case "damage": {
      const amount = scaleByStar(effect.amount, star, content);
      const who =
        effect.target === "current" ? "the unit it is fighting"
        : effect.target === "farthest" ? "the farthest enemy"
        : "the enemy with the lowest health";
      return `Deals ${amount} damage to ${who}.`;
    }
    case "heal": {
      const amount = scaleByStar(effect.amount, star, content);
      const who = effect.target === "self" ? "itself" : "the ally with the lowest health";
      return `Restores ${amount} health to ${who}.`;
    }
    case "stun":
      return `Stuns its target for ${(effect.ticks / content.rules.combat.tickRate).toFixed(1)} seconds.`;
  }
}

const STAT_LABEL: Record<StatKey, string> = { hp: "health", attack: "attack", armor: "armour" };

export function describeBreakpoints(traitId: string, content: ContentSet): { count: number; text: string }[] {
  const trait = content.traits.find((t) => t.id === traitId);
  if (!trait) return [];
  return trait.breakpoints.map((bp) => ({
    count: bp.count,
    text: `+${bp.bonus.amount} ${STAT_LABEL[bp.bonus.stat]}`,
  }));
}

export function rangeLabel(range: number): string {
  return range <= 1 ? "Melee (1 hex)" : `Ranged (${range} hexes)`;
}

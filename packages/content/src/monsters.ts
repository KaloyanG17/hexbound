import type { MonsterDef } from "./types";

// Creeps for monster rounds. They fight like characters but are never in the shop or the pool.
// `cost` here is only the monster's tier: later monster rounds draw stronger tiers.
export const monsters = [
  {
    id: "moss-crawler", name: "Moss Crawler", cost: 1, role: "Bruiser", traits: [], drops: 1,
    lore: "A slow, mossy beetle that guards the edge of every arena.",
    stats: { hp: 380, attack: 30, armor: 10, attackTicks: 30, range: 1, maxMana: 100, startMana: 0 },
    ability: { name: "Shell Bash", effect: { kind: "damage", amount: 90, target: "current" } },
  },
  {
    id: "ember-imp", name: "Ember Imp", cost: 1, role: "Skirmisher", traits: [], drops: 1,
    lore: "Small, quick and always on fire.",
    stats: { hp: 300, attack: 36, armor: 5, attackTicks: 24, range: 1, maxMana: 80, startMana: 0 },
    ability: { name: "Spark Spit", effect: { kind: "damage", amount: 110, target: "current" } },
  },
  {
    id: "tide-lurker", name: "Tide Lurker", cost: 2, role: "Guardian", traits: [], drops: 1,
    lore: "Waits under the waterline for anything that wanders too close.",
    stats: { hp: 720, attack: 45, armor: 25, attackTicks: 33, range: 1, maxMana: 90, startMana: 20 },
    ability: { name: "Undertow Grip", effect: { kind: "stun", ticks: 45, target: "current" } },
  },
  {
    id: "gale-harpy", name: "Gale Harpy", cost: 2, role: "Marksman", traits: [], drops: 1,
    lore: "Screams from the cliffs and dives on the weakest.",
    stats: { hp: 520, attack: 52, armor: 10, attackTicks: 24, range: 3, maxMana: 70, startMana: 0 },
    ability: { name: "Talon Shriek", effect: { kind: "damage", amount: 200, target: "lowestHp" } },
  },
  {
    id: "stone-golem", name: "Stone Golem", cost: 3, role: "Guardian", traits: [], drops: 2,
    lore: "A boulder that learned to hold a grudge.",
    stats: { hp: 1300, attack: 60, armor: 50, attackTicks: 38, range: 1, maxMana: 110, startMana: 30 },
    ability: { name: "Rock Slam", effect: { kind: "stun", ticks: 60, target: "current" } },
  },
  {
    id: "elder-wyrm", name: "Elder Wyrm", cost: 4, role: "Bruiser", traits: [], drops: 3,
    lore: "The arena's oldest resident. It rarely loses, and it never forgives.",
    stats: { hp: 2200, attack: 85, armor: 40, attackTicks: 30, range: 2, maxMana: 100, startMana: 30 },
    ability: { name: "Wyrmfire", effect: { kind: "damage", amount: 450, target: "farthest" } },
  },
] as const satisfies readonly MonsterDef[];

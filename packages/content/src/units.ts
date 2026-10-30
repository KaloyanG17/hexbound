import type { UnitDef } from "./types";

// Original cast. To add a character: append an entry here and drop its art in apps/web/public/units.
export const units = [
  {
    id: "pip-cinderpaw", name: "Pip Cinderpaw", cost: 1, traits: ["emberkin", "striker"],
    stats: { hp: 500, attack: 50, armor: 15, attackTicks: 24, range: 1, maxMana: 60, startMana: 0 },
    ability: { name: "Spark Pounce", effect: { kind: "damage", amount: 180, target: "current" } },
  },
  {
    id: "mossback-grunt", name: "Mossback Grunt", cost: 1, traits: ["ironroot", "warden"],
    stats: { hp: 700, attack: 40, armor: 35, attackTicks: 33, range: 1, maxMana: 80, startMana: 20 },
    ability: { name: "Bark Up", effect: { kind: "heal", amount: 250, target: "self" } },
  },
  {
    id: "brine-scout", name: "Brine Scout", cost: 1, traits: ["tidebound", "striker"],
    stats: { hp: 450, attack: 45, armor: 10, attackTicks: 21, range: 3, maxMana: 50, startMana: 0 },
    ability: { name: "Undertow Shot", effect: { kind: "damage", amount: 150, target: "farthest" } },
  },
  {
    id: "kestrel-vane", name: "Kestrel Vane", cost: 2, traits: ["skyward", "striker"],
    stats: { hp: 550, attack: 60, armor: 15, attackTicks: 20, range: 3, maxMana: 70, startMana: 10 },
    ability: { name: "Talon Dive", effect: { kind: "damage", amount: 260, target: "lowestHp" } },
  },
  {
    id: "coralyn", name: "Coralyn", cost: 2, traits: ["tidebound", "mystic"],
    stats: { hp: 550, attack: 40, armor: 15, attackTicks: 30, range: 3, maxMana: 60, startMana: 20 },
    ability: { name: "Tidepool Mend", effect: { kind: "heal", amount: 300, target: "lowestAlly" } },
  },
  {
    id: "ashen-bulwark", name: "Ashen Bulwark", cost: 2, traits: ["emberkin", "warden"],
    stats: { hp: 800, attack: 45, armor: 40, attackTicks: 33, range: 1, maxMana: 90, startMana: 30 },
    ability: { name: "Cinder Slam", effect: { kind: "stun", ticks: 45, target: "current" } },
  },
  {
    id: "thornmother-ysa", name: "Thornmother Ysa", cost: 3, traits: ["ironroot", "mystic"],
    stats: { hp: 750, attack: 55, armor: 25, attackTicks: 30, range: 2, maxMana: 80, startMana: 20 },
    ability: { name: "Bramble Bind", effect: { kind: "stun", ticks: 60, target: "current" } },
  },
  {
    id: "rook-galeblade", name: "Rook Galeblade", cost: 3, traits: ["skyward", "warden"],
    stats: { hp: 850, attack: 65, armor: 35, attackTicks: 27, range: 1, maxMana: 70, startMana: 0 },
    ability: { name: "Crosswind Cut", effect: { kind: "damage", amount: 320, target: "current" } },
  },
  {
    id: "magmaw", name: "Magmaw", cost: 4, traits: ["emberkin", "warden"],
    stats: { hp: 1100, attack: 75, armor: 45, attackTicks: 30, range: 1, maxMana: 100, startMana: 40 },
    ability: { name: "Molten Maw", effect: { kind: "damage", amount: 500, target: "current" } },
  },
  {
    id: "drowned-oracle", name: "The Drowned Oracle", cost: 5, traits: ["tidebound", "mystic"],
    stats: { hp: 950, attack: 70, armor: 25, attackTicks: 30, range: 4, maxMana: 90, startMana: 30 },
    ability: { name: "Abyssal Verdict", effect: { kind: "damage", amount: 700, target: "lowestHp" } },
  },
] as const satisfies readonly UnitDef[];

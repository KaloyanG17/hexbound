import type { UnitDef } from "./types";

// Original cast: 6 characters per cost tier, 30 in total. To add a character, append an entry
// here, add its look in apps/web/src/game/three/looks.ts, and keep 6 per tier (the test enforces it).
export const units = [
  // Cost 1
  {
    id: "pip-cinderpaw", name: "Pip Cinderpaw", cost: 1, role: "Skirmisher", traits: ["emberkin", "striker"],
    lore: "A cinder-furred kit who believes every fight is a race she can win.",
    stats: { hp: 500, attack: 50, armor: 15, attackTicks: 24, range: 1, maxMana: 60, startMana: 0 },
    ability: { name: "Spark Pounce", effect: { kind: "damage", amount: 180, target: "current" } },
  },
  {
    id: "mossback-grunt", name: "Mossback Grunt", cost: 1, role: "Guardian", traits: ["ironroot", "warden"],
    lore: "Moss grows on his shell because he never bothers to brush it off.",
    stats: { hp: 700, attack: 40, armor: 35, attackTicks: 33, range: 1, maxMana: 80, startMana: 20 },
    ability: { name: "Bark Up", effect: { kind: "heal", amount: 250, target: "self" } },
  },
  {
    id: "brine-scout", name: "Brine Scout", cost: 1, role: "Marksman", traits: ["tidebound", "striker"],
    lore: "Watches the tide turn from the cliffs and fires before the wave breaks.",
    stats: { hp: 450, attack: 45, armor: 10, attackTicks: 21, range: 3, maxMana: 50, startMana: 0 },
    ability: { name: "Undertow Shot", effect: { kind: "damage", amount: 150, target: "farthest" } },
  },
  {
    id: "ember-squire", name: "Ember Squire", cost: 1, role: "Bruiser", traits: ["emberkin", "warden"],
    lore: "Trained at the forge gates, he swears the sparks in his blade are loyal to him.",
    stats: { hp: 620, attack: 48, armor: 25, attackTicks: 27, range: 1, maxMana: 70, startMana: 0 },
    ability: { name: "Ember Riposte", effect: { kind: "damage", amount: 200, target: "current" } },
  },
  {
    id: "tidefin-runner", name: "Tidefin Runner", cost: 1, role: "Skirmisher", traits: ["tidebound", "striker"],
    lore: "Fins on her forearms cut the water and her opponents alike.",
    stats: { hp: 470, attack: 52, armor: 10, attackTicks: 22, range: 1, maxMana: 50, startMana: 0 },
    ability: { name: "Riptide Dash", effect: { kind: "damage", amount: 170, target: "current" } },
  },
  {
    id: "thistle-sprite", name: "Thistle Sprite", cost: 1, role: "Caster", traits: ["mystic"],
    lore: "A seed-headed spirit that mends wounds by humming to the plants.",
    stats: { hp: 420, attack: 30, armor: 5, attackTicks: 30, range: 2, maxMana: 60, startMana: 20 },
    ability: { name: "Thistle Mend", effect: { kind: "heal", amount: 220, target: "lowestAlly" } },
  },

  // Cost 2
  {
    id: "kestrel-vane", name: "Kestrel Vane", cost: 2, role: "Marksman", traits: ["skyward", "striker"],
    lore: "A glider who hunts from the thermals and drops like a stone.",
    stats: { hp: 550, attack: 60, armor: 15, attackTicks: 20, range: 3, maxMana: 70, startMana: 10 },
    ability: { name: "Talon Dive", effect: { kind: "damage", amount: 260, target: "lowestHp" } },
  },
  {
    id: "coralyn", name: "Coralyn", cost: 2, role: "Caster", traits: ["tidebound", "mystic"],
    lore: "Keeps a reef in her satchel and a song for every sick fish.",
    stats: { hp: 550, attack: 40, armor: 15, attackTicks: 30, range: 3, maxMana: 60, startMana: 20 },
    ability: { name: "Tidepool Mend", effect: { kind: "heal", amount: 300, target: "lowestAlly" } },
  },
  {
    id: "ashen-bulwark", name: "Ashen Bulwark", cost: 2, role: "Guardian", traits: ["emberkin", "warden"],
    lore: "A shield-wall of living embers that has never once been pushed back.",
    stats: { hp: 800, attack: 45, armor: 40, attackTicks: 33, range: 1, maxMana: 90, startMana: 30 },
    ability: { name: "Cinder Slam", effect: { kind: "stun", ticks: 45, target: "current" } },
  },
  {
    id: "gale-lancer", name: "Gale Lancer", cost: 2, role: "Skirmisher", traits: ["skyward", "striker"],
    lore: "Rides the wind on a spear-tipped glide, striking before the gust fades.",
    stats: { hp: 560, attack: 58, armor: 15, attackTicks: 24, range: 1, maxMana: 60, startMana: 0 },
    ability: { name: "Gust Thrust", effect: { kind: "damage", amount: 240, target: "current" } },
  },
  {
    id: "iron-hollow", name: "Iron Hollow", cost: 2, role: "Guardian", traits: ["ironroot", "warden"],
    lore: "An old oak wrapped in plate, it hums when it is calm and creaks when it is not.",
    stats: { hp: 780, attack: 42, armor: 45, attackTicks: 36, range: 1, maxMana: 90, startMana: 30 },
    ability: { name: "Hollow Stance", effect: { kind: "heal", amount: 320, target: "self" } },
  },
  {
    id: "lantern-wisp", name: "Lantern Wisp", cost: 2, role: "Caster", traits: ["emberkin", "mystic"],
    lore: "Drifts ahead of the squads, lighting the way and marking the enemy for flame.",
    stats: { hp: 500, attack: 35, armor: 10, attackTicks: 28, range: 2, maxMana: 60, startMana: 0 },
    ability: { name: "Lantern Flare", effect: { kind: "damage", amount: 230, target: "farthest" } },
  },

  // Cost 3
  {
    id: "thornmother-ysa", name: "Thornmother Ysa", cost: 3, role: "Caster", traits: ["ironroot", "mystic"],
    lore: "Her brambles grow wherever she walks and hold whatever she names.",
    stats: { hp: 750, attack: 55, armor: 25, attackTicks: 30, range: 2, maxMana: 80, startMana: 20 },
    ability: { name: "Bramble Bind", effect: { kind: "stun", ticks: 60, target: "current" } },
  },
  {
    id: "rook-galeblade", name: "Rook Galeblade", cost: 3, role: "Bruiser", traits: ["skyward", "warden"],
    lore: "A heavy-armoured flier who turns crosswinds into a blade.",
    stats: { hp: 850, attack: 65, armor: 35, attackTicks: 27, range: 1, maxMana: 70, startMana: 0 },
    ability: { name: "Crosswind Cut", effect: { kind: "damage", amount: 320, target: "current" } },
  },
  {
    id: "storm-sage", name: "Storm Sage", cost: 3, role: "Caster", traits: ["skyward", "mystic"],
    lore: "Reads the coming squalls in the feathers of passing birds.",
    stats: { hp: 640, attack: 50, armor: 15, attackTicks: 30, range: 3, maxMana: 70, startMana: 20 },
    ability: { name: "Thunder Verdict", effect: { kind: "damage", amount: 300, target: "lowestHp" } },
  },
  {
    id: "tide-warden-oru", name: "Tide Warden Oru", cost: 3, role: "Guardian", traits: ["tidebound", "warden"],
    lore: "Stands in the surf each dawn until the sea decides he may stay.",
    stats: { hp: 900, attack: 50, armor: 40, attackTicks: 33, range: 1, maxMana: 80, startMana: 20 },
    ability: { name: "Undertow Bulwark", effect: { kind: "heal", amount: 280, target: "self" } },
  },
  {
    id: "ember-duelist", name: "Ember Duelist", cost: 3, role: "Skirmisher", traits: ["emberkin", "striker"],
    lore: "Two blades, one flame, and an unbroken record of never stepping back.",
    stats: { hp: 720, attack: 74, armor: 20, attackTicks: 22, range: 1, maxMana: 60, startMana: 0 },
    ability: { name: "Twin Cinders", effect: { kind: "damage", amount: 280, target: "current" } },
  },
  {
    id: "bog-shaman", name: "Bog Shaman", cost: 3, role: "Caster", traits: ["ironroot", "mystic"],
    lore: "Sinks his enemies into the marsh one fat bubble at a time.",
    stats: { hp: 700, attack: 45, armor: 20, attackTicks: 32, range: 2, maxMana: 70, startMana: 10 },
    ability: { name: "Mire Snare", effect: { kind: "stun", ticks: 50, target: "current" } },
  },

  // Cost 4
  {
    id: "magmaw", name: "Magmaw", cost: 4, role: "Bruiser", traits: ["emberkin", "warden"],
    lore: "A furnace-hide beast that wakes only when the volcano sneezes.",
    stats: { hp: 1100, attack: 75, armor: 45, attackTicks: 30, range: 1, maxMana: 100, startMana: 40 },
    ability: { name: "Molten Maw", effect: { kind: "damage", amount: 500, target: "current" } },
  },
  {
    id: "stormcaller-ilse", name: "Stormcaller Ilse", cost: 4, role: "Caster", traits: ["skyward", "tidebound"],
    lore: "Calls rain onto her allies and lightning onto everyone else.",
    stats: { hp: 900, attack: 60, armor: 25, attackTicks: 30, range: 3, maxMana: 80, startMana: 30 },
    ability: { name: "Tempest Mend", effect: { kind: "heal", amount: 420, target: "lowestAlly" } },
  },
  {
    id: "lantern-king", name: "Lantern King", cost: 4, role: "Caster", traits: ["emberkin", "mystic"],
    lore: "Wears a crown of lamps, and the lamps never go out.",
    stats: { hp: 950, attack: 55, armor: 25, attackTicks: 30, range: 3, maxMana: 80, startMana: 20 },
    ability: { name: "Sunfire Crown", effect: { kind: "damage", amount: 450, target: "farthest" } },
  },
  {
    id: "stone-behemoth", name: "Stone Behemoth", cost: 4, role: "Guardian", traits: ["ironroot", "warden"],
    lore: "A hillside that decided to walk. It is in no hurry to arrive.",
    stats: { hp: 1350, attack: 62, armor: 60, attackTicks: 40, range: 1, maxMana: 110, startMana: 40 },
    ability: { name: "Quake Stomp", effect: { kind: "stun", ticks: 75, target: "current" } },
  },
  {
    id: "veil-hunter", name: "Veil Hunter", cost: 4, role: "Marksman", traits: ["striker", "skyward"],
    lore: "Hides in the mist and fires from a place no one thought to look.",
    stats: { hp: 800, attack: 80, armor: 20, attackTicks: 26, range: 4, maxMana: 70, startMana: 0 },
    ability: { name: "Shadow Volley", effect: { kind: "damage", amount: 380, target: "lowestHp" } },
  },
  {
    id: "coral-titan", name: "Coral Titan", cost: 4, role: "Guardian", traits: ["tidebound", "warden"],
    lore: "Built one reef at a time, and every reef is a bit of his body.",
    stats: { hp: 1250, attack: 58, armor: 50, attackTicks: 38, range: 1, maxMana: 100, startMana: 30 },
    ability: { name: "Reef Surge", effect: { kind: "heal", amount: 380, target: "self" } },
  },

  // Cost 5
  {
    id: "drowned-oracle", name: "The Drowned Oracle", cost: 5, role: "Caster", traits: ["tidebound", "mystic"],
    lore: "Speaks from beneath the waves and is never wrong about who will drown next.",
    stats: { hp: 950, attack: 70, armor: 25, attackTicks: 30, range: 4, maxMana: 90, startMana: 30 },
    ability: { name: "Abyssal Verdict", effect: { kind: "damage", amount: 700, target: "lowestHp" } },
  },
  {
    id: "ember-sovereign", name: "Ember Sovereign", cost: 5, role: "Bruiser", traits: ["emberkin", "warden"],
    lore: "Rules the forge-city from a throne that is still warm to the touch.",
    stats: { hp: 1200, attack: 85, armor: 45, attackTicks: 30, range: 1, maxMana: 90, startMana: 40 },
    ability: { name: "Sovereign's Flame", effect: { kind: "damage", amount: 650, target: "current" } },
  },
  {
    id: "ironroot-patriarch", name: "Ironroot Patriarch", cost: 5, role: "Guardian", traits: ["ironroot", "mystic"],
    lore: "The oldest tree in the grove, and the only one that remembers the first seed.",
    stats: { hp: 1400, attack: 60, armor: 55, attackTicks: 36, range: 2, maxMana: 100, startMana: 40 },
    ability: { name: "Ancestral Bark", effect: { kind: "heal", amount: 500, target: "lowestAlly" } },
  },
  {
    id: "sky-regent", name: "Sky Regent", cost: 5, role: "Marksman", traits: ["skyward", "striker"],
    lore: "Commands the high winds and expects the low ones to bow.",
    stats: { hp: 1000, attack: 92, armor: 25, attackTicks: 24, range: 4, maxMana: 90, startMana: 20 },
    ability: { name: "Regal Dive", effect: { kind: "damage", amount: 620, target: "lowestHp" } },
  },
  {
    id: "tide-empress", name: "Tide Empress", cost: 5, role: "Caster", traits: ["tidebound", "mystic"],
    lore: "Her court is the ocean floor and her laws are the tides.",
    stats: { hp: 1050, attack: 60, armor: 30, attackTicks: 30, range: 3, maxMana: 90, startMana: 40 },
    ability: { name: "Empress's Undertow", effect: { kind: "stun", ticks: 90, target: "current" } },
  },
  {
    id: "aurora-wyrm", name: "Aurora Wyrm", cost: 5, role: "Bruiser", traits: ["skyward", "tidebound"],
    lore: "Sleeps under the polar lights and breathes whatever colour the sky is that night.",
    stats: { hp: 1100, attack: 78, armor: 35, attackTicks: 28, range: 2, maxMana: 90, startMana: 30 },
    ability: { name: "Aurora Breath", effect: { kind: "damage", amount: 560, target: "farthest" } },
  },
] as const satisfies readonly UnitDef[];

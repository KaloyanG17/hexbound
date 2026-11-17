import type { ItemDef } from "./types";

// Components drop from monsters. Two components combine into a finished item.
// Every finished item lists its two components in `recipe`; the content test checks they exist.
export const items = [
  // Components
  { id: "ember-shard", name: "Ember Shard", kind: "component", stats: { attack: 8 }, description: "A warm sliver of forge glass. +8 attack." },
  { id: "tide-pearl", name: "Tide Pearl", kind: "component", stats: { hp: 120 }, description: "Smooth and cold to the touch. +120 health." },
  { id: "iron-scale", name: "Iron Scale", kind: "component", stats: { armor: 15 }, description: "A plate from an old guardian. +15 armour." },
  { id: "gale-feather", name: "Gale Feather", kind: "component", stats: { attackTicks: -3 }, description: "Light enough to ride the wind. Attacks a little faster." },
  { id: "sunstone", name: "Sunstone", kind: "component", stats: { startMana: 15 }, description: "Holds a little daylight. Starts each fight with 15 mana." },
  { id: "thorn-bark", name: "Thorn Bark", kind: "component", stats: { hp: 40, armor: 10 }, description: "Bristly and tough. +40 health, +10 armour." },
  { id: "wyrm-fang", name: "Wyrm Fang", kind: "component", stats: { attack: 12 }, description: "Still sharp after the wyrm is gone. +12 attack." },
  { id: "mystic-lens", name: "Mystic Lens", kind: "component", stats: { maxMana: -10 }, description: "Focuses spellwork. Needs 10 less mana to cast." },

  // Finished items
  { id: "blade-of-embers", name: "Blade of Embers", kind: "item", stats: { attack: 25 }, recipe: ["ember-shard", "wyrm-fang"], description: "+25 attack." },
  { id: "tidal-bulwark", name: "Tidal Bulwark", kind: "item", stats: { hp: 200, armor: 15 }, recipe: ["tide-pearl", "iron-scale"], description: "+200 health, +15 armour." },
  { id: "gale-bow", name: "Gale Bow", kind: "item", stats: { attack: 15, attackTicks: -4 }, recipe: ["gale-feather", "wyrm-fang"], description: "+15 attack and faster attacks." },
  { id: "thorn-plate", name: "Thorn Plate", kind: "item", stats: { armor: 30, hp: 80 }, recipe: ["thorn-bark", "iron-scale"], description: "+30 armour, +80 health." },
  { id: "sunspire-crown", name: "Sunspire Crown", kind: "item", stats: { startMana: 30, maxMana: -20 }, recipe: ["sunstone", "mystic-lens"], description: "Starts with 30 mana and needs 20 less to cast." },
  { id: "lifespring", name: "Lifespring", kind: "item", stats: { hp: 260 }, recipe: ["tide-pearl", "thorn-bark"], description: "+260 health." },
  { id: "hunters-sight", name: "Hunter's Sight", kind: "item", stats: { attack: 10, attackTicks: -2 }, recipe: ["ember-shard", "gale-feather"], description: "+10 attack and faster attacks." },
] as const satisfies readonly ItemDef[];

// How each unit is drawn, in 3D and in its portrait. Visual-only, so it lives in the web app
// rather than in content. Every unit in packages/content needs an entry here.

export type Body = "brute" | "slim" | "caster" | "beast";
/** The KayKit characters available in the free pack. */
export type KayModel = "Barbarian" | "Knight" | "Mage" | "Ranger" | "Rogue" | "Rogue_Hooded";
export type Weapon = "sword" | "bow" | "staff" | "shield" | "club" | "orb" | "claws" | "spear";
export type Extra = "wings" | "cape" | "horns" | "hood" | "ears" | "crown" | "fins" | "antlers" | "tail";

export interface UnitLook {
  body: Body;
  color: string;
  accent: string;
  weapon: Weapon;
  extra?: Extra;
  float?: boolean;
}

export const LOOKS: Record<string, UnitLook> = {
  // Cost 1
  "pip-cinderpaw": { body: "beast", color: "#e8742c", accent: "#ffd166", weapon: "claws", extra: "ears" },
  "mossback-grunt": { body: "brute", color: "#5c7a3a", accent: "#a3b86c", weapon: "club" },
  "brine-scout": { body: "slim", color: "#2a9d8f", accent: "#bde0dd", weapon: "bow", extra: "hood" },
  "ember-squire": { body: "brute", color: "#c2452d", accent: "#ffb347", weapon: "sword", extra: "cape" },
  "tidefin-runner": { body: "slim", color: "#1b6ca8", accent: "#7fd8ff", weapon: "sword", extra: "fins" },
  "thistle-sprite": { body: "caster", color: "#9ccc65", accent: "#f9f871", weapon: "orb", extra: "antlers", float: true },

  // Cost 2
  "kestrel-vane": { body: "slim", color: "#dfe7f2", accent: "#4f8fd6", weapon: "bow", extra: "wings" },
  "coralyn": { body: "caster", color: "#f28482", accent: "#ffe5d9", weapon: "staff" },
  "ashen-bulwark": { body: "brute", color: "#3d3d46", accent: "#ff7b2e", weapon: "shield", extra: "horns" },
  "gale-lancer": { body: "slim", color: "#e9f1ff", accent: "#8ed1fc", weapon: "spear", extra: "wings" },
  "iron-hollow": { body: "brute", color: "#6b5b3e", accent: "#c9b48a", weapon: "shield", extra: "antlers" },
  "lantern-wisp": { body: "caster", color: "#ffcf56", accent: "#fff3b0", weapon: "orb", float: true },

  // Cost 3
  "thornmother-ysa": { body: "caster", color: "#2d6a4f", accent: "#d8f3dc", weapon: "staff", extra: "horns" },
  "rook-galeblade": { body: "slim", color: "#9aa7b8", accent: "#3a6ea5", weapon: "sword", extra: "cape" },
  "storm-sage": { body: "caster", color: "#3b4cca", accent: "#c6d4ff", weapon: "staff", extra: "hood" },
  "tide-warden-oru": { body: "brute", color: "#1f4e79", accent: "#5fa8d3", weapon: "shield", extra: "fins" },
  "ember-duelist": { body: "slim", color: "#7a1f1f", accent: "#ff7a59", weapon: "sword", extra: "horns" },
  "bog-shaman": { body: "caster", color: "#4e6b3a", accent: "#b5d99c", weapon: "staff", extra: "antlers" },

  // Cost 4
  "magmaw": { body: "beast", color: "#2b1d1d", accent: "#ff4d1a", weapon: "claws", extra: "horns" },
  "stormcaller-ilse": { body: "caster", color: "#5a7bd8", accent: "#e0ecff", weapon: "staff", extra: "crown" },
  "lantern-king": { body: "caster", color: "#b8860b", accent: "#ffe066", weapon: "staff", extra: "crown" },
  "stone-behemoth": { body: "brute", color: "#6e6e6e", accent: "#a8a8a8", weapon: "club", extra: "horns" },
  "veil-hunter": { body: "slim", color: "#2f2f44", accent: "#9d8cff", weapon: "bow", extra: "hood" },
  "coral-titan": { body: "brute", color: "#e26d5c", accent: "#ffd1c4", weapon: "club", extra: "fins" },

  // Cost 5
  "drowned-oracle": { body: "caster", color: "#14404a", accent: "#7ae0d6", weapon: "orb", extra: "hood", float: true },
  "ember-sovereign": { body: "brute", color: "#8b1e3f", accent: "#ffd166", weapon: "sword", extra: "crown" },
  "ironroot-patriarch": { body: "caster", color: "#4a3b2a", accent: "#8fbc8f", weapon: "staff", extra: "antlers" },
  "sky-regent": { body: "beast", color: "#f5f5f5", accent: "#ffd700", weapon: "spear", extra: "wings" },
  "tide-empress": { body: "caster", color: "#0e5e6f", accent: "#b2f5ea", weapon: "orb", extra: "crown" },
  "aurora-wyrm": { body: "beast", color: "#3d2c8d", accent: "#7df9ff", weapon: "claws", extra: "tail" },
};

const FALLBACK: UnitLook = { body: "slim", color: "#888", accent: "#ddd", weapon: "sword" };

export function lookFor(unitId: string): UnitLook {
  return LOOKS[unitId] ?? FALLBACK;
}

/** Which KayKit model stands in for a look: bruisers, guardians, archers, casters and skirmishers. */
export function kayModelFor(look: UnitLook): KayModel {
  switch (look.body) {
    case "brute":
      return look.weapon === "shield" ? "Knight" : "Barbarian";
    case "slim":
      return look.weapon === "bow" || look.weapon === "spear" ? "Ranger" : "Rogue";
    case "caster":
      return "Mage";
    case "beast":
      return "Rogue_Hooded";
  }
}

export const COST_COLORS = ["", "#9aa3ad", "#3fbf7f", "#3b9be0", "#b06cf0", "#f0b429"] as const;

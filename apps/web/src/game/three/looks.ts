// How each unit is drawn. Visual-only, so it lives in the web app rather than in content.
// Swap a look for a real model later without touching game rules.

export interface UnitLook {
  body: "brute" | "slim" | "caster" | "beast";
  color: string;
  accent: string;
  weapon: "sword" | "bow" | "staff" | "shield" | "club" | "orb" | "claws";
  extra?: "wings" | "cape" | "horns" | "hood" | "ears";
  float?: boolean;
}

export const LOOKS: Record<string, UnitLook> = {
  "pip-cinderpaw": { body: "beast", color: "#e8742c", accent: "#ffd166", weapon: "claws", extra: "ears" },
  "mossback-grunt": { body: "brute", color: "#5c7a3a", accent: "#a3b86c", weapon: "club" },
  "brine-scout": { body: "slim", color: "#2a9d8f", accent: "#bde0dd", weapon: "bow", extra: "hood" },
  "kestrel-vane": { body: "slim", color: "#dfe7f2", accent: "#4f8fd6", weapon: "bow", extra: "wings" },
  "coralyn": { body: "caster", color: "#f28482", accent: "#ffe5d9", weapon: "staff" },
  "ashen-bulwark": { body: "brute", color: "#3d3d46", accent: "#ff7b2e", weapon: "shield", extra: "horns" },
  "thornmother-ysa": { body: "caster", color: "#2d6a4f", accent: "#d8f3dc", weapon: "staff", extra: "horns" },
  "rook-galeblade": { body: "slim", color: "#9aa7b8", accent: "#3a6ea5", weapon: "sword", extra: "cape" },
  "magmaw": { body: "beast", color: "#2b1d1d", accent: "#ff4d1a", weapon: "claws", extra: "horns" },
  "drowned-oracle": { body: "caster", color: "#14404a", accent: "#7ae0d6", weapon: "orb", extra: "hood", float: true },
};

const FALLBACK: UnitLook = { body: "slim", color: "#888", accent: "#ddd", weapon: "sword" };

export function lookFor(unitId: string): UnitLook {
  return LOOKS[unitId] ?? FALLBACK;
}

export const COST_COLORS = ["", "#9aa3ad", "#3fbf7f", "#3b9be0", "#b06cf0", "#f0b429"] as const;

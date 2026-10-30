import type { TraitDef } from "./types";

export const traits = [
  { id: "emberkin", name: "Emberkin", breakpoints: [{ count: 2, bonus: { stat: "attack", amount: 10 } }, { count: 4, bonus: { stat: "attack", amount: 25 } }] },
  { id: "tidebound", name: "Tidebound", breakpoints: [{ count: 2, bonus: { stat: "hp", amount: 150 } }, { count: 3, bonus: { stat: "hp", amount: 350 } }] },
  { id: "ironroot", name: "Ironroot", breakpoints: [{ count: 2, bonus: { stat: "armor", amount: 25 } }] },
  { id: "skyward", name: "Skyward", breakpoints: [{ count: 2, bonus: { stat: "attack", amount: 15 } }] },
  { id: "warden", name: "Warden", breakpoints: [{ count: 2, bonus: { stat: "armor", amount: 30 } }, { count: 4, bonus: { stat: "armor", amount: 70 } }] },
  { id: "striker", name: "Striker", breakpoints: [{ count: 2, bonus: { stat: "attack", amount: 12 } }, { count: 3, bonus: { stat: "attack", amount: 25 } }] },
  { id: "mystic", name: "Mystic", breakpoints: [{ count: 2, bonus: { stat: "hp", amount: 120 } }, { count: 3, bonus: { stat: "hp", amount: 260 } }] },
] as const satisfies readonly TraitDef[];

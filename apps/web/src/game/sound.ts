// Spell impact sounds: the Druid Spell Impacts pack (CC0, lentikula), 5 variants per family.
// Each ability plays one variant at random, so repeated casts don't sound identical.

export type SpellFamily = "earth" | "plant" | "wind";

const VARIANTS = 5;
const VOLUME = 0.45;

export function playSpell(family: SpellFamily) {
  if (typeof Audio === "undefined") return;
  const n = 1 + Math.floor(Math.random() * VARIANTS);
  const audio = new Audio(`/sounds/spells/${family}/${family}_spell_impact_${n}.wav`);
  audio.volume = VOLUME;
  // Browsers block audio until the player has interacted; the Fight click counts, so this plays.
  audio.play().catch(() => {});
}

// mulberry32. State is a plain object so it can live inside serialisable game state.
export interface Rng {
  state: number;
}

export function createRng(seed: number): Rng {
  return { state: seed >>> 0 };
}

export function nextU32(rng: Rng): number {
  rng.state = (rng.state + 0x6d2b79f5) >>> 0;
  let t = rng.state;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return (t ^ (t >>> 14)) >>> 0;
}

/** Integer in [0, maxExclusive). */
export function nextInt(rng: Rng, maxExclusive: number): number {
  if (maxExclusive <= 0) throw new Error(`nextInt: maxExclusive must be > 0, got ${maxExclusive}`);
  return nextU32(rng) % maxExclusive;
}

export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = nextInt(rng, i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

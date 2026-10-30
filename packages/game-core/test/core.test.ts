import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { baseSet } from "@hexbound/content";
import { describe, expect, it } from "vitest";
import {
  applyCommand, type BoardUnit, cellIndex, copiesForStar, createMatch, createPool, createRng, hashJson,
  hexDistance, isAlive, type MatchState, mergeUnits, neighbors, nextInt, nextU32, type PlayerState,
  poolTotal, resolveRound, returnShop, rollShop, simulateCombat,
} from "../src";

const content = baseSet;
const { cols, rowsPerSide } = content.rules.board;

const teamA: BoardUnit[] = [
  { unitId: "mossback-grunt", star: 1, cell: { col: 3, row: 3 } },
  { unitId: "pip-cinderpaw", star: 2, cell: { col: 2, row: 3 } },
  { unitId: "brine-scout", star: 1, cell: { col: 1, row: 0 } },
  { unitId: "coralyn", star: 1, cell: { col: 4, row: 0 } },
];
const teamB: BoardUnit[] = [
  { unitId: "ashen-bulwark", star: 1, cell: { col: 3, row: 3 } },
  { unitId: "kestrel-vane", star: 1, cell: { col: 5, row: 1 } },
  { unitId: "thornmother-ysa", star: 1, cell: { col: 2, row: 2 } },
];

describe("rng", () => {
  it("same seed gives the same sequence", () => {
    const a = createRng(42);
    const b = createRng(42);
    for (let i = 0; i < 100; i++) expect(nextU32(a)).toBe(nextU32(b));
  });

  it("nextInt stays in range", () => {
    const r = createRng(7);
    for (let i = 0; i < 1000; i++) {
      const n = nextInt(r, 6);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(6);
    }
  });
});

describe("hex", () => {
  it("neighbours are at distance 1 and distance is symmetric", () => {
    for (let row = 0; row < rowsPerSide * 2; row++) {
      for (let col = 0; col < cols; col++) {
        const c = { col, row };
        for (const n of neighbors(c, cols, rowsPerSide * 2)) {
          expect(hexDistance(c, n)).toBe(1);
          expect(hexDistance(n, c)).toBe(1);
        }
      }
    }
  });
});

describe("combat", () => {
  it("is deterministic for the same seed", () => {
    const r1 = simulateCombat([teamA, teamB], 1234, content);
    const r2 = simulateCombat([teamA, teamB], 1234, content);
    expect(hashJson(r1.events)).toBe(hashJson(r2.events));
  });

  it("does not depend on the order units are listed in", () => {
    const r1 = simulateCombat([teamA, teamB], 99, content);
    const r2 = simulateCombat([[...teamA].reverse(), [...teamB].reverse()], 99, content);
    expect(hashJson(r1.events)).toBe(hashJson(r2.events));
  });

  it("always terminates and never stacks two units on one cell", () => {
    for (let seed = 0; seed < 200; seed++) {
      const result = simulateCombat([teamA, teamB], seed, content);
      expect(result.ticks).toBeLessThanOrEqual(content.rules.combat.maxTicks);
      const cellOf = new Map<number, number>();
      for (const e of result.events) {
        if (e.type === "spawn") cellOf.set(e.uid, cellIndex(e.cell, cols));
        if (e.type === "move") cellOf.set(e.uid, cellIndex(e.to, cols));
        if (e.type === "death") cellOf.delete(e.uid);
        if (e.type === "spawn" || e.type === "move") {
          const cells = [...cellOf.values()];
          expect(new Set(cells).size).toBe(cells.length);
        }
      }
    }
  });

  it("a much stronger board wins", () => {
    const strong: BoardUnit[] = [
      { unitId: "magmaw", star: 3, cell: { col: 3, row: 3 } },
      { unitId: "drowned-oracle", star: 2, cell: { col: 3, row: 0 } },
    ];
    const weak: BoardUnit[] = [{ unitId: "pip-cinderpaw", star: 1, cell: { col: 3, row: 3 } }];
    expect(simulateCombat([strong, weak], 5, content).winner).toBe(0);
    expect(simulateCombat([weak, strong], 5, content).winner).toBe(1);
  });

  it("source never calls non-deterministic APIs", () => {
    const dir = join(import.meta.dirname, "../src");
    const banned = /Math\.(random|sin|cos|tan|atan2?|exp|log|pow)\b|Date\.now|performance\.now|localeCompare|new Date\(/;
    for (const file of readdirSync(dir)) {
      const source = readFileSync(join(dir, file), "utf8");
      expect(banned.test(source), `${file} uses a banned API`).toBe(false);
    }
  });
});

describe("pool and shop", () => {
  it("scales with lobby size", () => {
    expect(createPool(content, 8)["pip-cinderpaw"]).toBe(29);
    expect(createPool(content, 4)["pip-cinderpaw"]).toBe(15);
    expect(createPool(content, 2)["drowned-oracle"]).toBe(9);
  });

  it("rolling and returning conserves every copy", () => {
    const pool = createPool(content, 8);
    const total = poolTotal(pool);
    const rng = createRng(3);
    for (let i = 0; i < 500; i++) {
      const shop = rollShop(pool, 1 + (i % 9), rng, content);
      expect(poolTotal(pool) + shop.filter(Boolean).length).toBe(total);
      returnShop(pool, shop);
    }
    expect(poolTotal(pool)).toBe(total);
  });
});

describe("match", () => {
  it("three copies merge into a 2-star, nine into a 3-star", () => {
    const p = { board: [], bench: Array.from({ length: 9 }, () => null) } as unknown as PlayerState;
    for (let i = 0; i < 9; i++) {
      p.bench[p.bench.findIndex((s) => s === null)] = { unitId: "brine-scout", star: 1 };
      mergeUnits(p);
    }
    expect(p.bench.filter(Boolean)).toEqual([{ unitId: "brine-scout", star: 3 }]);
  });

  it("rejects illegal commands without mutating state", () => {
    const m = createMatch({ seed: 1, playerNames: ["a", "b"] }, content);
    const before = hashJson(m);
    expect(applyCommand(m, 0, { type: "place", benchIndex: 0, cell: { col: 0, row: 0 } }, content).ok).toBe(false);
    expect(applyCommand(m, 0, { type: "move", boardIndex: 0, cell: { col: 99, row: 0 } }, content).ok).toBe(false);
    expect(hashJson(m)).toBe(before);
  });

  it.each([2, 3, 5, 8, 11])("a %i-player match always finishes and conserves the pool", (count) => {
    let state = createMatch({ seed: count * 17, playerNames: Array.from({ length: count }, (_, i) => `p${i}`) }, content);
    const total = totalCopies(state);
    while (state.phase === "planning") {
      for (const p of state.players.filter(isAlive)) state = greedyTurn(state, p.id);
      expect(totalCopies(state)).toBe(total);
      const { state: next, fights } = resolveRound(state, content);
      const aliveBefore = state.players.filter(isAlive).length;
      expect(fights).toHaveLength(Math.ceil(aliveBefore / 2));
      state = next;
      expect(state.round).toBeLessThan(200);
    }
    expect(state.players.filter(isAlive).length).toBeLessThanOrEqual(1);
  });
});

function totalCopies(state: MatchState): number {
  let n = poolTotal(state.pool);
  for (const p of state.players) {
    n += p.shop.filter(Boolean).length;
    for (const u of [...p.board, ...p.bench]) if (u) n += copiesForStar(u.star);
  }
  return n;
}

// Placeholder bot: buy what it can afford, fill the board front to back.
function greedyTurn(state: MatchState, id: number): MatchState {
  const run = (cmd: Parameters<typeof applyCommand>[2]) => {
    const r = applyCommand(state, id, cmd, content);
    if (r.ok) state = r.state;
    return r.ok;
  };
  for (let slot = 0; slot < content.rules.shopSize; slot++) run({ type: "buy", slot });
  const p = () => state.players[id]!;
  for (let b = 0; b < p().bench.length && p().board.length < p().level; b++) {
    if (!p().bench[b]) continue;
    const taken = new Set(p().board.map((u) => cellIndex(u.cell, cols)));
    for (let i = cols * rowsPerSide - 1; i >= 0; i--) {
      if (!taken.has(i)) {
        run({ type: "place", benchIndex: b, cell: { col: i % cols, row: Math.floor(i / cols) } });
        break;
      }
    }
  }
  if (p().gold >= 14) run({ type: "buyXp" });
  return state;
}

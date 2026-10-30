import { describe, expect, it } from "vitest";
import { z } from "zod";
import { baseSet } from "../src";

const int = z.number().int();
const nonNeg = int.nonnegative();

const effect = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("damage"), amount: nonNeg, target: z.enum(["current", "farthest", "lowestHp"]) }),
  z.object({ kind: z.literal("heal"), amount: nonNeg, target: z.enum(["self", "lowestAlly"]) }),
  z.object({ kind: z.literal("stun"), ticks: nonNeg, target: z.literal("current") }),
]);

const unit = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  cost: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  traits: z.array(z.string()).min(1),
  stats: z.object({
    hp: int.positive(),
    attack: nonNeg,
    armor: nonNeg,
    attackTicks: int.positive(),
    range: int.positive(),
    maxMana: int.positive(),
    startMana: nonNeg,
  }),
  ability: z.object({ name: z.string().min(1), effect }),
});

describe("content", () => {
  it("every unit matches the schema", () => {
    for (const u of baseSet.units) expect(() => unit.parse(u), u.id).not.toThrow();
  });

  it("unit ids are unique and traits exist", () => {
    const ids = baseSet.units.map((u) => u.id);
    expect(new Set(ids).size).toBe(ids.length);
    const traitIds = new Set(baseSet.traits.map((t) => t.id));
    for (const u of baseSet.units) for (const t of u.traits) expect(traitIds.has(t), `${u.id} -> ${t}`).toBe(true);
  });

  it("shop odds rows sum to 100 and cover every level", () => {
    const { shopOdds, maxLevel, xpToNext } = baseSet.rules;
    expect(shopOdds).toHaveLength(maxLevel);
    expect(xpToNext).toHaveLength(maxLevel - 1);
    for (const row of shopOdds) expect(row.reduce((a, b) => a + b, 0)).toBe(100);
  });

  it("every cost tier offered by the odds has at least one unit", () => {
    const { shopOdds } = baseSet.rules;
    for (let cost = 1; cost <= 5; cost++) {
      const offered = shopOdds.some((row) => row[cost - 1]! > 0);
      if (offered) expect(baseSet.units.some((u) => u.cost === cost), `cost ${cost}`).toBe(true);
    }
  });
});

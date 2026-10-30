import { baseSet } from "@hexbound/content";
import { createMatch, isAlive, resolveRound } from "@hexbound/game-core";
import { describe, expect, it } from "vitest";
import { simpleBotTurn } from "../src";

describe("simpleBotTurn", () => {
  it.each([2, 4, 8])("an all-bot %i-player lobby plays to a winner", (count) => {
    let state = createMatch({ seed: count, playerNames: Array.from({ length: count }, (_, i) => `bot${i}`) }, baseSet);
    let draws = 0;
    let fights = 0;
    while (state.phase === "planning") {
      for (const p of state.players.filter(isAlive)) state = simpleBotTurn(state, p.id, baseSet);
      for (const p of state.players.filter(isAlive)) expect(p.board.length).toBeGreaterThan(0);
      const round = resolveRound(state, baseSet);
      fights += round.fights.length;
      draws += round.fights.filter((f) => f.result.winner === null).length;
      state = round.state;
      expect(state.round).toBeLessThan(80);
    }
    expect(state.players.filter(isAlive).length).toBeLessThanOrEqual(1);
    expect(draws / fights).toBeLessThan(0.25);
  });
});

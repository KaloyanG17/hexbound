import type { ContentSet } from "@hexbound/content";
import { applyCommand, type Cell, type Command, getUnit, type MatchState, type PlayerState } from "@hexbound/game-core";

/**
 * Starter "easy" bot. It only ever issues the same commands a human can, so it works
 * unchanged in the offline host and when filling empty seats on the server.
 * Strategy: buy duplicates and trait matches first, keep interest gold after the
 * early rounds, level when rich, melee in front and ranged in back.
 */
export function simpleBotTurn(start: MatchState, playerId: number, content: ContentSet): MatchState {
  let state = start;
  const me = (): PlayerState => state.players[playerId]!;
  const run = (cmd: Command) => {
    const r = applyCommand(state, playerId, cmd, content);
    if (r.ok) state = r.state;
    return r.ok;
  };
  const reserve = state.round >= 4 ? Math.min(content.rules.economy.interestPer * 3, state.round * 3) : 0;

  const owned = () => [...me().board, ...me().bench.filter((u) => u !== null)].map((u) => u.unitId);
  const score = (unitId: string) => {
    const def = getUnit(content, unitId);
    const mine = owned();
    const dupes = mine.filter((id) => id === unitId).length;
    const traitHits = def.traits.filter((t) => mine.some((id) => getUnit(content, id).traits.includes(t))).length;
    return dupes * 10 + traitHits * 3 + def.cost;
  };
  const slots = me().shop.map((id, slot) => ({ id, slot })).filter((s): s is { id: string; slot: number } => s.id !== null);
  slots.sort((a, b) => score(b.id) - score(a.id) || a.slot - b.slot);
  for (const { id, slot } of slots) {
    const cost = getUnit(content, id).cost;
    if (me().gold - cost >= reserve || score(id) >= 10) run({ type: "buy", slot });
  }

  if (me().gold - content.rules.xpBuyCost >= reserve + 10) run({ type: "buyXp" });

  // Fill the board, strongest first.
  const benchOrder = () =>
    me().bench
      .map((u, i) => ({ u, i }))
      .filter((x): x is { u: NonNullable<typeof x.u>; i: number } => x.u !== null)
      .sort((a, b) => b.u.star * 10 + getUnit(content, b.u.unitId).cost - (a.u.star * 10 + getUnit(content, a.u.unitId).cost));
  for (const { u, i } of benchOrder()) {
    if (me().board.length >= me().level) break;
    const cell = freeCell(me(), getUnit(content, u.unitId).stats.range === 1, content);
    if (cell) run({ type: "place", benchIndex: i, cell });
  }

  // Sell the bench overflow when nearly full so buying never stalls.
  while (me().bench.filter(Boolean).length > content.rules.benchSize - 2) {
    const worst = benchOrder().at(-1);
    if (!worst || !run({ type: "sell", from: "bench", index: worst.i })) break;
  }
  return state;
}

function freeCell(p: PlayerState, melee: boolean, content: ContentSet): Cell | null {
  const { cols, rowsPerSide } = content.rules.board;
  const rows = Array.from({ length: rowsPerSide }, (_, r) => (melee ? rowsPerSide - 1 - r : r));
  const centreOut = Array.from({ length: cols }, (_, i) => i).sort((a, b) => Math.abs(a - (cols - 1) / 2) - Math.abs(b - (cols - 1) / 2) || a - b);
  for (const row of rows) {
    for (const col of centreOut) {
      if (!p.board.some((u) => u.cell.col === col && u.cell.row === row)) return { col, row };
    }
  }
  return null;
}

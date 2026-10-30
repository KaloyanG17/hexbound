# Hexbound

An auto-battler with an original cast, built as one deterministic game core that runs
anywhere: in the browser for offline play against bots today, on a game server for PvP next.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # all packages
npm run typecheck
```

## Layout

| Path | What it is |
|---|---|
| `packages/content` | Units, traits and the rules table as typed data. Adding a character = one entry in `units.ts`. |
| `packages/game-core` | Pure TypeScript rules: seeded RNG, hex math, shared pool, shop, merging, planning commands, round resolution and the combat simulation. No React, DOM or network code. |
| `packages/ai` | Bots. They issue the same `Command`s as a human, so they can fill seats offline or on the server. |
| `apps/web` | Next.js app. The UI only talks to a `GameTransport`; `LocalTransport` runs the core in-process with bots. |

## Rules the core must keep

- **Deterministic.** Same boards + seed + content → same combat events, in any JS engine.
  Integer math only; no `Math.random`, `Date.now`, trig or `localeCompare` in `game-core/src`
  (a test fails if they appear). All randomness goes through `rng.ts`.
- **Pure.** `applyCommand` and `resolveRound` return new state and never mutate their input.
- **Lobby size is a setting.** `createMatch` takes 2–16 seats; the pool scales with seat count,
  and with an odd number alive one player fights a ghost copy of another board.

## Current scope

Offline only: you against bots, in the browser. The board is a three.js scene
(React Three Fiber) in `apps/web/src/game/three/`. Units are built from primitives in
`Figure.tsx`, with looks in `looks.ts`; the look is visual only and never affects rules.

## Next steps

1. Move `LocalTransport` into a Web Worker (same interface).
2. Add Serwist + Dexie for an installable offline build with save/resume.
3. Drag units onto the sell zone; add real unit models and combat VFX (projectiles, stuns).
4. Later: `apps/game-server` (Colyseus) with a `RemoteTransport` for PvP.

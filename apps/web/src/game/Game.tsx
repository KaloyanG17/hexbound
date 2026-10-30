"use client";

import { activeTraits, type Cell, type Command, type FightRecord, getUnit, isAlive, type MatchState, sameCell, type Side } from "@hexbound/game-core";
import { useEffect, useState } from "react";
import { Replay } from "./Replay";
import { LazyArena } from "./three/LazyArena";
import { benchToWorld, cellToWorld } from "./three/layout";
import { type ArenaUnit, type DragSource, type DropTarget, sameSource } from "./three/types";
import { Portrait } from "./Portrait";
import { type GameTransport, LocalTransport } from "./transport";
import { type InspectTarget, UnitInspector } from "./UnitInspector";
import styles from "./game.module.css";

export function Game() {
  const [transport, setTransport] = useState<GameTransport | null>(null);
  return transport ? <Match transport={transport} onQuit={() => setTransport(null)} /> : <Lobby onStart={setTransport} />;
}

function Lobby({ onStart }: { onStart: (t: GameTransport) => void }) {
  const [players, setPlayers] = useState(8);
  return (
    <div className={styles.lobby}>
      <h1>Hexbound</h1>
      <p className={styles.muted}>Offline match against bots. Drag units between the board and your bench, or click to select and place.</p>
      <label className={styles.field}>
        Players
        <select value={players} onChange={(e) => setPlayers(Number(e.target.value))}>
          {[2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </label>
      <button type="button" className={styles.primary} onClick={() => onStart(new LocalTransport(Math.floor(Math.random() * 2 ** 32), players))}>
        Start offline match
      </button>
    </div>
  );
}

function Match({ transport, onQuit }: { transport: GameTransport; onQuit: () => void }) {
  const { content, playerId } = transport;
  const { rules } = content;
  const { cols, rowsPerSide } = rules.board;
  const [state, setState] = useState<MatchState>(() => transport.getState());
  const [selection, setSelection] = useState<DragSource | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [replay, setReplay] = useState<FightRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [inspect, setInspect] = useState<InspectTarget | null>(null);

  useEffect(() => transport.subscribe(setState), [transport]);

  const me = state.players[playerId]!;
  const send = async (cmd: Command) => {
    const r = await transport.send(cmd);
    setError(r.ok ? null : r.error);
    setSelection(null);
  };

  const act = (src: DragSource, target: DropTarget) => {
    if (target.kind === "cell") {
      return send(src.from === "bench"
        ? { type: "place", benchIndex: src.index, cell: target.cell }
        : { type: "move", boardIndex: src.index, cell: target.cell });
    }
    if (src.from === "board") return send({ type: "bench", boardIndex: src.index });
    setSelection(null);
  };

  const onCellClick = (cell: Cell) => {
    if (selection) return act(selection, { kind: "cell", cell });
    const i = me.board.findIndex((u) => sameCell(u.cell, cell));
    if (i >= 0) setSelection({ from: "board", index: i });
  };

  const ready = async () => {
    setBusy(true);
    const fights = await transport.ready();
    setBusy(false);
    setSelection(null);
    setReplay(fights.find((f) => f.a === playerId || (f.b === playerId && f.ghostOf === null)) ?? null);
  };

  if (replay) {
    const mySide: Side = replay.a === playerId ? 0 : 1;
    const names: [string, string] = [state.players[replay.a]!.name, state.players[replay.b]!.name];
    return <Replay fight={replay} mySide={mySide} names={names} content={content} onDone={() => setReplay(null)} />;
  }

  if (state.phase === "ended" || !isAlive(me)) {
    const placement = 1 + state.players.filter((p) => p.id !== playerId && (isAlive(p) || (p.eliminatedRound ?? 0) > (me.eliminatedRound ?? Infinity))).length;
    return (
      <div className={styles.lobby}>
        <h1>{placement === 1 ? "You win!" : `You placed #${placement}`}</h1>
        <Standings state={state} playerId={playerId} />
        <button type="button" className={styles.primary} onClick={onQuit}>Back to lobby</button>
      </div>
    );
  }

  const arenaUnits: ArenaUnit[] = [
    ...me.board.map((u, i): ArenaUnit => {
      const source: DragSource = { from: "board", index: i };
      return {
        key: `board-${i}`, unitId: u.unitId, star: u.star, pos: cellToWorld(u.cell, cols, rowsPerSide), enemy: false,
        hp: 0, maxHp: 0, mana: 0, maxMana: 0, dead: false, pulse: 0, hit: 0, source,
        selected: selection !== null && sameSource(selection, source),
      };
    }),
    ...me.bench.flatMap((u, i): ArenaUnit[] => {
      if (!u) return [];
      const source: DragSource = { from: "bench", index: i };
      return [{
        key: `bench-${i}`, unitId: u.unitId, star: u.star, pos: benchToWorld(i, rules.benchSize, rowsPerSide), enemy: false,
        hp: 0, maxHp: 0, mana: 0, maxMana: 0, dead: false, pulse: 0, hit: 0, source,
        selected: selection !== null && sameSource(selection, source),
      }];
    }),
  ];

  const traits = activeTraits(me.board.map((u) => u.unitId), content).filter((t) => t.count > 0).sort((a, b) => b.level - a.level || b.count - a.count);
  const xpNeeded = rules.xpToNext[me.level - 1];

  return (
    <div className={styles.match}>
      <header className={styles.hud}>
        <span>Round {state.round}</span>
        <span>❤ {me.hp}</span>
        <span>Gold {me.gold}</span>
        <span>Lv {me.level}{xpNeeded ? ` (${me.xp}/${xpNeeded} xp)` : ""}</span>
        <span>Board {me.board.length}/{me.level}</span>
        {me.streak !== 0 ? <span>{me.streak > 0 ? `🔥 ${me.streak}` : `❄ ${-me.streak}`}</span> : null}
      </header>

      <div className={styles.stage}>
        <LazyArena
          cols={cols}
          rows={rowsPerSide}
          ownRows={rowsPerSide}
          benchCount={rules.benchSize}
          framing="plan"
          units={arenaUnits}
          floaters={[]}
          interactive
          dropHint={selection !== null}
          onCellClick={onCellClick}
          onSelect={(src) => setSelection((prev) => (prev && sameSource(prev, src) ? null : src))}
          onDrop={act}
          onInspect={(unitId, star) => setInspect({ unitId, star })}
        />

        <aside className={`${styles.overlay} ${styles.overlayLeft}`}>
          <h3>Traits</h3>
          {traits.length === 0 ? <p className={styles.muted}>Place units to activate traits.</p> : null}
          {traits.map((t) => {
            const def = content.traits.find((x) => x.id === t.traitId)!;
            const next = def.breakpoints.find((b) => b.count > t.count);
            return (
              <div key={t.traitId} className={t.level >= 0 ? styles.traitOn : styles.traitOff}>
                {def.name} {t.count}{next ? `/${next.count}` : ""}
              </div>
            );
          })}
        </aside>

        <aside className={`${styles.overlay} ${styles.overlayRight}`}>
          <h3>Players</h3>
          <Standings state={state} playerId={playerId} />
        </aside>

        <div className={styles.stageHint}>
          {selection ? "Click a hex to place or move the selected unit" : "Drag units to a hex or bench slot · click a unit to select it"}
        </div>
      </div>

      <div className={styles.controls}>
        <button type="button" onClick={() => send({ type: "reroll" })} disabled={me.gold < rules.rerollCost}>Reroll ({rules.rerollCost}g)</button>
        <button type="button" onClick={() => send({ type: "buyXp" })} disabled={me.gold < rules.xpBuyCost || me.level >= rules.maxLevel}>Buy XP ({rules.xpBuyCost}g)</button>
        <button type="button" onClick={() => selection && send({ type: "sell", from: selection.from, index: selection.index })} disabled={!selection}>Sell selected</button>
        <button type="button" className={styles.primary} onClick={ready} disabled={busy}>{busy ? "Fighting…" : "Ready"}</button>
      </div>
      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.shop}>
        {me.shop.map((id, slot) => {
          if (!id) return <div key={slot} className={styles.shopEmpty} />;
          const def = getUnit(content, id);
          return (
            <button
              key={slot}
              type="button"
              className={styles.shopCard}
              onClick={() => send({ type: "buy", slot })}
              onContextMenu={(e) => {
                e.preventDefault();
                setInspect({ unitId: id, star: 1 });
              }}
              disabled={me.gold < def.cost}
              title="Right-click for details"
            >
              <Portrait unit={def} size={96} />
              <span className={styles.shopName}>{def.name}</span>
              <span className={styles.muted}>{def.role} · {def.traits.map((t) => content.traits.find((x) => x.id === t)?.name).join(" · ")}</span>
              <span className={styles.shopCost}>{def.cost}g</span>
            </button>
          );
        })}
      </div>
      {inspect ? <UnitInspector target={inspect} content={content} onClose={() => setInspect(null)} /> : null}
    </div>
  );
}

function Standings({ state, playerId }: { state: MatchState; playerId: number }) {
  const sorted = [...state.players].sort((a, b) => b.hp - a.hp || (b.eliminatedRound ?? Infinity) - (a.eliminatedRound ?? Infinity));
  return (
    <ol className={styles.standings}>
      {sorted.map((p) => (
        <li key={p.id} className={[p.id === playerId ? styles.me : "", isAlive(p) ? "" : styles.out].join(" ")}>
          <span>{p.name}</span>
          <span>{isAlive(p) ? `❤ ${p.hp}` : `out R${p.eliminatedRound}`}</span>
        </li>
      ))}
    </ol>
  );
}

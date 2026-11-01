"use client";

import type { UnitDef } from "@hexbound/content";
import { activeTraits, type Cell, type Command, type FightRecord, getUnit, isAlive, type MatchState, sameCell, type Side } from "@hexbound/game-core";
import { useEffect, useState } from "react";
import { Portrait } from "./Portrait";
import { Replay } from "./Replay";
import { LazyArena } from "./three/LazyArena";
import { benchToWorld, cellToWorld } from "./three/layout";
import { COST_COLORS } from "./three/looks";
import { type ArenaUnit, type DragSource, type DropTarget, sameSource } from "./three/types";
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
      <h1 className={styles.logo}>HEXBOUND</h1>
      <p className={styles.muted}>Build a team of characters, place them on the hex board and fight. Offline against bots for now.</p>
      <label className={styles.field}>
        Players
        <select value={players} onChange={(e) => setPlayers(Number(e.target.value))}>
          {[2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </label>
      <button type="button" className={styles.primary} onClick={() => onStart(new LocalTransport(Math.floor(Math.random() * 2 ** 32), players))}>
        Start match
      </button>
    </div>
  );
}

function Match({ transport, onQuit }: { transport: GameTransport; onQuit: () => void }) {
  const { content, playerId } = transport;
  const { rules } = content;
  const { cols, rowsPerSide } = rules.board;
  // The whole map is drawn in planning: your half is interactive, the opponent's half stays visible.
  const mapRows = rowsPerSide * 2;
  const [state, setState] = useState<MatchState>(() => transport.getState());
  const [selection, setSelection] = useState<DragSource | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [replay, setReplay] = useState<FightRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [inspect, setInspect] = useState<InspectTarget | null>(null);

  useEffect(() => transport.subscribe(setState), [transport]);

  // Escape clears the selection, the same as clicking empty space in most strategy games.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelection(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Errors fade after a moment, so the message never sits over the board for long.
  useEffect(() => {
    if (!error) return;
    const t = window.setTimeout(() => setError(null), 2600);
    return () => window.clearTimeout(t);
  }, [error]);

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
        <h1 className={styles.logo}>{placement === 1 ? "VICTORY" : `PLACED #${placement}`}</h1>
        <Standings state={state} playerId={playerId} />
        <button type="button" className={styles.primary} onClick={onQuit}>Back to lobby</button>
      </div>
    );
  }

  const arenaUnits: ArenaUnit[] = [
    ...me.board.map((u, i): ArenaUnit => {
      const source: DragSource = { from: "board", index: i };
      return {
        key: `board-${i}`, unitId: u.unitId, star: u.star, pos: cellToWorld(u.cell, cols, mapRows), enemy: false,
        hp: 0, maxHp: 0, mana: 0, maxMana: 0, dead: false, pulse: 0, hit: 0, source,
        selected: selection !== null && sameSource(selection, source),
      };
    }),
    ...me.bench.flatMap((u, i): ArenaUnit[] => {
      if (!u) return [];
      const source: DragSource = { from: "bench", index: i };
      return [{
        key: `bench-${i}`, unitId: u.unitId, star: u.star, pos: benchToWorld(i, rules.benchSize, mapRows), enemy: false,
        hp: 0, maxHp: 0, mana: 0, maxMana: 0, dead: false, pulse: 0, hit: 0, source,
        selected: selection !== null && sameSource(selection, source),
      }];
    }),
  ];

  // The selected unit, if any, so its action card can show what it is and what it's worth.
  const selectedUnit = selection?.from === "board" ? me.board[selection.index] : selection?.from === "bench" ? me.bench[selection.index] : null;
  const selectedDef = selectedUnit ? getUnit(content, selectedUnit.unitId) : null;

  const traits = activeTraits(me.board.map((u) => u.unitId), content).filter((t) => t.count > 0).sort((a, b) => b.level - a.level || b.count - a.count);
  const xpNeeded = rules.xpToNext[me.level - 1];
  const xpPct = xpNeeded ? Math.round((100 * me.xp) / xpNeeded) : 100;
  const canLevel = me.level < rules.maxLevel;

  return (
    <div className={styles.table}>
      <header className={styles.topBar}>
        <div className={styles.roundChip}>
          <span className={styles.roundLabel}>Round</span>
          <strong>{state.round}</strong>
        </div>
        <div className={styles.topStats}>
          <Chip label="Health" value={`${me.hp}`} tone="hp" />
          <Chip label="Gold" value={`${me.gold}`} tone="gold" />
          <Chip label="Level" value={`${me.level}`} tone="mana" />
          {me.streak !== 0 ? <Chip label={me.streak > 0 ? "Win streak" : "Loss streak"} value={`${Math.abs(me.streak)}`} tone={me.streak > 0 ? "hp" : "danger"} /> : null}
        </div>
        <div className={styles.topHint}>
          {selection ? "Click a hex to place it · Esc to cancel" : "Drag units · click to select · right-click for details"}
        </div>
      </header>

      <aside className={styles.leftRail}>
        <section className={styles.card}>
          <h3 className={styles.cardTitle}>Traits</h3>
          {traits.length === 0 ? <p className={styles.muted}>Place characters on the board to activate traits.</p> : null}
          <ul className={styles.traitList}>
            {traits.map((t) => {
              const def = content.traits.find((x) => x.id === t.traitId)!;
              const max = def.breakpoints[def.breakpoints.length - 1]!.count;
              const next = def.breakpoints.find((b) => b.count > t.count);
              return (
                <li key={t.traitId} className={t.level >= 0 ? styles.traitActive : styles.traitInactive}>
                  <div className={styles.traitTop}>
                    <span className={styles.traitName}>{def.name}</span>
                    <span className={styles.traitCount}>{t.count}{next ? `/${next.count}` : `/${max}`}</span>
                  </div>
                  <div className={styles.traitTrack}>
                    {def.breakpoints.map((b) => (
                      <span key={b.count} className={t.count >= b.count ? styles.tickOn : styles.tickOff} style={{ left: `${(100 * b.count) / max}%` }} />
                    ))}
                    <span className={styles.traitFill} style={{ width: `${Math.min(100, (100 * t.count) / max)}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className={styles.card}>
          <h3 className={styles.cardTitle}>Level {me.level}</h3>
          <div className={styles.xpBar}><span style={{ width: `${xpPct}%` }} /></div>
          <div className={styles.xpText}>{xpNeeded && canLevel ? `${me.xp} / ${xpNeeded} XP` : "Max level"}</div>
          <button type="button" className={styles.btn} onClick={() => send({ type: "buyXp" })} disabled={me.gold < rules.xpBuyCost || !canLevel}>
            Buy XP <Coin /> {rules.xpBuyCost}
          </button>
          <div className={styles.muted}>Board {me.board.length}/{me.level} characters</div>
        </section>
      </aside>

      <section className={styles.arenaPane}>
        <LazyArena
          cols={cols}
          rows={mapRows}
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

        {selectedUnit && selectedDef ? (
          <div className={styles.selectCard}>
            <Portrait unit={selectedDef} size={64} />
            <div className={styles.selectText}>
              <strong>{selectedDef.name}</strong>
              <span className={styles.muted}>{"★".repeat(selectedUnit.star)} · {selectedDef.role} · sells for {selectedDef.cost * (selectedUnit.star === 1 ? 1 : selectedUnit.star === 2 ? 3 : 9)}g</span>
            </div>
            <div className={styles.selectActions}>
              {selection?.from === "board" ? (
                <button type="button" className={styles.btn} onClick={() => send({ type: "bench", boardIndex: selection.index })}>Bench</button>
              ) : null}
              <button type="button" className={styles.btnDanger} onClick={() => selection && send({ type: "sell", from: selection.from, index: selection.index })}>Sell</button>
              <button type="button" className={styles.btnGhost} onClick={() => setInspect({ unitId: selectedUnit.unitId, star: selectedUnit.star })}>Details</button>
            </div>
          </div>
        ) : null}

        {error ? <div className={styles.toast}>{error}</div> : null}
      </section>

      <aside className={styles.rightRail}>
        <section className={styles.card}>
          <h3 className={styles.cardTitle}>Players</h3>
          <Standings state={state} playerId={playerId} />
        </section>
      </aside>

      <footer className={styles.bottomBar}>
        <div className={styles.shopControls}>
          <button type="button" className={styles.roundBtn} onClick={() => send({ type: "reroll" })} disabled={me.gold < rules.rerollCost} aria-label="Reroll shop">
            <span className={styles.roundBtnIcon}>↻</span>
            <span className={styles.roundBtnCost}><Coin /> {rules.rerollCost}</span>
          </button>
        </div>

        <div className={styles.shop}>
          {me.shop.map((id, slot) => {
            if (!id) return <div key={slot} className={styles.shopEmpty} aria-label="Sold out" />;
            const def: UnitDef = getUnit(content, id);
            const affordable = me.gold >= def.cost;
            return (
              <button
                key={slot}
                type="button"
                className={styles.shopCard}
                style={{ borderColor: COST_COLORS[def.cost] }}
                onClick={() => send({ type: "buy", slot })}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setInspect({ unitId: id, star: 1 });
                }}
                disabled={!affordable}
                title={`${def.name} — ${def.cost} gold. Click to buy, right-click for details.`}
              >
                <span className={styles.costChip} style={{ background: COST_COLORS[def.cost] }}>{def.cost}</span>
                <Portrait unit={def} size={104} />
                <span className={styles.shopName}>{def.name}</span>
                <span className={styles.shopTraits}>{def.traits.map((t) => content.traits.find((x) => x.id === t)?.name).join(" · ")}</span>
              </button>
            );
          })}
        </div>

        <div className={styles.readyWrap}>
          <button type="button" className={styles.readyBtn} onClick={ready} disabled={busy}>{busy ? "Fighting…" : "Fight"}</button>
        </div>
      </footer>

      {inspect ? <UnitInspector target={inspect} content={content} onClose={() => setInspect(null)} /> : null}
    </div>
  );
}

function Chip({ label, value, tone }: { label: string; value: string; tone: "hp" | "gold" | "mana" | "danger" }) {
  return (
    <div className={`${styles.chip} ${styles[`chip_${tone}`]}`}>
      <span className={styles.chipLabel}>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Coin() {
  return <span className={styles.coin} aria-hidden="true" />;
}

function Standings({ state, playerId }: { state: MatchState; playerId: number }) {
  const sorted = [...state.players].sort((a, b) => b.hp - a.hp || (b.eliminatedRound ?? Infinity) - (a.eliminatedRound ?? Infinity));
  const maxHp = state.players[playerId] ? Math.max(100, ...state.players.map((p) => p.hp)) : 100;
  return (
    <ol className={styles.standings}>
      {sorted.map((p) => {
        const alive = isAlive(p);
        return (
          <li key={p.id} className={[p.id === playerId ? styles.me : "", alive ? "" : styles.out].join(" ")}>
            <span className={styles.avatar}>{p.name.slice(0, 1)}</span>
            <div className={styles.playerText}>
              <div className={styles.playerTop}>
                <span>{p.name}</span>
                <span>{alive ? `${p.hp}` : `out R${p.eliminatedRound}`}</span>
              </div>
              {alive ? <div className={styles.hpBar}><span style={{ width: `${Math.max(0, (100 * p.hp) / maxHp)}%` }} /></div> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

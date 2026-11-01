"use client";

import type { ContentSet } from "@hexbound/content";
import type { Cell, CombatEvent, FightRecord, Side, Star } from "@hexbound/game-core";
import { useEffect, useState } from "react";
import styles from "./game.module.css";
import { cellToWorld } from "./three/layout";
import { type InspectTarget, UnitInspector } from "./UnitInspector";
import { LazyArena } from "./three/LazyArena";
import type { ArenaUnit, Floater } from "./three/types";
import { type SpellFamily, playSpell } from "./sound";

const SPEED = 1.5;
const FLOATER_MS = 900;

interface Live {
  uid: number;
  side: Side;
  unitId: string;
  star: Star;
  cell: Cell;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  alive: boolean;
  pulse: number;
  hit: number;
}

interface Fx {
  cell: Cell;
  text: string;
  tone: Floater["tone"];
  spell?: SpellFamily;
}

// Damage abilities sound like earth impacts, heals like plant magic, stuns like wind.
const SPELL_FOR_EFFECT: Record<"damage" | "heal" | "stun", SpellFamily> = { damage: "earth", heal: "plant", stun: "wind" };

/** Applies one combat event. Text popups and sounds are collected into fx for the caller to show. */
function applyEvent(units: Map<number, Live>, e: CombatEvent, fx: Fx[], content: ContentSet) {
  if (e.type === "spawn") {
    units.set(e.uid, {
      uid: e.uid, side: e.side, unitId: e.unitId, star: e.star, cell: e.cell,
      hp: e.hp, maxHp: e.maxHp, mana: 0, maxMana: e.maxMana, alive: true, pulse: 0, hit: 0,
    });
    return;
  }
  if (e.type === "end") return;
  const u = units.get(e.uid);
  if (!u) return;
  switch (e.type) {
    case "move":
      u.cell = e.to;
      break;
    case "attack":
      u.pulse++;
      break;
    case "cast": {
      u.pulse++;
      const kind = content.units.find((x) => x.id === u.unitId)!.ability.effect.kind;
      fx.push({ cell: u.cell, text: e.ability, tone: "cast", spell: SPELL_FOR_EFFECT[kind] });
      break;
    }
    case "damage":
      u.hp = e.hp;
      u.hit++;
      fx.push({ cell: u.cell, text: `-${e.amount}`, tone: "damage" });
      break;
    case "heal":
      u.hp = e.hp;
      fx.push({ cell: u.cell, text: `+${e.amount}`, tone: "heal" });
      break;
    case "stun":
      fx.push({ cell: u.cell, text: "Stunned", tone: "cast" });
      break;
    case "mana":
      u.mana = e.mana;
      break;
    case "death":
      u.alive = false;
      break;
  }
}

interface ReplayProps {
  fight: FightRecord;
  mySide: Side;
  names: [string, string];
  content: ContentSet;
  onDone: () => void;
}

/** Plays back a combat event log. The simulation already happened; this only animates it. */
export function Replay({ fight, mySide, names, content, onDone }: ReplayProps) {
  const { cols, rowsPerSide } = content.rules.board;
  const rows = rowsPerSide * 2;
  const [units, setUnits] = useState<ArenaUnit[]>([]);
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [finished, setFinished] = useState(false);
  const [inspect, setInspect] = useState<InspectTarget | null>(null);

  useEffect(() => {
    const events = fight.result.events;
    const state = new Map<number, Live>();
    // Flip the board for the second player so their own units always sit nearest the camera.
    const display = (cell: Cell): Cell => (mySide === 0 ? cell : { col: cols - 1 - cell.col, row: rows - 1 - cell.row });
    const toArena = (): ArenaUnit[] =>
      [...state.values()].map((u) => ({
        key: String(u.uid),
        unitId: u.unitId,
        star: u.star,
        pos: cellToWorld(display(u.cell), cols, rows),
        enemy: u.side !== mySide,
        hp: u.hp,
        maxHp: u.maxHp,
        mana: u.mana,
        maxMana: u.maxMana,
        dead: !u.alive,
        selected: false,
        pulse: u.pulse,
        hit: u.hit,
      }));

    let cursor = 0;
    let nextId = 0;
    let raf = 0;
    const startTime = performance.now();
    const frame = (now: number) => {
      const tick = ((now - startTime) / 1000) * content.rules.combat.tickRate * SPEED;
      const fx: Fx[] = [];
      let changed = false;
      while (cursor < events.length && events[cursor]!.t <= tick) {
        applyEvent(state, events[cursor]!, fx, content);
        cursor++;
        changed = true;
      }
      if (changed) setUnits(toArena());
      for (const f of fx) if (f.spell) playSpell(f.spell);
      if (fx.length > 0) {
        const made: Floater[] = fx.map((f) => ({ id: ++nextId, pos: cellToWorld(display(f.cell), cols, rows), text: f.text, tone: f.tone }));
        setFloaters((prev) => [...prev, ...made]);
        for (const m of made) {
          window.setTimeout(() => setFloaters((prev) => prev.filter((x) => x.id !== m.id)), FLOATER_MS);
        }
      }
      if (cursor < events.length) raf = requestAnimationFrame(frame);
      else setFinished(true);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [fight, content, mySide, cols, rows]);

  const winner = fight.result.winner;
  const myDamage = mySide === 0 ? fight.damageToA : fight.damageToB;
  const headline = winner === null ? "Draw" : winner === mySide ? "Victory" : "Defeat";

  return (
    <div className={styles.replay}>
      <div className={styles.replayHeader}>
        <span>{names[mySide === 0 ? 1 : 0]}{fight.ghostOf !== null ? " (ghost)" : ""}</span>
        <span className={styles.muted}>vs</span>
        <span>{names[mySide]}</span>
      </div>
      <div className={styles.stage}>
        <LazyArena
          cols={cols}
          rows={rows}
          ownRows={rowsPerSide}
          benchCount={0}
          framing="fight"
          units={units}
          floaters={floaters}
          interactive={false}
          onInspect={(unitId, star) => setInspect({ unitId, star })}
        />
      </div>
      {inspect ? <UnitInspector target={inspect} content={content} onClose={() => setInspect(null)} /> : null}
      <div className={styles.replayResult}>
        {finished ? (
          <>
            <strong>{headline}</strong>
            {myDamage > 0 ? <span>You lose {myDamage} HP</span> : null}
            <button type="button" className={styles.primary} onClick={onDone}>Continue</button>
          </>
        ) : (
          <button type="button" className={styles.secondary} onClick={onDone}>Skip</button>
        )}
      </div>
    </div>
  );
}

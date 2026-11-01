"use client";

import type { ContentSet } from "@hexbound/content";
import { getUnit, type Star } from "@hexbound/game-core";
import { useEffect, useState } from "react";
import { ModelPortrait } from "./three/ModelPortrait";
import { describeBreakpoints, derivedStats, rangeLabel } from "./inspect";
import styles from "./game.module.css";

export interface InspectTarget {
  unitId: string;
  star: Star;
}

interface Props {
  target: InspectTarget;
  content: ContentSet;
  onClose: () => void;
}

/** Opened by right-clicking a unit on the board, on the bench, in the shop, or in a replay. */
export function UnitInspector({ target, content, onClose }: Props) {
  const [star, setStar] = useState<Star>(target.star);
  const def = getUnit(content, target.unitId);
  const stats = derivedStats(def, star, content);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className={styles.inspectorBackdrop} onClick={onClose} role="presentation">
      <section
        className={styles.inspector}
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.preventDefault()}
        aria-label={`${def.name} details`}
      >
        <button type="button" className={styles.inspectorClose} onClick={onClose} aria-label="Close">×</button>

        <div className={styles.inspectorTop}>
          <ModelPortrait unit={def} size={148} />
          <div className={styles.inspectorTitle}>
            <h2>{def.name}</h2>
            <p className={styles.muted}>{def.role} · {def.cost}-gold character</p>
            <div className={styles.starPicker} role="group" aria-label="Star level">
              {([1, 2, 3] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={s === star ? styles.starOn : styles.starOff}
                  onClick={() => setStar(s)}
                >
                  {"★".repeat(s)}
                </button>
              ))}
            </div>
            <p className={styles.lore}>“{def.lore}”</p>
          </div>
        </div>

        <dl className={styles.statGrid}>
          <Stat label="Health" value={String(stats.hp)} />
          <Stat label="Attack damage" value={String(stats.attack)} />
          <Stat label="Damage per second" value={`~${stats.damagePerSecond}`} />
          <Stat label="Attacks per second" value={stats.attacksPerSecond.toFixed(2)} />
          <Stat label="Range" value={rangeLabel(stats.range)} />
          <Stat label="Armour" value={`${stats.armor} (blocks ${stats.damageReduction}%)`} />
          <Stat label="Mana" value={`${stats.startMana} start / ${stats.maxMana} max`} />
          <Stat label="Cost" value={`${def.cost} gold`} />
        </dl>

        <div className={styles.abilityBox}>
          <span className={styles.abilityLabel}>Ability · {def.ability.name}</span>
          <p>{stats.abilityText}</p>
          <span className={styles.muted}>Cast when mana is full. Mana comes from attacking and taking hits.</span>
        </div>

        <div className={styles.traitList}>
          <span className={styles.abilityLabel}>Traits</span>
          {def.traits.map((traitId) => {
            const trait = content.traits.find((t) => t.id === traitId);
            return (
              <div key={traitId} className={styles.traitRow}>
                <strong>{trait?.name ?? traitId}</strong>
                <span className={styles.muted}>
                  {describeBreakpoints(traitId, content).map((bp) => `${bp.count}: ${bp.text}`).join(" · ")}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.statItem}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

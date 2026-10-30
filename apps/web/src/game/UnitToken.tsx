import type { ContentSet } from "@hexbound/content";
import { getUnit, type Star } from "@hexbound/game-core";
import styles from "./game.module.css";

const COST_COLORS = ["", "#8a8f98", "#3fa66b", "#3b82c4", "#9b5de5", "#e0a526"];

interface Props {
  unitId: string;
  star: Star;
  content: ContentSet;
  hp?: number;
  maxHp?: number;
  mana?: number;
  maxMana?: number;
  enemy?: boolean;
  selected?: boolean;
  dead?: boolean;
}

export function UnitToken({ unitId, star, content, hp, maxHp, mana, maxMana, enemy, selected, dead }: Props) {
  const def = getUnit(content, unitId);
  const initials = def.name.replace(/^The /, "").split(" ").map((w) => w[0]).join("").slice(0, 2);
  const traits = def.traits.map((t) => content.traits.find((x) => x.id === t)?.name ?? t).join(" · ");
  return (
    <div
      className={[styles.token, enemy ? styles.tokenEnemy : "", selected ? styles.tokenSelected : "", dead ? styles.tokenDead : ""].join(" ")}
      style={{ borderColor: COST_COLORS[def.cost] }}
      title={`${def.name} (${def.cost}g) — ${traits}\n${def.ability.name}`}
    >
      <span className={styles.tokenInitials}>{initials}</span>
      <span className={styles.tokenStars}>{"★".repeat(star)}</span>
      {hp !== undefined && maxHp ? (
        <span className={styles.bar}>
          <span className={styles.barHp} style={{ width: `${(100 * hp) / maxHp}%` }} />
        </span>
      ) : null}
      {mana !== undefined && maxMana ? (
        <span className={`${styles.bar} ${styles.barManaTrack}`}>
          <span className={styles.barMana} style={{ width: `${(100 * mana) / maxMana}%` }} />
        </span>
      ) : null}
    </div>
  );
}

import type { UnitDef } from "@hexbound/content";
import { useId } from "react";
import { COST_COLORS, lookFor, type UnitLook } from "./three/looks";

// Portraits are drawn from the same look data as the 3D figures, so the two always agree.
// Everything is drawn in a 120 x 120 box: a glowing backdrop, a silhouette, a head, then accessories.

interface PortraitProps {
  unit: Pick<UnitDef, "id" | "cost">;
  size?: number;
  /** Accessible label. Defaults to the unit id. */
  title?: string;
}

export function Portrait({ unit, size = 120, title }: PortraitProps) {
  const id = "p" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const look = lookFor(unit.id);
  const frame = COST_COLORS[unit.cost];
  const lift = look.float ? -4 : 0;

  return (
    <svg viewBox="0 0 120 120" width={size} height={size} role="img" aria-label={title ?? unit.id} className="portrait">
      <defs>
        <radialGradient id={`${id}-bg`} cx="50%" cy="38%" r="75%">
          <stop offset="0%" stopColor={look.accent} stopOpacity="0.55" />
          <stop offset="100%" stopColor="#0b1018" />
        </radialGradient>
        <radialGradient id={`${id}-halo`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={look.accent} stopOpacity="0.5" />
          <stop offset="100%" stopColor={look.accent} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x="0" y="0" width="120" height="120" rx="14" fill={`url(#${id}-bg)`} />
      <circle cx="60" cy="52" r="46" fill={`url(#${id}-halo)`} />
      <Sparks seed={unit.id} color={look.accent} />

      <g transform={`translate(0 ${lift})`}>
        {look.extra === "wings" ? <Wings look={look} /> : null}
        {look.extra === "cape" ? <path d="M40 72 L26 120 L94 120 L80 72 Z" fill={look.accent} opacity="0.9" /> : null}
        {look.extra === "tail" ? <path d="M86 108 Q116 104 110 80" fill="none" stroke={look.accent} strokeWidth="5" strokeLinecap="round" /> : null}

        <Body look={look} />
        <Head look={look} />
        <Extras look={look} />
        <Weapon look={look} />
      </g>

      <rect x="1.5" y="1.5" width="117" height="117" rx="13" fill="none" stroke={frame} strokeWidth="3" />
    </svg>
  );
}

function Sparks({ seed, color }: { seed: string; color: string }) {
  // Deterministic scatter from the id, so a unit always has the same sparks.
  let state = 0;
  for (const c of seed) state = (state * 31 + c.charCodeAt(0)) >>> 0;
  const dots: { x: number; y: number; r: number }[] = [];
  for (let i = 0; i < 6; i++) {
    state = (state * 1103515245 + 12345) >>> 0;
    const x = 8 + (state % 104);
    state = (state * 1103515245 + 12345) >>> 0;
    const y = 8 + (state % 60);
    dots.push({ x, y, r: 1 + (i % 2) });
  }
  return (
    <g fill={color} opacity="0.5">
      {dots.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={d.r} />)}
    </g>
  );
}

function Body({ look }: { look: UnitLook }) {
  const { color } = look;
  switch (look.body) {
    case "brute":
      return <rect x="26" y="74" width="68" height="46" rx="18" fill={color} />;
    case "slim":
      return <rect x="40" y="72" width="40" height="48" rx="18" fill={color} />;
    case "caster":
      return <path d="M60 62 L94 120 L26 120 Z" fill={color} />;
    case "beast":
      return <ellipse cx="60" cy="100" rx="34" ry="24" fill={color} />;
  }
}

function Head({ look }: { look: UnitLook }) {
  const beast = look.body === "beast";
  const cx = 60;
  const cy = beast ? 58 : 50;
  const r = beast ? 22 : 20;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={look.color} />
      <circle cx={cx - 8} cy={cy - 2} r="3.4" fill="#ffffff" />
      <circle cx={cx + 8} cy={cy - 2} r="3.4" fill="#ffffff" />
      <circle cx={cx - 8} cy={cy - 2} r="1.7" fill="#111111" />
      <circle cx={cx + 8} cy={cy - 2} r="1.7" fill="#111111" />
    </g>
  );
}

function Extras({ look }: { look: UnitLook }) {
  const { accent } = look;
  switch (look.extra) {
    case "horns":
      return (
        <g fill={accent}>
          <path d="M46 40 L40 20 L54 34 Z" />
          <path d="M74 40 L80 20 L66 34 Z" />
        </g>
      );
    case "ears":
      return (
        <g fill={look.color}>
          <ellipse cx="44" cy="34" rx="6" ry="14" transform="rotate(-20 44 34)" />
          <ellipse cx="76" cy="34" rx="6" ry="14" transform="rotate(20 76 34)" />
        </g>
      );
    case "hood":
      return <path d="M38 50 Q60 14 82 50 L82 56 Q60 40 38 56 Z" fill={accent} />;
    case "crown":
      return <path d="M42 36 L48 22 L56 32 L60 18 L64 32 L72 22 L78 36 Z" fill={accent} />;
    case "fins":
      return (
        <g fill={accent}>
          <path d="M34 80 L14 66 L30 92 Z" />
          <path d="M86 80 L106 66 L90 92 Z" />
        </g>
      );
    case "antlers":
      return (
        <g fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round">
          <path d="M48 38 L36 16 M40 26 L30 24 M44 22 L40 10" />
          <path d="M72 38 L84 16 M80 26 L90 24 M76 22 L80 10" />
        </g>
      );
    default:
      return null;
  }
}

function Wings({ look }: { look: UnitLook }) {
  return (
    <g fill={look.accent} opacity="0.85">
      <path d="M40 76 L8 50 L14 82 L30 96 Z" />
      <path d="M80 76 L112 50 L106 82 L90 96 Z" />
    </g>
  );
}

function Weapon({ look }: { look: UnitLook }) {
  const { accent } = look;
  switch (look.weapon) {
    case "sword":
      return (
        <g stroke={accent} strokeWidth="4" strokeLinecap="round">
          <path d="M92 98 L106 52" />
          <path d="M88 92 L98 92" strokeWidth="3" />
        </g>
      );
    case "spear":
      return (
        <g>
          <path d="M96 118 L104 26" stroke="#8a6a4a" strokeWidth="3" />
          <path d="M104 26 L100 38 L110 36 Z" fill={accent} />
        </g>
      );
    case "bow":
      return <path d="M102 56 Q116 84 102 112" fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" />;
    case "staff":
      return (
        <g>
          <path d="M98 118 L102 40" stroke="#8a6a4a" strokeWidth="4" strokeLinecap="round" />
          <circle cx="102" cy="36" r="7" fill={accent} />
        </g>
      );
    case "shield":
      return <circle cx="26" cy="90" r="15" fill={accent} />;
    case "club":
      return <rect x="94" y="62" width="10" height="46" rx="4" fill={accent} transform="rotate(20 99 85)" />;
    case "orb":
      return <circle cx="100" cy="70" r="10" fill={accent} opacity="0.9" />;
    case "claws":
      return (
        <g stroke={accent} strokeWidth="3" strokeLinecap="round">
          <path d="M22 96 L14 84 M28 100 L22 88 M34 98 L30 86" />
        </g>
      );
  }
}

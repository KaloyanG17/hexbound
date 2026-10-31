"use client";

import { Billboard, Html } from "@react-three/drei";
import { Canvas, type ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import type { Cell } from "@hexbound/game-core";
import { memo, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import styles from "../game.module.css";
import { Figure } from "./Figure";
import { BENCH_GAP, benchToWorld, cellToWorld, HEX_R, ROW_STEP, TILE_TOP, type Vec2 } from "./layout";
import { lookFor } from "./looks";
import { type ArenaProps, type ArenaUnit, type DragSource, type DropTarget, sameSource } from "./types";

const GROUND = new THREE.Plane(new THREE.Vector3(0, 1, 0), -TILE_TOP);
const DRAG_SLOP_PX = 6;
// A click fires after the pointerup that ends a drag; ignore it so a drop doesn't also select.
const CLICK_GUARD_MS = 150;

interface Press {
  src: DragSource;
  x: number;
  y: number;
  moved: boolean;
}

export default function Arena(props: ArenaProps) {
  return (
    <div className={styles.stageCanvas}>
      <Canvas dpr={[1, 2]} camera={{ fov: 40, near: 0.1, far: 100 }}>
        <color attach="background" args={["#0b1018"]} />
        <Scene {...props} />
      </Canvas>
    </div>
  );
}

/** Nearest drop target under a ground point: a bench slot below the board, otherwise a hex. */
function resolveDrop([x, z]: Vec2, o: ArenaProps): DropTarget | null {
  const benchEdge = ((o.rows - 1) / 2) * ROW_STEP + HEX_R * 1.4;
  if (o.benchCount > 0 && z > benchEdge) {
    const index = Math.round(x / BENCH_GAP + (o.benchCount - 1) / 2);
    return index >= 0 && index < o.benchCount ? { kind: "bench", index } : null;
  }
  let best: Cell | null = null;
  let bestDist = HEX_R * 1.05;
  for (let row = 0; row < o.ownRows; row++) {
    for (let col = 0; col < o.cols; col++) {
      const [cx, cz] = cellToWorld({ col, row }, o.cols, o.rows);
      const dist = Math.hypot(cx - x, cz - z);
      if (dist < bestDist) {
        bestDist = dist;
        best = { col, row };
      }
    }
  }
  return best ? { kind: "cell", cell: best } : null;
}

function Scene(props: ArenaProps) {
  const { cols, rows, ownRows, benchCount, framing, units, floaters, interactive, dropHint = false } = props;
  const { camera, gl, size } = useThree();
  const [hover, setHover] = useState<string | null>(null);
  const [ghost, setGhost] = useState<{ src: DragSource; point: Vec2 } | null>(null);
  const press = useRef<Press | null>(null);
  const justDragged = useRef(false);
  const latest = useRef(props);

  useEffect(() => {
    latest.current = props;
  });

  // Pull the camera back on narrow panes so the whole bench stays in view.
  const aspect = size.width / Math.max(1, size.height);
  const pullBack = aspect < 1.25 ? 1.25 / Math.max(aspect, 0.4) : 1;
  useEffect(() => {
    if (framing === "plan") camera.position.set(0, 7.6 * pullBack, 7.4 * pullBack);
    else camera.position.set(0, 9.2 * pullBack, 8.4 * pullBack);
    camera.lookAt(0, 0, framing === "plan" ? 0.5 : -0.3);
  }, [camera, framing, pullBack]);

  // Drag handling lives on the window so a drag can end anywhere, including off the board.
  useEffect(() => {
    const groundPoint = (clientX: number, clientY: number): Vec2 | null => {
      const rect = gl.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
      const ray = new THREE.Raycaster();
      ray.setFromCamera(ndc, camera);
      const hit = new THREE.Vector3();
      return ray.ray.intersectPlane(GROUND, hit) ? [hit.x, hit.z] : null;
    };
    const onMove = (e: PointerEvent) => {
      const p = press.current;
      if (!p) return;
      if (!p.moved && Math.hypot(e.clientX - p.x, e.clientY - p.y) > DRAG_SLOP_PX) p.moved = true;
      if (!p.moved) return;
      const point = groundPoint(e.clientX, e.clientY);
      if (point) setGhost({ src: p.src, point });
    };
    const onUp = (e: PointerEvent) => {
      const p = press.current;
      press.current = null;
      setGhost(null);
      if (!p?.moved) return;
      justDragged.current = true;
      window.setTimeout(() => {
        justDragged.current = false;
      }, CLICK_GUARD_MS);
      const point = groundPoint(e.clientX, e.clientY);
      const target = point ? resolveDrop(point, latest.current) : null;
      if (target) latest.current.onDrop?.(p.src, target);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [camera, gl]);

  const dragSrc = ghost?.src;
  const ghostUnit = ghost ? units.find((u) => u.source && sameSource(u.source, ghost.src)) : undefined;

  const tiles = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const key = `${col},${row}`;
      const [x, z] = cellToWorld({ col, row }, cols, rows);
      const own = row < ownRows;
      const lit = (own && interactive && hover === key) || (own && dropHint && interactive);
      // Warm, mossy floor like the TFT arena; the lit state shows where a drop will land.
      const color = own ? (lit ? "#7d9a5c" : "#5e7448") : "#7a4f3c";
      const clickable = interactive && own;
      tiles.push(
        <mesh
          key={key}
          position={[x, TILE_TOP / 2, z]}
          onPointerOver={clickable ? (e) => {
            e.stopPropagation();
            setHover(key);
          } : undefined}
          onPointerOut={clickable ? () => setHover(null) : undefined}
          onClick={clickable ? (e) => {
            e.stopPropagation();
            if (!justDragged.current) latest.current.onCellClick?.({ col, row });
          } : undefined}
        >
          <cylinderGeometry args={[HEX_R * 0.96, HEX_R * 0.96, TILE_TOP, 6]} />
          <meshStandardMaterial color={color} roughness={0.75} />
        </mesh>,
      );
    }
  }

  return (
    <>
      <ambientLight intensity={0.9} />
      <hemisphereLight args={["#ffe9c4", "#2a1d12", 0.9]} />
      <directionalLight position={[3, 12, 7]} intensity={1.4} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#0a0f16" />
      </mesh>

      {tiles}

      {Array.from({ length: benchCount }, (_, i) => {
        const [x, z] = benchToWorld(i, benchCount, rows);
        return (
          <mesh key={`pad-${i}`} position={[x, TILE_TOP / 2 - 0.02, z]}>
            <boxGeometry args={[BENCH_GAP * 0.86, TILE_TOP - 0.04, BENCH_GAP * 0.86]} />
            <meshStandardMaterial color="#5a4128" roughness={0.85} />
          </mesh>
        );
      })}

      {units.map((u) => {
        const src = interactive ? u.source : undefined;
        return (
          <Unit3D
            key={u.key}
            unit={u}
            hidden={!!dragSrc && !!src && sameSource(src, dragSrc)}
            onPointerDown={src ? (e) => {
              e.stopPropagation();
              press.current = { src, x: e.clientX, y: e.clientY, moved: false };
            } : undefined}
            onClick={src ? (e) => {
              e.stopPropagation();
              if (!justDragged.current) latest.current.onSelect?.(src);
            } : undefined}
            onContextMenu={(e) => {
              e.stopPropagation();
              e.nativeEvent.preventDefault();
              latest.current.onInspect?.(u.unitId, u.star);
            }}
          />
        );
      })}

      {ghost && ghostUnit ? <Unit3D unit={{ ...ghostUnit, pos: ghost.point }} ghost /> : null}

      {floaters.map((f) => (
        // Spread popups sideways so a hit and its cast label don't land on the same pixel.
        <Html key={f.id} position={[f.pos[0] + ((f.id % 3) - 1) * 0.3, 1.9 + (f.id % 2) * 0.25, f.pos[1]]} center>
          <div className={`${styles.floater} ${styles[f.tone]}`}>{f.text}</div>
        </Html>
      ))}
    </>
  );
}

interface UnitViewProps {
  unit: ArenaUnit;
  ghost?: boolean;
  hidden?: boolean;
  onPointerDown?: (e: ThreeEvent<PointerEvent>) => void;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
  onContextMenu?: (e: ThreeEvent<MouseEvent>) => void;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** One unit: eases towards its position, lunges when it acts, flashes when hit, shrinks when dead. */
const Unit3D = memo(function Unit3D({ unit, ghost = false, hidden = false, onPointerDown, onClick, onContextMenu }: UnitViewProps) {
  const root = useRef<THREE.Group>(null);
  const pose = useRef<THREE.Group>(null);
  const torso = useRef<THREE.MeshStandardMaterial>(null);
  const placed = useRef(false);
  const seen = useRef({ pulse: unit.pulse, hit: unit.hit });
  const fx = useRef({ pulse: 0, hit: 0, alive: unit.dead ? 0 : 1 });
  const look = lookFor(unit.unitId);
  const hpRatio = unit.maxHp > 0 ? Math.max(0.001, clamp01(unit.hp / unit.maxHp)) : 1;
  const manaRatio = unit.maxMana > 0 ? Math.max(0.001, clamp01(unit.mana / unit.maxMana)) : 0;

  useFrame((_, dt) => {
    const g = root.current;
    if (!g) return;
    if (!placed.current) {
      g.position.set(unit.pos[0], TILE_TOP, unit.pos[1]);
      placed.current = true;
    }
    const follow = 1 - Math.exp(-dt * (ghost ? 60 : 12));
    g.position.x += (unit.pos[0] - g.position.x) * follow;
    g.position.z += (unit.pos[1] - g.position.z) * follow;
    const bob = look.float ? Math.sin(performance.now() / 500) * 0.08 + 0.12 : 0;
    g.position.y = TILE_TOP + bob + (ghost ? 0.7 : 0);

    if (unit.pulse !== seen.current.pulse) {
      seen.current.pulse = unit.pulse;
      fx.current.pulse = 1;
    }
    if (unit.hit !== seen.current.hit) {
      seen.current.hit = unit.hit;
      fx.current.hit = 1;
    }
    fx.current.pulse *= Math.exp(-dt * 9);
    fx.current.hit *= Math.exp(-dt * 7);
    fx.current.alive += ((unit.dead ? 0 : 1) - fx.current.alive) * (1 - Math.exp(-dt * 10));

    g.scale.setScalar(Math.max(0.001, fx.current.alive) * 0.8);
    if (pose.current) pose.current.scale.setScalar(1 + 0.22 * fx.current.pulse);
    if (torso.current) torso.current.emissiveIntensity = fx.current.hit * 1.4;
  });

  return (
    <group ref={root} visible={!hidden} onPointerDown={onPointerDown} onClick={onClick} onContextMenu={onContextMenu}>
      <group ref={pose}>
        <Figure look={look} enemy={unit.enemy} torsoRef={torso} />
      </group>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.36, 0.44, 28]} />
        <meshBasicMaterial color={unit.enemy ? "#e5484d" : "#3b9eff"} transparent opacity={0.85} />
      </mesh>
      {unit.selected ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[0.5, 0.56, 32]} />
          <meshBasicMaterial color="#f2c14e" />
        </mesh>
      ) : null}

      {Array.from({ length: unit.star }, (_, i) => (
        <mesh key={i} position={[(i - (unit.star - 1) / 2) * 0.14, 1.28, 0]}>
          <sphereGeometry args={[0.05, 8, 6]} />
          <meshStandardMaterial color="#ffd166" emissive="#ffd166" emissiveIntensity={0.6} />
        </mesh>
      ))}

      {unit.maxHp > 0 ? (
        <Billboard position={[0, 1.5, 0]}>
          <mesh>
            <planeGeometry args={[0.9, 0.1]} />
            <meshBasicMaterial color="#000000" transparent opacity={0.6} depthTest={false} />
          </mesh>
          <mesh position={[-0.45 * (1 - hpRatio), 0, 0.01]} scale={[hpRatio, 1, 1]}>
            <planeGeometry args={[0.9, 0.07]} />
            <meshBasicMaterial color="#4ade80" depthTest={false} />
          </mesh>
          {unit.maxMana > 0 ? (
            <>
              <mesh position={[0, -0.13, 0]}>
                <planeGeometry args={[0.9, 0.06]} />
                <meshBasicMaterial color="#000000" transparent opacity={0.6} depthTest={false} />
              </mesh>
              <mesh position={[-0.45 * (1 - manaRatio), -0.13, 0.01]} scale={[manaRatio, 1, 1]}>
                <planeGeometry args={[0.9, 0.05]} />
                <meshBasicMaterial color="#60a5fa" depthTest={false} />
              </mesh>
            </>
          ) : null}
        </Billboard>
      ) : null}
    </group>
  );
});

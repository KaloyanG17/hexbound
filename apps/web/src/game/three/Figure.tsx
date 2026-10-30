import type { RefObject } from "react";
import type * as THREE from "three";
import type { UnitLook } from "./looks";

// Each unit is built from a few primitives. Front is +Z in local space, so units
// are turned to face the enemy side of the arena.
const HEAD_Y: Record<UnitLook["body"], number> = { brute: 0.86, slim: 0.9, caster: 0.86, beast: 0.8 };

const solid = (color: string) => <meshStandardMaterial color={color} roughness={0.6} />;
const glow = (color: string) => <meshStandardMaterial color={color} roughness={0.35} emissive={color} emissiveIntensity={0.35} />;

export function Figure({ look, enemy, torsoRef }: { look: UnitLook; enemy: boolean; torsoRef: RefObject<THREE.MeshStandardMaterial | null> }) {
  const headY = HEAD_Y[look.body];
  return (
    <group rotation={[0, enemy ? 0 : Math.PI, 0]}>
      {renderTorso(look, torsoRef)}
      <mesh position={[0, headY, 0]}>
        <sphereGeometry args={[0.2, 16, 12]} />
        {solid(look.color)}
      </mesh>
      {[-0.08, 0.08].map((x) => (
        <group key={x}>
          <mesh position={[x, headY + 0.02, 0.17]}>
            <sphereGeometry args={[0.045, 8, 6]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[x, headY + 0.02, 0.2]}>
            <sphereGeometry args={[0.02, 6, 6]} />
            <meshBasicMaterial color="#111111" />
          </mesh>
        </group>
      ))}
      {renderWeapon(look)}
      {look.extra ? renderExtra(look.extra, headY, look) : null}
    </group>
  );
}

function renderTorso(look: UnitLook, ref: RefObject<THREE.MeshStandardMaterial | null>) {
  const material = (
    <meshStandardMaterial ref={ref} color={look.color} roughness={0.6} emissive="#ff3b3b" emissiveIntensity={0} />
  );
  switch (look.body) {
    case "brute":
      return (
        <mesh position={[0, 0.42, 0]}>
          <boxGeometry args={[0.52, 0.5, 0.42]} />
          {material}
        </mesh>
      );
    case "slim":
      return (
        <mesh position={[0, 0.45, 0]}>
          <capsuleGeometry args={[0.17, 0.4, 4, 10]} />
          {material}
        </mesh>
      );
    case "caster":
      return (
        <mesh position={[0, 0.35, 0]}>
          <coneGeometry args={[0.3, 0.7, 10]} />
          {material}
        </mesh>
      );
    case "beast":
      return (
        <mesh position={[0, 0.4, 0]} scale={[1, 0.8, 1.2]}>
          <sphereGeometry args={[0.32, 16, 12]} />
          {material}
        </mesh>
      );
  }
}

function renderWeapon(look: UnitLook) {
  switch (look.weapon) {
    case "sword":
      return (
        <mesh position={[0.42, 0.55, 0.05]} rotation={[0, 0, -0.35]}>
          <boxGeometry args={[0.07, 0.62, 0.05]} />
          {glow(look.accent)}
        </mesh>
      );
    case "bow":
      return (
        <mesh position={[0.4, 0.55, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.28, 0.03, 6, 16, Math.PI]} />
          {glow(look.accent)}
        </mesh>
      );
    case "staff":
      return (
        <group>
          <mesh position={[0.4, 0.6, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 1.05, 6]} />
            {solid("#6b4f3a")}
          </mesh>
          <mesh position={[0.4, 1.15, 0]}>
            <sphereGeometry args={[0.1, 12, 10]} />
            {glow(look.accent)}
          </mesh>
        </group>
      );
    case "shield":
      return (
        <mesh position={[-0.42, 0.45, 0.12]} rotation={[0, Math.PI / 2, 0]}>
          <cylinderGeometry args={[0.28, 0.28, 0.06, 12]} />
          {glow(look.accent)}
        </mesh>
      );
    case "club":
      return (
        <mesh position={[0.42, 0.5, 0]} rotation={[0, 0, 0.5]}>
          <boxGeometry args={[0.14, 0.55, 0.14]} />
          {glow(look.accent)}
        </mesh>
      );
    case "orb":
      return (
        <mesh position={[0, 1.05, 0.1]}>
          <sphereGeometry args={[0.13, 14, 12]} />
          {glow(look.accent)}
        </mesh>
      );
    case "claws":
      return (
        <group>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.38, 0.3, 0.18]} rotation={[0.8, 0, s * 0.3]}>
              <coneGeometry args={[0.05, 0.25, 5]} />
              {glow(look.accent)}
            </mesh>
          ))}
        </group>
      );
  }
}

function renderExtra(extra: NonNullable<UnitLook["extra"]>, headY: number, look: UnitLook) {
  switch (extra) {
    case "wings":
      return (
        <group>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.42, 0.52, -0.12]} rotation={[0, 0, s * 0.35]}>
              <boxGeometry args={[0.55, 0.05, 0.32]} />
              {glow(look.accent)}
            </mesh>
          ))}
        </group>
      );
    case "cape":
      return (
        <mesh position={[0, 0.42, -0.24]}>
          <boxGeometry args={[0.46, 0.7, 0.03]} />
          {solid(look.accent)}
        </mesh>
      );
    case "horns":
      return (
        <group>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.12, headY + 0.24, 0]} rotation={[0, 0, -s * 0.4]}>
              <coneGeometry args={[0.05, 0.24, 6]} />
              {glow(look.accent)}
            </mesh>
          ))}
        </group>
      );
    case "ears":
      return (
        <group>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.12, headY + 0.28, 0]} rotation={[0, 0, -s * 0.15]}>
              <coneGeometry args={[0.06, 0.34, 6]} />
              {solid(look.color)}
            </mesh>
          ))}
        </group>
      );
    case "hood":
      return (
        <mesh position={[0, headY + 0.04, 0]}>
          <sphereGeometry args={[0.23, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          {solid(look.accent)}
        </mesh>
      );
  }
}

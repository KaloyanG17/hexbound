"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import type { UnitDef } from "@hexbound/content";
import { Portrait } from "../Portrait";
import { KayCharacter, type KayMotion } from "./CharacterModel";
import { kayModelFor, lookFor } from "./looks";

// Portraits come from the same KayKit model the arena uses, so the picture always matches the character.
// The drawn portrait sits underneath and shows until the model has loaded.

interface Props {
  unit: Pick<UnitDef, "id" | "cost">;
  size?: number;
}

export function ModelPortrait({ unit, size = 120 }: Props) {
  const motion = useRef<KayMotion>({ moving: false, dead: false, hit: 0, act: 0 });
  const model = kayModelFor(lookFor(unit.id));

  return (
    <div className="portrait" style={{ width: size, height: size, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0 }}>
        <Portrait unit={unit} size={size} />
      </div>
      <div style={{ position: "absolute", inset: 0 }}>
        <Canvas
          dpr={[1, 2]}
          camera={{ fov: 30, position: [0, 1.5, 4.6] }}
          gl={{ alpha: true }}
          onCreated={({ camera }) => camera.lookAt(0, 0.9, 0)}
        >
          <ambientLight intensity={1.2} />
          <directionalLight position={[2, 3, 4]} intensity={1.6} />
          <Suspense fallback={null}>
            <KayCharacter model={model} enemy={false} motion={motion} />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}

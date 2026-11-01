"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import type { KayModel } from "./looks";

// KayKit Adventurers: rigged low-poly characters with shared Rig_Medium animations (CC0).
// Animations are read from separate files and bound to each character's skeleton by bone name.

export interface KayMotion {
  moving: boolean;
  dead: boolean;
  /** Bumps when the unit takes damage. */
  hit: number;
  /** Bumps when the unit acts (attack or cast). */
  act: number;
}

const MODEL_FILE: Record<KayModel, string> = {
  Barbarian: "/models/kaykit/characters/Barbarian.glb",
  Knight: "/models/kaykit/characters/Knight.glb",
  Mage: "/models/kaykit/characters/Mage.glb",
  Ranger: "/models/kaykit/characters/Ranger.glb",
  Rogue: "/models/kaykit/characters/Rogue.glb",
  Rogue_Hooded: "/models/kaykit/characters/Rogue_Hooded.glb",
};
const GENERAL_ANIMS = "/models/kaykit/animations/Rig_Medium_General.glb";
const MOVEMENT_ANIMS = "/models/kaykit/animations/Rig_Medium_MovementBasic.glb";

for (const file of Object.values(MODEL_FILE)) useGLTF.preload(file);
useGLTF.preload(GENERAL_ANIMS);
useGLTF.preload(MOVEMENT_ANIMS);

// Clips used by the arena. The free pack has no melee swing, so attacks borrow "Throw".
const CLIPS = ["Idle_A", "Walking_A", "Death_A", "Hit_A", "Throw"] as const;
const FADE = 0.15;

interface Props {
  model: KayModel;
  enemy: boolean;
  motion: { current: KayMotion };
}

function Loaded({ model, enemy, motion }: Props) {
  const character = useGLTF(MODEL_FILE[model]);
  const general = useGLTF(GENERAL_ANIMS);
  const movement = useGLTF(MOVEMENT_ANIMS);

  const root = useMemo(() => clone(character.scene), [character.scene]);
  const mixer = useMemo(() => new THREE.AnimationMixer(root), [root]);
  const actions = useMemo(() => {
    const clips = [...general.animations, ...movement.animations];
    const map = new Map<string, THREE.AnimationAction>();
    for (const name of CLIPS) {
      const clip = THREE.AnimationClip.findByName(clips, name);
      if (clip) map.set(name, mixer.clipAction(clip));
    }
    return map;
  }, [general, movement, mixer]);

  const current = useRef<string | null>(null);
  const oneShotPlaying = useRef(false);
  const seen = useRef({ hit: motion.current.hit, act: motion.current.act });

  useEffect(() => {
    // A one-shot (hit, attack) ends and the character falls back to idle or walk.
    const onFinished = () => {
      oneShotPlaying.current = false;
      current.current = null;
    };
    mixer.addEventListener("finished", onFinished);
    return () => {
      mixer.removeEventListener("finished", onFinished);
      mixer.stopAllAction();
    };
  }, [mixer]);

  const play = (name: string, loop: boolean) => {
    const next = actions.get(name);
    if (!next || current.current === name) return;
    const prev = current.current ? actions.get(current.current) : undefined;
    next.reset();
    next.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
    next.clampWhenFinished = !loop;
    next.fadeIn(FADE).play();
    prev?.fadeOut(FADE);
    current.current = name;
    oneShotPlaying.current = !loop;
  };

  useFrame((_, dt) => {
    const m = motion.current;
    if (m.dead) {
      play("Death_A", false);
    } else if (m.hit !== seen.current.hit) {
      seen.current.hit = m.hit;
      play("Hit_A", false);
    } else if (m.act !== seen.current.act) {
      seen.current.act = m.act;
      play("Throw", false);
    } else if (!oneShotPlaying.current) {
      play(m.moving ? "Walking_A" : "Idle_A", true);
    }
    mixer.update(dt);
  });

  return <primitive object={root} rotation={[0, enemy ? 0 : Math.PI, 0]} scale={0.5} />;
}

/** A KayKit character driven by the unit's motion. Mount it inside a Suspense boundary. */
export function KayCharacter(props: Props) {
  return <Loaded {...props} />;
}

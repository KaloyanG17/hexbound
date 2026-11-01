import * as THREE from "three";

// Procedural ground for the arena: a moss-and-dirt map inside a worn stone rim.
// Drawn once to a canvas, so there are no image assets. Seeded so every load looks the same.

export const MAP_W = 13.5;
export const MAP_H = 11;

const W = 1400;
const H = 1100;

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function makeMapTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas is not available");
  const rand = seeded(7);

  // Base: moss, lighter in the middle and darker towards the edges.
  const base = ctx.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, W * 0.62);
  base.addColorStop(0, "#6f8c4e");
  base.addColorStop(0.6, "#56703d");
  base.addColorStop(1, "#34472b");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);

  // Soft mottling: large, faint patches so the ground doesn't look flat.
  for (let i = 0; i < 26; i++) {
    const x = rand() * W;
    const y = rand() * H;
    const r = 70 + rand() * 170;
    const patch = ctx.createRadialGradient(x, y, 0, x, y, r);
    const light = rand() < 0.5;
    patch.addColorStop(0, light ? "rgba(180,200,130,0.16)" : "rgba(24,38,20,0.22)");
    patch.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = patch;
    ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  }

  // Grass: thousands of tiny strokes in lighter and darker greens.
  for (let i = 0; i < 12000; i++) {
    const x = rand() * W;
    const y = rand() * H;
    ctx.fillStyle = rand() < 0.5
      ? `rgba(28,44,22,${0.22 + rand() * 0.3})`
      : `rgba(160,190,118,${0.1 + rand() * 0.18})`;
    ctx.fillRect(x, y, 1 + rand() * 2, 1 + rand() * 2);
  }

  // Worn dirt paths: two soft tan curves crossing the field.
  const path = (x0: number, y0: number, cx: number, cy: number, x1: number, y1: number) => {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(cx, cy, x1, y1);
    ctx.strokeStyle = "rgba(120,96,62,0.22)";
    ctx.lineWidth = 46;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.strokeStyle = "rgba(150,122,82,0.18)";
    ctx.lineWidth = 16;
    ctx.stroke();
  };
  path(120, 200, W * 0.45, H * 0.55, W - 120, H - 180);
  path(W - 160, 160, W * 0.55, H * 0.4, 160, H - 150);

  // Stone rim: a double-line border that frames the map.
  const pad = 46;
  ctx.strokeStyle = "#3d3123";
  ctx.lineWidth = 40;
  ctx.strokeRect(pad, pad, W - 2 * pad, H - 2 * pad);
  ctx.strokeStyle = "#7d6a4b";
  ctx.lineWidth = 6;
  ctx.strokeRect(pad + 20, pad + 20, W - 2 * pad - 40, H - 2 * pad - 40);
  ctx.strokeStyle = "rgba(20,14,8,0.6)";
  ctx.lineWidth = 3;
  ctx.strokeRect(pad - 14, pad - 14, W - 2 * pad + 28, H - 2 * pad + 28);

  // Vignette: darken the outer edge so the eye settles on the centre.
  const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.7);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.6)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

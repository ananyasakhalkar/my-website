/**
 * Procedural art for the room's decor: two vintage comic-style posters (original artwork, an homage only:
 * no logos, names or lettering) and a ginger tabby's fur. Drawn once on a canvas, so nothing is downloaded.
 */
import type { Texture } from 'three';
import { canvas, seeded, toTexture } from './textures';

const W = 512;
const H = 720;

/** Aged paper: cream border, faint mottling and halftone dots over the art. */
function ageing(ctx: CanvasRenderingContext2D, seed: number) {
  const r = seeded(seed);
  ctx.globalCompositeOperation = 'multiply';
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = `rgba(120, 90, 50, ${0.02 + r() * 0.05})`;
    ctx.beginPath();
    ctx.arc(r() * W, r() * H, 2 + r() * 18, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = 'rgba(255, 245, 225, 0.07)';
  for (let y = 0; y < H; y += 7) for (let x = (y / 7) % 2 ? 3.5 : 0; x < W; x += 7) ctx.fillRect(x, y, 2, 2);
  // Cream margin with a worn inner edge.
  ctx.strokeStyle = '#efe4cc';
  ctx.lineWidth = 34;
  ctx.strokeRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(60, 40, 20, 0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(17, 17, W - 34, H - 34);
}

function star(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 ? r : R;
    ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fill();
}

/** Poster 1: a star-centred round shield bursting out of comic speed lines, flag stripes below. */
export function posterShield(): Texture {
  const { c, ctx } = canvas(W, H);
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#13234a');
  bg.addColorStop(1, '#0b1530');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const cx = W / 2;
  const cy = 300;
  // Speed lines
  ctx.fillStyle = 'rgba(120, 160, 230, 0.16)';
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a - 0.04) * 700, cy + Math.sin(a - 0.04) * 700);
    ctx.lineTo(cx + Math.cos(a + 0.04) * 700, cy + Math.sin(a + 0.04) * 700);
    ctx.fill();
  }
  // Flag stripes at the foot
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = i % 2 ? '#efe7d6' : '#b3262e';
    ctx.fillRect(0, 560 + i * 24, W, 24);
  }
  // The shield: concentric rings, blue centre, white star; a soft drop shadow and a metal sheen.
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = '#b3262e';
  ctx.beginPath();
  ctx.arc(cx, cy, 190, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  const rings: [number, string][] = [[152, '#efe7d6'], [116, '#b3262e'], [80, '#1f4aa8']];
  for (const [rad, col] of rings) {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#f4efe4';
  star(ctx, cx, cy, 74, 29);
  const sheen = ctx.createRadialGradient(cx - 70, cy - 80, 10, cx, cy, 200);
  sheen.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
  sheen.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
  sheen.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
  ctx.fillStyle = sheen;
  ctx.beginPath();
  ctx.arc(cx, cy, 190, 0, Math.PI * 2);
  ctx.fill();
  ageing(ctx, 11);
  return toTexture(c, true, false);
}

/** A standing figure's silhouette; `kind` adds a prop so the team reads at a glance. */
function figure(ctx: CanvasRenderingContext2D, x: number, base: number, s: number, kind: number) {
  ctx.beginPath();
  ctx.ellipse(x, base - 150 * s, 13 * s, 15 * s, 0, 0, Math.PI * 2); // head
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 30 * s, base - 128 * s); // shoulders → hips → legs
  ctx.lineTo(x + 30 * s, base - 128 * s);
  ctx.lineTo(x + 18 * s, base - 62 * s);
  ctx.lineTo(x + 22 * s, base);
  ctx.lineTo(x + 6 * s, base);
  ctx.lineTo(x, base - 50 * s);
  ctx.lineTo(x - 6 * s, base);
  ctx.lineTo(x - 22 * s, base);
  ctx.lineTo(x - 18 * s, base - 62 * s);
  ctx.closePath();
  ctx.fill();
  if (kind === 0) {
    // round shield on the arm
    ctx.beginPath();
    ctx.arc(x - 34 * s, base - 92 * s, 22 * s, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 1) {
    // hammer held low
    ctx.fillRect(x + 30 * s, base - 100 * s, 5 * s, 46 * s);
    ctx.fillRect(x + 20 * s, base - 62 * s, 26 * s, 16 * s);
  } else if (kind === 2) {
    // cape
    ctx.beginPath();
    ctx.moveTo(x - 26 * s, base - 128 * s);
    ctx.lineTo(x - 48 * s, base - 8 * s);
    ctx.lineTo(x + 48 * s, base - 8 * s);
    ctx.lineTo(x + 26 * s, base - 128 * s);
    ctx.closePath();
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.globalAlpha = 1;
  } else if (kind === 3) {
    // bow
    ctx.lineWidth = 3 * s;
    ctx.beginPath();
    ctx.arc(x + 40 * s, base - 100 * s, 40 * s, -Math.PI / 2.4, Math.PI / 2.4);
    ctx.stroke();
  }
}

/** Poster 2: a team of silhouettes on a ridge against a comic-book sunset over a city. */
export function posterTeam(): Texture {
  const { c, ctx } = canvas(W, H);
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#2a1440');
  sky.addColorStop(0.45, '#b8323a');
  sky.addColorStop(0.75, '#f08a3c');
  sky.addColorStop(1, '#f6c26a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255, 220, 150, 0.85)';
  ctx.beginPath();
  ctx.arc(W / 2, 430, 120, 0, Math.PI * 2);
  ctx.fill();
  // City skyline
  const r = seeded(5);
  ctx.fillStyle = '#5a1f2e';
  for (let x = 20; x < W - 20; ) {
    const w = 18 + r() * 34;
    const h = 60 + r() * 150;
    ctx.fillRect(x, 560 - h, w, h);
    x += w + 2;
  }
  // Ridge and the team
  ctx.fillStyle = '#16090f';
  ctx.beginPath();
  ctx.moveTo(0, 620);
  ctx.quadraticCurveTo(W / 2, 560, W, 620);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.fill();
  ctx.strokeStyle = '#16090f';
  const team: [number, number, number][] = [[95, 0.78, 3], [170, 0.92, 2], [256, 1.05, 0], [342, 0.95, 1], [420, 1.12, 4], [470, 0.7, 4]];
  for (const [x, s, k] of team) figure(ctx, x, 588 + Math.abs(x - W / 2) * 0.1, s, k);
  // Rim light along the ridge
  ctx.strokeStyle = 'rgba(255, 190, 110, 0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 620);
  ctx.quadraticCurveTo(W / 2, 560, W, 620);
  ctx.stroke();
  ageing(ctx, 23);
  return toTexture(c, true, false);
}

/** Ginger tabby fur: warm base, darker stripes that wrap around the body, a lighter belly band. */
export function catFur(): Texture {
  const w = 256;
  const h = 128;
  const { c, ctx } = canvas(w, h);
  ctx.fillStyle = '#d98a48';
  ctx.fillRect(0, 0, w, h);
  const r = seeded(9);
  ctx.fillStyle = 'rgba(150, 70, 28, 0.32)';
  for (let x = 0; x < w; x += 16) {
    ctx.beginPath();
    ctx.ellipse(x + r() * 4, h * 0.42, 3 + r() * 3, h * 0.36, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  const belly = ctx.createLinearGradient(0, h * 0.7, 0, h);
  belly.addColorStop(0, 'rgba(250, 232, 205, 0)');
  belly.addColorStop(1, 'rgba(250, 232, 205, 0.9)');
  ctx.fillStyle = belly;
  ctx.fillRect(0, 0, w, h);
  return toTexture(c, true, true);
}

/**
 * Procedural textures, generated once at startup on canvases: no downloads and no licensing questions
 * (DESK_SPEC §9 fallback path). Each generator is seeded, so every visit looks identical.
 */
import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from 'three';

type RGB = [number, number, number];

function hex(c: string): RGB {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Seeded PRNG (mulberry32) returning [0, 1). */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const mix = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

/** Tileable 2D value noise on a lattice of `period` cells. */
function makeNoise(seed: number) {
  const perm = new Uint8Array(512);
  let s = seed >>> 0;
  for (let i = 0; i < 256; i++) perm[i] = i;
  for (let i = 255; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    const t = perm[i]!;
    perm[i] = perm[j]!;
    perm[j] = t;
  }
  for (let i = 0; i < 256; i++) perm[i + 256] = perm[i]!;
  const h = (x: number, y: number) => perm[(perm[x & 255]! + (y & 255)) & 511]! / 255;
  const fade = (t: number) => t * t * (3 - 2 * t);
  return (x: number, y: number, period = 256): number => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = fade(x - xi);
    const yf = fade(y - yi);
    const x0 = ((xi % period) + period) % period;
    const y0 = ((yi % period) + period) % period;
    const x1 = (x0 + 1) % period;
    const y1 = (y0 + 1) % period;
    const a = h(x0, y0) + (h(x1, y0) - h(x0, y0)) * xf;
    const b = h(x0, y1) + (h(x1, y1) - h(x0, y1)) * xf;
    return a + (b - a) * yf;
  };
}

function fbm(n: ReturnType<typeof makeNoise>, x: number, y: number, octaves: number, period: number): number {
  let v = 0;
  let amp = 0.5;
  let f = 1;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    v += n(x * f, y * f, period * f) * amp;
    norm += amp;
    amp *= 0.5;
    f *= 2;
  }
  return v / norm;
}

function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('2D canvas unavailable');
  return { c, ctx };
}

function paint(w: number, h: number, fn: (x: number, y: number) => RGB): HTMLCanvasElement {
  const { c, ctx } = canvas(w, h);
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [r, g, b] = fn(x, y);
      const i = (y * w + x) * 4;
      img.data[i] = r;
      img.data[i + 1] = g;
      img.data[i + 2] = b;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function toTexture(c: HTMLCanvasElement, color: boolean, repeat = true): Texture {
  const t = new CanvasTexture(c);
  if (color) t.colorSpace = SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = RepeatWrapping;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

/** Warm plaster: 1 tile = 1 m. Colour + bump. */
export function plaster(): { map: Texture; bump: Texture } {
  const n = makeNoise(11);
  const base = hex('#EDE3D3');
  const dark = hex('#DCCFBC');
  const S = 256;
  const P = 8;
  const col = paint(S, S, (x, y) => {
    const v = fbm(n, (x / S) * P, (y / S) * P, 5, P);
    const t = Math.min(1, Math.max(0, (v - 0.35) * 1.4));
    return mix(base, dark, t * 0.55);
  });
  const bump = paint(S, S, (x, y) => {
    const v = fbm(n, (x / S) * P * 2 + 3, (y / S) * P * 2 + 7, 4, P * 2) * 255;
    return [v, v, v];
  });
  return { map: toTexture(col, true), bump: toTexture(bump, false) };
}

/** Oak grain running along U. 1 tile = 1.6 m × 0.4 m. */
export function oak(): { map: Texture; rough: Texture } {
  const n = makeNoise(23);
  const light = hex('#A2714A');
  const mid = hex('#8A5A3B');
  const dark = hex('#5E3A24');
  const W = 1024;
  const H = 256;
  const map = paint(W, H, (x, y) => {
    const u = x / W;
    const v = y / H;
    const warp = fbm(n, u * 3, v * 6, 4, 64) * 9;
    const rings = 0.5 + 0.5 * Math.sin((v * 38 + warp) * Math.PI);
    const fine = n(x * 0.9, y * 4.5, 256);
    const t = Math.pow(rings, 2.4) * 0.8 + fine * 0.2;
    return mix(mix(light, mid, 0.35 + fbm(n, u * 2, v * 2, 3, 64) * 0.5), dark, t * 0.42);
  });
  const rough = paint(W / 4, H / 4, (x, y) => {
    const v = 120 + n(x * 2, y * 8, 256) * 60;
    return [v, v, v];
  });
  return { map: toTexture(map, true), rough: toTexture(rough, false) };
}

/** Wide oak floorboards. 1 tile = 2 m × 2 m, boards 0.19 m wide. */
export function floorboards(): Texture {
  const n = makeNoise(37);
  const S = 1024;
  const boards = 10.5;
  const tones = Array.from({ length: 12 }, (_, i) => 0.75 + n(i * 3.1, 1.7) * 0.5);
  const c = paint(S, S, (x, y) => {
    const bx = (x / S) * boards;
    const b = Math.floor(bx);
    const fx = bx - b;
    const offset = (n(b * 5.3, 2.2) * S) | 0;
    const yy = (y + offset) % S;
    const seamY = yy % (S / 1.6) < 3;
    const seamX = fx < 0.012 || fx > 0.988;
    const grain = 0.5 + 0.5 * Math.sin(((x % 97) * 0.08 + fbm(n, x / 40, yy / 220, 3, 64) * 8) * Math.PI);
    const tone = tones[b % tones.length]!;
    const base = mix(hex('#8C6446'), hex('#6A462F'), grain * 0.35);
    const col: RGB = [base[0] * tone, base[1] * tone, base[2] * tone];
    return seamX || seamY ? mix(col, hex('#2E1D12'), 0.7) : col;
  });
  return toTexture(c, true);
}

/** Cork board surface. 1 tile = 0.3 m. */
export function cork(): { map: Texture; bump: Texture } {
  const n = makeNoise(41);
  const S = 256;
  const map = paint(S, S, (x, y) => {
    const g = n(x * 0.9, y * 0.9, 256);
    const blob = fbm(n, x / 18, y / 18, 3, 16);
    const t = g > 0.8 ? 0.8 : g < 0.15 ? -0.5 : blob * 0.4;
    return t < 0 ? mix(hex('#B98A5A'), hex('#DDB88A'), -t) : mix(hex('#B98A5A'), hex('#6E4A2A'), t);
  });
  const bump = paint(S, S, (x, y) => {
    const v = n(x * 0.9, y * 0.9, 256) * 255;
    return [v, v, v];
  });
  return { map: toTexture(map, true), bump: toTexture(bump, false) };
}

/** Green felt desk mat. */
export function felt(): Texture {
  const n = makeNoise(53);
  const S = 256;
  return toTexture(
    paint(S, S, (x, y) => mix(hex('#3A5A48'), hex('#4A6B57'), n(x * 1.3, y * 1.3, 256) * 0.6 + fbm(n, x / 30, y / 30, 3, 8) * 0.4)),
    true,
  );
}

/** Sheer linen weave for the curtains (tiles every ~4 cm). */
export function linen(): Texture {
  const n = makeNoise(67);
  const S = 128;
  const c = paint(S, S, (x, y) => {
    const warp = 0.5 + 0.5 * Math.sin((x / S) * Math.PI * 64);
    const weft = 0.5 + 0.5 * Math.sin((y / S) * Math.PI * 64);
    const slub = n(x * 0.15, y * 2, 256);
    const t = (warp * 0.5 + weft * 0.5) * 0.12 + slub * 0.08;
    return mix(hex('#FAF6EE'), hex('#D9CFBF'), t);
  });
  return toTexture(c, true);
}

/** Soft, out-of-focus tree canopy card with alpha (outside the window). */
export function foliage(seed: number, warm: boolean): Texture {
  const { c, ctx } = canvas(256, 256);
  const r = seeded(seed);
  ctx.filter = 'blur(5px)';
  const greens = warm ? ['#6E7A3E', '#8A8F48', '#A69A55', '#57632F'] : ['#4E5E36', '#5F6E3C', '#72804A', '#3F4C2C'];
  for (let i = 0; i < 70; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.pow(r(), 0.7) * 95;
    const x = 128 + Math.cos(a) * d;
    const y = 120 + Math.sin(a) * d * 0.8;
    ctx.fillStyle = greens[(r() * greens.length) | 0]!;
    ctx.globalAlpha = 0.55 + r() * 0.4;
    ctx.beginPath();
    ctx.arc(x, y, 14 + r() * 26, 0, Math.PI * 2);
    ctx.fill();
  }
  // Sunlit rim on the upper-left.
  ctx.globalCompositeOperation = 'source-atop';
  const g = ctx.createLinearGradient(40, 20, 200, 220);
  g.addColorStop(0, 'rgba(255,214,150,0.55)');
  g.addColorStop(0.5, 'rgba(255,214,150,0)');
  ctx.fillStyle = g;
  ctx.globalAlpha = 1;
  ctx.fillRect(0, 0, 256, 256);
  // Trunk.
  ctx.globalCompositeOperation = 'destination-over';
  ctx.fillStyle = '#4A3B2E';
  ctx.fillRect(122, 170, 10, 86);
  return toTexture(c, true, false);
}

/** Distant rooftops silhouette with haze, alpha above the roofline. */
export function rooftops(): Texture {
  const { c, ctx } = canvas(512, 128);
  ctx.filter = 'blur(1.5px)';
  const r = seeded(7);
  ctx.fillStyle = '#A9A3A8';
  let x = 0;
  while (x < 512) {
    const w = 30 + r() * 60;
    const h = 30 + r() * 45;
    ctx.beginPath();
    ctx.moveTo(x, 128);
    ctx.lineTo(x, 128 - h);
    if (r() > 0.4) ctx.lineTo(x + w / 2, 128 - h - 12 - r() * 16);
    ctx.lineTo(x + w, 128 - h);
    ctx.lineTo(x + w, 128);
    ctx.fill();
    if (r() > 0.6) ctx.fillRect(x + w * 0.7, 128 - h - 22, 6, 22);
    x += w - 4;
  }
  return toTexture(c, true, false);
}

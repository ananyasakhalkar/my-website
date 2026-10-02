import { CanvasTexture, SRGBColorSpace, type Texture } from 'three';
import { seeded } from '../scene/textures';

async function fontsReady(specs: string[]) {
  try {
    await Promise.all(specs.map((s) => document.fonts.load(s)));
  } catch {
    // Canvas falls back to the generic family; the label still renders.
  }
}

/**
 * Manila folder cover: cardstock fibre, worn edges, a faint coffee ring, label-maker tape and a red
 * stamp. `label` and `stamp` come from content (e.g. `${projects.length} enclosed`).
 */
export async function folderCoverTexture(label: string, stamp: string): Promise<Texture> {
  await fontsReady(['700 64px "Courier Prime"']);
  const W = 1024;
  const H = 792;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  const r = seeded(4242);

  // Cardstock base + fibre.
  ctx.fillStyle = '#E3C98F';
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 2600; i++) {
    const x = r() * W;
    const y = r() * H;
    const len = 6 + r() * 22;
    const a = r() * Math.PI;
    ctx.strokeStyle = r() > 0.5 ? 'rgba(160,120,60,0.10)' : 'rgba(255,240,200,0.12)';
    ctx.lineWidth = 0.6 + r();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
    ctx.stroke();
  }
  // Darker wear toward the edges.
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.72);
  g.addColorStop(0, 'rgba(120,80,30,0)');
  g.addColorStop(1, 'rgba(120,80,30,0.28)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // A faint coffee ring (a wink at the mug).
  ctx.save();
  ctx.translate(W * 0.74, H * 0.64);
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(0, 0, 118 + i * 2, 112 + i * 2, 0.3, 0.2 + i * 0.4, Math.PI * 1.85 + i * 0.1);
    ctx.strokeStyle = `rgba(122,74,38,${0.18 - i * 0.05})`;
    ctx.lineWidth = 7 - i * 2;
    ctx.stroke();
  }
  ctx.restore();

  // Label-maker tape.
  ctx.save();
  ctx.translate(96, 110);
  ctx.rotate(-0.012);
  ctx.fillStyle = '#1b1b1d';
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 3;
  ctx.fillRect(0, 0, 470, 96);
  ctx.shadowColor = 'transparent';
  ctx.font = '700 64px "Courier Prime", "Courier New", monospace';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f4f1ea';
  ctx.fillText(label.split('').join(' '), 30, 52);
  ctx.restore();

  // Red rubber stamp, rotated −4°, with ink breakup.
  ctx.save();
  ctx.translate(120, 300);
  ctx.rotate((-4 * Math.PI) / 180);
  ctx.font = '700 58px "Courier Prime", "Courier New", monospace';
  ctx.fillStyle = 'rgba(179,38,30,0.8)';
  ctx.fillText(stamp.toUpperCase(), 0, 0);
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = `rgba(0,0,0,${0.3 + r() * 0.6})`;
    ctx.fillRect(r() * 520, -52 + r() * 64, 1 + r() * 3, 1 + r() * 3);
  }
  ctx.restore();

  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

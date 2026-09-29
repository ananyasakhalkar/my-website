/**
 * Where the contact details develop in the coffee (DESK_SPEC §4.3.1). One layout drives both the pigment
 * texture (canvas) and the invisible, focusable DOM links aligned over each line.
 */
import { contact, respondNote, type ContactItem } from '../content/contact';
import { profile } from '../content/profile';

/** World rectangle (XZ) of the text block inside the spill zone; the text's top faces the window (−Z). */
export const TEXT_RECT = { x0: 0.135, z0: 0.1, x1: 0.535, z1: 0.35 };
export const CANVAS = { w: 2048, h: 1280 };

export type Line =
  | { kind: 'status'; text: string; y: number; h: number }
  | { kind: 'rule'; y: number; h: number }
  | { kind: 'item'; item: ContactItem; y: number; h: number }
  | { kind: 'note'; text: string; y: number; h: number };

const STATUS_H = 96;
const RULE_H = 44;
const ITEM_H = 142;

export const lines: Line[] = (() => {
  const out: Line[] = [];
  let y = 60;
  out.push({ kind: 'status', text: profile.status, y, h: STATUS_H });
  y += STATUS_H;
  out.push({ kind: 'rule', y, h: RULE_H });
  y += RULE_H;
  for (const item of contact) {
    out.push({ kind: 'item', item, y, h: ITEM_H });
    y += ITEM_H;
  }
  out.push({ kind: 'note', text: `“${respondNote}”`, y: y + 10, h: 100 });
  return out;
})();

export const LABEL_X = 110;
export const VALUE_X = 520;
export const RIGHT_X = CANVAS.w - 150;

/** Canvas box → world XZ rectangle [x0, z0, x1, z1]. */
export function toWorld(x: number, y: number, w: number, h: number): [number, number, number, number] {
  const sx = (TEXT_RECT.x1 - TEXT_RECT.x0) / CANVAS.w;
  const sz = (TEXT_RECT.z1 - TEXT_RECT.z0) / CANVAS.h;
  return [TEXT_RECT.x0 + x * sx, TEXT_RECT.z0 + y * sz, TEXT_RECT.x0 + (x + w) * sx, TEXT_RECT.z0 + (y + h) * sz];
}

/** Draws the pigment (alpha = ink) with a faint bleed under sharp strokes. */
export async function drawContactText(): Promise<HTMLCanvasElement> {
  try {
    await Promise.all([
      document.fonts.load('400 96px Newsreader'),
      document.fonts.load('italic 400 64px Newsreader'),
      document.fonts.load('700 50px "Courier Prime"'),
    ]);
  } catch {
    // fall back to generic families
  }
  const c = document.createElement('canvas');
  c.width = CANVAS.w;
  c.height = CANVAS.h;
  const ctx = c.getContext('2d')!;
  const paint = () => {
    ctx.fillStyle = '#000';
    ctx.strokeStyle = '#000';
    for (const l of lines) {
      if (l.kind === 'status') {
        ctx.font = '700 50px "Courier Prime", "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(l.text.toUpperCase().split('').join(' '), CANVAS.w / 2, l.y + l.h / 2);
      } else if (l.kind === 'rule') {
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(LABEL_X, l.y + l.h / 2);
        ctx.lineTo(RIGHT_X, l.y + l.h / 2);
        ctx.stroke();
      } else if (l.kind === 'item') {
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.font = '700 50px "Courier Prime", "Courier New", monospace';
        ctx.fillText(l.item.label.toUpperCase(), LABEL_X, l.y + l.h / 2 + 4);
        ctx.font = '400 96px Newsreader, Georgia, serif';
        ctx.fillText(l.item.value, VALUE_X, l.y + l.h / 2);
      } else {
        ctx.font = 'italic 400 64px Newsreader, Georgia, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(l.text, CANVAS.w / 2, l.y + l.h / 2);
      }
    }
  };
  // Bleed: a soft pass under the sharp one (ink blooming in liquid).
  ctx.filter = 'blur(3px)';
  ctx.globalAlpha = 0.45;
  paint();
  ctx.filter = 'none';
  ctx.globalAlpha = 1;
  paint();
  return c;
}

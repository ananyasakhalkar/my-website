/**
 * Reader state shared by the DOM page (crisp, selectable text at rest) and the 3D paper (flights,
 * swipes). The route drives it; this store only sequences the choreography.
 */
import { create } from 'zustand';
import { prefersReducedMotion } from '../app/capabilities';

export type ReaderKind = 'projects';
export type Phase = 'closed' | 'opening' | 'rest' | 'drag' | 'settle' | 'turning' | 'closing';

export interface PileSheet {
  page: number;
  rot: number;
  dx: number;
  dz: number;
}

interface ReaderState {
  kind: ReaderKind | null;
  page: number;
  phase: Phase;
  /** performance.now() when the phase began. */
  t0: number;
  /** Page leaving during a turn, and where it goes. */
  leaving: { page: number; dir: 1 | -1 } | null;
  /** Horizontal drag in page widths (−1…1) and its velocity (page widths / s). */
  drag: number;
  dragVel: number;
  /** Pages already read, lying on the pile beside the folder. */
  pile: PileSheet[];
}

export const useReader = create<ReaderState>(() => ({
  kind: null,
  page: 1,
  phase: 'closed',
  t0: 0,
  leaving: null,
  drag: 0,
  dragVel: 0,
  pile: [],
}));

const reduced = prefersReducedMotion();

/** Choreography timings in ms (DESK_SPEC §4.1–4.2; shortened to crossfades under reduced motion). */
export const T = reduced
  ? { coverDelay: 0, coverOpen: 200, liftDelay: 0, flight: 250, arrive: 260, turn: 250, turnDelay: 0, close: 300 }
  : { coverDelay: 200, coverOpen: 600, liftDelay: 480, flight: 700, arrive: 1220, turn: 450, turnDelay: 110, close: 1100 };

const now = () => performance.now();

export function openReader(kind: ReaderKind, page: number) {
  useReader.setState({ kind, page, phase: 'opening', t0: now(), leaving: null, drag: 0, dragVel: 0, pile: [] });
}

/** Turn to `page`. Pages going forward land on the pile; going back, the page is taken from the pile. */
export function turnTo(page: number) {
  const s = useReader.getState();
  if (!s.kind || page === s.page) return;
  const dir: 1 | -1 = page > s.page ? 1 : -1;
  let pile = s.pile;
  if (dir === 1) {
    const r = Math.sin(s.page * 12.9898) * 43758.5453;
    const f = r - Math.floor(r);
    pile = [...pile, { page: s.page, rot: (f - 0.5) * 0.32, dx: (f - 0.5) * 0.02, dz: (0.5 - f) * 0.015 }];
  } else {
    pile = pile.filter((p) => p.page !== page);
  }
  useReader.setState({ page, phase: 'turning', t0: now(), leaving: { page: s.page, dir }, pile });
}

export function closeReader() {
  const s = useReader.getState();
  if (s.phase === 'closed' || s.phase === 'closing') return;
  useReader.setState({ phase: 'closing', t0: now(), leaving: null, drag: 0 });
}

export function setPhase(phase: Phase) {
  useReader.setState({ phase, t0: now() });
}

/**
 * Where the page sits on screen at rest (CSS px). Shared by the DOM page and the 3D paper so the
 * crisp DOM text lands exactly on the paper.
 */
export function pageRect(w: number, h: number) {
  const ratio = 1.4142;
  let ph = h * 0.84;
  let pw = ph / ratio;
  if (w / h < 0.8) {
    pw = w * 0.92;
    ph = pw * ratio;
    if (ph > h * 0.84) {
      ph = h * 0.84;
      pw = ph / ratio;
    }
  }
  const cx = w / 2;
  const cy = h * 0.5 + (w / h < 0.8 ? h * 0.02 : h * 0.015);
  return { cx, cy, w: pw, h: ph, left: cx - pw / 2, top: cy - ph / 2 };
}

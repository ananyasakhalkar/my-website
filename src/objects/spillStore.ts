/** The mug → spill → contact sequence (DESK_SPEC §4.3). The #/contact route drives it. */
import { create } from 'zustand';
import { prefersReducedMotion } from '../app/capabilities';
import { params } from '../app/params';
import { sfx } from '../audio/sound';

export type SpillPhase = 'upright' | 'spilling' | 'spilled' | 'refilling';

interface SpillState {
  phase: SpillPhase;
  /** performance.now() when the phase began. */
  t0: number;
  /** True once a spill has happened this session: a faint ring stays after refilling. */
  stained: boolean;
}

export const useSpill = create<SpillState>(() => ({ phase: 'upright', t0: 0, stained: false }));

/** Beat timings in ms (DESK_SPEC §4.3 table). */
export const S = {
  anticipation: 260,
  tipStart: 260,
  tipEnd: 720,
  pourStart: 480,
  pourEnd: 1500,
  spreadStart: 600,
  spreadEnd: 2600,
  developStart: 1500,
  developEnd: 3200,
  dryStart: 2400,
  dryEnd: 3600,
  ring: 2600,
  controls: 3000,
  total: 3600,
  refill: 1200,
};

const now = () => performance.now();

export function startSpill() {
  const s = useSpill.getState();
  if (s.phase !== 'upright') return;
  // Reduced motion: straight to the end state (with a short fade handled by the renderers).
  const t0 = prefersReducedMotion() ? now() - S.total + 300 : now();
  useSpill.setState({ phase: 'spilling', t0, stained: true });
  setTimeout(() => sfx('clink'), Math.max(0, t0 + S.tipEnd - now()));
  setTimeout(() => sfx('pour'), Math.max(0, t0 + S.pourStart - now()));
}

/** Esc during the sequence jumps to the end state; direct visits to #/contact start there too. */
export function finishSpill() {
  useSpill.setState({ phase: 'spilled', t0: now() - S.total, stained: true });
}

export function refill() {
  const s = useSpill.getState();
  if (s.phase === 'spilled' || s.phase === 'spilling') useSpill.setState({ phase: 'refilling', t0: now() });
}

/** Elapsed time along the spill timeline (clamped to its end once spilled). */
export function spillTime(): number {
  const s = useSpill.getState();
  if (s.phase === 'upright') return 0;
  if (s.phase === 'spilled') return S.total;
  if (s.phase === 'refilling') return S.total;
  if (params.spillAt !== null) return Math.min(params.spillAt, S.total);
  return Math.min(now() - s.t0, S.total);
}

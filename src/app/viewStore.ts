/**
 * Open/rest/close choreography for the single-view objects (report card, badges, notebook, board).
 * The route drives it (ViewSync); 3D objects and DOM views read the phase and its start time.
 */
import { useEffect } from 'react';
import { create } from 'zustand';
import { prefersReducedMotion } from './capabilities';
import { useRoute, type Route } from './routes';
import { sfx } from '../audio/sound';

export type ViewKey = 'report-card' | 'experience' | 'about' | 'board';
export type ViewPhase = 'closed' | 'opening' | 'rest' | 'closing';

interface ViewState {
  key: ViewKey | null;
  phase: ViewPhase;
  t0: number;
}

export const useView = create<ViewState>(() => ({ key: null, phase: 'closed', t0: 0 }));

const reduced = prefersReducedMotion();
export const VT = reduced ? { open: 250, close: 250 } : { open: 950, close: 750 };

const VIEWS: ViewKey[] = ['report-card', 'experience', 'about', 'board'];
export const viewOf = (r: Route): ViewKey | null => (VIEWS.includes(r.view as ViewKey) ? (r.view as ViewKey) : null);

/** Progress 0..1 of the current phase. */
export function viewProgress(): number {
  const s = useView.getState();
  const d = s.phase === 'opening' ? VT.open : s.phase === 'closing' ? VT.close : 1;
  return Math.min(1, Math.max(0, (performance.now() - s.t0) / d));
}

/** Keeps the view store in step with the route and advances its phases. */
export function ViewSync() {
  const route = useRoute((s) => s.route);
  useEffect(() => {
    const next = viewOf(route);
    const s = useView.getState();
    if (next && (s.key !== next || s.phase === 'closing' || s.phase === 'closed')) {
      useView.setState({ key: next, phase: 'opening', t0: performance.now() });
      sfx(next === 'board' ? 'tick' : 'rustle');
    } else if (!next && s.key && s.phase !== 'closing') {
      useView.setState({ phase: 'closing', t0: performance.now() });
    }
  }, [route]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const s = useView.getState();
      const t = performance.now() - s.t0;
      if (s.phase === 'opening' && t >= VT.open) useView.setState({ phase: 'rest', t0: performance.now() });
      else if (s.phase === 'closing' && t >= VT.close) useView.setState({ key: null, phase: 'closed' });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return null;
}

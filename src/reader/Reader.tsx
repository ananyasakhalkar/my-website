import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { projects } from '../content/projects';
import { publications } from '../content/publications';
import { closeView, navigate, useRoute } from '../app/routes';
import { ProjectPage } from './pages/ProjectPage';
import { PublicationPage } from './pages/PublicationPage';
import { KINDS, isReaderKind } from './kinds';
import { closeReader, openReader, pageRect, setPhase, turnTo, useReader } from './readerStore';

/** Keeps the reader in step with the route (the route is the single source of navigation state). */
export function ReaderSync() {
  const route = useRoute((s) => s.route);
  useEffect(() => {
    const s = useReader.getState();
    if (isReaderKind(route.view) && 'page' in route) {
      if (s.kind !== route.view || s.phase === 'closing' || s.phase === 'closed') openReader(route.view, route.page);
      else if (route.page !== s.page) turnTo(route.page);
    } else if (s.kind) closeReader();
  }, [route]);
  return null;
}

function useViewport() {
  const [v, setV] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const on = () => setV({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return v;
}

const COMMIT_DIST = 0.25; // page widths
const COMMIT_VEL = 0.5; // px/ms

/** The DOM half of the reader: crisp, selectable, clickable page at rest; swipe/keys/wheel/buttons to page. */
export function Reader() {
  const kind = useReader((s) => s.kind);
  const page = useReader((s) => s.page);
  const phase = useReader((s) => s.phase);
  const dragFrac = useReader((s) => s.drag);
  const { w, h } = useViewport();
  const rect = pageRect(w, h);
  const total = kind ? KINDS[kind].count : 0;
  const project = kind === 'projects' ? projects[page - 1] : undefined;
  const pub = kind === 'publications' ? publications[page - 1] : undefined;
  const pageEl = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x0: number; y0: number; last: number; lastT: number; vel: number; active: boolean; id: number } | null>(null);

  const go = (n: number) => {
    const k = useReader.getState().kind;
    if (!k || n < 1 || n > KINDS[k].count) return;
    navigate({ view: k, page: n });
  };

  // Keyboard: ←/→, PageUp/PageDown, Esc.
  useEffect(() => {
    if (!kind) return;
    const onKey = (e: KeyboardEvent) => {
      const { phase: ph, page: pg } = useReader.getState();
      if (ph === 'closing') return;
      if (e.key === 'Escape') {
        e.preventDefault();
        closeView();
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        go(pg + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        go(pg - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [kind]);

  // Horizontal trackpad wheel / shift+wheel: one page per gesture.
  useEffect(() => {
    if (!kind) return;
    let acc = 0;
    let cool = 0;
    const onWheel = (e: WheelEvent) => {
      const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
      if (!dx) return;
      e.preventDefault();
      const now = performance.now();
      if (now < cool) return;
      acc += dx;
      if (Math.abs(acc) > 60) {
        go(useReader.getState().page + Math.sign(acc));
        acc = 0;
        cool = now + 550;
      }
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [kind]);

  // Focus the page when it arrives (keyboard and screen-reader users land on the content).
  useEffect(() => {
    if (phase === 'rest') pageEl.current?.focus({ preventScroll: true });
  }, [phase, page]);

  if (!kind || (!project && !pub)) return null;
  const meta = KINDS[kind];

  const onDown = (e: RPointerEvent<HTMLDivElement>) => {
    if (phase !== 'rest' || e.button !== 0) return;
    drag.current = { x0: e.clientX, y0: e.clientY, last: e.clientX, lastT: performance.now(), vel: 0, active: false, id: e.pointerId };
  };
  const onMove = (e: RPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x0;
    if (!d.active) {
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(e.clientY - d.y0)) return;
      d.active = true;
      e.currentTarget.setPointerCapture(d.id);
      window.getSelection()?.removeAllRanges();
      setPhase('drag');
    }
    const t = performance.now();
    d.vel = (e.clientX - d.last) / Math.max(1, t - d.lastT);
    d.last = e.clientX;
    d.lastT = t;
    let frac = dx / rect.w;
    // Rubber-band at the first and last pages.
    if ((page === 1 && frac > 0) || (page === total && frac < 0)) frac *= 0.3;
    useReader.setState({ drag: frac, dragVel: (d.vel * 1000) / rect.w });
  };
  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d?.active) return;
    const frac = useReader.getState().drag;
    const dir = frac < 0 ? 1 : -1; // drag left → next page
    const target = page + dir;
    const fast = Math.abs(d.vel) > COMMIT_VEL && Math.sign(-d.vel) === dir;
    if ((Math.abs(frac) > COMMIT_DIST || fast) && target >= 1 && target <= total) go(target);
    else setPhase('settle');
  };

  const atRest = phase === 'rest';
  // While dragging or settling, the crisp DOM page itself moves, matching the 3D sheet's pose exactly.
  const moving = phase === 'drag' || phase === 'settle';
  const shown = atRest || moving;
  const transform = moving
    ? `translate(${(dragFrac * 1.05 * rect.w).toFixed(1)}px, ${(Math.abs(dragFrac) * 0.04 * rect.h).toFixed(1)}px) rotate(${(dragFrac * 0.17).toFixed(4)}rad)`
    : undefined;
  return (
    <div className="reader" role="dialog" aria-modal="true" aria-label={meta.label}>
      <button type="button" className="reader__outside" aria-label="Back to desk" tabIndex={-1} onClick={closeView} />
      <div
        ref={pageEl}
        className={`reader__page${shown ? ' is-on' : ''}${moving ? ' is-moving' : ''}`}
        style={{ left: rect.left, top: rect.top, width: rect.w, height: rect.h, transform }}
        tabIndex={-1}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        {project && <ProjectPage project={project} arriving={atRest} />}
        {pub && <PublicationPage pub={pub} />}
      </div>
      <div className="reader__hud">
        <button type="button" className="hud-btn" onClick={closeView}>
          ← back to desk
        </button>
        <div className="pager">
          <button type="button" className="hud-btn pager__btn" aria-label={`Previous ${meta.noun.toLowerCase()}`} disabled={page === 1} onClick={() => go(page - 1)}>
            ‹
          </button>
          <span className="pager__n" aria-hidden="true">
            {String(page).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </span>
          <button type="button" className="hud-btn pager__btn" aria-label={`Next ${meta.noun.toLowerCase()}`} disabled={page === total} onClick={() => go(page + 1)}>
            ›
          </button>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {atRest ? `${meta.noun} ${page} of ${total}: ${meta.title(page)}` : ''}
      </p>
    </div>
  );
}

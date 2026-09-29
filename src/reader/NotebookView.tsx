import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { profile } from '../content/profile';
import { research } from '../content/research';
import { about } from '../content/about';
import { closeView, navigate, useRoute } from '../app/routes';
import { useView } from '../app/viewStore';

function useViewport() {
  const [v, setV] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const on = () => setV({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return v;
}

function SpreadOne() {
  return (
    <>
      <section className="nb-page nb-left" aria-label="Notebook, page 1">
        <p className="nb-status">{profile.status}</p>
        <h2 className="nb-name">{profile.name}</h2>
        <p className="nb-lede">{profile.lede}</p>
        <p>{profile.intro}</p>
        <ul className="nb-links">
          {profile.links.map((l) => (
            <li key={l.label}>
              <a href={l.href} {...(l.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <h3 className="nb-hand">at a glance</h3>
        <dl className="nb-glance">
          {profile.glance.map((g) => (
            <div key={g.label}>
              <dt>{g.label}</dt>
              <dd>{g.value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="nb-page nb-right" aria-label="Notebook, page 2">
        <h3 className="nb-hand">research direction</h3>
        {research.direction.map((p) => (
          <p key={p.slice(0, 20)}>{p}</p>
        ))}
        <p className="nb-muted">{research.interestsLead}</p>
        <p className="nb-interests">{research.interests}</p>
      </section>
    </>
  );
}

function SpreadTwo() {
  return (
    <>
      <section className="nb-page nb-left" aria-label="Notebook, page 3">
        <h3 className="nb-hand">beyond research</h3>
        <p>{about.creative}</p>
        <blockquote className="nb-quote">“{about.quote}”</blockquote>
      </section>
      <section className="nb-page nb-right" aria-label="Notebook, page 4">
        <h3 className="nb-hand">competitive programming</h3>
        <p>{about.leetcode}</p>
        <p className="nb-muted nb-small">{about.topics}</p>
        <h3 className="nb-hand">open source</h3>
        <p>{about.openSource}</p>
        <p className="nb-stats">
          {about.stats.map((s) => (
            <span key={s.label}>
              <b>{s.n}</b> {s.label}
            </span>
          ))}
        </p>
        <p className="nb-muted nb-small">{profile.roles}</p>
      </section>
    </>
  );
}

/** The notebook's pages as crisp DOM (DESK_SPEC §4.7): #/about and #/about/2, with a page turn between. */
export function NotebookView() {
  const route = useRoute((s) => s.route);
  const phase = useView((s) => (s.key === 'about' ? s.phase : 'closed'));
  const open = route.view === 'about';
  const spread = route.view === 'about' ? route.page : 1;
  const { w, h } = useViewport();
  const last = useRef(spread);
  const [turn, setTurn] = useState<'fwd' | 'back' | null>(null);
  const drag = useRef<number | null>(null);

  useEffect(() => {
    if (spread !== last.current) {
      setTurn(spread > last.current ? 'fwd' : 'back');
      last.current = spread;
      const t = setTimeout(() => setTurn(null), 720);
      return () => clearTimeout(t);
    }
  }, [spread]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeView();
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown') navigate({ view: 'about', page: 2 });
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') navigate({ view: 'about', page: 1 });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open || phase !== 'rest') return null;
  const narrow = w / h < 0.8;
  const sh = narrow ? undefined : Math.min(h * 0.84, (w * 0.9) / 1.41);
  const sw = narrow ? w * 0.94 : sh! * 1.41;

  const onDown = (e: RPointerEvent) => {
    drag.current = e.clientX;
  };
  const onUp = (e: RPointerEvent) => {
    if (drag.current === null) return;
    const dx = e.clientX - drag.current;
    drag.current = null;
    if (dx < -60) navigate({ view: 'about', page: 2 });
    else if (dx > 60) navigate({ view: 'about', page: 1 });
  };

  return (
    <div className="reader" role="dialog" aria-modal="true" aria-label="Notebook">
      <button type="button" className="reader__outside" aria-label="Back to desk" tabIndex={-1} onClick={closeView} />
      <div
        className={`nb-spread${narrow ? ' is-narrow' : ''}${turn ? ' is-turning-' + turn : ''}`}
        style={{ width: sw, height: sh }}
        onPointerDown={onDown}
        onPointerUp={onUp}
      >
        {spread === 1 ? <SpreadOne /> : <SpreadTwo />}
        <span className="nb-ribbon" aria-hidden="true" />
      </div>
      <div className="reader__hud">
        <button type="button" className="hud-btn" onClick={closeView}>
          ← back to desk
        </button>
      </div>
      <div className="pager">
        <button type="button" className="hud-btn pager__btn" aria-label="Previous spread" disabled={spread === 1} onClick={() => navigate({ view: 'about', page: 1 })}>
          ‹
        </button>
        <span className="pager__n" aria-hidden="true">
          {spread} / 2
        </span>
        <button type="button" className="hud-btn pager__btn" aria-label="Next spread" disabled={spread === 2} onClick={() => navigate({ view: 'about', page: 2 })}>
          ›
        </button>
      </div>
      <p className="sr-only" aria-live="polite">
        {spread === 1 ? 'Notebook: introduction and research direction' : 'Notebook: beyond research'}
      </p>
    </div>
  );
}

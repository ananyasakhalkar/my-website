import { useEffect, type CSSProperties } from 'react';
import { experience } from '../content/experience';
import { closeView, navigate, useRoute } from '../app/routes';
import { useView } from '../app/viewStore';
import { BAND } from '../objects/Badges';
import { pageRect } from './readerStore';

const idAt = (i: number) => experience[(i + experience.length) % experience.length]!.id;

/** The printed sheet on the back of a selected badge (DESK_SPEC §4.6): crisp DOM at rest. */
export function BadgeBackView() {
  const route = useRoute((s) => s.route);
  const phase = useView((s) => (s.key === 'experience' ? s.phase : 'closed'));
  const open = route.view === 'experience';
  const id = route.view === 'experience' ? route.id : null;
  const i = experience.findIndex((r) => r.id === id);
  const role = i >= 0 ? experience[i] : undefined;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      const r = useRoute.getState().route;
      const cur = r.view === 'experience' ? experience.findIndex((x) => x.id === r.id) : -1;
      if (e.key === 'Escape') {
        e.preventDefault();
        closeView();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        navigate({ view: 'experience', id: cur < 0 ? idAt(0) : idAt(cur + (e.key === 'ArrowRight' ? 1 : -1)) });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open || phase !== 'rest') return null;
  const r = pageRect(window.innerWidth, window.innerHeight);
  const sheetStyle = role
    ? ({ left: r.left, top: r.top, width: r.w, height: r.h, '--band': BAND[role.id] } as CSSProperties)
    : undefined;

  return (
    <div className="reader" role="dialog" aria-modal="true" aria-label="Experience">
      <button type="button" className="reader__outside" aria-label="Back to desk" tabIndex={-1} onClick={closeView} />
      {role ? (
        <article key={role.id} className="badge-sheet" style={sheetStyle} aria-labelledby={'xp-' + role.id + '-org'}>
          <div className="badge-sheet__band" aria-hidden="true" />
          <div className="badge-sheet__inner">
            <p className="badge-sheet__dates">{role.dates}</p>
            <h2 className="badge-sheet__org" id={'xp-' + role.id + '-org'}>
              {role.org}
            </h2>
            <p className="badge-sheet__role">{role.role}</p>
            <ul className="badge-sheet__list">
              {role.bullets.map((b) => (
                <li key={b.slice(0, 24)}>{b}</li>
              ))}
            </ul>
            <footer className="page__foot">
              <span>
                {i + 1} / {experience.length} · Experience
              </span>
              <span className="page__mono" aria-hidden="true">
                A.S.
              </span>
            </footer>
          </div>
        </article>
      ) : (
        <p className="badge-hint">pick a badge</p>
      )}
      <div className="reader__hud">
        <button type="button" className="hud-btn" onClick={closeView}>
          ← back to desk
        </button>
        {role && (
          <button type="button" className="hud-btn" onClick={() => navigate({ view: 'experience', id: null })}>
            all badges
          </button>
        )}
      </div>
      {role && (
        <div className="pager">
          <button type="button" className="hud-btn pager__btn" aria-label="Previous role" onClick={() => navigate({ view: 'experience', id: idAt(i - 1) })}>
            ‹
          </button>
          <span className="pager__n" aria-hidden="true">
            {String(i + 1).padStart(2, '0')} / {String(experience.length).padStart(2, '0')}
          </span>
          <button type="button" className="hud-btn pager__btn" aria-label="Next role" onClick={() => navigate({ view: 'experience', id: idAt(i + 1) })}>
            ›
          </button>
        </div>
      )}
      <p className="sr-only" aria-live="polite">
        {role ? role.org + ', ' + role.role + ', ' + role.dates : 'Four ID badges. Pick one.'}
      </p>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { profile } from '../content/profile';
import { education } from '../content/education';
import { certifications, recognition } from '../content/recognition';
import { research } from '../content/research';
import { closeView, useRoute } from '../app/routes';
import { useView } from '../app/viewStore';
import { PenCircle } from './pages/ProjectPage';
import { Crest } from './pages/Crest';

function useViewport() {
  const [v, setV] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const on = () => setV({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return v;
}

/**
 * The open report card (DESK_SPEC §4.4): verbatim facts only. No grades per subject, no ranks,
 * remarks, signatures or seal; the "Remarks" box is labelled "Research interests".
 */
export function ReportCardView() {
  const open = useRoute((s) => s.route.view === 'report-card');
  const phase = useView((s) => (s.key === 'report-card' ? s.phase : 'closed'));
  const { w, h } = useViewport();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeView();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open || phase !== 'rest') return null;
  const narrow = w / h < 0.8;
  const sh = narrow ? undefined : Math.min(h * 0.86, (w * 0.88) / 1.36);
  const sw = narrow ? w * 0.94 : sh! * 1.36;

  return (
    <div className="reader" role="dialog" aria-modal="true" aria-label="Report card">
      <button type="button" className="reader__outside" aria-label="Back to desk" tabIndex={-1} onClick={closeView} />
      <div className={`rc-spread${narrow ? ' is-narrow' : ''}`} style={{ width: sw, height: sh }}>
        <section className="rc-page rc-left" aria-label="Report card, left page">
          <Crest className="rc-crest" />
          <header className="rc-head">
            <span>Report card</span>
          </header>
          <table className="rc-table">
            <tbody>
              <tr>
                <th scope="row">Student</th>
                <td>{profile.name}</td>
              </tr>
              <tr>
                <th scope="row">Institution</th>
                <td>{education.institution}</td>
              </tr>
              <tr>
                <th scope="row">Programme</th>
                <td>{education.programmeFormal}</td>
              </tr>
              <tr>
                <th scope="row">Session</th>
                <td>
                  {education.session} · {education.completed}
                </td>
              </tr>
            </tbody>
          </table>
          <div className="rc-overall">
            <span className="rc-label">Overall</span>
            <span className="rc-cgpa">
              <span className="rc-cgpa__v">
                CGPA {education.cgpa} / {education.cgpaScale}
                <PenCircle seed={893} chars={12} />
              </span>
              <span className="rc-cgpa__c">cumulative grade point average</span>
            </span>
          </div>
          <table className="rc-table rc-subjects">
            <thead>
              <tr>
                <th scope="col">Subjects of note</th>
                <th scope="col">Coursework</th>
              </tr>
            </thead>
            <tbody>
              {education.coursework.map((c) => (
                <tr key={c}>
                  <td colSpan={2}>{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="rc-page rc-right" aria-label="Report card, right page">
          <dl className="rc-list">
            <dt>Research practice</dt>
            <dd>{education.practice}</dd>
            <dt>Recognition &amp; service</dt>
            <dd>
              <ul>
                {recognition.map((r) => (
                  <li key={r.title}>
                    {r.title} <span className="rc-meta">· {r.kind} · {r.year}</span>
                  </li>
                ))}
              </ul>
            </dd>
            <dt>Certificates</dt>
            <dd>
              <ul>
                {certifications.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </dd>
          </dl>
          <div className="rc-remarks">
            <span className="rc-label">Research interests</span>
            <p>{research.interests}</p>
          </div>
          <p className="rc-sign" aria-hidden="true">
            <span />
          </p>
        </section>
      </div>
      <div className="reader__hud">
        <button type="button" className="hud-btn" onClick={closeView}>
          ← back to desk
        </button>
      </div>
      <p className="sr-only" aria-live="polite">
        Report card open
      </p>
    </div>
  );
}

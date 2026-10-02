import type { CSSProperties } from 'react';
import { Crest } from './Crest';
import type { Project } from '../../content/projects';
import { projects } from '../../content/projects';
import { publications } from '../../content/publications';
import { seeded } from '../../scene/textures';

/**
 * A slightly imperfect hand-drawn loop (red pen) around a result, seeded so it is stable per value.
 * The viewBox follows the figure's approximate aspect so the stroke stays even.
 */
export function PenCircle({ seed, chars }: { seed: number; chars: number }) {
  const r = seeded(seed);
  const h = 100;
  const w = Math.max(1.2, chars * 0.45) * h;
  const n = 18;
  const start = -0.5 + r() * 0.4;
  const pts: [number, number][] = [];
  // A little more than one turn, so the pen overshoots where it started.
  for (let i = 0; i <= n + 2; i++) {
    const a = start + (i / n) * Math.PI * 2;
    const wob = 1 + (r() - 0.5) * 0.07 + (i / n) * 0.035;
    pts.push([w / 2 + Math.cos(a) * (w / 2 - 4) * wob, h / 2 + Math.sin(a) * (h / 2 - 5) * wob]);
  }
  const f = (v: number) => v.toFixed(1);
  let d = `M${f(pts[0]![0])} ${f(pts[0]![1])}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = pts[i]!;
    const [nx, ny] = pts[i + 1]!;
    d += ` Q${f(x)} ${f(y)} ${f((x + nx) / 2)} ${f((y + ny) / 2)}`;
  }
  return (
    <svg className="result__circle" viewBox={`0 0 ${f(w)} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <path pathLength={1} d={d} />
    </svg>
  );
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Status stamp: restates a fact only (DESK_SPEC §8). */
function stampFor(p: Project): { text: string; tone: 'red' | 'blue' } | null {
  if (p.stamp) return { text: p.stamp, tone: 'red' };
  const pub = publications.find((x) => x.n === p.relatedPub);
  if (!pub) return null;
  return { text: `${pub.stamp} [${pub.n}]`, tone: pub.status === 'published' ? 'red' : 'blue' };
}

export function ProjectPage({ project, arriving = false }: { project: Project; arriving?: boolean }) {
  const total = projects.length;
  const nn = String(project.n).padStart(2, '0');
  const stamp = stampFor(project);
  const figureAsMetric = project.metrics.length === 0 && project.figure?.strong;
  const results = figureAsMetric
    ? [{ value: project.figure!.strong!, caption: project.figure!.text }]
    : project.metrics;
  return (
    <article className={`page${arriving ? ' is-arriving' : ''}`} aria-labelledby={`${project.id}-title`}>
      {project.n === 1 && <span className="page__staple" aria-hidden="true" />}
      {project.id === 'project-graphrag' && <span className="page__ring" aria-hidden="true" />}
      {stamp && (
        <span className={`stamp stamp--${stamp.tone}`} aria-hidden="true">
          {stamp.text}
        </span>
      )}
      <Crest className="page__crest" />
      <div className="page__inner">
        <header className="page__head">
          <b>Project {nn}</b>
        </header>
        <h2 className="page__title" id={`${project.id}-title`}>
          {project.title}
        </h2>
        {stamp && <p className="sr-only">{stamp.text}</p>}
        {project.aim && <p className="page__aim">{project.aim}</p>}
        <p className="page__label">Approach</p>
        <p className="page__body">{project.body}</p>
        {results.length > 0 && (
          <>
            <p className="page__label">Results</p>
            <div className="page__results">
              {results.map((m, i) => (
                <div className="result" key={m.value} style={{ '--i': i } as CSSProperties}>
                  <span className="result__v">
                    {m.value}
                    <PenCircle seed={hash(m.value)} chars={m.value.length} />
                  </span>
                  <span className="result__c">{m.caption}</span>
                </div>
              ))}
            </div>
          </>
        )}
        {project.figure && !figureAsMetric && <p className="page__figure">{project.figure.text}</p>}
        {project.stack.length > 0 && <p className="page__stack">{project.stack.join(' · ')}</p>}
        {project.links.length > 0 && (
          <ul className="page__links">
            {project.links.map((l) => (
              <li key={l.href}>
                → <a href={l.href}>{l.href.replace(/^https:\/\//, '')}</a>
              </li>
            ))}
          </ul>
        )}
        {project.note && <p className="page__note">{project.note}</p>}
        <footer className="page__foot">
          <span>
            {project.n} / {total} · {project.selected ? 'Selected research' : 'Systems & applied'}
          </span>
          <span className="page__mono" aria-hidden="true">
            <Crest className="page__crest-mini" />
            A.S.
          </span>
        </footer>
      </div>
    </article>
  );
}

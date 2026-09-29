import { useState } from 'react';
import { publications, type Publication } from '../../content/publications';


/** Author list exactly as published; her own name is bolded in place (standard citation style). */
function Authors({ list }: { list: string }) {
  const parts = list.split(/(Ananya Sakhalkar|A\. Sakhalkar)/);
  return (
    <p className="pub__authors">
      {parts.map((p, i) => (p === 'Ananya Sakhalkar' || p === 'A. Sakhalkar' ? <b key={i}>{p}</b> : p))}
    </p>
  );
}

export function PublicationPage({ pub, interactive = true }: { pub: Publication; interactive?: boolean }) {
  const [copied, setCopied] = useState(false);
  const stamp = { text: pub.stamp, tone: pub.status === 'published' ? 'red' : 'blue' };
  const copy = async () => {
    if (!pub.bibtex) return;
    try {
      await navigator.clipboard.writeText(pub.bibtex);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };
  return (
    <article className="page page--pub" aria-labelledby={`${pub.id}-title`}>
      <span className={`stamp stamp--${stamp.tone}`} aria-hidden="true">
        {stamp.text}
      </span>
      <div className="page__inner">
        <header className="page__head">
          <b>[{pub.n}]</b>
        </header>
        <p className="sr-only">{pub.tag}</p>
        <h2 className={`pub__title${pub.untitled ? ' pub__title--plain' : ''}`} id={`${pub.id}-title`}>
          {pub.title}
        </h2>
        {pub.authors && <Authors list={pub.authors} />}
        {pub.venue && <p className={`pub__venue${pub.venueIsTitle ? ' is-title' : ''}`}>{pub.venue}{pub.year ? `, ${pub.year}.` : ''}</p>}
        {pub.topic && <p className="pub__topic">{pub.topic}</p>}
        {pub.contribution && <p className="pub__contribution">{pub.contribution}</p>}
        {pub.methods && (
          <p className="page__body">
            <span className="page__label">Methods </span>
            {pub.methods}
          </p>
        )}
        {pub.relatedProject && (
          <p className="pub__related">
            Related project:{' '}
            {interactive ? <a href={pub.relatedProject.route}>{pub.relatedProject.title}</a> : pub.relatedProject.title}
          </p>
        )}
        {(pub.links.length > 0 || pub.bibtex) && (
          <div className="pub__actions">
            {pub.links.map((l, i) => (
              <a key={l.href} href={l.href} className="pub__action">
                {l.label}
                {i > 0 && <span aria-hidden="true"> ↗</span>}
              </a>
            ))}
            {pub.bibtex && interactive && (
              <button type="button" className="pub__action pub__copy" onClick={() => void copy()}>
                {copied ? 'Copied ✓' : 'Copy BibTeX'}
              </button>
            )}
            <span className="sr-only" aria-live="polite">
              {copied ? 'BibTeX copied' : ''}
            </span>
          </div>
        )}
        <footer className="page__foot">
          <span>
            {pub.n} / {publications.length} · Publications &amp; manuscripts
          </span>
          <span className="page__mono" aria-hidden="true">
            A.S.
          </span>
        </footer>
      </div>
    </article>
  );
}

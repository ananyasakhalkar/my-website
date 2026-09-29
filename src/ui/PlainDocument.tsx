/**
 * The plain "read as a document" version (FACELIFT.md design, public/assets/css/site.css).
 * Prerendered into index.html at build time and used as the fallback; every string comes from src/content.
 */
import type { ReactNode } from 'react';
import { profile } from '../content/profile';
import { research, threads } from '../content/research';
import { publications } from '../content/publications';
import { projects } from '../content/projects';
import { experience, experienceIntro } from '../content/experience';
import { education } from '../content/education';
import { skills } from '../content/skills';
import { certifications, recognition } from '../content/recognition';
import { about } from '../content/about';
import { contact, contactIntro } from '../content/contact';
import type { Link } from '../content/types';

const ICONS: Record<string, ReactNode> = {
  'CV (PDF)': (
    <>
      <path d="M4 1.5h5.5L13 5v9.5H4z" />
      <path d="M9.5 1.5V5H13" />
    </>
  ),
  Email: (
    <>
      <rect x="1.5" y="3.5" width="13" height="9" rx="1" />
      <path d="m2 4 6 5 6-5" />
    </>
  ),
  ORCID: (
    <>
      <circle cx="8" cy="8" r="6.5" />
      <path d="M5.5 6.5v4M8 5.5v5h1.2a2.5 2.5 0 0 0 0-5z" />
    </>
  ),
  GitHub: <path d="m5.5 4.5-3.5 3.5 3.5 3.5M10.5 4.5l3.5 3.5-3.5 3.5" />,
  LinkedIn: (
    <>
      <rect x="1.5" y="1.5" width="13" height="13" rx="2" />
      <path d="M5 7v4.5M5 4.6v.1M8 11.5V7m0 2a2 2 0 0 1 4 0v2.5" />
    </>
  ),
};

const SECTIONS = [
  ['research', 'Research'],
  ['publications', 'Publications'],
  ['projects', 'Projects'],
  ['experience', 'Experience'],
  ['education', 'Education'],
  ['recognition', 'Recognition'],
  ['about', 'About'],
  ['contact', 'Contact'],
] as const;
const NAV = ['research', 'publications', 'projects', 'experience', 'about', 'contact'];

function A({ link, children }: { link: Link; children?: ReactNode }) {
  return (
    <a href={link.href} {...(link.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {children ?? link.label}
    </a>
  );
}

/** Wrap "NLP" in an abbreviation (thread titles). */
function withAbbr(text: string): ReactNode {
  const i = text.indexOf('NLP');
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <abbr title="natural language processing">NLP</abbr>
      {text.slice(i + 3)}
    </>
  );
}

function Head({ n, id, title, children }: { n: number; id: string; title: string; children?: ReactNode }) {
  const label = SECTIONS.find(([s]) => s === id)?.[1] ?? title;
  return (
    <div className="section__head">
      <p className="label">
        {String(n).padStart(2, '0')} — {label}
      </p>
      <h2 id={`${id}-h`}>
        {title}
        <a className="anchor" href={`#${id}`} aria-label={`Link to ${label}`}>
          #
        </a>
      </h2>
      {children}
    </div>
  );
}

export function PlainDocument({ onOpenDesk }: { onOpenDesk?: () => void }) {
  const selected = projects.filter((p) => p.selected);
  const more = projects.filter((p) => !p.selected);
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>

      <header className="nav" id="nav">
        <div className="container nav__inner">
          <a className="mark" href="#top" aria-label={`${profile.wordmark.first}.${profile.wordmark.rest} — back to top`}>
            {profile.wordmark.first}
            <span className="mark__dot">.</span>
            {profile.wordmark.rest}
          </a>
          <nav className="nav__nav" aria-label="Primary">
            <ul className="nav__links" id="nav-links">
              {SECTIONS.filter(([id]) => NAV.includes(id)).map(([id, label]) => (
                <li key={id}>
                  <a href={`#${id}`}>{label}</a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="nav__actions">
            {onOpenDesk && (
              <button className="nav__cv" type="button" onClick={onOpenDesk}>
                ✦ open the 3D desk
              </button>
            )}
            <a className="nav__cv" href="resume.pdf" target="_blank" rel="noopener noreferrer">
              CV ↓
            </a>
          </div>
        </div>
      </header>

      <main id="main">
        {/* ===== Hero ===== */}
        <section className="hero" aria-labelledby="name">
          <div className="hero__contours" aria-hidden="true" />
          <div className="container hero__grid">
            <div className="hero__main hero__seq">
              <p className="status">
                <span className="status__dot" aria-hidden="true" />
                {profile.status}
              </p>
              <h1 id="name">{profile.name}</h1>
              <p className="lede" data-voice="">
                {profile.lede}
              </p>
              <p className="hero__para" data-voice="">
                {profile.intro}
              </p>
              <ul className="linkrow">
                {profile.links.map((l) => (
                  <li key={l.label}>
                    <A link={l}>
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
                        {ICONS[l.label]}
                      </svg>
                      {l.label}
                    </A>
                  </li>
                ))}
              </ul>
            </div>
            <dl className="glance hero__glance">
              {profile.glance.map((g) => (
                <div key={g.label}>
                  <dt className="label">{g.label}</dt>
                  <dd>{g.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <div className="container layout">
          <nav className="toc" aria-label="Sections on this page">
            <ol>
              {SECTIONS.map(([id, label], i) => (
                <li key={id}>
                  <a href={`#${id}`}>
                    {String(i + 1).padStart(2, '0')} {label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="content">
            {/* ===== Research ===== */}
            <section className="section" id="research" aria-labelledby="research-h">
              <Head n={1} id="research" title="Research direction" />
              <div className="prose">
                {research.direction.map((p) => (
                  <p key={p.slice(0, 20)} data-voice="">
                    {p}
                  </p>
                ))}
              </div>
              <div className="interests">
                <p data-voice="">{research.interestsLead}</p>
                <p className="interests__text">{research.interests}</p>
              </div>
              <div className="threads">
                {threads.map((t) => (
                  <article className="card thread" key={t.id}>
                    <p className="label">{t.id}</p>
                    <h3>{withAbbr(t.title)}</h3>
                    <p>{t.body}</p>
                    <p className="evidence">
                      Evidence →{' '}
                      {t.evidence.map((e) => (
                        <a key={e.anchor} href={`#${e.anchor}`}>
                          {e.label}
                        </a>
                      ))}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            {/* ===== Publications ===== */}
            <section className="section" id="publications" aria-labelledby="publications-h">
              <Head n={2} id="publications" title="Publications & manuscripts" />
              <ol className="pubs">
                {publications.map((p) => (
                  <li className="cite" id={p.id} key={p.id}>
                    <span className="cite__num">[{p.n}]</span>
                    <p className={p.untitled ? 'cite__title cite__title--plain' : 'cite__title'}>{p.title}</p>
                    <p className="cite__tags">
                      <span className={p.status === 'published' ? 'tag tag--pub' : 'tag'}>{p.tag}</span>
                    </p>
                    <p className="cite__meta">
                      {p.authors && <>{p.authors}. </>}
                      <em>{p.venue}</em>
                      {p.year && <>, {p.year}.</>}
                      {p.topic && (
                        <>
                          {' '}
                          <span className="muted">{p.topic}</span>
                        </>
                      )}
                    </p>
                    {p.contribution && (
                      <p className="cite__note">
                        <i>{p.contribution}</i>
                      </p>
                    )}
                    {p.relatedProject && (
                      <p className="cite__note">
                        {p.methods && <>Methods: {p.methods}. </>}
                        Related project: <a href={`#${p.relatedProject.anchor}`}>{p.relatedProject.title}</a>
                      </p>
                    )}
                    {(p.links.length > 0 || p.bibtex) && (
                      <div className="cite__actions">
                        {p.links.map((l, i) => (
                          <a key={l.href} href={l.href} className={i === 0 && p.doi ? 'doi' : undefined}>
                            {l.label}
                            {i > 0 && <span aria-hidden="true"> ↗</span>}
                          </a>
                        ))}
                        {p.bibtex && (
                          <details className="bib">
                            <summary>BibTeX</summary>
                            <pre id={`bib-${p.n}`}>{p.bibtex}</pre>
                          </details>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            </section>

            {/* ===== Projects ===== */}
            <section className="section" id="projects" aria-labelledby="projects-h">
              <Head n={3} id="projects" title="Selected research projects" />
              <div className="projects">
                {selected.map((p) => {
                  const pub = publications.find((x) => x.n === p.relatedPub);
                  return (
                    <article className="card project" id={p.id} key={p.id}>
                      <div className="project__top">
                        <h3>{p.title}</h3>
                        {pub && (
                          <a className="tag" href={`#${pub.id}`}>
                            Related paper [{pub.n}]
                          </a>
                        )}
                      </div>
                      <p className="project__aim" data-voice="">
                        {p.aim}
                      </p>
                      <details className="project__approach" open>
                        <summary>Approach</summary>
                        <p>{p.body}</p>
                      </details>
                      <div className="metrics">
                        {p.metrics.map((m) => (
                          <p className="metric" key={m.value}>
                            <span className="metric__v">{m.value}</span>
                            <span className="metric__c">{m.caption}</span>
                          </p>
                        ))}
                      </div>
                      <ul className="stack">
                        {p.stack.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                      {p.note && (
                        <p className="note" data-voice="">
                          {p.note}
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>

              <div className="more" id="more-projects">
                <h3>Systems &amp; applied projects</h3>
                <ul className="more__list">
                  {more.map((p) => (
                    <li id={p.id} key={p.id}>
                      <p className="more__title">{p.title}</p>
                      <div className="more__body">
                        <p>{p.body}</p>
                        {(p.figure || p.stack.length > 0 || p.links.length > 0) && (
                          <p className="more__meta">
                            {p.figure && (
                              <span>
                                {p.figure.strong && <strong>{p.figure.strong}</strong>}
                                {p.figure.strong ? ' ' : ''}
                                {p.figure.text}
                              </span>
                            )}
                            {p.stack.length > 0 && <span>{p.stack.join(' · ')}</span>}
                            {p.links.map((l) => (
                              <a key={l.href} href={l.href}>
                                {l.label} <span aria-hidden="true">↗</span>
                              </a>
                            ))}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* ===== Experience ===== */}
            <section className="section" id="experience" aria-labelledby="experience-h">
              <Head n={4} id="experience" title="Industry experience">
                <p className="sub" data-voice="">
                  {experienceIntro}
                </p>
              </Head>
              {experience.map((r) => (
                <article className="xp" id={`xp-${r.id}`} key={r.id}>
                  <p className="xp__date">{r.dates}</p>
                  <div>
                    <h3 className="xp__org">{r.org}</h3>
                    <p className="xp__role">{r.role}</p>
                    <ul>
                      {r.bullets.map((b) => (
                        <li key={b.slice(0, 24)}>{b}</li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </section>

            {/* ===== Education + tools ===== */}
            <section className="section edu" id="education" aria-labelledby="education-h">
              <Head n={5} id="education" title="Education" />
              <p className="edu__title">{education.title}</p>
              <p className="muted">
                {education.session} · CGPA {education.cgpa} / {education.cgpaScale}. {education.completed}
              </p>
              <dl>
                <div>
                  <dt className="label">Relevant coursework</dt>
                  <dd>{education.coursework.join(', ')}.</dd>
                </div>
                <div>
                  <dt className="label">Research practice</dt>
                  <dd>{education.practice}</dd>
                </div>
              </dl>
              <div className="tools" id="skills">
                <h3>Tools &amp; methods</h3>
                <dl>
                  {skills.map((g) => (
                    <div key={g.group}>
                      <dt className="label">{g.group}</dt>
                      <dd>{g.items.join(' · ')}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </section>

            {/* ===== Recognition ===== */}
            <section className="section" id="recognition" aria-labelledby="recognition-h">
              <Head n={6} id="recognition" title="Recognition & service" />
              <ul className="rec">
                {recognition.map((r) => (
                  <li key={r.title}>
                    <div>
                      <p className="rec__title">{r.title}</p>
                      <p className="rec__kind">{r.kind}</p>
                    </div>
                    <p className="rec__year">{r.year}</p>
                    <p>{r.body}</p>
                  </li>
                ))}
                <li>
                  <div>
                    <p className="rec__title">Certifications</p>
                  </div>
                  <ul className="certs">
                    {certifications.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </li>
              </ul>
            </section>

            {/* ===== About ===== */}
            <section className="section" id="about" aria-labelledby="about-h">
              <Head n={7} id="about" title="Beyond research" />
              <div className="prose">
                <p>{about.creative}</p>
              </div>
              <blockquote className="quote">
                <p>“{about.quote}”</p>
              </blockquote>
              <div className="cols">
                <div>
                  <h3>Competitive programming</h3>
                  <p>{about.leetcode}</p>
                  <p className="muted">{about.topics}</p>
                </div>
                <div>
                  <h3>Open source</h3>
                  <p>{about.openSource}</p>
                </div>
              </div>
              <p className="statline">
                {about.stats.map((s) => (
                  <span key={s.label}>
                    <b>{s.n}</b> {s.label}
                  </span>
                ))}
              </p>
              <p className="roles">{profile.roles}</p>
            </section>

            {/* ===== Contact ===== */}
            <section className="section contact" id="contact" aria-labelledby="contact-h">
              <Head n={8} id="contact" title="Get in touch" />
              <div className="prose">
                <p data-voice="">{contactIntro}</p>
              </div>
              <ul className="contact__list">
                {contact.map((c) => (
                  <li key={c.key}>
                    <a href={c.href} {...(c.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                      <span className="k label">{c.label}</span>
                      <span className="v">{c.value}</span>
                      <span className="arrow" aria-hidden="true">
                        {c.key === 'cv' ? '↓' : c.href.startsWith('http') ? '↗' : '→'}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          <p>{profile.footer}</p>
          <p className="footer__top">
            <a href="#top">Back to top ↑</a>
          </p>
        </div>
      </footer>
    </>
  );
}


import type { Link } from './types';

/** F-ID-1, F-ID-9; hero copy from COPY.md §1 (✎ voice lines), status per Q1 answer (source A). */
export const profile = {
  name: 'Ananya Sakhalkar', // F-ID-1
  wordmark: { first: 'A', rest: 'Sakhalkar' },
  status: 'Seeking MS / PhD positions · Summer 2027 intake', // Q1 answer (source A)
  lede: 'Machine learning where errors are costly — language models for biomedical text and mental-health support, and production ML on a live healthcare platform.', // ✎
  // ✎ Built from F-ID-2, F-ID-4 (A: 8.93), F-PRJ-5, F-PRJ-6, F-EXP-*.
  intro:
    'I studied Computer Science at SRM IST Chennai (B.Tech, 2022 – 2026, CGPA 8.93 / 10). My recent research fine-tunes language models to extract gene–drug associations from PharmGKB text, and to classify emotional state — including crisis risk — in messages, for mental-health support. I have also built and shipped machine learning in production at a government healthcare platform, Jio Platforms and Reliance Industries.',
  links: [
    { label: 'CV (PDF)', href: 'resume.pdf', newTab: true },
    { label: 'Email', href: 'mailto:sakhalkarananya@gmail.com' },
    { label: 'ORCID', href: 'https://orcid.org/0009-0006-6371-5873' }, // F-ID-8
    { label: 'GitHub', href: 'https://github.com/ananyasakhalkar' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/ananya-sakhalkar-834b4337a/' },
    // PENDING Q13: Google Scholar
  ] satisfies Link[],
  /** "At a glance" (COPY.md §1), statuses per Ananya's corrections (source A). */
  glance: [
    { label: 'Publication', value: 'IEEE ICSCAN 2026' },
    { label: 'Research', value: 'Sole-authored technical report; manuscripts in preparation' },
    { label: 'Industry', value: '3 production internships — Jio, APMSIDC, Reliance' },
    { label: 'Education', value: 'B.Tech CS · CGPA 8.93 / 10' },
    { label: 'Recognition', value: '#1 Digithon 2.0 · among 77 teams' },
  ],
  roles: 'Machine Learning Engineer • Software Engineer • Full Stack Developer', // F-ID-9
  location: 'India', // F-ID-7
  footer: '© 2026 Ananya Sakhalkar · India · Last updated September 2026',
};

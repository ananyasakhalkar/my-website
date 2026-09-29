/** F-EXP-*: roles, dates and bullets from the site (COPY.md §6). No résumé-only details. */
export interface Role {
  id: 'jio' | 'apmsidc' | 'reliance' | 'freelance';
  org: string;
  role: string;
  dates: string;
  bullets: string[];
}

export const experienceIntro =
  'Three internships building machine learning that ran in production, and ongoing freelance work.'; // ✎

export const experience: Role[] = [
  {
    id: 'jio', // F-EXP-JIO
    org: 'Jio Platforms Limited',
    role: 'ML & Data Science Intern',
    dates: 'Jan 2026 – Apr 2026',
    bullets: [
      'Designed a real-time ingestion pipeline processing live telecom sensor streams (RSRP, SINR, throughput) at sub-second latency — built for fault tolerance and horizontal scale across a nationwide network.',
      'Engineered Python anomaly detection modules integrated into automated decision pipelines, improving operational response time by 20–30%.',
      'Delivered the end-to-end system — forecasting, visualization and alerting layers — for non-technical operations teams, aimed at predicting site-level failures before they escalate to outages.',
    ],
  },
  {
    id: 'apmsidc', // F-EXP-APM
    org: 'APMSIDC — Govt. Healthcare Platform',
    role: 'ML Engineer Intern',
    dates: 'Feb 2025 – May 2025',
    bullets: [
      'Architected and shipped a production FastAPI inference service achieving under 200ms response time under strict SLA requirements on a live government platform serving real patients.',
      'Designed feature engineering and preprocessing for sensitive clinical data — missing-value handling, outlier detection, feature selection — as modular, tested, iterable code.',
      'Applied model interpretability to surface feature impact and build physician trust, and established evaluation workflows that improved recommendation accuracy across iterations.',
      'Owned the full engineering lifecycle — system design to deployment — in a zero-error-tolerance environment.',
    ],
  },
  {
    id: 'reliance', // F-EXP-REL
    org: 'Reliance Industries Limited',
    role: 'Software Engineering Intern',
    dates: 'May 2024 – Jul 2024',
    bullets: [
      'Built and deployed ML solutions for biotech and industrial use cases achieving ~90%+ classification accuracy and 20–30% performance improvement in anomaly detection.',
      'Protein & Lipid Classification — deep learning models for structure classification at 90%+ accuracy; anomaly detection pipelines for industrial systems.',
      'Presented architectural decisions and technical results directly to internal research leadership; participated in design reviews, code reviews and iterative debugging.',
    ],
  },
  {
    id: 'freelance', // F-EXP-FRE (title per D15 / Q3)
    org: 'Independent',
    role: 'Freelance Software Developer',
    dates: '2023 – Present',
    bullets: [
      'Sole architect and engineer for a full-stack desktop IDE — system design, Python backend, ML modules, React frontend — shipped and iterated with the client over two years.',
      'Designed, trained and delivered ML systems for clients, including ML-based code suggestions and error detection inside the desktop Python IDE.',
    ],
  },
];

import type { Link } from './types';

export type PubStatus = 'published' | 'report' | 'preparation';

export interface Publication {
  n: 1 | 2 | 3 | 4;
  id: string; // plain-document anchor
  /** Exact title; [4] has no title (never invent one) and uses its descriptive line instead. */
  title: string;
  untitled?: boolean;
  status: PubStatus;
  tag: string;
  /** Short status stamp on the paper and its project page (restates `status` only). */
  stamp: string;
  /** Author list exactly as published (order never changes). */
  authors?: string;
  venue?: string;
  /** Venue is a proceedings title (italic in citations) vs. a status line. */
  venueIsTitle?: boolean;
  year?: string;
  topic?: string;
  contribution?: string;
  methods?: string;
  doi?: string;
  links: Link[];
  bibtex?: string;
  relatedProject?: { title: string; anchor: string; route: string };
}

export const publications: Publication[] = [
  {
    // F-PUB-1 — verbatim title, authors (order), venue, DOI, URL, contribution statement.
    n: 1,
    id: 'pub-icscan-2026',
    title:
      'Farm Digital Twin and Deep Learning-Based Crop Health Detection Using Multi-Index Vegetation Signals from Sentinel-2 Satellite Imagery',
    status: 'published',
    stamp: 'Published · IEEE',
    tag: 'Published · IEEE',
    authors: 'Sathya Raman, Ananya Sakhalkar, Priya Debnath',
    venue: '2026 International Conference on System, Computation, Automation and Networking (ICSCAN)',
    venueIsTitle: true,
    year: '2026',
    topic: 'ICSCAN 2026 · Precision Agriculture',
    contribution: 'Primary contributor (methodology, model development, analysis); presented at the conference.',
    doi: '10.1109/ICSCAN66520.2026.11588351',
    links: [
      { label: 'DOI 10.1109/ICSCAN66520.2026.11588351', href: 'https://doi.org/10.1109/ICSCAN66520.2026.11588351' },
      { label: 'IEEE Xplore', href: 'https://ieeexplore.ieee.org/document/11588351' },
    ],
    // No address line: the conference location exists only in the résumé (owner: no résumé details).
    bibtex: [
      '@inproceedings{raman2026farm,',
      '  author    = {Raman, Sathya and Sakhalkar, Ananya and Debnath, Priya},',
      '  title     = {Farm Digital Twin and Deep Learning-Based Crop Health Detection Using Multi-Index Vegetation Signals from Sentinel-2 Satellite Imagery},',
      '  booktitle = {2026 International Conference on System, Computation, Automation and Networking (ICSCAN)},',
      '  year      = {2026},',
      '  doi       = {10.1109/ICSCAN66520.2026.11588351}',
      '}',
    ].join('\n'),
  },
  {
    // F-PUB-2 — status per Ananya (source A): technical report, arXiv label kept, no link (PENDING Q5).
    n: 2,
    id: 'pub-warfarin-llm',
    title:
      'LLM-Based Extraction of Pharmacogenomic Gene-Drug Associations from PharmGKB Text: A Feature-Fusion Approach for Warfarin Dose Prediction',
    status: 'report',
    stamp: 'Technical report',
    tag: 'Technical report · Sole author',
    authors: 'A. Sakhalkar',
    venue: 'Technical report (arXiv).',
    links: [],
    relatedProject: { title: 'LLM Pharmacogenomic Extraction & Warfarin Dosing', anchor: 'project-warfarin', route: '#/projects/1' },
  },
  {
    // F-PUB-3 — status per Ananya (source A): in preparation. No venue, no PDF.
    n: 3,
    id: 'pub-emotion',
    title: 'Emotion Classification and Emotion-Conditioned Response Generation for Mental-Health Support',
    status: 'preparation',
    stamp: 'In preparation',
    tag: 'In preparation · Sole author',
    authors: 'A. Sakhalkar',
    venue: 'Manuscript in preparation.',
    methods: 'DistilBERT · LoRA-tuned Llama 3.1 8B Instruct',
    links: [],
    relatedProject: { title: 'Emotion Classification & Response Generation', anchor: 'project-emotion', route: '#/projects/2' },
  },
  {
    // F-PUB-4 — untitled; status per Ananya (source A).
    n: 4,
    id: 'pub-crop-extension',
    title: 'Also in preparation: sole-authored extension of the ICSCAN 2026 crop-health detection work.',
    untitled: true,
    status: 'preparation',
    stamp: 'In preparation',
    tag: 'In preparation · Sole author',
    venue: 'Manuscript in preparation.',
    links: [],
  },
];

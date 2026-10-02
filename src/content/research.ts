/** COPY.md §2: research direction (✎ voice), interests (F-RI, verbatim), threads (POSITIONING §4). */
export const research = {
  direction: [
    'Most of what I’ve built sits where machine learning meets decisions that matter: an inference service on a live government healthcare platform serving real patients, anomaly detection for a nationwide telecom network, and crop-health monitoring from Sentinel-2 satellite imagery.', // ✎
    'Working on those systems made two questions feel central. Does a model still hold up on data it wasn’t tuned for — another site, another population, another way of writing? And can the people relying on it see why it decided what it did? My recent work tries to evaluate honestly — a pair-aware split with no leakage and a subject-level split in the warfarin study — and in production I applied model interpretability to surface feature impact and build physician trust. How models hold up across sites and domains is what I’d like to study next.', // ✎
  ],
  interestsLead: 'I’d like to pursue these questions in graduate research. My interests:', // ✎
  // F-RI — verbatim; never rephrase.
  interests:
    'Clinical and mental-health NLP; robustness and cross-site/domain generalisation of language models; clinical risk detection; evaluation and reliability of LLMs in high-stakes settings; parameter-efficient fine-tuning and adaptation of LLMs; healthcare machine learning.',
};

export interface Evidence {
  label: string;
  /** Plain-document anchor. */
  anchor: string;
  /** 3D route that opens the matching reader page. */
  route: string;
}

export interface Thread {
  id: 'A' | 'B' | 'C' | 'D';
  title: string;
  body: string;
  evidence: Evidence[];
}

export const threads: Thread[] = [
  {
    id: 'A',
    title: 'Language models for biomedical text',
    body: 'LoRA-fine-tuned Qwen2.5-3B-Instruct extracts gene–drug association status from PharmGKB text; extracted features are fused with genotype and clinical data for warfarin dose prediction.', // F-PRJ-5
    evidence: [
      { label: '[2] technical report', anchor: 'pub-warfarin-llm', route: '#/publications/2' },
      { label: 'project', anchor: 'project-warfarin', route: '#/projects/1' },
    ],
  },
  {
    id: 'B',
    title: 'Mental-health NLP and risk detection',
    body: 'Classification of messages into eight emotional states, including Crisis Risk, and emotion-conditioned response generation with a LoRA-tuned Llama 3.1 8B Instruct.', // F-PRJ-6, F-PUB-3
    evidence: [
      { label: '[3] in preparation', anchor: 'pub-emotion', route: '#/publications/3' },
      { label: 'project', anchor: 'project-emotion', route: '#/projects/2' },
    ],
  },
  {
    id: 'C',
    title: 'Interpretable ML in healthcare',
    body: 'Model interpretability and evaluation workflows for a production inference service on a government healthcare platform, and interpretability tooling for a gene–drug recommendation engine.', // F-EXP-APM, F-PRJ-3
    evidence: [
      { label: 'APMSIDC', anchor: 'xp-apmsidc', route: '#/experience/apmsidc' },
      { label: 'Drug Recommendation Engine', anchor: 'project-drug-rec', route: '#/projects/6' },
    ],
  },
  {
    id: 'D',
    title: 'Remote sensing and ML for agriculture',
    body: 'Crop-health detection from multi-index Sentinel-2 vegetation signals and a farm digital twin; field-level agricultural data with the BAIF Foundation.', // F-PUB-1, F-PRJ-2, F-AWD (BAIF)
    evidence: [
      { label: '[1] IEEE', anchor: 'pub-icscan-2026', route: '#/publications/1' },
      { label: '[4] in preparation', anchor: 'pub-crop-extension', route: '#/publications/4' },
      { label: 'projects', anchor: 'project-digital-twin', route: '#/projects/3' },
    ],
  },
];

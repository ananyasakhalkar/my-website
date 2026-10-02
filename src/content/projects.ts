import type { Link, Metric } from './types';

export interface Project {
  /** Page number in the PROJECTS folder (DESK_SPEC §4.2 order). */
  n: number;
  id: string; // plain-document anchor
  title: string;
  /** Selected research projects get a full card; the rest are compact "systems & applied" rows. */
  selected: boolean;
  aim?: string; // ✎ voice line
  body: string;
  metrics: Metric[];
  /** Figure line for compact rows (verbatim facts); `strong` is emphasised. */
  figure?: { strong?: string; text: string };
  stack: string[];
  links: Link[];
  note?: string; // ✎ (D17 / Q12)
  relatedPub?: 1 | 2 | 3;
  /** Stamp on the project page when it isn't a paper's status. */
  stamp?: string;
}

export const projects: Project[] = [
  {
    n: 1, // F-PRJ-5
    id: 'project-warfarin',
    title: 'LLM Pharmacogenomic Extraction & Warfarin Dosing',
    selected: true,
    aim: 'Turn free-text pharmacogenomic evidence into features a dosing model can use.',
    body: 'LoRA-fine-tuned Qwen2.5-3B-Instruct extracts gene–drug association status from PharmGKB text, evaluated on a pair-aware split of 11,035 pairs with no leakage. Extracted features are fused with genotype and clinical data in XGBoost for warfarin dose prediction, using a subject-level split.',
    metrics: [
      { value: '84.09%', caption: 'extraction accuracy' },
      { value: 'R² 0.70', caption: 'dose prediction' },
      { value: '7.0 mg/wk', caption: 'MAE' },
    ],
    stack: ['Qwen2.5-3B', 'LoRA', 'XGBoost', 'PharmGKB', 'IWPC'],
    links: [], // PENDING Q6
    relatedPub: 2,
  },
  {
    n: 2, // F-PRJ-6 (status per Ananya: in preparation)
    id: 'project-emotion',
    title: 'Emotion Classification & Response Generation',
    selected: true,
    aim: 'Recognize emotional state — including crisis risk — in a message, and condition the response on it.',
    body: 'A fully fine-tuned DistilBERT classifies messages into eight emotional states (incl. Crisis Risk). A LoRA-tuned Llama 3.1 8B Instruct then generates state-conditioned responses. Manuscript in preparation.',
    metrics: [
      { value: '93.4%', caption: 'accuracy' },
      { value: '92.4%', caption: 'F1' },
    ],
    stack: ['DistilBERT', 'Llama 3.1 8B', 'PEFT/LoRA', 'Transformers'],
    links: [], // PENDING Q6
    note: 'Research work; not a substitute for professional mental-health care.',
    relatedPub: 3,
  },
  {
    n: 3, // F-PRJ-2
    id: 'project-digital-twin',
    title: 'Farm Digital Twin',
    selected: true,
    aim: 'Model crop health over time from satellite signals, and let people plan around it.',
    body: 'A digital twin with a time-series ML backend, Google Earth Engine pipelines and a React frontend for what-if scenario planning and geospatial risk heatmaps; modular layers update independently.',
    metrics: [{ value: '~96%', caption: 'crop-health classification accuracy' }],
    stack: ['PyTorch', 'Time-Series ML', 'GEE', 'React'],
    links: [], // PENDING Q6
    relatedPub: 1,
  },
  {
    n: 4, // F-PRJ-7
    id: 'project-graphrag',
    title: 'GraphRAG for Multi-Hop QA',
    selected: true,
    aim: 'Answer questions that need several connected facts, not one retrieved passage.',
    body: 'Combined knowledge-graph traversal with vector retrieval, lifting multi-hop QA accuracy over a standard RAG baseline.',
    metrics: [
      { value: '61→82%', caption: 'multi-hop QA accuracy' },
      { value: '+21 pp', caption: 'vs RAG' },
    ],
    stack: ['GraphRAG', 'Knowledge Graphs', 'Vector Retrieval'],
    links: [], // PENDING Q6, Q11 (benchmark name)
  },
  {
    n: 5, // F-PRJ-1 — old placeholder link to github.com removed (D10).
    id: 'project-crop-monitoring',
    title: 'Distributed Crop Health Monitoring System',
    selected: false,
    body: 'Multi-tiered distributed system: a geospatial ML backend (RF/CNN classifiers on Sentinel-2 satellite imagery), a REST API layer and an interactive React frontend for live farm-level visualization. Z-score anomaly detection handles real-world data variability across large farm regions.',
    metrics: [],
    figure: { text: 'Real-time predictions · multi-tier architecture · scalable pipeline' },
    stack: ['FastAPI', 'React', 'Sentinel-2', 'Random Forest', 'CNN', 'MongoDB'],
    links: [], // PENDING Q6
  },
  {
    n: 6, // F-PRJ-3 — "Clinical Accuracy" relabelled "accuracy on held-out data" (D6, weaker).
    id: 'project-drug-rec',
    title: 'Drug Recommendation Engine',
    selected: false,
    body: 'Multi-model recommendation system for gene–drug interaction prediction with a FastAPI REST backend; robust preprocessing, evaluation pipelines and interpretability tooling to support clinical validation.',
    metrics: [{ value: '~85–90%', caption: 'accuracy on held-out data' }],
    figure: { strong: '~85–90%', text: 'accuracy on held-out data' },
    stack: ['XGBoost', 'Neural Networks', 'FastAPI', 'scikit-learn'],
    links: [], // PENDING Q6 (Drug-Recommendation-Using-Pharmacogenomics: which project?)
  },
  {
    n: 7, // F-PRJ-9
    id: 'project-genomedic',
    title: 'Gene–Drug Interaction Prediction (GenoMedic)',
    selected: false,
    body: 'Full-stack ML system for pharmacogenomic risk scoring: multi-model benchmarking, end-to-end pipeline, live demo.',
    metrics: [],
    figure: { strong: '1st', text: 'at Digithon 2.0, among 77 teams' },
    stack: [],
    links: [],
    stamp: '1st place · Digithon 2.0', // F-PRJ-9
  },
  {
    n: 8, // F-PRJ-10
    id: 'project-chatbot',
    title: 'Mental Health Support Chatbot',
    selected: false,
    body: 'Transformer-based chatbot with sentiment analysis handling 100+ concurrent users; HuggingFace models integrated with Firebase for real-time, low-latency response.',
    metrics: [],
    stack: [],
    links: [{ label: 'Repository', href: 'https://github.com/ananyasakhalkar/Mental-Health-Chatbot-' }],
  },
  {
    n: 9, // F-PRJ-4
    id: 'project-ide',
    title: 'AI-Powered Python IDE',
    selected: false,
    body: 'Full-stack desktop IDE from scratch — system design, ML backend, REST API integration, React frontend, Docker deployment. Sole owner across the complete product lifecycle, iterated with client over 2 years.',
    metrics: [],
    figure: { text: 'Solo · full lifecycle' },
    stack: ['Python', 'React', 'REST APIs', 'Docker', 'ML Pipeline'],
    links: [],
  },
  {
    n: 10, // F-PRJ-8
    id: 'project-plant-disease',
    title: 'Plant Disease Detection',
    selected: false,
    body: 'Multi-class plant disease classification with ResNet and DenseNet, deployed as a cloud inference service.',
    metrics: [],
    stack: ['ResNet', 'DenseNet', 'TensorFlow/Keras', 'Cloud'],
    links: [{ label: 'Repository', href: 'https://github.com/ananyasakhalkar/Plant-Disease-Detection-System' }],
  },
];

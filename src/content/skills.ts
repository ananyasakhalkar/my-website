/** F-SKL: every skill name from the old site, grouped; self-rated percentages removed (D4). */
export const skills: { group: string; items: string[] }[] = [
  { group: 'Language models', items: ['Transformers / HuggingFace', 'PEFT / LoRA', 'Llama 3.1', 'Qwen2.5', 'DistilBERT', 'RAG'] },
  {
    group: 'Machine learning',
    items: ['PyTorch', 'TensorFlow / Keras', 'scikit-learn / XGBoost', 'Random Forest', 'CNNs (ResNet, DenseNet)', 'OpenCV'],
  },
  { group: 'Geospatial', items: ['Google Earth Engine', 'Sentinel-2'] },
  {
    group: 'Engineering',
    items: ['FastAPI', 'Flask', 'React', 'REST APIs', 'Docker', 'MongoDB', 'MySQL', 'Microservices', 'System Design', 'CI/CD', 'Git', 'Linux'],
  },
  { group: 'Languages', items: ['Python', 'C++', 'SQL', 'JavaScript'] },
];

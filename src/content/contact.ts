/** F-CON. Phone kept, last, never in meta/JSON-LD/OG (D13 / Q8). */
export interface ContactItem {
  key: 'email' | 'linkedin' | 'github' | 'orcid' | 'cv' | 'phone';
  label: string;
  value: string;
  href: string;
  newTab?: boolean;
}

export const contactIntro =
  'I’m looking for MS and PhD opportunities for the Summer 2027 intake, and am glad to hear from faculty and research groups working on clinical NLP, reliable language models or healthcare machine learning. I respond within 24 hours.'; // ✎ + F-CON "I respond within 24 hours"

export const respondNote = 'I respond within 24 hours.';

export const contact: ContactItem[] = [
  { key: 'email', label: 'Email', value: 'sakhalkarananya@gmail.com', href: 'mailto:sakhalkarananya@gmail.com' },
  { key: 'linkedin', label: 'LinkedIn', value: 'Ananya-Sakhalkar', href: 'https://www.linkedin.com/in/ananya-sakhalkar-834b4337a/' },
  { key: 'github', label: 'GitHub', value: 'ananyasakhalkar', href: 'https://github.com/ananyasakhalkar' },
  { key: 'orcid', label: 'ORCID', value: '0009-0006-6371-5873', href: 'https://orcid.org/0009-0006-6371-5873' },
  { key: 'cv', label: 'Résumé', value: 'CV — PDF', href: 'resume.pdf', newTab: true },
  { key: 'phone', label: 'Phone', value: '+91 70218 03259', href: 'tel:+917021803259' },
];

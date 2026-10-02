import { projects } from '../content/projects';
import { publications } from '../content/publications';

/** Everything the Reader needs to know about a stack of pages (projects folder, publications stack). */
export const KINDS = {
  projects: {
    count: projects.length,
    label: 'Projects folder',
    noun: 'Project',
    title: (n: number) => projects[n - 1]?.title ?? '',
  },
  publications: {
    count: publications.length,
    label: 'Publications',
    noun: 'Publication',
    title: (n: number) => publications[n - 1]?.title ?? '',
  },
} as const;

export type ReaderKind = keyof typeof KINDS;
export const isReaderKind = (v: string): v is ReaderKind => v in KINDS;

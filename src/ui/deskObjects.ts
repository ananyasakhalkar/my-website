/** The desk's objects in keyboard order (DESK_SPEC §7), with their screen-reader labels and actions. */
import { projects } from '../content/projects';
import { publications } from '../content/publications';
import { experience } from '../content/experience';
import { navigate } from '../app/routes';
import { refill, useSpill } from '../objects/spillStore';
import { useDayNight } from '../scene/dayNight';

export interface DeskObject {
  id: string;
  label: () => string;
  activate: () => void;
}

export const DESK_OBJECTS: DeskObject[] = [
  { id: 'notebook', label: () => 'Notebook — introduction and research direction', activate: () => navigate({ view: 'about', page: 1 }) },
  { id: 'folder', label: () => `Projects folder — ${projects.length} projects`, activate: () => navigate({ view: 'projects', page: 1 }) },
  { id: 'report-card', label: () => 'Report card — academic record', activate: () => navigate({ view: 'report-card' }) },
  {
    id: 'mug',
    label: () => (useSpill.getState().phase === 'upright' ? 'Mug that says collaborate — contact details' : 'Fallen mug — refill'),
    activate: () => (useSpill.getState().phase === 'upright' ? navigate({ view: 'contact' }) : refill()),
  },
  { id: 'journals', label: () => `Publications — ${publications.length} papers and manuscripts`, activate: () => navigate({ view: 'publications', page: 1 }) },
  { id: 'badges', label: () => `ID badges — experience, ${experience.length} roles`, activate: () => navigate({ view: 'experience', id: null }) },
  { id: 'board', label: () => 'Corkboard — research threads and tools', activate: () => navigate({ view: 'board' }) },
  {
    id: 'lamp',
    label: () => (useDayNight.getState().night ? 'Desk lamp — switch back to daylight' : 'Desk lamp — switch to night'),
    activate: () => useDayNight.getState().toggle(),
  },
];

/** Which object opened the current view (focus returns to it on close). */
export const ROUTE_OBJECT: Record<string, string> = {
  about: 'notebook',
  projects: 'folder',
  'report-card': 'report-card',
  contact: 'mug',
  publications: 'journals',
  experience: 'badges',
  board: 'board',
};

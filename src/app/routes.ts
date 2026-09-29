/**
 * Hash routes are the single source of navigation state (DESK_SPEC §5). The app subscribes to them,
 * so deep links, refresh and Back/Forward all just work.
 */
import { create } from 'zustand';
import { projects } from '../content/projects';
import { publications } from '../content/publications';

export type Route =
  | { view: 'desk' }
  | { view: 'projects'; page: number }
  | { view: 'publications'; page: number }
  | { view: 'experience'; id: string | null }
  | { view: 'report-card' }
  | { view: 'contact' }
  | { view: 'about'; page: number }
  | { view: 'board' }
  | { view: 'plain' };

const clampPage = (n: number, max: number) => Math.min(Math.max(1, Math.floor(n) || 1), max);

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const [head, arg] = parts;
  switch (head) {
    case 'projects':
      return { view: 'projects', page: clampPage(Number(arg ?? 1), projects.length) };
    case 'publications':
      return { view: 'publications', page: clampPage(Number(arg ?? 1), publications.length) };
    case 'experience':
      return { view: 'experience', id: arg ?? null };
    case 'report-card':
      return { view: 'report-card' };
    case 'contact':
      return { view: 'contact' };
    case 'about':
      return { view: 'about', page: arg === '2' ? 2 : 1 };
    case 'board':
      return { view: 'board' };
    case 'plain':
      return { view: 'plain' };
    default:
      return { view: 'desk' };
  }
}

export function formatRoute(r: Route): string {
  switch (r.view) {
    case 'desk':
      return '#/';
    case 'projects':
    case 'publications':
      return `#/${r.view}/${r.page}`;
    case 'experience':
      return r.id ? `#/experience/${r.id}` : '#/experience';
    case 'about':
      return r.page === 2 ? '#/about/2' : '#/about';
    default:
      return `#/${r.view}`;
  }
}

interface RouteState {
  route: Route;
  /** The route we arrived from (used to choose transitions). */
  previous: Route | null;
  /** True when the page was loaded straight onto a deep link (skip the intro). */
  deepLinked: boolean;
}

const initial = parseHash(window.location.hash);

export const useRoute = create<RouteState>(() => ({
  route: initial,
  previous: null,
  deepLinked: initial.view !== 'desk',
}));

/**
 * Our own mirror of the history entries this session created, so "close" can return to the desk in one
 * step (history.go(-k)) while the browser's Back still walks back through reader pages first.
 */
const stack: string[] = [formatRoute(initial)];

window.addEventListener('hashchange', () => {
  const next = parseHash(window.location.hash);
  const h = formatRoute(next);
  if (stack.length > 1 && stack[stack.length - 2] === h) stack.pop();
  else if (stack[stack.length - 1] !== h) stack.push(h);
  useRoute.setState((s) => ({ route: next, previous: s.route }));
});

/** Navigate by pushing a history entry. */
export function navigate(r: Route) {
  const h = formatRoute(r);
  if (window.location.hash !== h) window.location.hash = h;
}

/** Close the current view and return to the desk, unwinding the entries pushed inside the view. */
export function closeView() {
  let k = 0;
  for (let i = stack.length - 1; i > 0 && stack[i] !== '#/'; i--) k++;
  if (k > 0 && stack[stack.length - 1 - k] === '#/') window.history.go(-k);
  else navigate({ view: 'desk' });
}

import { projects } from '../content/projects';
import { ProjectPage } from './pages/ProjectPage';

/** Renders one page at texture size for scripts/bake-page-textures.mjs (?bake=projects/3). */
export function BakeView({ spec }: { spec: string }) {
  const [kind, n] = spec.split('/');
  const page = Number(n);
  if (kind === 'projects') {
    const p = projects.find((x) => x.n === page);
    if (p) return <div className="bake-frame"><ProjectPage project={p} /></div>;
  }
  return null;
}

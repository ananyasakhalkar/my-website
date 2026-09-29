import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { canRun3D, prefersReducedMotion } from './app/capabilities';
import { initWind } from './scene/wind';
import { PlainDocument } from './ui/PlainDocument';
import { BakeView } from './reader/BakeView';
import { params } from './app/params';
import './styles/app.css';
import './styles/paper.css';
import { useDesk } from './app/store';

if (import.meta.env.DEV) (window as unknown as { __desk: typeof useDesk }).__desk = useDesk;

const plain = document.getElementById('plain');
const root = document.getElementById('app');

// Production ships the plain document prerendered; the dev server doesn't, so render it here.
if (import.meta.env.DEV && plain && plain.children.length === 0) {
  createRoot(plain).render(<PlainDocument />);
}

if (params.bake && root) {
  // Build-time texture baking (scripts/bake-page-textures.mjs): one page, nothing else.
  document.documentElement.classList.add('bake');
  createRoot(root).render(<BakeView spec={params.bake} />);
} else if (root && canRun3D()) {
  // Without WebGL2 (or on save-data / very low memory), the plain document simply stays.
  document.documentElement.classList.add('desk-on');
  initWind(prefersReducedMotion());
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { canRun3D, prefersReducedMotion } from './app/capabilities';
import { initWind } from './scene/wind';
import { PlainDocument } from './ui/PlainDocument';
import './styles/app.css';

const plain = document.getElementById('plain');
const root = document.getElementById('app');

// Production ships the plain document prerendered; the dev server doesn't, so render it here.
if (import.meta.env.DEV && plain && plain.children.length === 0) {
  createRoot(plain).render(<PlainDocument />);
}

// Without WebGL2 (or on save-data / very low memory), the plain document simply stays.
if (root && canRun3D()) {
  document.documentElement.classList.add('desk-on');
  initWind(prefersReducedMotion());
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

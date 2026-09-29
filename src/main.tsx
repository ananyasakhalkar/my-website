import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { canRun3D, prefersReducedMotion } from './app/capabilities';
import { initWind } from './scene/wind';
import './styles/app.css';

// Without WebGL2 (or on save-data / very low memory), the prerendered plain document simply stays.
const root = document.getElementById('app');
if (root && canRun3D()) {
  document.documentElement.classList.add('desk-on');
  initWind(prefersReducedMotion());
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

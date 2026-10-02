import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/** Production Content-Security-Policy (DESK_SPEC §11), injected at build; the dev server is exempt. */
const CSP = [
  "default-src 'none'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "worker-src 'self' blob:",
  "style-src 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self' blob: data:",
  "media-src 'self' blob:",
  "manifest-src 'self'",
  "base-uri 'self'",
  "form-action 'none'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ');

function csp(): Plugin {
  return {
    name: 'desk-csp',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler: (html) =>
        html.replace('<meta charset="UTF-8">', `<meta http-equiv="Content-Security-Policy" content="${CSP}">\n<meta charset="UTF-8">`),
    },
  };
}

export default defineConfig({
  base: '/my-website/',
  plugins: [react(), csp()],
  build: {
    target: 'es2022',
    assetsInlineLimit: 0,
  },
});

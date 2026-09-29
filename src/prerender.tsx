/** SSR entry used only at build time by scripts/prerender-plain.mjs. */
import { renderToStaticMarkup } from 'react-dom/server';
import { PlainDocument } from './ui/PlainDocument';

export function renderPlain(): string {
  return renderToStaticMarkup(<PlainDocument />);
}

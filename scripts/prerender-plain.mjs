// Renders the PlainDocument (from src/content) into dist/index.html so crawlers, link previews,
// no-JS visitors and the fact checker see every fact (DESK_SPEC §7).
import { readFile, rm, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const MARKER = '<!--plain-document-->';
const ssr = resolve('.prerender/prerender.js');
const { renderPlain } = await import(pathToFileURL(ssr).href);
const file = resolve('dist/index.html');
const html = await readFile(file, 'utf8');
if (!html.includes(MARKER)) throw new Error(`prerender: marker ${MARKER} not found in dist/index.html`);
await writeFile(file, html.replace(MARKER, renderPlain()));
await rm(resolve('.prerender'), { recursive: true, force: true });
console.log('prerender: plain document written into dist/index.html');

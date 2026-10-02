// Fails the build when DESK_SPEC §10 budgets are exceeded, and checks the résumé is byte-identical.
import { readFile, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { join, relative } from 'node:path';

const DIST = 'dist';
const KB = 1024;
const BUDGET = {
  initialJsGzip: 450 * KB, // three + r3f + app
  beforeFirstFrame: 3.5 * KB * KB, // excluding the résumé
  everything: 9 * KB * KB,
};

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

const files = await walk(DIST);
const html = await readFile(join(DIST, 'index.html'), 'utf8');
// Initial: the entry script/style referenced by index.html plus the fonts and assets the room needs up front.
const initial = [...html.matchAll(/(?:src|href)="\/my-website\/([^"]+\.(?:js|css))"/g)].map((m) => join(DIST, m[1]));
let initialJsGzip = 0;
let initialBytes = (await stat(join(DIST, 'index.html'))).size;
for (const f of initial) {
  const buf = await readFile(f);
  initialBytes += buf.length;
  if (f.endsWith('.js')) initialJsGzip += gzipSync(buf).length;
}
// Fonts and images used before the first frame (page textures and the résumé load later, on demand).
for (const f of files) {
  const r = relative(DIST, f).replace(/\\/g, '/');
  if (r.startsWith('assets/fonts/') && r.endsWith('.woff2')) initialBytes += (await stat(f)).size;
}
let everything = 0;
for (const f of files) if (!f.endsWith('resume.pdf')) everything += (await stat(f)).size;

const rows = [
  ['Initial JS (gzip)', initialJsGzip, BUDGET.initialJsGzip],
  ['Bytes before first 3D frame', initialBytes, BUDGET.beforeFirstFrame],
  ['Everything (excl. résumé)', everything, BUDGET.everything],
];
let failed = false;
for (const [name, v, b] of rows) {
  const ok = v <= b;
  failed ||= !ok;
  console.log(`${ok ? '✓' : '✗'} ${name}: ${(v / KB).toFixed(1)} KB / ${(b / KB).toFixed(0)} KB`);
}

// The résumé must be byte-identical in the repo and in dist/.
const sha = async (p) => createHash('sha256').update(await readFile(p)).digest('hex');
const [a, b] = [await sha('public/resume.pdf'), await sha(join(DIST, 'resume.pdf'))];
if (a !== b) {
  console.log('✗ resume.pdf differs between public/ and dist/');
  failed = true;
} else console.log(`✓ resume.pdf identical (${a.slice(0, 12)}…)`);

// Page textures must match the current content (re-run `npm run bake` after editing content or pages).
try {
  const manifest = JSON.parse(await readFile('public/assets/pages/manifest.json', 'utf8'));
  const { contentHash } = await import('./page-hash.mjs');
  const now = await contentHash();
  if (manifest.hash !== now) {
    console.log('✗ page textures are stale: run `npm run bake`');
    failed = true;
  } else console.log('✓ page textures match content');
} catch (e) {
  console.log('✗ page texture manifest missing: run `npm run bake`', e.message);
  failed = true;
}

if (failed) process.exit(1);

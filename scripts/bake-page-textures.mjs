// Bakes each reader page to a WebP texture from the SAME React page component (DESK_SPEC §4.2), so the
// 3D paper in flight shows exactly what the crisp DOM page shows at rest.
// Usage: npm run bake   (uses the system Chrome; set CHROME_PATH to override)
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { contentHash } from './page-hash.mjs';

const OUT = resolve('public/assets/pages');
const W = 1024;
const H = 1448;
const PAGES = [
  { kind: 'projects', count: 10 },
  { kind: 'publications', count: 4 },
];

const chrome =
  process.env.CHROME_PATH ??
  ['C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => existsSync(p));
if (!chrome) throw new Error('bake: no Chrome found; set CHROME_PATH');

const server = await createServer({ server: { port: 5177, strictPort: false }, logLevel: 'error' });
await server.listen();
const base = server.resolvedUrls.local[0];
const browser = await chromium.launch({ executablePath: chrome });
const page = await browser.newPage({ viewport: { width: W, height: H } });
await mkdir(OUT, { recursive: true });

for (const { kind, count } of PAGES) {
  for (let n = 1; n <= count; n++) {
    await page.goto(`${base}?bake=${kind}/${n}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const png = (await page.screenshot({ type: 'png' })).toString('base64');
    const webp = await page.evaluate(async (b64) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      c.getContext('2d').drawImage(img, 0, 0);
      return c.toDataURL('image/webp', 0.86).split(',')[1];
    }, png);
    const file = join(OUT, `${kind}-${String(n).padStart(2, '0')}.webp`);
    await writeFile(file, Buffer.from(webp, 'base64'));
    console.log(`bake: ${file}`);
  }
}
await writeFile(join(OUT, 'manifest.json'), JSON.stringify({ hash: await contentHash() }, null, 2) + '\n');
await browser.close();
await server.close();

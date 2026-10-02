// Hash of everything that affects how a baked reader page looks (content, page components, paper styles).
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';

export async function contentHash() {
  const files = ['src/styles/paper.css', 'src/reader/pages/ProjectPage.tsx', 'src/reader/pages/PublicationPage.tsx', 'src/reader/pages/Crest.tsx'];
  // POSIX paths so the order (and the hash) is the same on Windows and on the Linux CI runner.
  for (const f of await readdir('src/content')) files.push('src/content/' + f);
  const h = createHash('sha256');
  for (const f of files.sort()) h.update((await readFile(f, 'utf8')).replace(/\r\n/g, '\n'));
  return h.digest('hex').slice(0, 16);
}

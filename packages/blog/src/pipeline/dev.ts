import { watch } from 'node:fs';
import { createServer } from 'node:http';
import { execSync } from 'node:child_process';
import { context } from 'esbuild';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { CLIENT_ENTRY, DIST, SRC, POSTS_DIR, STYLES_SRC, ROOT } from '../lib/paths.js';

const MIME: Record<string, string> = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.svg': 'image/svg+xml', '.json': 'application/json', '.xml': 'application/xml',
  '.txt': 'text/plain', '.ico': 'image/x-icon',
};

const buildHTML = () => {
  execSync('tsx src/pipeline/build-html.ts', { cwd: ROOT, stdio: 'inherit' });
};

buildHTML();

const ctx = await context({
  entryPoints: [CLIENT_ENTRY, STYLES_SRC],
  bundle: true,
  outdir: DIST,
  entryNames: '[name]',
  format: 'esm',
  target: 'es2024',
});
await ctx.rebuild();

createServer(async (req, res) => {
  let url = req.url ?? '/';
  if (url.endsWith('/')) url += 'index.html';
  if (!extname(url)) url += '/index.html';

  try {
    const data = await readFile(join(DIST, url));
    res.writeHead(200, { 'Content-Type': MIME[extname(url)] ?? 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
}).listen(3000, () => console.log('Dev server at http://localhost:3000'));

let building = false;
let debounce: ReturnType<typeof setTimeout>;

for (const dir of [SRC, POSTS_DIR]) {
  watch(dir, { recursive: true }, (_event, filename) => {
    if (!filename) return;
    if (!filename.endsWith('.ts') && !filename.endsWith('.css') && !filename.endsWith('.md')) return;
    if (filename.includes('client')) return;
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      if (building) return;
      building = true;
      try {
        buildHTML();
        ctx.rebuild().catch(() => {});
        console.log('Rebuilt');
      } finally {
        setTimeout(() => { building = false; }, 500);
      }
    }, 150);
  });
}

import { readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { app, build, config, here, inside, runtime } from './common.mjs';

await writeFile(join(app, 'index.html'), await readFile(join(here, '../repro/index.html')));
const dist = join(runtime, 'publication-dist');
await build({ ...config, build: { outDir: dist, emptyOutDir: true, target: 'es2024', minify: true, sourcemap: true } });
if (process.argv.includes('--build-only')) process.exit(0);
createServer(async (request, response) => {
  try {
    if (request.method === 'POST' && request.url === '/results') {
      const chunks = []; let length = 0;
      for await (const chunk of request) {
        length += chunk.length;
        if (length > 1048576) throw new Error('Result too large');
        chunks.push(chunk);
      }
      const body = Buffer.concat(chunks).toString('utf8'); JSON.parse(body);
      await writeFile(join(runtime, 'publication-browser-results.json'), body + '\n');
      response.end('Saved'); return;
    }
    const path = new URL(request.url ?? '/', 'http://localhost').pathname;
    const counter = /^\/counter\/(lit|lit-signals|solid|nisli)(\/.*)?$/.exec(path);
    const base = counter ? join(runtime, `publication-size-${counter[1]}`) : dist;
    const route = counter ? counter[2] || '/' : path;
    const target = inside(base, route === '/' ? 'index.html' : route.slice(1));
    let body = await readFile(target);
    if (counter && target.endsWith('.html')) body = Buffer.from(body.toString('utf8').replaceAll('/assets/', `/counter/${counter[1]}/assets/`));
    response.writeHead(200, { 'Content-Type': target.endsWith('.js') ? 'text/javascript' : target.endsWith('.map') ? 'application/json' : 'text/html', 'Cache-Control': 'no-store' });
    response.end(body);
  } catch (error) { response.writeHead(500); response.end(String(error)); }
}).listen(Number(process.env.NISLI_BENCH_PORT ?? 48177), '127.0.0.1', () => console.log('Published-package fixture: http://127.0.0.1:48177'));

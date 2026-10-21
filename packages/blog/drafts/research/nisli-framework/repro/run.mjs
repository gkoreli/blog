import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const runtime = process.env.NISLI_BENCH_RUNTIME;
const nisliRoot = process.env.NISLI_SOURCE_ROOT;
if (!runtime || !nisliRoot) throw new Error('Set NISLI_BENCH_RUNTIME and NISLI_SOURCE_ROOT; see README');
const appRoot = join(runtime, 'app');
await mkdir(appRoot, { recursive: true });
await cp(join(here, 'src'), join(appRoot, 'src'), { recursive: true });
await cp(join(here, 'index.html'), join(appRoot, 'index.html'));
const { build } = await import(pathToFileURL(join(runtime, 'node_modules/vite/dist/node/index.js')).href);
const { default: solid } = await import(pathToFileURL(join(runtime, 'node_modules/@solidjs/vite-plugin/dist/esm/index.mjs')).href);
await build({
  root: appRoot,
  configFile: false,
  plugins: [solid()],
  resolve: { alias: { '@nisli/core': join(nisliRoot, 'packages/core/src/index.ts') } },
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: { outDir: join(runtime, 'dist'), emptyOutDir: true, target: 'es2024', minify: true, sourcemap: true },
});
if (process.argv.includes('--build-only')) process.exit(0);
const port = Number(process.env.NISLI_BENCH_PORT ?? 48173);
const dist = join(runtime, 'dist');
const server = createServer(async (request, response) => {
  try {
    if (request.method === 'POST' && request.url === '/results') {
      const chunks = []; let length = 0;
      for await (const chunk of request) {
        length += chunk.length;
        if (length > 1048576) throw new Error('Result too large');
        chunks.push(chunk);
      }
      const body = Buffer.concat(chunks).toString('utf8');
      JSON.parse(body);
      await writeFile(join(runtime, 'browser-results.json'), body + '\n');
      response.writeHead(200, { 'Content-Type': 'text/plain' }); response.end('Saved'); return;
    }
    const url = new URL(request.url ?? '/', 'http://localhost');
    const counter = /^\/counter\/(lit|lit-signals|solid|nisli)(\/.*)?$/.exec(url.pathname);
    const base = counter ? join(runtime, `size-${counter[1]}`) : dist;
    const route = counter ? counter[2] || '/' : url.pathname;
    const relative = route === '/' ? 'index.html' : route.slice(1);
    const target = resolve(base, relative);
    if (!target.startsWith(base + '/')) { response.writeHead(403); response.end(); return; }
    let body = await readFile(target);
    if (counter && target.endsWith('.html')) {
      body = Buffer.from(body.toString('utf8').replaceAll('/assets/', `/counter/${counter[1]}/assets/`));
    }
    response.writeHead(200, { 'Content-Type': target.endsWith('.js') ? 'text/javascript' : target.endsWith('.map') ? 'application/json' : 'text/html', 'Cache-Control': 'no-store' });
    response.end(body);
  } catch (error) {
    response.writeHead(500, { 'Content-Type': 'text/plain' });
    response.end(error instanceof Error ? error.message : String(error));
  }
});
server.listen(port, '127.0.0.1', () => { console.log(`Article fixture: http://127.0.0.1:${port}`); });

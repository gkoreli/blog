import { cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const runtime = process.env.NISLI_BENCH_RUNTIME;
const baseline = process.env.NISLI_BASELINE_ROOT;
const scheduler = process.env.NISLI_SCHEDULER_ROOT;
const candidate = process.env.NISLI_CANDIDATE_ROOT;
const promise = process.env.NISLI_PROMISE_ROOT;
const pathCache = process.env.NISLI_PATH_ROOT;
if (!runtime || !baseline || !scheduler || !candidate || !promise || !pathCache) throw new Error('Set the runtime and all five source roots');
async function fingerprint(root) {
  const hash = createHash('sha256');
  async function visit(relative) {
    for (const entry of (await readdir(join(root, relative), { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      const path = join(relative, entry.name);
      if (entry.isDirectory()) await visit(path);
      else if (path.endsWith('.ts') && !path.includes('.test.')) {
        hash.update(path); hash.update(await readFile(join(root, path)));
      }
    }
  }
  await visit('packages/core/src');
  return hash.digest('hex');
}
const app = join(runtime, 'optimization-app/optimization');
await mkdir(app, { recursive: true });
await cp(join(here, 'src'), join(app, 'src'), { recursive: true });
await cp(join(here, '../repro/src'), join(app, '../repro/src'), { recursive: true });
await writeFile(join(app, 'index.html'), '<!doctype html><html><meta charset="utf-8"><title>Nisli core optimization</title><style>body{font:16px system-ui;margin:24px}button{padding:12px}pre{white-space:pre-wrap}.row{display:flex;gap:12px}</style><h1>Nisli core optimization</h1><button id="run">Run paired comparison</button><p id="progress">Ready</p><pre id="report"></pre><div id="fixture"></div><script type="module" src="/src/app.ts"></script></html>');
const { build } = await import(pathToFileURL(join(runtime, 'node_modules/vite/dist/node/index.js')).href);
const outDir = join(runtime, 'optimization-dist');
await build({
  root: app, configFile: false,
  resolve: { alias: {
    '@nisli/core-baseline': join(baseline, 'packages/core/src/index.ts'),
    '@nisli/core-scheduler': join(scheduler, 'packages/core/src/index.ts'),
    '@nisli/core-promise': join(promise, 'packages/core/src/index.ts'),
    '@nisli/core-path': join(pathCache, 'packages/core/src/index.ts'),
    '@nisli/core': join(candidate, 'packages/core/src/index.ts'),
  } },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    __NISLI_PERF__: JSON.stringify({ baselineCommit: '4afde49c728a330e10ce887a38b8013d63b58498', baseline: await fingerprint(baseline), schedulerOnly: await fingerprint(scheduler), promiseScheduler: await fingerprint(promise), pathCache: await fingerprint(pathCache), candidate: await fingerprint(candidate), harness: createHash('sha256').update(await readFile(join(here, 'src/app.ts'))).digest('hex') }),
  },
  build: { outDir, emptyOutDir: true, target: 'es2024', minify: true, sourcemap: true },
});
if (process.argv.includes('--build-only')) process.exit(0);
createServer(async (request, response) => {
  try {
    if (request.method === 'POST' && request.url === '/results') {
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      const body = Buffer.concat(chunks).toString('utf8');
      JSON.parse(body);
      await writeFile(join(runtime, 'optimization-results.json'), body + '\n');
      await writeFile(join(runtime, `optimization-results-${Date.now()}.json`), body + '\n');
      response.end('Saved'); return;
    }
    const path = new URL(request.url ?? '/', 'http://localhost').pathname;
    if (path.includes('..')) throw new Error('Invalid path');
    const target = join(outDir, path === '/' ? 'index.html' : path);
    const body = await readFile(target);
    response.writeHead(200, { 'Content-Type': target.endsWith('.js') ? 'text/javascript' : target.endsWith('.map') ? 'application/json' : 'text/html', 'Cache-Control': 'no-store' });
    response.end(body);
  } catch (error) { response.writeHead(500); response.end(String(error)); }
}).listen(Number(process.env.NISLI_BENCH_PORT ?? 48175), '127.0.0.1', () => console.log('Optimization fixture ready'));

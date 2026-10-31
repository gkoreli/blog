import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { freshSchemaPath, schemaObjects } from './fresh-schema.mjs';

const blogRequire = createRequire(new URL('../../blog/package.json', import.meta.url));
const { build } = await import(pathToFileURL(blogRequire.resolve('esbuild')));
const require = createRequire(new URL('../../../package.json', import.meta.url));
const { Miniflare, Log, LogLevel } = await import(pathToFileURL(require.resolve('miniflare', {
  paths: [dirname(require.resolve('wrangler/package.json'))],
})));
const entry = fileURLToPath(new URL('../examples/minimal-worker/worker.ts', import.meta.url));
// Only the test harness waits for all scheduled writes before returning. The
// example itself uses the real ctx.waitUntil API and returns its page promptly.
const bundle = await build({ stdin: { contents: `import worker from ${JSON.stringify(entry)};
export default {async fetch(request,env) {
  const pending=[];
  const response=await worker.fetch(request,env,{waitUntil(p){pending.push(p)}});
  const work=await Promise.allSettled(pending);
  const headers=new Headers(response.headers);
  headers.set('x-test-background-failures',String(work.filter(r=>r.status==='rejected').length));
  return new Response(response.body,{status:response.status,headers});
}};`, resolveDir: dirname(entry) }, bundle: true, format: 'esm', platform: 'browser', write: false });
const secret = randomBytes(32).toString('hex');
let outbound = 0;
function instance(hashKey = randomBytes(32).toString('hex')) {
  return new Miniflare({ modules: true, script: bundle.outputFiles[0].text,
    compatibilityDate: '2026-03-06', cf: {}, d1Databases: { DB: 'minimal-worker' },
    bindings: { ANALYTICS_HASH_KEY: hashKey, ADMIN_SECRET: secret },
    outboundService() { outbound++; throw new Error('External network disabled in portability check'); },
    log: new Log(LogLevel.ERROR),
  });
}
const runtime = instance();
const failedRuntime = instance('');
const browser = 'Mozilla/5.0 Chrome/130.0.0.0 Safari/537.36';
const headers = { 'User-Agent': browser, Accept: 'text/html', 'Accept-Language': 'en',
  'Sec-Fetch-Mode': 'navigate', 'Sec-Fetch-Dest': 'document' };
let requests = 0;
async function visit(path, init = {}, host = 'publication.example', mf = runtime) {
  requests++;
  return mf.dispatchFetch(`https://${host}${path}`, { ...init, headers: { ...headers, ...init.headers } });
}
try {
  const db = await runtime.getD1Database('DB');
  const snapshot = new DatabaseSync(':memory:');
  try {
    snapshot.exec(readFileSync(freshSchemaPath, 'utf8'));
    for (const row of schemaObjects(snapshot)) await db.prepare(row.sql).run();
  } finally { snapshot.close(); }
  assert.equal((await visit('/api/stats')).status, 200);
  const empty = await (await visit('/api/stats')).json();
  assert.equal(empty.totals.views, 0);
  assert.equal((await visit('/notes')).headers.get('x-test-background-failures'), '0');
  await visit('/notes', { headers: { Accept: 'text/markdown' } });
  await visit('/notes', { headers: { 'User-Agent': 'HeadlessChrome/130.0.0.0' } });
  await visit('/notes', { headers: { 'User-Agent': 'ExaSearchBot/1.0' } });
  for (const [path, init, status] of [
    ['/notes', { method: 'HEAD' }, 200], ['/notes', { method: 'POST' }, 405],
    ['/notes', { headers: { 'Sec-Purpose': 'prefetch' } }, 200],
    ['/notes.md', {}, 200], ['/missing', {}, 404], ['/api/stats', { method: 'POST' }, 405],
  ]) assert.equal((await visit(path, init)).status, status);
  assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM page_observations').first()).n, 4);
  const before = await (await visit('/api/stats')).json();
  assert.equal(before.totals.views, 4);
  const stored = (await db.prepare('SELECT reader_kind,agent_name,representation,daily_client_id,signature_status FROM page_observations ORDER BY id').all()).results;
  assert.deepEqual(stored.map(row => row.representation), ['html', 'markdown', 'html', 'html']);
  assert.equal(stored[2].reader_kind, 'headless-browser');
  assert.equal(stored[3].agent_name, 'ExaSearchBot');
  assert.equal(stored[3].reader_kind, 'ai-search');
  assert.equal(stored[3].signature_status, null);
  assert.equal((await visit('/api/owner', { method: 'POST' })).status, 401);
  assert.equal((await visit('/api/owner', { method: 'POST', headers: { Authorization: `Bearer ${secret}` } })).status, 200);
  const marked = await (await visit('/api/stats')).json();
  assert.equal(marked.totals.views, 2); // Prior HTML + Markdown now owner-excluded.
  await visit('/notes');
  assert.equal((await (await visit('/api/stats')).json()).totals.views, 2);
  await visit('/notes', {}, 'another-publication.example');
  assert.equal((await (await visit('/api/stats')).json()).totals.views, 3);
  const ids = (await db.prepare("SELECT daily_client_id FROM page_observations WHERE agent_name IS NULL AND reader_kind <> 'headless-browser' ORDER BY id").all()).results;
  assert.equal(ids[0].daily_client_id, ids[1].daily_client_id);
  assert.notEqual(ids[0].daily_client_id, ids.at(-1).daily_client_id);
  assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM page_observation_diagnostics').first()).n, 0);
  assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM analytics_calibration_trials').first()).n, 0);
  // Missing configuration must be visible as failed background work, while the
  // page still works. The report failure must not become a plausible zero.
  const failed = await visit('/notes', {}, 'publication.example', failedRuntime);
  assert.equal(failed.status, 200);
  assert.equal(failed.headers.get('x-test-background-failures'), '1');
  const failedReport = await visit('/api/stats', {}, 'publication.example', failedRuntime);
  assert.equal(failedReport.status, 503);
  assert.equal(failedReport.headers.get('cache-control'), 'no-store');
  assert.equal(outbound, 0);
  console.log(JSON.stringify({ result: 'passed', requests, storedEvents: 6, publicEvents: 3,
    ownerExcluded: 3, secondOriginIdSeparated: true, diagnostics: 0, externalRequests: outbound,
    storedKinds: stored.map(row => row.reader_kind), productionRequests: 0, humanLabels: 0 }));
} finally { await Promise.all([runtime.dispose(), failedRuntime.dispose()]); }

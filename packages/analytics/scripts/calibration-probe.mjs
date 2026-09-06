// Local known-input experiment. No network calls or production writes.
// Run after: pnpm -C packages/analytics exec tsc -p tsconfig.test.json
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { observePageResponse } from '../.test-dist/index.js';

const cases = [
  ['html', 'text/html', 1],
  ['html-zero', 'text/html;q=0', 0],
  ['wildcard-zero', '*/*;q=0', 0],
  ['text-wildcard', 'text/*', 1],
  ['specific-zero-overrides-wildcard', 'text/html;q=0, */*;q=1', 0],
  ['specific-positive-overrides-wildcard', 'text/html;q=0.5, */*;q=0', 1],
  ['different-subtype', 'text/html-example', 0],
  ['mixed-ranges', 'application/json, text/*;q=0.5', 1],
  ['utf8-parameter', 'text/html;charset="utf-8"', 1],
  ['nonmatching-parameter', 'text/html;profile="other"', 0],
  ['absent', null, null],
  ['empty', '', 0],
];
const database = new DatabaseSync(':memory:');
database.exec(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'));
const d1 = { prepare(sql) { return { bind(...values) { return {
  async run() { return database.prepare(sql).run(...values); },
}; } }; } };
const results = [];
for (const [id, accept, expectedAcceptance] of cases) {
  const headers = new Headers({
    'User-Agent': 'Mozilla/5.0 Chrome/152.0.0.0 Safari/537.36',
    'Sec-Fetch-Mode': 'navigate', 'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Site': 'none', 'Accept-Language': 'en',
    'CF-Connecting-IP': '192.0.2.1',
  });
  if (accept !== null) headers.set('Accept', accept);
  const request = new Request(`https://calibration.example/${id}`, { headers });
  Object.defineProperty(request, 'cf', { value: { asn: 64512, asOrganization: 'Synthetic test network' } });
  const pending = [];
  observePageResponse(request, new Response('<p>fixture</p>', {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  }), 'html', { DB: d1, ANALYTICS_HASH_KEY: 'local-fixture-only' }, {
    waitUntil(promise) { pending.push(promise); },
  });
  await Promise.all(pending);
  const row = database.prepare('SELECT accepts_html, reader_kind, reader_reason, asn_source FROM page_observations WHERE path = ?').get(`/${id}`);
  results.push({ id, accept, expectedAcceptance, ...row, acceptanceMatches: row.accepts_html === expectedAcceptance });
}
const sourceFiles = ['metadata', 'db', 'readerkind', 'index', 'accept'];
const sourceHashes = {};
for (const name of sourceFiles) {
  try { sourceHashes[name] = createHash('sha256').update(readFileSync(new URL(`../.test-dist/${name}.js`, import.meta.url))).digest('hex'); }
  catch (error) { if (name !== 'accept' || error.code !== 'ENOENT') throw error; }
}
console.log(JSON.stringify({
  capturedAt: new Date().toISOString(),
  gitRevision: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  sourceHashes,
  method: 'Synthetic Request -> production observePageResponse -> in-memory SQLite; no HTTP transport, browser, beacon, or production D1 involved.',
  cases: results.length,
  acceptanceMismatches: results.filter(row => !row.acceptanceMatches).length,
  missingProvenance: results.filter(row => row.asn_source === null).length,
  results,
}, null, 2));
database.close();

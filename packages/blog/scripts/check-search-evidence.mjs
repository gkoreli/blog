import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import * as api from '../../analytics/.test-dist/search-evidence.js';

const [output, inputPath] = process.argv.slice(2); assert.ok(output && inputPath);
const base = JSON.parse(readFileSync(new URL('./examples/search-evidence.demo.json', import.meta.url), 'utf8'));
const cases = [], add = (name, mutate, valid = true) => { const input = structuredClone(base); mutate(input); cases.push({ name, input, valid }); };
add('base', () => {});
add('reverse-dimensions', f => { f.request.dimensions.reverse(); f.response.rows.forEach(row => row.keys.reverse()); });
add('empty-response', f => { delete f.response.rows; });
add('recent-without-metadata', f => { f.request.dataState = 'all'; });
add('native-re2-filter', f => { f.request.dimensionFilterGroups = [{ groupType: 'and', filters: [{ dimension: 'query', operator: 'includingRegex', expression: '(?i)agent' }] }]; });
add('dst-calendar-dates', f => { f.request.startDate = '2026-03-07'; f.request.endDate = '2026-03-09'; });
add('url-variant', f => { f.response.rows[0].keys[0] = 'https://example.test/x/../agent-fetchers'; });
add('row-limit', f => { f.request.rowLimit = f.response.rows.length; });
add('duplicate', f => { f.response.rows.push(structuredClone(f.response.rows[0])); }, false);
add('property-aggregate', f => { f.response.responseAggregationType = 'byProperty'; }, false);
add('missing-aggregation', f => { delete f.response.responseAggregationType; }, false);
add('bad-ctr', f => { f.response.rows[0].ctr = 0.8; }, false);
add('wrong-property', f => { f.response.rows[0].keys[0] = 'https://outside.test/article'; }, false);
add('unknown-request-field', f => { f.request.credential = 'private-canary'; }, false);
add('null-default', f => { f.request.rowLimit = null; }, false);
add('invalid-calendar-date', f => { f.request.startDate = '2026-02-30'; }, false);
writeFileSync(inputPath, JSON.stringify(cases) + '\n', { flag: 'wx', mode: 0o600 });
function run(cases, api) {
  return cases.map(trial => {
    try { const result = api.analyzeSearchEvidence(trial.input); return { name: trial.name, accepted: true, result, brief: api.renderSearchEvidence(result) }; }
    catch (error) { return { name: trial.name, accepted: false, error: error instanceof Error ? error.message : 'unexpected-error' }; }
  });
}
const require = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] })));
const bundle = await build({ stdin: { resolveDir: process.cwd(), contents: `
  import * as api from './packages/analytics/src/search-evidence.ts';
  const run=${run.toString()};
  export default {async fetch(request){return Response.json(run(await request.json(),api));}};
` }, bundle: true, write: false, format: 'esm', platform: 'browser', logLevel: 'silent' });
const mf = new Miniflare({ modules: true, script: bundle.outputFiles[0].text, compatibilityDate: '2026-03-06', cf: {} });
try {
  const rounds = [];
  for (let round = 0; round < 3; round++) {
    const node = run(cases, api), response = await mf.dispatchFetch('https://offline.invalid/search', { method: 'POST', body: JSON.stringify(cases) });
    assert.equal(response.status, 200); const native = await response.json(); assert.deepEqual(native, node);
    native.forEach((row, i) => assert.equal(row.accepted, cases[i].valid, row.name)); rounds.push({ round, rows: native });
  }
  const hash = file => createHash('sha256').update(readFileSync(file)).digest('hex');
  writeFileSync(output, JSON.stringify({ checkedAt: new Date().toISOString(), inputSha256: hash(inputPath), sourceSha256: hash('packages/analytics/src/search-evidence.ts'),
    workerBundleSha256: createHash('sha256').update(bundle.outputFiles[0].contents).digest('hex'),
    method: 'Sixteen synthetic saved API-shaped contexts, three exact Node/workerd result and brief comparisons. No native Google export, authenticated data or provider measurement.',
    rounds, acceptedCasesPerRound: 8, rejectedCasesPerRound: 8, productionRequests: 0, externalRequests: 0, d1Statements: 0, realSearchRows: 0 }, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  console.log('48 exact Node/workerd comparisons pass (24 accepted/24 rejected synthetic contexts).');
} finally { await mf.dispose(); }

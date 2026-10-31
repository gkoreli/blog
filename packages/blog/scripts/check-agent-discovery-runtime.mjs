import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import * as api from '../../analytics/.test-dist/agent-discovery-evidence.js';

const [output, extra] = process.argv.slice(2); assert.ok(output && !extra);
const inputPath = 'packages/blog/drafts/research/discovery-experiment-02/agent-discovery-evidence.json';
const base = JSON.parse(readFileSync(inputPath, 'utf8')), cases = [];
function add(name, mutate, accepted = true) { const input = structuredClone(base); mutate(input); cases.push({ name, input, accepted }); }
add('actual-two-run-audit', () => {});
add('completed-empty-pools', f => f.runs.forEach(r => r.observations.forEach(o => { o.returnedSources = []; })));
add('failed-and-missing', f => { const o = f.runs[1].observations[0]; delete o.returnedSources; o.status = 'failed'; o.reason = 'tool-error'; f.runs[1].observations.pop(); });
add('compatible-method', f => { f.runs[0].method = structuredClone(f.runs[1].method); });
add('fragment-reference', f => { f.references.push({ ...f.references[0], sourceUrl: f.references[0].sourceUrl + '#coverage' }); });
add('changed-method', f => { f.runs[1].method.model = 'different-declared-model'; });
add('repeat-reference', f => { f.references.push(structuredClone(f.references[0])); });
add('unregistered-fragment', f => { f.runs[1].observations[0].returnedSources.forEach(s => { s.url += '#section'; }); });
add('duplicate-question', f => { f.questions.push(f.questions[0]); }, false);
add('invalid-date', f => { f.references[0].capturedAt = '2026-02-30T00:00:00Z'; }, false);
add('credential-field', f => { f.runs[0].method.apiKey = 'synthetic-canary'; }, false);
add('ambiguous-source', f => { f.sources[1].urls.push(f.sources[0].urls[0]); }, false);
function run(cases, api) {
  return cases.map(c => {
    try { const report = api.analyzeAgentDiscovery(c.input); return { name: c.name, accepted: true, report, brief: api.renderAgentDiscovery(report) }; }
    catch (error) { return { name: c.name, accepted: false, error: error instanceof Error ? error.message : 'unexpected-error' }; }
  });
}
const require = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] })));
const bundle = await build({ stdin: { resolveDir: process.cwd(), contents: `
  import * as api from './packages/analytics/src/agent-discovery-evidence.ts';
  const run=${run.toString()};
  export default {async fetch(request){return Response.json(run(await request.json(),api));}};
` }, bundle: true, write: false, format: 'esm', platform: 'browser', logLevel: 'silent' });
const mf = new Miniflare({ modules: true, script: bundle.outputFiles[0].text, compatibilityDate: '2026-03-06', cf: {} });
try {
  const node = run(cases, api), response = await mf.dispatchFetch('https://offline.invalid/discovery', { method: 'POST', body: JSON.stringify(cases) });
  assert.equal(response.status, 200); const native = await response.json(); assert.deepEqual(native, node);
  native.forEach((c, i) => assert.equal(c.accepted, cases[i].accepted, c.name));
  const sha = path => createHash('sha256').update(readFileSync(path)).digest('hex');
  writeFileSync(output, JSON.stringify({ checkedAt: new Date().toISOString(), inputSha256: sha(inputPath), sourceSha256: sha('packages/analytics/src/agent-discovery-evidence.ts'),
    comparisons: native.map(c => ({ name: c.name, accepted: c.accepted, exactReportAndBriefMatch: true })),
    method: 'One saved actual audit and eleven explicitly modified controls, one exact Node/workerd comparison each; no search or provider API execution.',
    externalRequests: 0, productionRequests: 0, d1Statements: 0 }, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
  console.log('12 exact Node/workerd comparisons pass (8 accepted, 4 rejected).');
} finally { await mf.dispose(); }

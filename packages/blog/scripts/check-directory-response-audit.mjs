import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { directoryResponseFixture } from '../../analytics/test/fixtures/directory-response.mjs';
import { auditDirectoryResponse } from '../../analytics/.test-dist/directory-response-audit.js';

const [output, privateInputs, captureRoot] = process.argv.slice(2);
assert.ok(output && privateInputs && captureRoot, 'Supply new receipt/input paths and existing private capture root');
const fixture = directoryResponseFixture();
const trials = fixture.cases.map(trial => ({ name: trial.name, now: fixture.now.toISOString(),
  context: { ...trial.context, headers: [...new Headers(trial.context.headers)], body: [...trial.context.body] } }));
for (const name of ['exa', 'ahrefs']) {
  const receipt = JSON.parse(readFileSync(resolve(captureRoot, `${name}.json`), 'utf8'));
  const bytes = readFileSync(resolve(captureRoot, `${name}.body`));
  const { createHash } = await import('node:crypto');
  assert.equal(createHash('sha256').update(bytes).digest('hex'), receipt.bodySha256);
  trials.push({ name: `captured-${name}`, now: receipt.end,
    context: { requestUrl: receipt.url, status: receipt.status, headers: receipt.responseHeaders, body: [...bytes] } });
}
writeFileSync(privateInputs, JSON.stringify({ trials }) + '\n', { mode: 0o600, flag: 'wx' });
const require = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] })));
const bundle = await build({ stdin: { resolveDir: process.cwd(), contents: `
  import { auditDirectoryResponse } from './packages/analytics/src/directory-response-audit.ts';
  export default { async fetch(request) {
    const trial = await request.json();
    return Response.json(await auditDirectoryResponse({...trial.context, body:new Uint8Array(trial.context.body)}, {now:new Date(trial.now)}));
  }};
` }, bundle: true, write: false, format: 'esm', platform: 'browser', logLevel: 'silent' });
const mf = new Miniflare({ modules: true, script: bundle.outputFiles[0].text, compatibilityDate: '2026-03-06', cf: {} });
try {
  const rows = [];
  for (const trial of trials) {
    const node = await auditDirectoryResponse({ ...trial.context, body: new Uint8Array(trial.context.body) }, { now: new Date(trial.now) });
    const response = await mf.dispatchFetch('https://offline.invalid/audit', { method: 'POST', body: JSON.stringify(trial), headers: { 'Content-Type': 'application/json' } });
    assert.equal(response.status, 200);
    const native = await response.json();
    assert.deepEqual(native, node, trial.name);
    rows.push({ name: trial.name, nodeNativeEqual: true, ...node });
  }
  writeFileSync(output, JSON.stringify({ checkedAt: new Date().toISOString(), method: 'Exact Node/local-workerd result comparison; captured proofs assessed at their capture time',
    rows, trials: rows.length, externalRequests: 0, productionRequests: 0, d1Statements: 0 }, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
  console.log(JSON.stringify({ comparedNodeNative: rows.length, productionRequests: 0, d1Statements: 0 }));
} finally { await mf.dispose(); }

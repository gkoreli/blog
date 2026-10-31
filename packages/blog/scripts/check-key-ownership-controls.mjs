import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { keyLifecycleFixture } from '../../analytics/test/fixtures/key-lifecycle.mjs';
import { keyRequestOwnershipTrials } from '../../analytics/test/fixtures/key-request-ownership.mjs';
import * as api from '../../analytics/.test-dist/webbotauth.js';

const [output, inputPath, mode = 'create'] = process.argv.slice(2);
assert.ok(output && inputPath && ['create', 'reuse'].includes(mode));
const fixture = mode === 'reuse' ? JSON.parse(readFileSync(inputPath, 'utf8')) : keyLifecycleFixture();
if (mode === 'create') writeFileSync(inputPath, JSON.stringify(fixture) + '\n', { flag: 'wx', mode: 0o600 });
const require = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] })));
const bundle = await build({ stdin: { resolveDir: process.cwd(), contents: `
  import * as api from './packages/analytics/src/webbotauth.ts';
  const trials=${keyRequestOwnershipTrials.toString()};
  export default {async fetch(request){return Response.json(await trials(await request.json(),api));}};
` }, bundle: true, write: false, format: 'esm', platform: 'browser', logLevel: 'silent' });
const mf = new Miniflare({ modules: true, script: bundle.outputFiles[0].text, compatibilityDate: '2026-03-06', cf: {} });
try {
  const rows = [];
  for (let round = 0; round < 3; round++) {
    const node = await keyRequestOwnershipTrials(fixture, api);
    const response = await mf.dispatchFetch('https://offline.invalid/lifecycle', { method: 'POST', body: JSON.stringify(fixture) });
    assert.equal(response.status, 200); const native = await response.json(); assert.deepEqual(native, node);
    rows.push({ round, cases: native });
  }
  const hash = file => createHash('sha256').update(readFileSync(file)).digest('hex');
  writeFileSync(output, JSON.stringify({ checkedAt: new Date().toISOString(), inputSha256: hash(inputPath),
    sourceSha256: hash('packages/analytics/src/webbotauth.ts'), workerBundleSha256: createHash('sha256').update(bundle.outputFiles[0].contents).digest('hex'),
    method: 'Explicit owner signals, deterministic abort/import barriers; actual crypto; three exact Node/workerd comparisons. Not production or managed-provider verification.', rows,
    productionRequests: 0, externalRequests: 0, d1Statements: 0 }, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify(rows[0]));
} finally { await mf.dispose(); }

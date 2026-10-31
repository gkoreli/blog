import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { directoryAdoptionFixture, directoryAdoptionTrials } from '../../analytics/test/fixtures/directory-adoption.mjs';
import * as requestApi from '../../analytics/.test-dist/webbotauth.js';
import * as responseApi from '../../analytics/.test-dist/directory-response-audit.js';

const [output, inputPath, mode = 'create'] = process.argv.slice(2); assert.ok(output && inputPath && ['create', 'reuse'].includes(mode));
const data = mode === 'create' ? directoryAdoptionFixture() : JSON.parse(readFileSync(inputPath, 'utf8'));
if (mode === 'create') writeFileSync(inputPath, JSON.stringify(data) + '\n', { flag: 'wx', mode: 0o600 });
const require = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] })));
const bundle = await build({ stdin: { resolveDir: process.cwd(), contents: `
  import * as requestApi from './packages/analytics/src/webbotauth.ts';
  import * as responseApi from './packages/analytics/src/directory-response-audit.ts';
  const trials=${directoryAdoptionTrials.toString()};
  export default {async fetch(request){return Response.json(await trials(await request.json(),requestApi,responseApi));}};
` }, bundle: true, write: false, format: 'esm', platform: 'browser', logLevel: 'silent' });
const mf = new Miniflare({ modules: true, script: bundle.outputFiles[0].text, compatibilityDate: '2026-03-06', cf: {} });
try {
  const rows = [];
  for (let round = 0; round < 3; round++) {
    const node = await directoryAdoptionTrials(data, requestApi, responseApi);
    const response = await mf.dispatchFetch('https://offline.invalid/adoption', { method: 'POST', body: JSON.stringify(data) });
    assert.equal(response.status, 200); const native = await response.json(); assert.deepEqual(native, node);
    rows.push({ round, cases: native });
  }
  const hash = file => createHash('sha256').update(readFileSync(file)).digest('hex');
  writeFileSync(output, JSON.stringify({ checkedAt: new Date().toISOString(), sourceHashes: ['packages/analytics/src/directory-response-audit.ts', 'packages/analytics/src/webbotauth.ts'].map(path => ({ path, sha256: hash(path) })),
    inputSha256: hash(inputPath), workerBundleSha256: createHash('sha256').update(bundle.outputFiles[0].contents).digest('hex'),
    method: 'Same exact signed request/response bytes; three exact Node/workerd comparisons with separate pass-through request-verifier/response-audit WebCrypto counters; local policy counterfactuals, not actual enforcement.', rows,
    productionRequests: 0, externalRequests: 0, d1Statements: 0, humanLabels: 0 }, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify(rows[0].cases.map(r => ({ name: r.name, incoming: r.incoming.result.status, digest: r.audit.result.digest,
    authority: r.audit.result.profiles.cloudflareDirectory03.verifiedKeys, bound: r.audit.result.profiles.ietfProtocol01DomainBinding.verifiedKeys, counts: r.audit.counts, hypothetical: r.hypothetical }))));
} finally { await mf.dispose(); }

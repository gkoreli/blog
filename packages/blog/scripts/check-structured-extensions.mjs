import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { makeStructuredExtensionsFixture, runStructuredExtensionsFixture } from '../../analytics/test/fixtures/structured-extensions.mjs';
import * as requestApi from '../../analytics/.test-dist/webbotauth.js';
import * as responseApi from '../../analytics/.test-dist/directory-response-audit.js';

const [output, input, mode] = process.argv.slice(2);
assert.ok(output && input && ['create', 'reuse'].includes(mode));
const data = mode === 'create' ? await makeStructuredExtensionsFixture() : JSON.parse(readFileSync(input, 'utf8'));
if (mode === 'create') writeFileSync(input, JSON.stringify(data) + '\n', { mode: 0o600, flag: 'wx' });
const require = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] })));
const bundle = await build({ stdin: { resolveDir: process.cwd(), contents: `
  import * as requestApi from './packages/analytics/src/webbotauth.ts';
  import * as responseApi from './packages/analytics/src/directory-response-audit.ts';
  const run=${runStructuredExtensionsFixture.toString()};
  export default {async fetch(request){return Response.json(await run(await request.json(),requestApi,responseApi));}};
` }, bundle: true, write: false, format: 'esm', platform: 'browser', logLevel: 'silent' });
const mf = new Miniflare({ modules: true, script: bundle.outputFiles[0].text, compatibilityDate: '2026-03-06', cf: {} });
try {
  const node = await runStructuredExtensionsFixture(data, requestApi, responseApi);
  assert.equal(node.requests.find(row => row.name === 'plain-baseline')?.status, 'verified', 'Plain-signature positive control must verify');
  assert.ok(node.responses.every(row => row.audit.assessment === 'assessed'), 'Response controls must reach assessment');
  if (mode === 'reuse') {
    for (const row of node.syntax) assert.equal(row.canonical, data.syntax.find(source => source.name === row.name)?.canonical, row.name);
    for (const row of node.requests) assert.equal(row.status === 'verified' ? 'verified' : row.reason, data.requests.find(source => source.name === row.name)?.expected, row.name);
    assert.deepEqual(node.responses.map(row => [row.audit.digest, row.audit.profiles.ietfProtocol01DomainBinding.verifiedKeys]), [['matched', 1], ['matched', 0], ['mismatch', 0]]);
  }
  const response = await mf.dispatchFetch('https://offline.invalid/extensions', { method: 'POST', body: JSON.stringify(data) });
  assert.equal(response.status, 200); const native = await response.json(); assert.deepEqual(native, node);
  writeFileSync(output, JSON.stringify({ checkedAt: new Date().toISOString(), inputSha256: createHash('sha256').update(readFileSync(input)).digest('hex'),
    workerSha256: createHash('sha256').update(bundle.outputFiles[0].contents).digest('hex'), nodeWorkerdExact: true, result: node,
    productionRequests: 0, externalRequests: 0 }, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
  console.log(JSON.stringify({ syntax: node.syntax.length, requests: node.requests, responses: node.responses.map(r => ({ name: r.name, digest: r.audit.digest, proofs: r.audit.proofs })) }));
} finally { await mf.dispose(); }

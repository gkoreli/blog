import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { signatureSelectionFixture } from '../../analytics/test/fixtures/signature-selection.mjs';
import { keyMetadataMatrix } from '../../analytics/test/fixtures/key-metadata.mjs';
import { verifyWebBotAuth, createWebBotAuthCache } from '../../analytics/.test-dist/webbotauth.js';
import { VERIFIER_PROFILE_VERSION } from '../../analytics/.test-dist/versions.js';
const [output, fixtureOutput, expectation] = process.argv.slice(2); assert.ok(output && fixtureOutput);
const fixture = await signatureSelectionFixture();
writeFileSync(fixtureOutput, JSON.stringify(fixture)+'\n', { mode: 0o600, flag: 'wx' });
const node = await keyMetadataMatrix(fixture, verifyWebBotAuth, createWebBotAuthCache);
const require = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] })));
const bundle = await build({ stdin: { resolveDir: process.cwd(), contents: `
 import { keyMetadataMatrix } from './packages/analytics/test/fixtures/key-metadata.mjs';
 import { verifyWebBotAuth, createWebBotAuthCache } from './packages/analytics/src/webbotauth.ts';
 export default { async fetch() { return Response.json(await keyMetadataMatrix(${JSON.stringify(fixture)},verifyWebBotAuth,createWebBotAuthCache)); } };
` }, bundle: true, write: false, format: 'esm', platform: 'browser', logLevel: 'silent' });
const mf = new Miniflare({ modules: true, script: bundle.outputFiles[0].text, compatibilityDate: '2026-03-06', cf: {} });
try {
 const response = await mf.dispatchFetch('https://local.fixture.example/'); assert.equal(response.status, 200); const native = await response.json();
 assert.equal(node.length, 16); assert.equal(native.length, 16);
 if (expectation === 'expect-policy') for (const row of [...node, ...native]) {
   assert.equal(row.local.status === 'verified', row.applicationPolicyAccepts, row.name);
   assert.equal(row.local.reason, row.applicationPolicyAccepts ? null : row.name.startsWith('conflicting-key') ? 'key-metadata-conflict' : 'key-metadata-rejected');
 }
 const data = { checkedAt: new Date().toISOString(), verifierProfile: VERIFIER_PROFILE_VERSION,
   policyExpectationEnforced: expectation === 'expect-policy',
   method: 'Independent Ed25519 proof; directory metadata varies while material and signed request stay fixed. Direct import and application normalization are separate paths. Node and actual local workerd; intercepted directories only.', node, native, externalRequests: 0, productionRequests: 0, d1Statements: 0 };
 assert.equal(JSON.stringify(data).includes('metadata-canary'),false);
 writeFileSync(output,JSON.stringify(data,null,2)+'\n',{mode:0o600,flag:'wx'});
 console.log(JSON.stringify({ cases: native.length, nodePolicyMismatches: node.filter(r=>(r.local.status==='verified')!==r.applicationPolicyAccepts).length, nativePolicyMismatches: native.filter(r=>(r.local.status==='verified')!==r.applicationPolicyAccepts).length,
   nativeDirect: native.map(r=>({name:r.name,...r.direct})) }));
} finally { await mf.dispose(); }

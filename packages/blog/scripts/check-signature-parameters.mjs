import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { signatureParameterFixture, signatureParameterMatrix } from '../../analytics/test/fixtures/signature-parameters.mjs';
import { verifyWebBotAuth, verifyWebBotAuthCandidate, createWebBotAuthCache } from '../../analytics/.test-dist/webbotauth.js';
import { auditWebBotAuth } from '../../analytics/.test-dist/webbotauth-audit.js';
import { verificationOutcome } from '../../analytics/.test-dist/signature-evidence.js';
import { VERIFIER_PROFILE_VERSION } from '../../analytics/.test-dist/versions.js';

const [output, fixtureFile, expected] = process.argv.slice(2); assert.ok(output && fixtureFile);
let fixture;
try { fixture = JSON.parse(readFileSync(fixtureFile)); }
catch (error) { if (error.code !== 'ENOENT') throw error; fixture = await signatureParameterFixture(); writeFileSync(fixtureFile, JSON.stringify(fixture) + '\n', { flag: 'wx', mode: 0o600 }); }
const node = await signatureParameterMatrix(fixture, { verify: verifyWebBotAuth, selected: verifyWebBotAuthCandidate, cache: createWebBotAuthCache, audit: auditWebBotAuth, outcome: verificationOutcome });
const require = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] })));
const bundle = await build({ stdin: { resolveDir: process.cwd(), contents: `
  import {signatureParameterMatrix} from './packages/analytics/test/fixtures/signature-parameters.mjs';
  import {verifyWebBotAuth,verifyWebBotAuthCandidate,createWebBotAuthCache} from './packages/analytics/src/webbotauth.ts';
  import {auditWebBotAuth} from './packages/analytics/src/webbotauth-audit.ts';
  import {verificationOutcome} from './packages/analytics/src/signature-evidence.ts';
  export default{async fetch(){return Response.json(await signatureParameterMatrix(${JSON.stringify(fixture)},{verify:verifyWebBotAuth,selected:verifyWebBotAuthCandidate,cache:createWebBotAuthCache,audit:auditWebBotAuth,outcome:verificationOutcome}));}};
` }, bundle: true, write: false, format: 'esm', platform: 'browser', logLevel: 'silent' });
const mf = new Miniflare({ modules: true, script: bundle.outputFiles[0].text, compatibilityDate: '2026-03-06', cf: {} });
try {
  const response = await mf.dispatchFetch('https://local-control.example/'); assert.equal(response.status, 200); const native = await response.json();
  if (expected === 'expect-policy') for (const rows of [node, native]) for (const row of rows) {
    assert.equal(row.paths[0].reason, row.expectedReason, row.name);
    assert.equal(row.paths[1].reason, row.expectedReason, row.name + '/selected');
    if (row.expectedReason?.endsWith('-type')) assert.equal(row.paths[0].outcome, 'invalid');
  }
  writeFileSync(output, JSON.stringify({ checkedAt: new Date().toISOString(), verifierProfile: VERIFIER_PROFILE_VERSION,
    policyExpectationEnforced: expected === 'expect-policy', method: 'Independently constructed Ed25519 signatures, fixed recorded clock, default/selected/all-candidate APIs in Node and actual local workerd. No production traffic or remote discovery.', node, native, externalRequests: 0, productionRequests: 0, d1Statements: 0 }, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ casesPerRuntime: native.length, apiPathsPerRuntime: native.length * 3,
    nodeDefaultPolicyMismatches: node.filter(row => row.paths[0].reason !== row.expectedReason).length,
    nativeDefaultPolicyMismatches: native.filter(row => row.paths[0].reason !== row.expectedReason).length }));
} finally { await mf.dispose(); }

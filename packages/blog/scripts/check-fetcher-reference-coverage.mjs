import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { verifyWebBotAuth, buildSignatureBase, createWebBotAuthCache } from '../../analytics/.test-dist/webbotauth.js';

// Explicit saved directory and pinned reference source only. No network fallback.
const [directoryFile, referenceRoot, output] = process.argv.slice(2);
assert.ok(output, 'Provide directory JSON, pinned reference checkout and a new receipt path');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const captureFile = 'packages/blog/drafts/research/ai-fetcher-headers/data/captures.jsonl';
const captureBytes = readFileSync(captureFile);
const directoryBytes = readFileSync(directoryFile);
const directory = JSON.parse(directoryBytes);
assert.equal(directory.keys.length, 1);
const jwk = directory.keys[0];
assert.equal(jwk.kty, 'OKP');
assert.equal(jwk.crv, 'Ed25519');
const thumbprint = createHash('sha256').update(JSON.stringify({ crv: jwk.crv, kty: jwk.kty, x: jwk.x })).digest('base64url');
assert.equal(thumbprint, 'Ov3HDsa8JQ39dPEYFvFFN-cUpnz9yNI8LDvr-5LeiBM');
assert.equal(jwk.kid, thumbprint);

const pinned = {
  'core.ts': '81d8586901f895a3c6dc5e6f0dba6c44c9c6ee89998e7de70043fd7e334789b4',
  'errors.ts': 'a4decc66313fedd0b62889badbd39c0d68df5f2245aa7a8faeaa46ac59c1aae6',
  'types.ts': '2ecab61767bc9984c94ea86d0dc0e6fb7677dbd4a03641c63bd5ea43a7830647',
};
for (const [file, expected] of Object.entries(pinned)) assert.equal(hash(readFileSync(resolve(referenceRoot, 'reference', file))), expected);
const dependency = JSON.parse(readFileSync(resolve(referenceRoot, 'node_modules/structured-headers/package.json')));
assert.equal(dependency.version, '2.1.1');
const referenceBuild = await build({ entryPoints: [resolve(referenceRoot, 'reference/core.ts')], bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent' });
const reference = await import('data:text/javascript;base64,' + Buffer.from(referenceBuild.outputFiles[0].text).toString('base64'));
const key = await crypto.subtle.importKey('jwk', jwk, { name: 'Ed25519' }, false, ['verify']);

const originals = captureBytes.toString('utf8').trim().split('\n').map(line => JSON.parse(line)).filter(row => row.headers['signature']);
assert.equal(originals.length, 2);
assert.deepEqual(originals.map(row => row.probe), ['duckai-path', 'duckai-goga']);
async function local(trial, directory) {
  const request = new Request(trial.url, { method: trial.method, headers: trial.headers });
  const result = await verifyWebBotAuth(request, { cache: createWebBotAuthCache(), now: new Date(trial.now), includeEvidence: true, fetcher: async url => {
    if (String(url) !== 'https://assistbot.duckduckgo.com/.well-known/http-message-signatures-directory') throw Error('Outside fixed resolver');
    if (trial.unavailable) throw Error('Controlled directory outage');
    return Response.json(directory, { headers: { 'Content-Type': 'application/http-message-signatures-directory+json' } });
  } });
  return { status: result.status, reason: result.reason ?? null, coverage: result.evidence ?? null, base: buildSignatureBase(request, 'sig1') };
}
const worker = await build({ stdin: { resolveDir: process.cwd(), contents: `
  import {verifyWebBotAuth,buildSignatureBase,createWebBotAuthCache} from './packages/analytics/src/webbotauth.ts';
  const local=${local.toString()};
  export default {async fetch(request){const {trial,directory}=await request.json();return Response.json(await local(trial,directory));}};
` }, bundle: true, write: false, format: 'esm', platform: 'browser', logLevel: 'silent' });
const require = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] })));
const mf = new Miniflare({ modules: true, script: worker.outputFiles[0].text, compatibilityDate: '2026-03-06', cf: {} });
const rows = [];
try {
  for (const original of originals) {
    const clock = Date.parse(original.observed_at);
    assert.ok(Number.isFinite(clock));
    let originalBase;
    for (const variant of ['original', 'user-agent', 'path-query', 'method', 'all-unsigned', 'authority', 'publisher', 'signature-bytes', 'expired', 'directory-unavailable']) {
      const trial = { url: original.url, method: original.method, headers: { ...original.headers }, now: new Date(clock).toISOString() };
      const url = new URL(trial.url);
      if (variant === 'user-agent' || variant === 'all-unsigned') trial.headers['user-agent'] = 'OfflineChangedClient/1.0';
      if (variant === 'path-query' || variant === 'all-unsigned') { url.pathname = '/offline-changed-resource'; url.search = '?changed=1'; }
      if (variant === 'method' || variant === 'all-unsigned') trial.method = 'POST';
      if (variant === 'authority') url.hostname = 'offline-invalid.example';
      // Same discovery origin/key; changing only the signed field reaches crypto.
      if (variant === 'publisher') trial.headers['signature-agent'] = '"https://assistbot.duckduckgo.com/"';
      if (variant === 'directory-unavailable') trial.unavailable = true;
      if (variant === 'signature-bytes') trial.headers.signature = trial.headers.signature.replace(/(:)([A-Za-z0-9+/])/, (_, colon, first) => colon + (first === 'A' ? 'B' : 'A'));
      if (variant === 'expired') trial.now = new Date((Number(/expires=(\d+)/.exec(trial.headers['signature-input'])[1]) + 61) * 1000).toISOString();
      trial.url = url.href;
      const node = await local(trial, directory);
      const response = await mf.dispatchFetch('https://offline.invalid/coverage', { method: 'POST', body: JSON.stringify({ trial, directory }) });
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), node);
      let independentBase;
      let independentValid = false;
      let independentReason = null;
      try {
        await reference.verifySignature({ kind: 'request', method: trial.method, targetUri: trial.url, fields: Object.entries(trial.headers).map(([name, value]) => ({ name, value })) }, {
          label: 'sig1', policy: { algorithms: ['ed25519'], requiredComponents: ['@authority', 'signature-agent'], requiredParameters: ['created', 'expires', 'keyid', 'tag'], now: Math.floor(Date.parse(trial.now) / 1000), clockSkew: 60 },
          resolveVerifier: async candidate => {
            assert.equal(candidate.parameters.keyid, thumbprint);
            if (trial.unavailable) throw Error('Controlled directory outage');
            return { algorithm: 'ed25519', verify: async (base, signature) => { independentBase = new TextDecoder().decode(base); return crypto.subtle.verify('Ed25519', key, signature, base); } };
          },
        });
        independentValid = true;
      } catch (error) { independentReason = error.code; }
      const expectedValid = ['original', 'user-agent', 'path-query', 'method', 'all-unsigned'].includes(variant);
      assert.equal(node.status === 'verified', expectedValid, `${original.probe}/${variant}`);
      assert.equal(independentValid, expectedValid);
      const expectedReason = variant === 'expired' ? 'expired' : variant === 'directory-unavailable' ? 'dir-fetch-failed' : expectedValid ? null : 'signature-invalid';
      assert.equal(node.reason, expectedReason);
      if (independentBase !== undefined) assert.equal(independentBase, node.base);
      if (variant === 'original') originalBase = node.base;
      assert.equal(node.base === originalBase, !['authority', 'publisher'].includes(variant));
      if (expectedValid) {
        assert.equal(node.coverage.covered.authority, true);
        for (const field of ['method', 'path', 'query', 'targetUri', 'userAgent']) assert.equal(node.coverage.covered[field], false);
      }
      rows.push({ probe: original.probe, variant, localStatus: node.status, localReason: node.reason, independentValid, independentReason, baseUnchanged: node.base === originalBase, coverage: node.coverage });
    }
  }
  const receipt = { checkedAt: new Date().toISOString(), sourceBaseline: 'e2fdae6', capturesSha256: hash(captureBytes), directorySha256: hash(directoryBytes), directoryScope: 'Current saved directory key, not reconstructed September resolver state', reference: { repository: 'cloudflare/web-bot-auth', commit: 'e4d3167886d0e7508d55fc5c501f1e498a3d4f5c', sourceHashes: pinned, structuredHeaders: '2.1.1', bundleSha256: hash(referenceBuild.outputFiles[0].text) }, contextsPerRuntime: rows.length, runtimes: ['Node 24.14.1 local verifier', 'Miniflare/workerd local verifier', 'pinned independent RFC implementation with WebCrypto Ed25519'], rows, scriptSha256: hash(readFileSync(new URL(import.meta.url))), verifierSha256: hash(readFileSync('packages/analytics/src/webbotauth.ts')), newOwnSiteRequests: 0, d1Statements: 0, humanLabels: 0, historicalProductionOutcomeRewritten: false };
  writeFileSync(output, JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify({ contextsPerRuntime: rows.length, verifiedPerRuntime: rows.filter(row => row.localStatus === 'verified').length, invalidSignaturePerRuntime: rows.filter(row => row.localReason === 'signature-invalid').length, expiredPerRuntime: rows.filter(row => row.localReason === 'expired').length, unavailablePerRuntime: rows.filter(row => row.localReason === 'dir-fetch-failed').length }));
} finally { await mf.dispose(); }

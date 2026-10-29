// Offline replay of the frozen public-diagnostic controls. No live endpoint calls.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { verifyWebBotAuth } from '../../analytics/.test-dist/webbotauth.js';
import { VERIFIER_PROFILE_VERSION } from '../../analytics/.test-dist/versions.js';

const [inputPath, probePath, referencePath, outputPath] = process.argv.slice(2);
assert.ok(outputPath, 'input, probe, reference and private output paths required');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const bytes = readFileSync(inputPath), input = JSON.parse(bytes);
const probe = JSON.parse(readFileSync(probePath)), reference = JSON.parse(readFileSync(referencePath));
assert.equal(digest(bytes), probe.inputSha256);
assert.equal(digest(bytes), reference.inputSha256);
assert.equal(input.trials.length, 9);
assert.equal(new Set(input.trials.map(row => row.variant)).size, 9);
assert.equal(probe.rows.length, 9);
assert.equal(reference.rows.length, 9);

async function inspect(trial, verify) {
  const result = await verify(new Request(trial.url, { method: trial.method, headers: trial.headers }), {
    now: new Date(trial.now), maxAgeSeconds: 86400, includeEvidence: true,
    fetcher: async url => {
      assert.equal(String(url), 'https://diagnostic.invalid/.well-known/http-message-signatures-directory');
      return Response.json(trial.directory, { headers: { 'Content-Type': 'application/http-message-signatures-directory+json' } });
    },
  });
  return { status: result.status, reason: result.reason ?? null, headerForm: result.evidence?.headerForm ?? null };
}

const bundled = await build({ stdin: { resolveDir: process.cwd(), contents: `
import assert from 'node:assert/strict';
import {verifyWebBotAuth} from './packages/analytics/src/webbotauth.ts';
const inspect = ${inspect.toString()};
export default {async fetch(request) {return Response.json(await inspect(await request.json(),verifyWebBotAuth));}};`
}, bundle: true, write: false, platform: 'browser', external: ['node:assert/strict'], format: 'esm', logLevel: 'silent' });
const script = bundled.outputFiles[0].text;
const require = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] })));
const mf = new Miniflare({ modules: true, script, compatibilityDate: '2026-03-06', compatibilityFlags: ['nodejs_compat'], cf: {} });
try {
  const rows = [];
  for (const trial of input.trials) {
    const original = probe.rows.find(row => row.variant === trial.variant);
    const independent = reference.rows.find(row => row.variant === trial.variant);
    assert.ok(original && independent);
    const node = await inspect(trial, verifyWebBotAuth);
    const response = await mf.dispatchFetch('https://offline.example/check', { method: 'POST', body: JSON.stringify(trial) });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), node);
    assert.deepEqual(node, original.local);
    const expectedReferenceValid = ['structured-valid', 'bare-uri-valid', 'dictionary-valid', 'agent-not-covered', 'non-https-agent'].includes(trial.variant);
    assert.equal(independent.returnedResults === 1, expectedReferenceValid);
    assert.equal(independent.error === null, expectedReferenceValid);
    rows.push({ variant: trial.variant, ...node, referenceValid: expectedReferenceValid });
  }
  const result = {
    checkedAt: new Date().toISOString(), inputSha256: digest(bytes),
    probeSha256: digest(readFileSync(probePath)), referenceSha256: digest(readFileSync(referencePath)),
    scriptSha256: digest(readFileSync(new URL(import.meta.url))), bundleSha256: digest(Buffer.from(script)),
    verifierProfile: VERIFIER_PROFILE_VERSION, nodeAndNativeAgree: true, contextsPerRuntime: rows.length, rows,
    externalRequests: 0, d1Statements: 0, humanLabels: 0,
    limits: ['Mocked directory resolution is not HTTPS reachability or provider enrollment.',
      'Generic RFC verification does not enforce the Web Bot Auth component/discovery policy.',
      'Local workerd is not the managed Cloudflare verifier.'],
  };
  writeFileSync(outputPath, JSON.stringify(result, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify({ contextsPerRuntime: rows.length, nodeAndNativeAgree: true, referenceValid: rows.filter(row => row.referenceValid).length }));
} finally {
  await mf.dispose();
}

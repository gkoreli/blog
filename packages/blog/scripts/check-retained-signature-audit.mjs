import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { retainedSignatureFixture } from '../../analytics/test/fixtures/retained-signature.mjs';
import { auditRetainedWebBotAuth } from '../../analytics/.test-dist/retained-signature-audit.js';

const [retainedFile, privateInput, output] = process.argv.slice(2);
assert.ok(output);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const retainedBytes = readFileSync(retainedFile), retained = JSON.parse(retainedBytes);
assert.equal(hash(retainedBytes), JSON.parse(readFileSync('packages/blog/drafts/research/analytics-retrospective/latest-signed-production.json')).inputCommitments.replay);
const originals = retained.trials.filter(row => row.variant === 'original'); assert.equal(originals.length, 2);
const fixture = await retainedSignatureFixture();
const trials = Object.entries(fixture.records).map(([name, row]) => ({ name, row }));
for (const name of ['limit', 'unavailable', 'deadline', 'mutation', 'missing-clock', 'null-clock', 'invalid-clock', 'header-budget', 'malformed']) trials.push({ name, row: name === 'limit' ? fixture.records.mixed : fixture.records.original });
for (const [i, row] of originals.entries()) trials.push({ name: `retained-${i}`, row });
const inputBytes = JSON.stringify({ trials }) + '\n'; writeFileSync(privateInput, inputBytes, { flag: 'wx', mode: 0o600 });

// Same frozen inputs and explicit resolver in each runtime. Remote URLs never
// reach a transport: each admitted resolver response comes from the trial.
async function invoke(item, audit) {
  const { name, row } = item, headers = new Headers(row.headers);
  if (name === 'header-budget') headers.set('Signature', 'a'.repeat(32769));
  if (name === 'malformed') headers.set('Signature-Input', 'broken');
  const request = new Request(row.url, { method: row.method, headers });
  const clock = new Date(row.now); let aborted = false;
  const pending = audit(request, { recordedAt: name === 'missing-clock' ? undefined : name === 'null-clock' ? null : name === 'invalid-clock' ? new Date(NaN) : clock,
    maxCandidates: name === 'limit' ? 1 : 8, deadlineMs: name === 'deadline' ? 50 : 2000,
    fetcher: async (url, init) => {
      if (!['https://retained-fixture.example/.well-known/http-message-signatures-directory', 'https://crawler.exa.ai/.well-known/http-message-signatures-directory'].includes(String(url))) throw Error('Unreviewed resolver');
      if (name === 'unavailable') return new Response(null, { status: 503 });
      if (name === 'deadline') return new Promise((resolve, reject) => init.signal.addEventListener('abort', () => { aborted = true; reject(Error('Controlled abort')); }, { once: true }));
      if (name === 'mutation') { request.headers.set('cookie', 'REDACTED'); clock.setTime(NaN); }
      return Response.json(row.directory, { headers: { 'Content-Type': 'application/http-message-signatures-directory+json' } });
    } });
  return { result: await pending, aborted };
}
const bundle = await build({ stdin: { resolveDir: process.cwd(), contents: `
import {auditRetainedWebBotAuth} from './packages/analytics/src/retained-signature-audit.ts';
const invoke=${invoke.toString()};
export default{async fetch(request){return Response.json(await invoke(await request.json(),auditRetainedWebBotAuth));}};` },
  bundle: true, write: false, format: 'esm', platform: 'browser', logLevel: 'silent' });
const require = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] })));
const mf = new Miniflare({ modules: true, script: bundle.outputFiles[0].text, compatibilityDate: '2026-03-06', cf: {} });
try {
  const results = [];
  for (const trial of trials) {
    const node = await invoke(trial, auditRetainedWebBotAuth);
    const response = await mf.dispatchFetch('https://offline.example/audit', { method: 'POST', body: JSON.stringify(trial) });
    assert.equal(response.status, 200); const native = await response.json(); assert.deepEqual(native, node, trial.name);
    const { result: r } = native, name = trial.name;
    assert.equal(r.originalRequestValidity, 'not-established'); assert.equal(r.directorySnapshotEquivalence, 'not-established');
    if (['missing-clock', 'null-clock', 'invalid-clock'].includes(name)) { assert.equal(r.capturedInputAudit, null); assert.equal(r.recordedClock, 'missing-or-invalid'); }
    else {
      assert.equal(r.capturedInputAudit.verifiedCandidates, ['original', 'literal', 'unsignedMarker', 'mixed', 'mutation'].includes(name) || name.startsWith('retained-') ? 1 : 0, name);
      if (['redacted', 'invalid', 'limit'].includes(name)) assert.equal(r.capturedInputAudit.notVerifiedByProfileCandidates, 1, name);
      if (name === 'missing') { assert.equal(r.availability.missingHeaderComponents, 1); assert.equal(r.capturedInputAudit.indeterminateCandidates, 1); }
      if (['deadline', 'unavailable'].includes(name)) { assert.equal(r.capturedInputAudit.unavailableCandidates, 1); assert.equal(r.capturedInputAudit.notVerifiedByProfileCandidates, 0); }
      if (name === 'deadline') { assert.equal(r.capturedInputAudit.termination, 'deadline'); assert.equal(native.aborted, true); }
      if (name === 'limit') { assert.equal(r.availability.uninspectedCandidates, 1); assert.equal(r.capturedInputAudit.unassessedCandidates, 1); }
    }
    results.push({ name, ...native });
  }
  const receipt = { checkedAt: new Date().toISOString(), scope: 'offline retained representation diagnostic', inputSha256: hash(inputBytes), retainedInputSha256: hash(retainedBytes),
    scriptSha256: hash(readFileSync(new URL(import.meta.url))), moduleSha256: hash(readFileSync('packages/analytics/src/retained-signature-audit.ts')),
    fixtureSha256: hash(readFileSync('packages/analytics/test/fixtures/retained-signature.mjs')), casesPerRuntime: results.length, results,
    newProductionRequests: 0, d1Statements: 0, externalResolverRequests: 0, newHumanLabels: 0,
    limits: ['Two retained originals come from Research 72; no new observation.', 'Marker shape does not establish provider redaction.', 'No original-wire or historical directory snapshot equivalence claim.'] };
  writeFileSync(output, JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify({ casesPerRuntime: results.length, retainedOriginals: originals.length, newProductionRequests: 0 }));
} finally { await mf.dispose(); }

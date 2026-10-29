import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { createRequire } from 'node:module';
import { dirname, resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { reconcileInvocations } from './reconcile-organic-exa.mjs';
import { verifyWebBotAuth, createWebBotAuthCache } from '../../../../analytics/.test-dist/webbotauth.js';
import { auditWebBotAuth } from '../../../../analytics/.test-dist/webbotauth-audit.js';
import { auditWebBotAuthReuse } from '../../../../analytics/.test-dist/webbotauth-reuse-audit.js';
import { COLLECTION_VERSION, VERIFIER_PROFILE_VERSION } from '../../../../analytics/.test-dist/versions.js';

const [headersFile, chainsFile, directoryRoot, output, privateInput] = process.argv.slice(2); assert.ok(privateInput);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const headersBytes = readFileSync(headersFile), chainsBytes = readFileSync(chainsFile);
const headers = JSON.parse(headersBytes), chains = JSON.parse(chainsBytes);
assert.equal(COLLECTION_VERSION, '2026-10-29.3'); assert.equal(VERIFIER_PROFILE_VERSION, '2026-10-29.1');
assert.equal(headers.length, 409); assert.equal(chains.length, 8);
const ids = new Map(), requests = new Set(); let forwarded = 0, signatureTriples = 0;
for (const row of headers) {
  assert.equal(row.$metadata.type, 'cf-worker-event'); assert.ok(typeof row.$metadata.id === 'string' && typeof row.$metadata.requestId === 'string');
  assert.equal(requests.has(row.$metadata.requestId), false);
  ids.set(row.$metadata.id, (ids.get(row.$metadata.id) ?? 0) + 1); requests.add(row.$metadata.requestId);
  assert.ok(Date.parse(row.timestamp) >= Date.parse('2026-10-29T03:15:00Z') && Date.parse(row.timestamp) < Date.parse('2026-10-29T04:15:00Z'));
  const fields = new Headers(row.$workers.event.request.headers); assert.ok(fields.has('x-forwarded-proto'));
  if (fields.has('forwarded')) forwarded++;
  if (['signature', 'signature-input', 'signature-agent'].every(name => fields.has(name))) signatureTriples++;
}
assert.equal(forwarded, 0); assert.equal(signatureTriples, 2);
const duplicateLogIdGroups = [...ids.values()].filter(count => count > 1);
assert.equal(ids.size, 402); assert.deepEqual(duplicateLogIdGroups, Array(7).fill(2));
const reconciled = reconcileInvocations(chains, new Set(['ExaSearchBot']));
assert.equal(reconciled.reconciliations.length, 2); assert.ok(reconciled.reconciliations.every(row => row.complete)); assert.ok(Object.values(reconciled.integrity).every(value => value === 0));
const directoryBytes = readFileSync(join(directoryRoot, 'exa.json')), capture = JSON.parse(readFileSync(join(directoryRoot, 'exa-capture.json')));
assert.equal(capture.source, 'https://crawler.exa.ai/.well-known/http-message-signatures-directory'); assert.equal(capture.responseStatus, 200); assert.equal(capture.sha256, hash(directoryBytes));
assert.equal(capture.responseHeaders['content-type'].split(';')[0].trim(), 'application/http-message-signatures-directory+json');
assert.ok(Object.keys(capture.responseHeaders).every(name => ['content-type', 'cache-control', 'age'].includes(name)));
const fetcher = async url => { assert.equal(String(url), capture.source); return new Response(directoryBytes, { headers: capture.responseHeaders }); };
const trials = [], rows = [], observations = [], workers = new Set();
for (const item of reconciled.reconciliations.sort((a, b) => Date.parse(a.row.timestamp) - Date.parse(b.row.timestamp))) {
  const invocation = item.row, at = new Date(invocation.timestamp), data = invocation.$workers.event.request;
  // Broad export log IDs collide. The scoped native request reference must be
  // unique, and neither signed record may belong to a colliding log-ID group.
  const originalCopy = headers.filter(row => row.$metadata.requestId === invocation.$metadata.requestId); assert.equal(originalCopy.length, 1);
  assert.equal(originalCopy[0].$metadata.id, invocation.$metadata.id); assert.equal(ids.get(invocation.$metadata.id), 1);
  assert.equal(originalCopy[0].timestamp, invocation.timestamp); assert.ok(isDeepStrictEqual(originalCopy[0].$workers.event.request, data));
  const stored = chains.filter(row => row.$metadata.requestId === invocation.$metadata.requestId && row.source?.message === 'analytics.observation_stored'); assert.equal(stored.length, 1);
  const receipt = stored[0].source.receipt;
  assert.equal(stored[0].source.collectionVersion, COLLECTION_VERSION); assert.equal(receipt.version, '2026-10-29.1'); assert.equal(receipt.signature.verifierProfile, VERIFIER_PROFILE_VERSION);
  assert.equal(receipt.signature.outcome, 'verified'); assert.equal(receipt.readerKind, 'ai-search'); assert.equal(receipt.declarations.candidateNames, 'ExaSearchBot');
  assert.equal(receipt.vendorNetwork.configuredDeclarationCount, 0); assert.equal(receipt.vendorNetwork.unmappedDeclarationCount, 1); assert.equal(receipt.vendorNetwork.checkCount, 0);
  assert.ok(Date.parse(capture.capturedAt) > at.getTime()); workers.add(invocation.$workers.scriptVersion.id);
  const request = new Request(data.url, { method: data.method, headers: data.headers }); assert.equal(request.method, 'GET'); assert.equal(request.headers.has('Forwarded'), false);
  assert.equal(request.headers.has('x-analytics-control'), false); assert.equal(request.headers.has('x-analytics-fixture'), false);
  const variants = [
    ['original', request],
    ['changed-authority', (() => { const url = new URL(request.url); url.hostname = 'offline-control.invalid'; return new Request(url, { method: request.method, headers: request.headers }); })()],
    ['changed-unsigned-role-and-path', (() => { const url = new URL(request.url); url.pathname = '/offline-unsigned-role-control'; const fields = new Headers(request.headers); fields.set('User-Agent', 'OfflineControl/1.0'); return new Request(url, { method: request.method, headers: fields }); })()],
  ];
  const outcomes = {};
  for (const [variant, context] of variants) {
    const result = await verifyWebBotAuth(context, { now: at, includeEvidence: true, maxAgeSeconds: 86400, cache: createWebBotAuthCache(), fetcher });
    assert.equal(result.status, variant === 'changed-authority' ? 'unverified' : 'verified'); assert.equal(result.reason ?? null, variant === 'changed-authority' ? 'signature-invalid' : null);
    if (variant === 'original') {
      assert.equal(result.agent, 'https://crawler.exa.ai');
      for (const [name, value] of Object.entries(result.evidence.covered)) assert.equal(receipt.signature.coverage[name], value);
      assert.deepEqual(result.evidence.selection, receipt.signature.selection);
    }
    outcomes[variant] = { status: result.status, reason: result.reason ?? null };
    trials.push({ vendor: 'exa', variant, now: at.toISOString(), url: context.url, method: context.method, headers: Object.fromEntries(context.headers), directory: JSON.parse(directoryBytes) });
  }
  const audit = await auditWebBotAuth(request, { now: at, maxAgeSeconds: 86400, fetcher }); assert.equal(audit.assessment, 'complete'); assert.equal(audit.verifiedCandidates, 1);
  observations.push({ reference: invocation.$metadata.requestId, request, observedAt: at });
  rows.push({ collectionVersion: stored[0].source.collectionVersion, receiptVersion: receipt.version, readerKind: receipt.readerKind, declaredClient: receipt.declarations.candidateNames,
    signature: receipt.signature, native: receipt.native, vendorNetwork: receipt.vendorNetwork, exhaustiveAudit: audit, outcomes });
}
const reuse = await auditWebBotAuthReuse(observations, { fetcher, maxObservations: 2, maxCandidatesPerObservation: 2, deadlineMs: 2000, maxAgeSeconds: 86400 });
assert.equal(reuse.assessment, 'complete'); assert.equal(reuse.verifiedObservations, 2); assert.equal(reuse.distinctVerifiedProofs, 2); assert.equal(reuse.distinctUsableNonces, 2); assert.equal(reuse.repeatedProofGroups, 0); assert.equal(reuse.repeatedNonceGroups, 0);
const inputBytes = JSON.stringify({ trials }) + '\n'; writeFileSync(privateInput, inputBytes, { flag: 'wx', mode: 0o600 });
const bundle = await build({ stdin: { resolveDir: process.cwd(), contents: `
 import {verifyWebBotAuth,createWebBotAuthCache} from './packages/analytics/src/webbotauth.ts';
 import {VERIFIER_PROFILE_VERSION} from './packages/analytics/src/versions.ts';
 export default{async fetch(request){const trial=await request.json();const result=await verifyWebBotAuth(new Request(trial.url,{method:trial.method,headers:trial.headers}),{
  now:new Date(trial.now),includeEvidence:true,maxAgeSeconds:86400,cache:createWebBotAuthCache(),fetcher:async url=>{
   if(String(url)!=='https://crawler.exa.ai/.well-known/http-message-signatures-directory')throw Error('Unreviewed directory');
   return Response.json(trial.directory,{headers:{'Content-Type':'application/http-message-signatures-directory+json'}});
  }});return Response.json({verifierProfile:VERIFIER_PROFILE_VERSION,status:result.status,reason:result.reason??null,coverage:result.evidence??null});}};` }, bundle: true, write: false, format: 'esm', platform: 'browser', logLevel: 'silent' });
const require = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] })));
const mf = new Miniflare({ modules: true, script: bundle.outputFiles[0].text, compatibilityDate: '2026-03-06', cf: {} });
try {
  const native = [];
  for (const trial of trials) {
    const response = await mf.dispatchFetch('https://offline.example/verify', { method: 'POST', body: JSON.stringify(trial) }); assert.equal(response.status, 200);
    const result = await response.json(); assert.equal(result.verifierProfile, VERIFIER_PROFILE_VERSION);
    assert.equal(result.status, trial.variant === 'changed-authority' ? 'unverified' : 'verified'); assert.equal(result.reason, trial.variant === 'changed-authority' ? 'signature-invalid' : null);
    native.push({ variant: trial.variant, ...result });
  }
  const result = { checkedAt: new Date().toISOString(), headersExportSha256: hash(headersBytes), chainsSha256: hash(chainsBytes), privateInputSha256: hash(inputBytes),
    method: 'Fixed selected retained records; Node and local workerd verification at recorded times with later captured reviewed Exa keys',
    headerSelection: { start: '2026-10-29T03:15:00.000Z', end: '2026-10-29T04:15:00.000Z', nativeCount: 409, exportCap: 500, exportedInvocations: headers.length,
      distinctLogReferences: ids.size, duplicateLogIdGroups: duplicateLogIdGroups.length, recordsInDuplicateLogIdGroups: duplicateLogIdGroups.reduce((n, count) => n + count, 0),
      signedRecordsInDuplicateLogIdGroups: 0, distinctRequestReferences: requests.size, positiveHeader: 'x-forwarded-proto', capturedForwardedHeaders: forwarded, signatureTriples },
    exactCompleteChains: 2, matchingIndependentInvocationCopies: 2, nativeExportIntegrity: reconciled.integrity, executionWorkers: [...workers], rows, native, reuse, directory: capture,
    externalReplayRequests: 0, newSiteRequests: 0, newHumanLabels: 0,
    limits: ['Retained header objects are not independently wire-complete; native sampling/retention and field-discovery limits remain.', 'No D1 readback accepted yet.',
      'Origin proofs leave User-Agent and resource unsigned; distinct proofs/nonces do not establish distinct actions or human triggers.', 'Later directory keys do not recover original discovery snapshots or managed-provider agreement.'] };
  writeFileSync(output, JSON.stringify(result, null, 2) + '\n', { flag: 'wx', mode: 0o600 }); console.log(JSON.stringify({ headerObjects: headers.length, forwarded, latestCollectorChains: 2, nodeAndNativeContexts: trials.length }));
} finally { await mf.dispose(); }

import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { reconcileReceiptStorage } from './reconcile-receipt-storage.mjs';
import { reconcileInvocations } from './reconcile-organic-exa.mjs';
import { verifyWebBotAuth, createWebBotAuthCache } from '../../../../analytics/.test-dist/webbotauth.js';
import { auditWebBotAuth } from '../../../../analytics/.test-dist/webbotauth-audit.js';
import { nativeCategoryEvidence } from '../../../../analytics/.test-dist/native-bot-evidence.js';
import { VERIFIER_PROFILE_VERSION } from '../../../../analytics/.test-dist/versions.js';

// Fixed reviewed cohort. No arbitrary origin or live resolver fallback.
const vendors = new Map([['https://crawler.exa.ai', 'exa'], ['https://ahrefs.com', 'ahrefs']]);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const read = file => JSON.parse(readFileSync(file));
const [queryFile, receiptsFile, directoryRoot, chainPrefix, output, referenceInput] = process.argv.slice(2);
assert.ok(referenceInput, 'Provide private query, receipts, directory folder, chain prefix, closed output and private reference input');
const query = read(queryFile);
assert.equal(query.length, 1); assert.equal(query[0].success, true);
const candidates = query[0].results, receipts = read(receiptsFile);
assert.equal(candidates.length, 3, 'Changed fixed cohort requires a new plan');
const chains = [0, 1, 2].flatMap(index => read(`${chainPrefix}${index}.json`));
assert.equal(chains.length, 9);
const comparison = reconcileReceiptStorage(candidates, chains);
assert.equal(comparison.identicalProjectionPairs, 3);
assert.equal(comparison.storedLocalVerifiedPairs, 3);
for (const field of ['invalidCandidateReferences', 'unavailableReceiptReferences', 'invalidReceiptReferences', 'unmatchedCandidateRows', 'unmatchedReceiptRecords', 'ambiguousReferenceGroups', 'invalidPairMetadata', 'unprojectableCandidateRows', 'differentProjectionPairs', 'testInjectedPairs', 'conflictingStoredStatusPairs']) assert.equal(comparison[field], 0, field);
assert.ok(Object.values(comparison.rejectedRetainedRecords).every(value => value === 0));
const reconciled = reconcileInvocations(chains, new Set(['ExaSearchBot', 'ExaUser', 'AhrefsBot', 'AhrefsSiteAudit']));
assert.equal(reconciled.reconciliations.length, 3);
assert.ok(Object.values(reconciled.integrity).every(value => value === 0));
assert.ok(reconciled.reconciliations.every(item => item.complete));
const captures = new Map();
for (const [origin, vendor] of vendors) {
  const bytes = readFileSync(join(directoryRoot, `${vendor}.json`));
  const capture = read(join(directoryRoot, `${vendor}-capture.json`));
  const url = `${origin}/.well-known/http-message-signatures-directory`;
  assert.equal(capture.source, url); assert.equal(capture.responseStatus, 200);
  assert.equal(capture.sha256, hash(bytes));
  assert.ok(Number.isFinite(Date.parse(capture.capturedAt)));
  assert.ok(Object.keys(capture.responseHeaders).every(name => ['content-type', 'cache-control', 'age'].includes(name)));
  assert.equal(capture.responseHeaders['content-type'].split(';')[0].trim(), 'application/http-message-signatures-directory+json');
  captures.set(origin, { bytes, capture, url });
}
const trials = [], rows = [];
const identities = { urls: new Set(), signatures: new Set(), signatureInputs: new Set(), requests: new Set(), operations: new Set() };
for (const item of reconciled.reconciliations) {
  const invocation = item.row;
  const stored = chains.filter(record => record.$metadata.requestId === invocation.$metadata.requestId && record.source?.message === 'analytics.observation_stored');
  assert.equal(stored.length, 1);
  const record = stored[0], source = record.source;
  const selected = candidates.filter(row => row.privateReference === source.storage.observationId);
  assert.equal(selected.length, 1);
  const row = selected[0], evidence = JSON.parse(row.signatureEvidence);
  const copies = receipts.filter(copy => copy.$metadata.id === record.$metadata.id);
  assert.ok(copies.length === 1 && isDeepStrictEqual(copies[0].source, source));
  assert.ok(vendors.has(row.signatureAgent), 'Unreviewed signer');
  const data = invocation.$workers.event.request, at = new Date(invocation.timestamp);
  const request = new Request(data.url, { method: data.method, headers: new Headers(data.headers) });
  assert.ok(request.method === 'GET' && new URL(request.url).pathname === row.path);
  assert.equal(evidence.verifierProfile, VERIFIER_PROFILE_VERSION);
  const directory = captures.get(row.signatureAgent);
  assert.ok(Date.parse(directory.capture.capturedAt) >= at.getTime());
  const fetcher = async url => {
    assert.equal(String(url), directory.url, 'Unexpected resolver request');
    return new Response(directory.bytes, { status: 200, headers: directory.capture.responseHeaders });
  };
  const options = { now: at, includeEvidence: true, maxAgeSeconds: 86400, fetcher };
  const variants = [
    ['original', request],
    ['changed-authority', (() => { const url = new URL(request.url); url.hostname = 'signature-control.invalid'; return new Request(url, { method: request.method, headers: request.headers }); })()],
    ['changed-unsigned-role-and-path', (() => { const url = new URL(request.url); url.pathname = '/offline-unsigned-control'; const headers = new Headers(request.headers); headers.set('user-agent', 'OfflineUnsignedRoleControl/1.0'); return new Request(url, { method: request.method, headers }); })()],
  ];
  const outcomes = {};
  let original;
  for (const [name, variant] of variants) {
    const result = await verifyWebBotAuth(variant, { ...options, cache: createWebBotAuthCache() });
    outcomes[name] = { status: result.status, reason: result.reason ?? null };
    if (name === 'original') original = result;
    trials.push({ vendor: vendors.get(row.signatureAgent), variant: name, now: at.toISOString(), method: variant.method, url: variant.url,
      headers: Object.fromEntries(variant.headers), directory: JSON.parse(directory.bytes) });
  }
  assert.equal(original.status, 'verified'); assert.equal(original.agent, row.signatureAgent);
  assert.deepEqual(original.evidence.covered, evidence.coverage.covered);
  const audit = await auditWebBotAuth(request, options);
  assert.equal(audit.assessment, 'complete'); assert.equal(audit.verifiedCandidates, 1);
  assert.equal(audit.unresolvedCandidates, 0);
  const management = data.cf?.botManagement;
  const native = { verifiedBot: typeof management?.verifiedBot === 'boolean' ? management.verifiedBot : null,
    signedAgent: typeof management?.signedAgent === 'boolean' ? management.signedAgent : null, category: nativeCategoryEvidence(data.cf) };
  assert.deepEqual(native, evidence.native);
  const ip = JSON.parse(row.vendorIpEvidence);
  rows.push({ vendor: vendors.get(row.signatureAgent), collectionVersion: row.collectionVersion, storedVerifierProfile: evidence.verifierProfile,
    readerKind: row.readerKind, representation: row.representation, documentedVendor: source.receipt.signature.documentedVendorStatus,
    directoryPublisher: source.receipt.directoryPublication.status, optionalCaptureAbsent: row.optionalCaptureAbsent === 1,
    native, ip: { configuredDeclarations: ip.configuredDeclarationCount, unmappedDeclarations: ip.unmappedDeclarationCount, checks: ip.checks.length, summary: ip.summary },
    coverage: evidence.coverage, audit, outcomes });
  identities.urls.add(hash(request.url)); identities.signatures.add(hash(request.headers.get('signature')));
  identities.signatureInputs.add(hash(request.headers.get('signature-input')));
  identities.requests.add(invocation.$metadata.requestId); identities.operations.add(source.operationId);
}
const result = { checkedAt: new Date().toISOString(), replayVerifierProfile: VERIFIER_PROFILE_VERSION, candidateRows: candidates.length,
  exactCompleteNativeChains: rows.length, matchingSeparateReceiptCopies: rows.length, comparison, nativeExportIntegrity: reconciled.integrity,
  rows, cardinalities: Object.fromEntries(Object.entries(identities).map(([key, values]) => [key, values.size])),
  directories: [...captures.values()].map(({ capture }) => capture), externalReplayRequests: 0, newControlRequests: 0,
  limits: ['Selected stored events, not unique people, sessions, triggers or actions.', 'Directory keys were captured later; original discovery snapshots and native cryptographic agreement are unavailable.',
    'Stored collection .7 differs from current .8; only verifier .6 is shared.', 'Offline request mutations are signature-coverage controls, not production visits or authenticated roles.'] };
writeFileSync(referenceInput, JSON.stringify({ trials }) + '\n', { flag: 'wx', mode: 0o600 });
writeFileSync(output, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ exactChains: rows.length, replayVerified: rows.filter(row => row.outcomes.original.status === 'verified').length,
  mutationResults: rows.map(row => ({ vendor: row.vendor, outcomes: row.outcomes })), cardinalities: result.cardinalities }));

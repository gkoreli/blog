import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { reconcileReceiptStorage } from './reconcile-receipt-storage.mjs';

const [prefix, output] = process.argv.slice(2); assert.ok(output);
const read = suffix => JSON.parse(readFileSync(prefix + suffix));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const pre = read('preflight.json'), reference = read('reference.json'), chains = read('chains.json'), headers = read('header-export.json'), copies = read('receipt-copies.json');
const plan = read('read-plan.json'), control = read('control.json'), query = read('readback.json');
assert.equal(pre.headersExportSha256, hash(readFileSync(prefix + 'header-export.json')));
assert.equal(pre.chainsSha256, hash(readFileSync(prefix + 'chains.json')));
assert.equal(pre.privateInputSha256, hash(readFileSync(prefix + 'reference-input.json'))); assert.equal(reference.execution.inputSha256, pre.privateInputSha256);
assert.equal(reference.execution.scriptSha256, hash(readFileSync(new URL('./probe-pyauth-retained.py', import.meta.url))));
assert.equal(reference.execution.sourceManifestSha256, hash(readFileSync(new URL('./complete-audit-sources.json', import.meta.url))));
assert.equal(reference.sourceCommit, '1de433d9a49fd608475c6054ab14a1652c088844'); assert.equal(reference.sourceFilesRechecked, 18); assert.equal(reference.referenceCalls, 6); assert.equal(reference.externalRequests, 0);
assert.equal(plan.templateSha256, hash(readFileSync(new URL('./latest-signed-storage.sql', import.meta.url))));
assert.equal(control.length, 1); assert.equal(control[0].success, true); assert.deepEqual(control[0].results, [{ query_access_control: 1 }]);
assert.equal(control[0].meta.rows_read, 0); assert.equal(control[0].meta.rows_written, 0); assert.equal(control[0].meta.changed_db, false);
assert.equal(query.length, 1); assert.equal(query[0].success, true); assert.equal(query[0].results.length, 2);
assert.equal(query[0].meta.rows_read, 4); assert.equal(query[0].meta.rows_written, 0); assert.equal(query[0].meta.changed_db, false);
assert.equal(control[0].meta.total_attempts, 1); assert.equal(query[0].meta.total_attempts, 1);
const comparison = reconcileReceiptStorage(query[0].results, chains);
assert.equal(comparison.identicalProjectionPairs, 2); assert.equal(comparison.storedLocalVerifiedPairs, 2);
for (const field of ['invalidCandidateReferences', 'unavailableReceiptReferences', 'invalidReceiptReferences', 'unmatchedCandidateRows', 'unmatchedReceiptRecords', 'ambiguousReferenceGroups', 'invalidPairMetadata', 'unprojectableCandidateRows', 'differentProjectionPairs', 'testInjectedPairs', 'conflictingStoredStatusPairs', 'unexpectedFields']) assert.equal(comparison[field], 0, field);
assert.ok(Object.values(comparison.rejectedRetainedRecords).every(value => value === 0));
assert.equal(copies.length, 2); const copyIds = new Set();
for (const copy of copies) {
  assert.equal(copyIds.has(copy.$metadata.id), false); copyIds.add(copy.$metadata.id);
  const match = chains.filter(row => row.$metadata.id === copy.$metadata.id && row.$metadata.requestId === copy.$metadata.requestId && row.source?.message === 'analytics.observation_stored');
  assert.equal(match.length, 1); assert.equal(copy.timestamp, match[0].timestamp); assert.ok(isDeepStrictEqual(copy.source, match[0].source));
}
const trials = read('reference-input.json').trials;
assert.equal(pre.native.length, 6); assert.equal(trials.length, 6); assert.equal(reference.rows.length, 6);
for (let index = 0; index < 6; index++) {
  const trial = trials[index], native = pre.native[index], independent = reference.rows[index];
  assert.equal(native.variant, trial.variant); assert.equal(independent.variant, trial.variant);
  assert.equal(native.status, trial.variant === 'changed-authority' ? 'unverified' : 'verified');
  assert.equal(native.reason, trial.variant === 'changed-authority' ? 'signature-invalid' : null);
  assert.equal(independent.error, trial.variant === 'changed-authority' ? 'InvalidSignature' : null);
  assert.equal(independent.returnedResults, trial.variant === 'changed-authority' ? null : 1);
  if (trial.variant === 'original') {
    // Stored observation time and invocation time can differ; use the exact
    // already reconciled request/storage link rather than a fuzzy time join.
    const invocation = chains.filter(row => row.$metadata.type === 'cf-worker-event' && row.timestamp === trial.now && row.$workers?.event?.request.url === trial.url);
    assert.equal(invocation.length, 1);
    const stored = chains.filter(row => row.$metadata.requestId === invocation[0].$metadata.requestId && row.source?.message === 'analytics.observation_stored'); assert.equal(stored.length, 1);
    const row = query[0].results.find(row => row.privateReference === stored[0].source.storage.observationId); assert.ok(row);
    assert.equal(row.collectionVersion, '2026-10-29.3'); assert.equal(row.classifierVersion, '2026-10-29.1'); assert.equal(row.agentName, 'ExaSearchBot'); assert.equal(row.readerKind, 'ai-search');
    assert.equal(row.signatureAgent, 'https://crawler.exa.ai'); assert.equal(row.optionalCaptureAbsent, 1); assert.equal(row.ownerFlag, 0);
    const evidence = JSON.parse(row.signatureEvidence);
    assert.equal(evidence.verifierProfile, '2026-10-29.1'); assert.deepEqual(native.coverage.covered, evidence.coverage.covered); assert.deepEqual(native.coverage.selection, evidence.coverage.selection);
    assert.equal(evidence.native.verifiedBot, null); assert.equal(evidence.native.signedAgent, null);
    assert.equal(new Headers(invocation[0].$workers.event.request.headers).has('Forwarded'), false);
    assert.ok(headers.some(copy => copy.$metadata.requestId === invocation[0].$metadata.requestId && isDeepStrictEqual(copy.$workers.event.request, invocation[0].$workers.event.request)));
  }
}
const result = { checkedAt: new Date().toISOString(), stage: 'accepted-exact-storage-and-replay',
  headerSelection: pre.headerSelection, broadExportLogIdCollisionsPreserved: true,
  latestCollector: '2026-10-29.3', receiptVersion: '2026-10-29.1', verifierProfile: '2026-10-29.1',
  exactCompleteChains: 2, independentInvocationCopyPairs: 2, independentReceiptCopyPairs: 2, exactStorageProjectionPairs: 2,
  comparison, scopedNativeExportIntegrity: pre.nativeExportIntegrity, executionWorkers: pre.executionWorkers,
  rows: pre.rows, nodeAndWorkerdContexts: 6, independentRfcContexts: 6, independentReference: reference, boundedReuse: pre.reuse,
  directory: pre.directory, inputCommitments: { headers: pre.headersExportSha256, chains: pre.chainsSha256, replay: pre.privateInputSha256, receiptCopies: hash(readFileSync(prefix + 'receipt-copies.json')), sqlTemplate: plan.templateSha256 },
  productionDiagnostics: { statements: 2, agentAttempts: 2, reportedReads: 4, reportedWrites: 0, reportedAttempts: 2,
    metadataFailure: { attempts: 1, providerCode: 10000, metering: 'unavailable', cause: 'not-established' }, queryAccessControl: { reads: 0, writes: 0 }, exactRead: { reads: 4, writes: 0 }, remainingDailyBudgetEstablished: false },
  newSiteRequests: 0, newHumanLabels: 0, runtimeChanged: false,
  limits: ['Fixed retained representations, not complete traffic or wire-complete request headers; positive x-forwarded-proto selection and provider sampling apply.',
    'Seven colliding exported log-ID pairs are outside the exact signed selection and are preserved, not deduplicated.',
    'Two latest-collector proofs do not recover the old 52 outcome-only records or prove whole-history correctness.',
    'Unsigned User-Agent/resource and no trustworthy Forwarded assertion leave request purpose, human trigger and actual use unestablished.',
    'Later captured keys do not establish the original resolver snapshot or Cloudflare managed-verifier agreement.',
    'Native UI/export and failed metadata costs are additional and unreturned; successful SELECT metering is not an account-wide ledger.'] };
writeFileSync(output, JSON.stringify(result, null, 2) + '\n', { flag: 'wx', mode: 0o600 }); console.log(JSON.stringify({ exactStoragePairs: 2, receiptCopyPairs: 2, meteredReads: 4, meteredWrites: 0, statements: 2 }));

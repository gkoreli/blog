import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { join } from 'node:path';
import { reconcileReceiptStorage } from './reconcile-receipt-storage.mjs';
import { reconcileInvocations } from './reconcile-organic-exa.mjs';
import { nativeCategoryEvidence } from '../../../../analytics/.test-dist/native-bot-evidence.js';

// Fixed reviewed cohort; no network access, discovery fallback or new SQL.
const [queryFile, receiptsFile, chainsFile, directoryRoot, inputFile, nativeFile, referenceFile, preflightFile, output] = process.argv.slice(2);
assert.ok(output, 'Supply query, receipts, chains, directory root, frozen input, native, reference, preflight and closed output');
const read = file => JSON.parse(readFileSync(file));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const query = read(queryFile), receipts = read(receiptsFile), chains = read(chainsFile);
assert.equal(query.length, 1); assert.equal(query[0].success, true);
const rows = query[0].results;
assert.equal(rows.length, 4); assert.equal(receipts.length, 4); assert.equal(chains.length, 16);
assert.equal(query[0].meta.rows_read, 8); assert.equal(query[0].meta.rows_written, 0);
assert.equal(query[0].meta.total_attempts, 1);
const comparison = reconcileReceiptStorage(rows, chains);
assert.equal(comparison.identicalProjectionPairs, 4); assert.equal(comparison.storedLocalVerifiedPairs, 4);
for (const field of ['invalidCandidateReferences', 'unavailableReceiptReferences', 'invalidReceiptReferences', 'unmatchedCandidateRows', 'unmatchedReceiptRecords', 'ambiguousReferenceGroups', 'invalidPairMetadata', 'unprojectableCandidateRows', 'differentProjectionPairs', 'testInjectedPairs', 'conflictingStoredStatusPairs']) assert.equal(comparison[field], 0, field);
assert.ok(Object.values(comparison.rejectedRetainedRecords).every(value => value === 0));
const reconciled = reconcileInvocations(chains, new Set(['ExaSearchBot']));
assert.equal(reconciled.reconciliations.length, 4);
assert.ok(Object.values(reconciled.integrity).every(value => value === 0));
assert.ok(reconciled.reconciliations.every(item => item.complete));
const directoryBytes = readFileSync(join(directoryRoot, 'exa.json'));
const capture = read(join(directoryRoot, 'exa-capture.json'));
assert.equal(capture.source, 'https://crawler.exa.ai/.well-known/http-message-signatures-directory');
assert.equal(capture.responseStatus, 200); assert.equal(capture.sha256, hash(directoryBytes));
assert.equal(capture.responseHeaders['content-type'].split(';')[0].trim(), 'application/http-message-signatures-directory+json');
assert.ok(Object.keys(capture.responseHeaders).every(key => ['content-type', 'cache-control', 'age'].includes(key)));
const inputBytes = readFileSync(inputFile), input = JSON.parse(inputBytes), native = read(nativeFile), reference = read(referenceFile), preflight = read(preflightFile);
const inputSha256 = hash(inputBytes);
assert.equal(input.trials.length, 12); assert.equal(native.inputSha256, inputSha256);
assert.equal(reference.execution.inputSha256, inputSha256);
assert.equal(reference.execution.scriptSha256, hash(readFileSync(new URL('./probe-pyauth-retained.py', import.meta.url))));
assert.equal(reference.execution.sourceManifestSha256, hash(readFileSync(new URL('./complete-audit-sources.json', import.meta.url))));
assert.equal(reference.sourceCommit, '1de433d9a49fd608475c6054ab14a1652c088844');
assert.equal(reference.sourceFilesRechecked, 18); assert.equal(reference.referenceCalls, 12);
assert.equal(reference.externalRequests, 0); assert.equal(native.externalRequests, 0); assert.equal(native.productionRequests, 0);
assert.equal(native.trials.length, 12); assert.equal(reference.rows.length, 12);
const outcomes = { original: 0, 'changed-authority': 0, 'changed-unsigned-role-and-path': 0 };
const collections = {}, coverage = [], workers = new Set();
for (const [index, item] of reconciled.reconciliations.sort((a, b) => Date.parse(a.row.timestamp) - Date.parse(b.row.timestamp)).entries()) {
  const invocation = item.row, data = invocation.$workers.event.request;
  const stored = chains.filter(record => record.$metadata.requestId === invocation.$metadata.requestId && record.source?.message === 'analytics.observation_stored');
  assert.equal(stored.length, 1);
  const source = stored[0].source, selected = rows.filter(row => row.privateReference === source.storage.observationId);
  assert.equal(selected.length, 1); const row = selected[0], evidence = JSON.parse(row.signatureEvidence);
  const copy = receipts.filter(record => record.$metadata.id === stored[0].$metadata.id);
  assert.equal(copy.length, 1); assert.ok(isDeepStrictEqual(copy[0].source, source));
  assert.equal(data.method, 'GET'); assert.equal(new URL(data.url).pathname, row.path);
  assert.equal(row.agentName, 'ExaSearchBot'); assert.equal(row.readerKind, 'ai-search');
  assert.equal(row.signatureAgent, 'https://crawler.exa.ai'); assert.equal(row.signatureStatus, 'verified');
  assert.equal(row.optionalCaptureAbsent, 1); assert.equal(row.ownerFlag, 0);
  assert.equal(evidence.verifierProfile, '2026-10-29.1'); assert.equal(source.receipt.version, '2026-10-28.2');
  assert.ok(['2026-10-29.1', '2026-10-29.2'].includes(row.collectionVersion));
  assert.ok(Date.parse(capture.capturedAt) > Date.parse(invocation.timestamp));
  const management = data.cf?.botManagement;
  assert.deepEqual(evidence.native, { verifiedBot: typeof management?.verifiedBot === 'boolean' ? management.verifiedBot : null,
    signedAgent: typeof management?.signedAgent === 'boolean' ? management.signedAgent : null, category: nativeCategoryEvidence(data.cf) });
  assert.equal(evidence.native.verifiedBot, null); assert.equal(evidence.native.signedAgent, null);
  collections[row.collectionVersion] = (collections[row.collectionVersion] ?? 0) + 1;
  workers.add(invocation.$workers.scriptVersion.id);
  for (const [offset, variant] of Object.keys(outcomes).entries()) {
    const trial = input.trials[index * 3 + offset], workerd = native.trials[index * 3 + offset], python = reference.rows[index * 3 + offset];
    assert.equal(trial.variant, variant); assert.equal(trial.vendor, 'exa'); assert.equal(trial.now, new Date(invocation.timestamp).toISOString());
    assert.deepEqual(trial.directory, JSON.parse(directoryBytes));
    const request = new Request(data.url, { method: data.method, headers: data.headers });
    const url = new URL(request.url), headers = new Headers(request.headers);
    if (variant === 'changed-authority') url.hostname = 'offline-control.invalid';
    if (variant === 'changed-unsigned-role-and-path') { url.pathname = '/offline-unsigned-role-control'; headers.set('User-Agent', 'OfflineControl/1.0'); }
    assert.equal(trial.url, url.href); assert.equal(trial.method, request.method); assert.deepEqual(trial.headers, Object.fromEntries(headers));
    assert.equal(workerd.variant, variant); assert.equal(python.variant, variant);
    assert.equal(workerd.verifierProfile, '2026-10-29.1');
    assert.equal(workerd.status, variant === 'changed-authority' ? 'unverified' : 'verified');
    assert.equal(workerd.reason, variant === 'changed-authority' ? 'signature-invalid' : null);
    assert.equal(python.error, variant === 'changed-authority' ? 'InvalidSignature' : null);
    assert.equal(python.returnedResults, variant === 'changed-authority' ? null : 1);
    if (variant === 'original') {
      assert.deepEqual(workerd.coverage.covered, evidence.coverage.covered);
      assert.deepEqual(workerd.coverage.selection, evidence.coverage.selection);
      coverage.push(evidence.coverage);
    }
    outcomes[variant]++;
  }
}
assert.deepEqual(collections, { '2026-10-29.1': 2, '2026-10-29.2': 2 });
const reuse = preflight.reuse;
assert.equal(reuse.assessment, 'complete'); assert.equal(reuse.verifiedObservations, 4);
assert.equal(reuse.distinctVerifiedProofs, 4); assert.equal(reuse.distinctUsableNonces, 4);
assert.equal(reuse.repeatedProofGroups, 0); assert.equal(reuse.repeatedNonceGroups, 0);
const result = { checkedAt: new Date().toISOString(), verifierProfile: '2026-10-29.1', candidateRows: 4,
  exactCompleteChains: 4, matchingSeparateReceiptCopies: 4, comparison, nativeExportIntegrity: reconciled.integrity,
  collections, receiptVersion: '2026-10-28.2', executionWorkers: [...workers].sort(),
  directory: capture, inputSha256, localAndIndependentControls: outcomes, originalCoverage: coverage,
  nativeBooleanValuesAvailable: 0, optionalCaptureAbsent: 4, reuse,
  metering: { statements: 1, agentAttempts: 1, reportedReads: 8, reportedWrites: 0, reportedAttempts: 1 },
  newSiteRequests: 0, newHumanLabels: 0, runtimeChanged: false,
  limits: ['Fixed selected cohort; no whole-history or newest .29.3 collection acceptance.',
    'Later keys and recorded clocks; original discovery snapshot unavailable.',
    'Workerd crypto and independent RFC verification are not native managed-verifier verdicts.',
    'Unsigned User-Agent, path, method and query do not establish purpose or a human trigger.',
    'Four distinct proofs/nonces in this cohort do not establish four unique actions or global replay rates.'] };
writeFileSync(output, JSON.stringify(result, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
console.log(JSON.stringify({ exactChains: 4, storagePairs: 4, inputSha256, outcomes, metering: result.metering }));

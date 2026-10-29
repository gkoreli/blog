import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { reconcileInvocations } from './reconcile-organic-exa.mjs';
import { reconcileReceiptStorage } from './reconcile-receipt-storage.mjs';

const [slicePath, chainsPath, receiptPath, directoryRoot, outputPath, inputPath] = process.argv.slice(2);
assert.ok(inputPath);
const read = path => JSON.parse(readFileSync(path));
const hash = value => createHash('sha256').update(value).digest('hex');
const slice = read(slicePath), chains = read(chainsPath), copies = read(receiptPath);
assert.equal(slice.length, 1); assert.equal(chains.length, 4); assert.equal(copies.length, 1);
const joined = reconcileInvocations(chains, new Set(['ExaSearchBot']));
assert.ok(Object.values(joined.integrity).every(value => value === 0));
assert.equal(joined.reconciliations.length, 1);
assert.equal(joined.reconciliations[0].complete, true);
const storage = reconcileReceiptStorage(slice, chains), copyStorage = reconcileReceiptStorage(slice, copies);
for (const result of [storage, copyStorage]) {
  assert.equal(result.identicalProjectionPairs, 1);
  assert.equal(result.storedLocalVerifiedPairs, 1);
  assert.equal(result.differentProjectionPairs, 0);
  assert.equal(result.unmatchedCandidateRows, 0);
  assert.equal(result.ambiguousReferenceGroups, 0);
  assert.equal(result.invalidPairMetadata, 0);
  assert.equal(result.unexpectedFields, 0);
}
const stored = chains.filter(row => row.source?.message === 'analytics.observation_stored');
assert.equal(stored.length, 1); assert.deepEqual(stored, copies);
const invocation = joined.reconciliations[0].row, data = invocation.$workers.event.request;
const at = new Date(invocation.timestamp);
assert.ok(at >= new Date('2026-10-29T01:53:00Z') && at < new Date('2026-10-29T01:55:00Z'));
assert.equal(stored[0].source.collectionVersion, '2026-10-28.10');
assert.equal(stored[0].source.receipt.signature.verifierProfile, '2026-10-28.7');
const directoryBytes = readFileSync(join(directoryRoot, 'exa.json'));
const directory = JSON.parse(directoryBytes), capture = read(join(directoryRoot, 'exa-capture.json'));
assert.equal(capture.source, 'https://crawler.exa.ai/.well-known/http-message-signatures-directory');
assert.equal(capture.responseStatus, 200); assert.equal(capture.sha256, hash(directoryBytes));
assert.ok(Date.parse(capture.capturedAt) > at.getTime());
assert.equal(capture.responseHeaders['content-type'].split(';')[0], 'application/http-message-signatures-directory+json');
const original = new Request(data.url, { method: data.method, headers: data.headers });
assert.equal(original.method, 'GET');
for (const name of ['x-analytics-control', 'x-analytics-fixture']) assert.equal(original.headers.has(name), false);
const wrongAuthority = new URL(original.url); wrongAuthority.hostname = 'offline-control.invalid';
const unsignedUrl = new URL(original.url); unsignedUrl.pathname = '/offline-unsigned-role-control';
const unsignedHeaders = new Headers(original.headers); unsignedHeaders.set('User-Agent', 'OfflineControl/1.0');
const trials = [
  ['original', original],
  ['changed-authority', new Request(wrongAuthority, { method: original.method, headers: original.headers })],
  ['changed-unsigned-role-and-path', new Request(unsignedUrl, { method: original.method, headers: unsignedHeaders })],
].map(([variant, request]) => ({ vendor: 'exa', variant, now: at.toISOString(), url: request.url,
  method: request.method, headers: Object.fromEntries(request.headers), directory }));
const bytes = JSON.stringify({ trials }) + '\n';
writeFileSync(inputPath, bytes, { flag: 'wx', mode: 0o600 });
const result = { checkedAt: new Date().toISOString(), chainsSha256: hash(readFileSync(chainsPath)),
  receiptCopySha256: hash(readFileSync(receiptPath)), storedProjectionSha256: hash(readFileSync(slicePath)),
  inputSha256: hash(bytes), scriptSha256: hash(readFileSync(new URL(import.meta.url))),
  completeChains: 1, identicalStoredProjectionPairs: 1, matchingSeparateQueryCopies: 1,
  storedProfile: '2026-10-28.7', collectionVersion: '2026-10-28.10',
  queryWindow: { start: '2026-10-29T01:53:00Z', endExclusive: '2026-10-29T01:55:00Z' },
  contextCount: 3, directory: capture, integrity: joined.integrity, storage, copyStorage,
  executionWorker: invocation.$workers.scriptVersion.id,
  limits: ['Separate exports share the retained provider source; neither is an independent wire capture.',
    'Later captured directory keys do not recover original resolver state.',
    'No new production request, human label or managed verification comparison.'] };
writeFileSync(outputPath, JSON.stringify(result, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
console.log(JSON.stringify({ completeChains: 1, identicalProjectionPairs: 1, contexts: 3 }));

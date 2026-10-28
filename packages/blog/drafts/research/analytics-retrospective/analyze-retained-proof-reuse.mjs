import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import { createHash } from 'node:crypto';
import { reconcileReceiptStorage } from './reconcile-receipt-storage.mjs';
import { reconcileInvocations } from './reconcile-organic-exa.mjs';
import { auditWebBotAuthReuse } from '../../../../analytics/.test-dist/webbotauth-reuse-audit.js';

const [queryFile, chainPrefix, directoryRoot, output, parentManifestFile] = process.argv.slice(2);
assert.ok(parentManifestFile);
const read = file => JSON.parse(readFileSync(file));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const manifestBytes = readFileSync(parentManifestFile);
assert.equal(hash(manifestBytes), read(new URL('./recent-signed-checks.json', import.meta.url)).privateManifestSha256);
const manifest = JSON.parse(manifestBytes);
const queryBytes = readFileSync(queryFile);
assert.equal(hash(queryBytes), read(new URL('./recent-signed-query.json', import.meta.url)).privateQuerySha256, 'Different retained cohort');
const response = JSON.parse(queryBytes); assert.equal(response.length, 1); assert.equal(response[0].success, true);
const candidates = response[0].results;
const chainBytes = [0, 1, 2].map(index => {
  const file = `${chainPrefix}${index}.json`, bytes = readFileSync(file);
  assert.equal(hash(bytes), manifest.files.find(item => item.path === basename(file))?.sha256, 'Different retained native chain');
  return bytes;
});
const chains = chainBytes.flatMap(bytes => JSON.parse(bytes));
const comparison = reconcileReceiptStorage(candidates, chains);
assert.equal(comparison.identicalProjectionPairs, 3); assert.equal(comparison.storedLocalVerifiedPairs, 3);
for (const field of ['invalidCandidateReferences', 'unavailableReceiptReferences', 'invalidReceiptReferences', 'unmatchedCandidateRows', 'unmatchedReceiptRecords', 'ambiguousReferenceGroups', 'invalidPairMetadata', 'unprojectableCandidateRows', 'differentProjectionPairs', 'testInjectedPairs', 'conflictingStoredStatusPairs', 'unexpectedFields']) assert.equal(comparison[field], 0);
assert.ok(Object.values(comparison.rejectedRetainedRecords).every(n => n === 0));
const native = reconcileInvocations(chains, new Set(['ExaSearchBot', 'AhrefsBot']));
assert.equal(native.reconciliations.length, 3); assert.ok(native.reconciliations.every(row => row.complete));
assert.ok(Object.values(native.integrity).every(n => n === 0));
const directories = new Map();
for (const [name, origin] of [['exa', 'https://crawler.exa.ai'], ['ahrefs', 'https://ahrefs.com']]) {
  const capture = read(join(directoryRoot, `${name}-capture.json`));
  const bytes = readFileSync(join(directoryRoot, `${name}.json`));
  assert.equal(capture.source, `${origin}/.well-known/http-message-signatures-directory`);
  assert.equal(capture.responseStatus, 200); assert.equal(capture.sha256, hash(bytes));
  assert.equal(capture.sha256, read(new URL('./recent-signed-analysis.json', import.meta.url)).directories.find(item => item.source === capture.source)?.sha256);
  directories.set(capture.source, { capture, bytes });
}
const observations = native.reconciliations.map(({ row }) => {
  const data = row.$workers.event.request;
  return { reference: row.$metadata.requestId, observedAt: new Date(row.timestamp), request: new Request(data.url, { method: data.method, headers: new Headers(data.headers) }) };
});
const result = await auditWebBotAuthReuse(observations, { fetcher: async url => {
  const entry = directories.get(String(url)); assert.ok(entry, 'Unreviewed resolver origin');
  return new Response(entry.bytes, { status: 200, headers: entry.capture.responseHeaders });
} });
assert.equal(result.assessment, 'complete'); assert.equal(result.verifiedObservations, 3);
writeFileSync(output, JSON.stringify({ checkedAt: new Date().toISOString(), method: 'Reuse the three exact-chain research-49 requests at their recorded invocation times, with the same later-captured publisher directory bytes. No new production query or visit.', result,
  parentPrivateManifestSha256: hash(manifestBytes), nativeInputCommitments: chainBytes.map(bytes => ({ bytes: bytes.length, sha256: hash(bytes) })),
  directories: [...directories.values()].map(({ capture }) => ({ source: capture.source, capturedAt: capture.capturedAt, sha256: capture.sha256 })),
  externalRequests: 0, productionRequests: 0, d1Statements: 0,
  limits: ['Selected three-request historical cohort, not replay prevalence or attack attribution.', 'No nonce or proof digests are retained in this result.', 'A nonrepeated proof does not establish a unique action, person or trigger.'] }, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(result));

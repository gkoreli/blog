import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { reconcile, validateSlice } from '../../../scripts/check-signed-slice.mjs';

const [privateRoot, outputRoot, previousReplayPath] = process.argv.slice(2); assert.ok(previousReplayPath);
const bytes = name => readFileSync(join(privateRoot, name));
const read = name => JSON.parse(bytes(name));
const hash = value => createHash('sha256').update(value).digest('hex');
const known = read('known.json'), original = read('ledger.json'), native = read('native.json');
const plan = read('plan.json'), preflight = read('preflight.json'), replay = read('replay.json');
const reference = read('reference.json'), archive = read('archive-revalidation.json');
const projections = read('new-row.json'); assert.equal(projections.length, 1);
const control = read('control-production.json'), query = read('slice-production.json');
for (const statement of [control, query]) {
  assert.equal(statement.length, 1); assert.equal(statement[0].success, true);
  assert.equal(statement[0].meta.total_attempts, 1);
  assert.equal(statement[0].meta.rows_written, 0); assert.equal(statement[0].meta.changed_db, false);
}
assert.deepEqual(control[0].results, [{ access_check: 1 }]);
const rows = validateSlice(query[0].results, known.bounds.lowerIdExclusive, known.bounds.upperIdInclusive);
assert.equal(rows.length, 114);
const prior = reconcile(rows, known.known);
assert.equal(prior.summary.matchedDistinct, 6); assert.equal(prior.summary.uncoveredProjections, 1);
assert.equal(prior.summary.changedArchiveEntries, 0); assert.equal(prior.summary.missingArchiveEntries, 0);
assert.equal(projections[0].privateReference, prior.private.uncovered[0].privateReference);
assert.deepEqual(projections[0], JSON.parse(prior.private.uncovered[0].proofProjection));
const final = reconcile(rows, [...known.known, { source: 'recovered-older-one', projection: projections[0] }]);
assert.equal(final.summary.matchedDistinct, 7); assert.equal(final.summary.uncoveredProjections, 0);
assert.equal(final.summary.overlappingSourceMemberships, 0);
assert.equal(hash(bytes('known.json')), plan.knownSha256);
assert.equal(hash(bytes('native.json')), plan.nativeSha256);
assert.equal(hash(bytes('archive-revalidation.json')), plan.archiveRevalidationSha256);
for (const item of archive.cohorts) assert.equal(item.newCryptographicReplay, false);
assert.deepEqual(archive.cohorts.map(item => item.rows), [4, 2]);
assert.equal(preflight.inputSha256, hash(bytes('input.json')));
assert.equal(replay.inputSha256, preflight.inputSha256);
assert.equal(replay.originals, 1); assert.equal(replay.contextsPerRuntimePerProfile, 3);
assert.equal(reference.referenceCalls, 3); assert.equal(reference.sourceFilesRechecked, 18);
for (const result of reference.rows) {
  assert.equal(result.returnedResults, result.variant === 'changed-authority' ? null : 1);
  assert.equal(result.error, result.variant === 'changed-authority' ? 'InvalidSignature' : null);
}
const storedCoverage = JSON.parse(projections[0].signatureEvidence).coverage;
for (const profile of ['historical', 'current']) {
  const originalResult = replay.results.find(item => item.variant === 'original')[profile];
  assert.deepEqual(originalResult.coverage.covered, storedCoverage.covered);
  assert.deepEqual(originalResult.coverage.selection, storedCoverage.selection);
}
const previousPublic = JSON.parse(readFileSync(join(outputRoot, 'frozen-signed-replay.json')));
const previousBytes = readFileSync(previousReplayPath), previousReplay = JSON.parse(previousBytes);
assert.equal(hash(previousBytes), previousPublic.privateFullResultSha256);
const regression = read('regression52.json');
assert.ok(isDeepStrictEqual(regression.results, previousReplay.results), 'Archived 52 replay results changed');
assert.ok(isDeepStrictEqual(regression.reuse, previousReplay.reuse), 'Archived 52 reuse assessment changed');
const reportedReads = control[0].meta.rows_read + query[0].meta.rows_read;
assert.equal(reportedReads, 343); assert.ok(reportedReads < plan.plan.readReviewThreshold);
assert.equal(native.scale.rows, 114); assert.equal(native.scale.reads, 130);
const production = { checkedAt: new Date().toISOString(), sourceBaseline: 'c79bb49',
  scope: 'All 114 retained rows in the frozen Research 78 new-ID range; seven selected stored verified claims.',
  initial: original.result, final: final.summary,
  previouslyAcceptedProofsReconciled: 6, newlyRecoveredProofs: 1,
  newRecordedTimeContextsPerRuntimePerProfile: 3, newIndependentRfcContexts: 3,
  regressionOriginals: 52, regressionResultsAndReuseUnchanged: true,
  proofComparison: 'Complete private stored projections, exact text references and retained receipt/invocation chains; no count-only join.',
  storage: { newProjectionMatches: preflight.identicalStoredProjectionPairs,
    separateQueryCopyMatches: preflight.matchingSeparateQueryCopies },
  statements: [{ purpose: 'constant access', reads: 0, writes: 0, providerAttempts: 1 },
    { purpose: 'complete fixed slice', reads: 343, writes: 0, providerAttempts: 1 }],
  reportedReads, reportedWrites: 0, reviewThreshold: 500, databaseEnforcedReadCap: false,
  queryMode: 'Wrangler --command; prepared private SQL passed as one subprocess argument',
  readPlanArchive: read('plan-archive.json'),
  nativeFixtureReads: 130, nativeProductionCostEquivalenceEstablished: false,
  d1MetadataFailure: { code: 10000, cause: 'not-established', attempts: 1 },
  resourceIdentity: 'Separate successful Worker allocation/version metadata matches the configured D1 binding; constant control separately accepts query access.',
  nativeUi: { start: '2026-10-29T01:53:00Z', endExclusive: '2026-10-29T01:55:00Z',
    receiptQueryRecords: 1, linkedQueryRecords: 4, acknowledgedCopies: 2,
    providerQueryMetering: 'not-returned', pricingNoticeAccepted: false },
  ownSiteRequests: 0, newHumanLabels: 0, managedCryptoAgreementMeasured: false,
  runtimeChanged: false, articleChanged: false,
  limits: ['Six archived proof cohorts are reused; only one new proof has fresh Node/workerd/two-profile and independent RFC replay.',
    'The 52-proof regression reruns archived contexts; it is not new production evidence.',
    'Later captured keys do not reconstruct original directory discovery, and source replay does not attest deployed bytes.',
    'Separate query copies share provider retention; neither proves wire-complete capture or delivery uniqueness.',
    'No held database snapshot, whole-history correctness, current service health, human trigger, readership or managed-verifier agreement claim.',
    'Cross-cohort seven-proof nonce/reuse census is not performed; the new proof reuse assessment has one observation.',
    'Native 130 reads and production 343 reads are separate measured costs; fixture equivalence is not established.'] };
for (const [name, result] of Object.entries({ 'signed-slice-production.json': production,
  'signed-slice-native.json': native, 'signed-slice-replay.json': replay,
  'signed-slice-reference.json': reference, 'signed-slice-preflight.json': preflight })) {
  writeFileSync(join(outputRoot, name), JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
}
console.log(JSON.stringify({ matched: 7, uncovered: 0, reads: reportedReads, newProofs: 1, regressionOriginals: 52 }));

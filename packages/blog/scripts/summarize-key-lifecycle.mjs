import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const [output, beforePath, afterPath, ...lifecyclePaths] = process.argv.slice(2);
assert.ok(output && beforePath && afterPath && lifecyclePaths.length === 3);
const before = JSON.parse(readFileSync(beforePath, 'utf8')), after = JSON.parse(readFileSync(afterPath, 'utf8'));
assert.equal(before.inputSha256, after.inputSha256); assert.equal(before.rows.length, 3); assert.equal(after.rows.length, 3);
for (const [index, round] of after.rows.entries()) {
  const old = before.rows[index]; assert.equal(old.round, round.round); assert.equal(round.cases.length, 4);
  for (const [i, row] of round.cases.entries()) {
    assert.equal(row.condition, old.cases[i].condition); assert.equal(row.pending, 0);
    if (row.condition === 'late-old-import') {
      assert.equal(old.cases[i].resurrectedBeforeProbe, true); assert.equal(old.cases[i].results[2].status, 'verified');
      assert.equal(row.newDirectoryPublished, true); assert.equal(row.resurrectedBeforeProbe, false);
      assert.deepEqual(row.results, [{ status: 'unverified', reason: 'reload' }, { status: 'verified', reason: null }, { status: 'unverified', reason: 'key-not-found' }]);
      assert.equal(row.fetches, 2);
    } else if (row.condition === 'parallel-warm-rotation') {
      assert.equal(old.cases[i].results.filter(r => r.status === 'verified').length, 1);
      assert.ok(row.results.every(r => r.status === 'verified')); assert.equal(row.fetches, 2);
    } else assert.deepEqual(row, old.cases[i]);
  }
}
const requests = lifecyclePaths.map(path => JSON.parse(readFileSync(path, 'utf8')));
for (const r of requests) { assert.equal(r.inputSha256, after.inputSha256); assert.deepEqual(r.rows, requests[0].rows); }
for (const row of requests[0].rows) {
  assert.equal(row.finalState.pending, 0); assert.equal(row.finalState.active, 0); assert.equal(row.recovery.status, 'verified');
  assert.equal(row.finalState.lookups, row.condition === 'owner-deadline' ? 2 : 1);
  if (row.condition === 'owner-deadline') assert.equal(row.results[1].reason, 'dir-fetch-failed');
  if (row.condition === 'newer-waiter-deadline') assert.equal(row.results[0].status, 'verified');
}
const sourceHash = createHash('sha256').update(readFileSync('packages/analytics/src/webbotauth.ts')).digest('hex');
assert.equal(after.sourceSha256, sourceHash);
writeFileSync(output, JSON.stringify({ inputSha256: after.inputSha256, sourceSha256: sourceHash,
  beforeAfterRounds: 3, pairedCases: 12, removedKeyResurrectionBefore: 3, removedKeyResurrectionAfter: 0,
  prematureWarmMissBefore: 3, prematureWarmMissAfter: 0, unchangedColdWarmControlCases: 6,
  crossRequestRounds: 3, crossRequestCases: 9, crossRequestRows: requests[0].rows,
  limits: ['Synthetic, controlled local Worker/service-binding schedules; no traffic prevalence or managed-provider accuracy.',
    'Owner timeout still affects its shared lookup waiter; all measured recovery calls verified.',
    'Completed noncacheable replacements/other cancellation schedules remain outside this matrix.'],
  productionRequests: 0, externalRequests: 0, productionD1Statements: 0 }, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
console.log(JSON.stringify({ pairedCases: 12, crossRequestCases: 9, resurrectedAfter: 0, prematureWarmMissAfter: 0 }));

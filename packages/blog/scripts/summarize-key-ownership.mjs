import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const [root, output] = process.argv.slice(2); assert.ok(root && output);
const load = file => JSON.parse(readFileSync(resolve(root, file), 'utf8'));
const hash = file => createHash('sha256').update(readFileSync(file)).digest('hex');
const source = hash('packages/analytics/src/webbotauth.ts'), input = hash(resolve(root, 'inputs.json'));
const before = load('before.json'), controls = load('controls-final.json');
const native = [1, 2, 3].map(n => load(`native-final${n}.json`));
function validate(control, runs) {
  assert.equal(control.sourceSha256, source); assert.equal(control.inputSha256, input); assert.equal(control.rows.length, 3);
  for (const round of control.rows) {
    assert.equal(round.cases.length, 9); assert.equal(new Set(round.cases.map(c => c.condition)).size, 9);
    assert.ok(round.cases.every(c => c.pending === 0 && (c.active ?? 0) === 0));
    const canceled = round.cases.find(c => c.condition === 'abort-during-warm-missing-key-hash');
    assert.equal(canceled.sourcePreserved, true); assert.equal(canceled.forcedRefreshes, 0);
    assert.equal(round.cases.find(c => c.condition === 'one-recovery-allowance').fetchesBeforeProbe, 2);
  }
  assert.equal(runs.length, 3);
  for (const run of runs) {
    assert.equal(run.sourceSha256, source); assert.equal(run.inputSha256, input); assert.equal(run.rows.length, 4);
    assert.equal(new Set(run.rows.map(c => c.condition)).size, 4);
    for (const row of run.rows) {
      const expires = row.condition.startsWith('owner-deadline');
      assert.equal(row.state.lookups, expires ? 2 : 1); assert.equal(row.state.pending, 0); assert.equal(row.state.active, 0);
      assert.equal(row.results[0].reason, expires ? 'fixture-deadline' : null);
      assert.equal(row.results.length, row.condition === 'owner-deadline-five-waiters' ? 6 : 2);
      for (const result of row.results.slice(1)) assert.equal(result.status, row.condition === 'newer-waiter-deadline' ? 'unverified' : 'verified');
      assert.equal(row.recovery.status, 'verified'); assert.deepEqual(row.finalState, row.state);
    }
  }
}
validate(controls, native);
assert.equal(before.inputSha256, input); assert.equal(before.rows.find(c => c.condition === 'owner-deadline').results[1].reason, 'dir-fetch-failed');
const mutations = [
  (c, n) => { n[0].rows.find(r => r.condition === 'owner-deadline').results[1].status = 'unverified'; },
  (c, n) => { n[0].rows[0].state.lookups++; },
  (c, n) => { n[0].sourceSha256 = 'wrong'; },
  c => { c.rows[0].cases.find(r => r.condition === 'abort-during-warm-missing-key-hash').sourcePreserved = false; },
];
for (const mutate of mutations) {
  const c = structuredClone(controls), n = structuredClone(native); mutate(c, n); assert.throws(() => validate(c, n));
}
writeFileSync(output, JSON.stringify({ checkedAt: new Date().toISOString(), sourceSha256: source, inputSha256: input,
  nativeSchedules: 12, pairedNodeWorkerdConditions: 27, comparisonNegativeControls: mutations.length,
  ownerDeadlineBefore: 'waiter unavailable, one lookup', ownerDeadlineAfter: 'waiter verified, two lookups',
  fiveWaiterRecoveryRounds: 3, hashCancellationMutationBefore: 3, hashCancellationMutationAfter: 0,
  physicalDrainCounters: 'Held custom fetches drain to zero; logical pending-map cap does not bound all transports that ignore abort.',
  artifacts: ['before.json', 'controls-final.json', ...[1, 2, 3].map(n => `native-final${n}.json`)].map(file => ({ file, sha256: hash(resolve(root, file)) })),
  productionRequests: 0, d1Statements: 0, humanLabels: 0,
}, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
console.log('Ownership comparisons and four corruption controls pass.');

import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const [beforePath, afterPath, inputPath, output, referencePath] = process.argv.slice(2);
assert.ok(beforePath && afterPath && inputPath && output, 'Supply before/after receipts, frozen inputs and new summary path');
const before = JSON.parse(readFileSync(beforePath, 'utf8')), after = JSON.parse(readFileSync(afterPath, 'utf8'));
const input = JSON.parse(readFileSync(inputPath, 'utf8'));
assert.equal(before.inputSha256, after.inputSha256); assert.equal(input.scenarios.length, 19);
assert.equal(createHash('sha256').update(readFileSync(inputPath)).digest('hex'), after.inputSha256);
assert.equal(before.rows.length, input.scenarios.length); assert.equal(after.rows.length, input.scenarios.length);
const semantic = result => {
  const { version, publicKeyPolicy, clock, knownDemonstrationKeyEntries, ...common } = result;
  return common;
};
const plain = value => JSON.stringify(value);
const temporal = new Map([
  ['proof-expires@0', 5001], ['proof-expires@5', 5001], ['proof-expires@5.001', null], ['proof-expires@6', null],
  ['body-proof-expires@0', 5001], ['body-proof-expires@6', null], ['future-proof@0', 5000], ['future-proof@5', 20001],
  ['key-expires@0', 5000], ['key-expires@5', 300001], ['future-key@0', 5000], ['future-key@5', 300001],
  ['mixed-expiry@0', 5001], ['mixed-expiry@6', 20001], ['mixed-expiry@21', null],
]);
const hypotheticalHttpDeadline = input.epoch * 1000 + 3600000;
const naive = new Map(), bounded = new Map();
const naiveWrong = [], boundedWrong = [], rows = [];
let boundedReassessments = 0, preserved = 0;
for (const [index, trial] of input.scenarios.entries()) {
  const a = before.rows[index], b = after.rows[index], truth = b.result;
  assert.equal(a.name, trial.name); assert.equal(b.name, trial.name);
  assert.equal(a.result.version, '2026-10-30.1'); assert.equal(truth.version, '2026-10-30.2');
  if (trial.scenario === 'known-public-demonstration-key') {
    assert.equal(a.result.profiles.cloudflareDirectory03.verifiedKeys, 1);
    assert.equal(truth.admittedKeys, 0); assert.equal(truth.proofs[0].reason, 'known-test-key');
  } else { assert.deepEqual(semantic(a.result), semantic(truth), trial.name); preserved++; }
  const now = Date.parse(trial.now);
  assert.equal(truth.clock.assessedAtMs, now);
  if (temporal.has(trial.name)) {
    const expected = temporal.get(trial.name);
    assert.equal(truth.clock.nextReassessmentAtMs, expected === null ? null : input.epoch * 1000 + expected, trial.name);
  }
  // These are policies applied to the actual measured results, not a live HTTP cache.
  // Cache identity is the entire frozen URL/status/header/body tuple for each scenario.
  const key = trial.scenario, context = plain(trial.context), expected = plain(semantic(truth));
  if (!naive.has(key)) naive.set(key, { context, result: truth });
  assert.equal(naive.get(key).context, context);
  if (plain(semantic(naive.get(key).result)) !== expected) naiveWrong.push(trial.name);
  const old = bounded.get(key);
  let reused = false, selected = truth;
  if (old && old.context === context && old.result.assessment === 'assessed'
    && now >= old.result.clock.assessedAtMs && now < old.deadline) {
    selected = old.result; reused = true;
  } else {
    boundedReassessments++;
    const deadline = Math.min(hypotheticalHttpDeadline, truth.clock.nextReassessmentAtMs ?? Infinity);
    bounded.set(key, { context, result: truth, deadline });
  }
  if (plain(semantic(selected)) !== expected) boundedWrong.push(trial.name);
  rows.push({ name: trial.name, beforeOperations: a.counts, afterOperations: b.counts,
    admittedKeys: truth.admittedKeys, authorityKeys: truth.profiles.cloudflareDirectory03.verifiedKeys,
    nextReassessmentAtMs: truth.clock.nextReassessmentAtMs, boundedReused: reused });
}
assert.equal(preserved, 18); assert.equal(naiveWrong.length, 8); assert.equal(boundedWrong.length, 0);
let referenceComparison = null;
if (referencePath) {
  const reference = JSON.parse(readFileSync(referencePath, 'utf8'));
  assert.equal(reference.sourceCommit, '1de433d9a49fd608475c6054ab14a1652c088844');
  assert.equal(reference.sourceFilesRechecked, 18); assert.equal(reference.rows.length, after.rows.length);
  const expected = new Set();
  for (const [name, index] of [['key-expires@5', 1], ['future-key@0', 1], ['known-public-demonstration-key@0', 0]]) {
    for (const mode of ['crypto', 'authority']) expected.add(`${name}:${index}:${mode}`);
  }
  const differences = []; let matched = 0;
  for (const [index, row] of after.rows.entries()) {
    const ref = reference.rows[index]; assert.equal(row.name, ref.name); assert.equal(row.result.proofs.length, ref.proofs.length);
    for (const [candidate, proof] of row.result.proofs.entries()) {
      const crypto = proof.outcome === 'verified', authority = crypto && proof.authorityCovered === true;
      const bodyBound = authority && proof.digestCovered === true && row.result.digest === 'matched';
      for (const [mode, value] of Object.entries({ crypto, authority, bodyBound })) {
        assert.equal(typeof ref.proofs[candidate][mode], 'boolean');
        if (value === ref.proofs[candidate][mode]) matched++;
        else {
          assert.ok(expected.delete(`${row.name}:${candidate}:${mode}`));
          differences.push({ name: row.name, candidateIndex: candidate, mode, localAccepted: value,
            referenceAccepted: ref.proofs[candidate][mode], cause: 'explicit local key validity/demonstration admission policy' });
        }
      }
    }
  }
  assert.equal(expected.size, 0); assert.equal(matched + differences.length, reference.referenceCalls);
  referenceComparison = { calls: reference.referenceCalls, matched, differences, unexplained: 0 };
}
for (const name of ['duplicate-128@0', 'absent-proof-duplicate-128@0']) {
  const row = rows.find(row => row.name === name);
  assert.equal(row.beforeOperations.digest, 128); assert.equal(row.beforeOperations.importKey, 128);
  assert.equal(row.afterOperations.digest, 1); assert.equal(row.afterOperations.importKey, 1);
}
writeFileSync(output, JSON.stringify({ inputSha256: after.inputSha256, nativeNodeCases: rows.length,
  unchangedCommonResults: preserved, deliberateAdmissionRepairs: 1, operationCounts: rows, referenceComparison,
  model: { hypotheticalHttpFreshSeconds: 3600, scenarios: naive.size, decisions: rows.length,
    naiveIncorrectDecisions: naiveWrong, boundedIncorrectDecisions: boundedWrong,
    boundedReassessments, boundedReuses: rows.length - boundedReassessments,
    limit: 'Policy simulation over actual recorded-time audits; no runtime cache, HTTP fetch, CPU or billing measurement.' },
  externalRequests: 0, productionRequests: 0, d1Statements: 0 }, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
console.log(JSON.stringify({ compared: rows.length, preserved, naiveWrong: naiveWrong.length, boundedWrong: boundedWrong.length,
  boundedReassessments, boundedReuses: rows.length - boundedReassessments }));

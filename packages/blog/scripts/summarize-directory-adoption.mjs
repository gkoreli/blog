import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const [root, output] = process.argv.slice(2); assert.ok(root && output);
const read = file => JSON.parse(readFileSync(resolve(root, file), 'utf8'));
const sha = file => createHash('sha256').update(readFileSync(file)).digest('hex');
const before = read('before-frozen.json'), after = read('after.json'), reference = read('reference-frozen.json');
const input = sha(resolve(root, 'inputs-frozen.json'));
function validate(b, a, r) {
  assert.equal(b.inputSha256, input); assert.equal(a.inputSha256, input); assert.equal(r.inputSha256, input);
  assert.equal(a.rows.length, 3); assert.equal(b.rows.length, 3); assert.equal(r.rows.length, 14);
  assert.equal(r.sourceCommit, '1de433d9a49fd608475c6054ab14a1652c088844'); assert.equal(r.sourceFilesRechecked, 18);
  for (const file of a.sourceHashes) assert.equal(sha(file.path), file.sha256);
  const changed = new Map([['signed-parameterized-digest', 'matched'], ['parameter-changed-without-resigning', 'matched'], ['parameterized-digest-body-changed', 'mismatch']]);
  let checks = 0;
  for (let round = 0; round < 3; round++) {
    assert.equal(a.rows[round].cases.length, 14); assert.equal(b.rows[round].cases.length, 14);
    for (let i = 0; i < 14; i++) {
      const row = a.rows[round].cases[i], old = b.rows[round].cases[i], ref = r.rows[i];
      assert.equal(row.name, old.name); assert.equal(row.name, ref.name); assert.equal(row.fetches, 1);
      assert.deepEqual(row.incoming, old.incoming);
      const expected = structuredClone(old.audit); expected.result.version = row.audit.result.version;
      if (changed.has(row.name)) { expected.counts.digest++; expected.result.digest = changed.get(row.name); }
      if (row.name === 'signed-parameterized-digest') expected.result.profiles.ietfProtocol01DomainBinding = { verifiedKeys: 2, allAdmittedKeysVerified: true };
      assert.deepEqual(row.audit, expected, row.name);
      assert.equal(row.audit.result.proofs.length, ref.proofs.length);
      row.audit.result.proofs.forEach((proof, index) => {
        const valid = proof.outcome === 'verified', authority = valid && proof.authorityCovered === true;
        const bound = authority && proof.digestCovered === true && row.audit.result.digest === 'matched';
        assert.equal(valid, ref.proofs[index].crypto, row.name); assert.equal(authority, ref.proofs[index].authority, row.name);
        assert.equal(bound, ref.proofs[index].bodyBound, row.name); if (round === 0) checks += 3;
      });
    }
    const rows = a.rows[round].cases, get = name => rows.find(row => row.name === name);
    assert.equal(rows.filter(row => row.hypothetical.current).length, 13);
    assert.equal(rows.filter(row => row.hypothetical.requireAllAuthority).length, 7);
    assert.equal(rows.filter(row => row.hypothetical.requireAllBodyBound).length, 2);
    assert.deepEqual(get('proof-for-request-key-only').audit, get('proof-for-other-key-only').audit);
    assert.deepEqual(get('128-keys-response-proofs-absent').audit.counts, { digest: 128, importKey: 128, verify: 0 });
  }
  assert.equal(checks, 66); assert.equal(r.referenceCalls, checks);
  return checks;
}
const referenceChecks = validate(before, after, reference);
const mutations = [
  (b, a, r) => { r.inputSha256 = 'wrong'; },
  (b, a, r) => { r.rows.reverse(); },
  (b, a, r) => { r.rows[0].proofs[0].bodyBound = true; },
  (b, a) => { a.rows[0].cases.find(c => c.name === '128-keys-response-proofs-absent').audit.counts.importKey--; },
];
for (const mutate of mutations) { const b = structuredClone(before), a = structuredClone(after), r = structuredClone(reference); mutate(b, a, r); assert.throws(() => validate(b, a, r)); }
const sameBundle = read('bundle-before.json'); assert.deepEqual(read('bundle-after.json'), sameBundle);
writeFileSync(output, JSON.stringify({ checkedAt: new Date().toISOString(), inputSha256: input, sourceHashes: after.sourceHashes,
  rounds: 3, pairedConditions: 42, syntheticCases: 14, independentReferenceChecks: referenceChecks, unexplainedReferenceDifferences: 0,
  changedDigestCases: 3, incomingResultsChanged: 0, comparisonNegativeControls: mutations.length,
  hypotheticalPerRound: { currentVerified: 13, requireAllDirectoryAuthority: 7, requireAllDirectoryBodyBound: 2, denominator: '14 deliberately selected signed-request/directory conditions; no prevalence or error-rate estimate' },
  analyticsEntryBundle: sameBundle, productionRequests: 0, d1Statements: 0, humanLabels: 0,
  decision: 'Keep the directory audit offline; do not gate incoming verification or promote aggregate directory counts to selected-key/operator facts. Runtime proposal requires a specific consumer decision, key-specific association, failure policy and additional cost/lifecycle acceptance.',
}, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
console.log(JSON.stringify({ pairedConditions: 42, referenceChecks, negativeControls: mutations.length, analyticsEntryUnchanged: true }));

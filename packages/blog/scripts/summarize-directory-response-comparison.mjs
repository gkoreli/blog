import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';

const [nativePath, referencePath, output] = process.argv.slice(2);
assert.ok(nativePath && referencePath && output, 'Supply native/reference receipts and a new summary path');
const native = JSON.parse(readFileSync(nativePath, 'utf8')), reference = JSON.parse(readFileSync(referencePath, 'utf8'));
assert.equal(reference.sourceCommit, '1de433d9a49fd608475c6054ab14a1652c088844');
assert.equal(reference.sourceFilesRechecked, 18);
assert.equal(native.productionRequests, 0); assert.equal(native.d1Statements, 0); assert.equal(reference.externalRequests, 0);
assert.equal(native.rows.length, reference.rows.length); assert.equal(native.trials, native.rows.length);
assert.equal(new Set(native.rows.map(row => row.name)).size, native.rows.length);
const expected = new Set();
for (const [name, count] of [['unsupported-component', 2], ['conflicting-duplicate-key', 1],
  ['rejected-key-metadata', 1], ['conflicting-validity-duplicates', 1], ['expired-key-boundary', 1]]) {
  for (let index = 0; index < count; index++) for (const mode of ['crypto', 'authority']) expected.add(`${name}:${index}:${mode}`);
}
let matched = 0;
const differences = [], rows = [];
for (const [index, local] of native.rows.entries()) {
  const ref = reference.rows[index];
  assert.equal(local.name, ref.name); assert.equal(local.nodeNativeEqual, true);
  assert.equal(local.proofs.length, ref.proofs.length);
  for (const [candidateIndex, proof] of local.proofs.entries()) {
    const crypto = proof.outcome === 'verified', authority = crypto && proof.authorityCovered === true;
    const bodyBound = authority && proof.digestCovered === true && local.digest === 'matched';
    for (const [mode, value] of Object.entries({ crypto, authority, bodyBound })) {
      assert.equal(typeof ref.proofs[candidateIndex][mode], 'boolean');
      if (value === ref.proofs[candidateIndex][mode]) matched++;
      else {
        const id = `${local.name}:${candidateIndex}:${mode}`;
        assert.ok(expected.delete(id), `Unexplained difference: ${id}`);
        differences.push({ name: local.name, candidateIndex, mode, localAccepted: value, referenceAccepted: ref.proofs[candidateIndex][mode],
          cause: local.name === 'unsupported-component' ? 'component subset' : 'explicit local JWK admission policy' });
      }
    }
  }
  rows.push({ name: local.name, nodeNativeEqual: true, cryptoProofs: local.proofs.filter(p => p.outcome === 'verified').length,
    admittedKeys: local.admittedKeys, authorityKeys: local.profiles.cloudflareDirectory03.verifiedKeys,
    bodyBoundKeys: local.profiles.ietfProtocol01DomainBinding.verifiedKeys, digest: local.digest });
}
assert.equal(expected.size, 0, 'A documented scope/admission difference disappeared');
assert.equal(matched + differences.length, reference.referenceCalls);
writeFileSync(output, JSON.stringify({ trials: rows.length, referenceCalls: reference.referenceCalls, matchedSemanticChecks: matched,
  documentedDifferences: differences, unexplainedDifferences: 0, sourceCommit: reference.sourceCommit,
  sourceFilesRechecked: reference.sourceFilesRechecked, rows }, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
console.log(JSON.stringify({ compared: rows.length, matched, explainedDifferences: differences.length, unexplainedDifferences: 0 }));

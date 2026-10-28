import assert from 'node:assert/strict';

export async function checkSignatureReuseFixture(fixture, invoke) {
  const results = [];
  for (const cohort of fixture.cohorts) {
    const result = await invoke(cohort.rows);
    assert.equal(result.attemptedCandidates, result.verifiedCandidates + result.notVerifiedByProfileCandidates + result.unresolvedCandidates);
    const expected = {
      'same-proof-different-request-label-and-context': [2, 1, 1, 0],
      'different-proofs-same-publisher-key-nonce': [2, 0, 1, 1],
      'same-nonce-different-publisher-or-key': [3, 0, 0, 0],
      'same-key-bytes-different-jwk-encoding': [2, 0, 1, 1],
      'duplicate-export-reference': [0, 0, 0, 0],
      'invalid-signature-does-not-add-reuse': [1, 0, 0, 0],
      'missing-nonce-is-not-a-duplicate-nonce': [2, 1, 0, 0],
      'different-nonces': [2, 0, 0, 0],
      'two-proofs-in-one-observation': [2, 0, 0, 0],
    }[cohort.name];
    assert.deepEqual([result.verifiedCandidates, result.repeatedProofGroups, result.repeatedNonceGroups, result.repeatedNonceGroupsWithDifferentProofs], expected, cohort.name);
    assert.equal(result.assessment, cohort.name === 'duplicate-export-reference' ? 'partial' : 'complete');
    if (cohort.name === 'same-proof-different-request-label-and-context') assert.equal(result.repeatedProofGroupsWithChangedMethodUrlOrUserAgent, 1);
    if (cohort.name === 'duplicate-export-reference') assert.equal(result.duplicateReferenceRecords, 2);
    if (cohort.name === 'two-proofs-in-one-observation') assert.equal(result.verifiedObservations, 1);
    const text = JSON.stringify(result);
    for (const value of ['fixture.example', 'fixture-reuse-nonce', cohort.rows[0].headers.Signature, cohort.rows[0].headers['Signature-Input']]) assert.equal(text.includes(value), false);
    results.push({ name: cohort.name, ...result });
  }
  return results;
}


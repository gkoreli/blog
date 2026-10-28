import test from 'node:test';
import assert from 'node:assert/strict';
import { signatureParameterFixture, signatureParameterMatrix } from './fixtures/signature-parameters.mjs';
import { verifyWebBotAuth, verifyWebBotAuthCandidate, createWebBotAuthCache } from '../.test-dist/webbotauth.js';
import { auditWebBotAuth } from '../.test-dist/webbotauth-audit.js';
import { verificationOutcome } from '../.test-dist/signature-evidence.js';

test('signed parameter types are invalid before discovery; explicit freshness policy remains separate', async () => {
  const fixture = await signatureParameterFixture();
  const rows = await signatureParameterMatrix(fixture, { verify: verifyWebBotAuth, selected: verifyWebBotAuthCandidate, cache: createWebBotAuthCache, audit: auditWebBotAuth, outcome: verificationOutcome });
  for (const row of rows) for (const path of row.paths.slice(0, 2)) {
    assert.equal(path.reason, row.expectedReason, row.name + '/' + path.mode);
    if (row.expectedReason?.endsWith('-type')) { assert.equal(path.outcome, 'invalid'); assert.equal(path.fetches, 0); }
  }
  for (const row of rows.filter(row => row.expectedReason?.endsWith('-type'))) {
    const audit = row.paths[2];
    assert.equal(audit.verified, 0);
    assert.equal(audit.assessment, row.name.endsWith('/tag-token') ? 'not-assessed' : 'complete');
    if (!row.name.endsWith('/tag-token')) assert.equal(audit.negative, 1);
  }
  const bad = fixture.rows.find(row => row.name === 'dictionary/integer-nonce');
  const good = fixture.rows.find(row => row.name === 'dictionary/string-nonce');
  const request = new Request('https://publication.example/a', { headers: { ...good.headers,
    'Signature-Input': `${bad.headers['Signature-Input']}, ${good.headers['Signature-Input'].replace(/^proof=/, 'valid=')}`,
    Signature: `${bad.headers.Signature}, ${good.headers.Signature.replace(/^proof=/, 'valid=')}` } });
  const options = { now: new Date(good.now), includeEvidence: true, fetcher: async () => Response.json(fixture.directory, { headers: { 'Content-Type': 'application/http-message-signatures-directory+json' } }) };
  const selected = await verifyWebBotAuth(request, options);
  assert.equal(selected.status, 'verified'); assert.equal(selected.evidence.selection.attemptedCandidates, 2);
  const audit = await auditWebBotAuth(request, options);
  assert.equal(audit.assessment, 'complete'); assert.equal(audit.verifiedCandidates, 1); assert.equal(audit.notVerifiedByProfileCandidates, 1);
});

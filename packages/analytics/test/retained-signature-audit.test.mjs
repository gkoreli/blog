import test from 'node:test';
import assert from 'node:assert/strict';
import { auditRetainedWebBotAuth } from '../.test-dist/retained-signature-audit.js';
import { retainedSignatureFixture } from './fixtures/retained-signature.mjs';
import { nativeTraceSignatureFixture } from './fixtures/native-trace-signatures.mjs';

export async function assessRetainedCase(row, changes = {}) {
  const request = new Request(row.url, { method: row.method, headers: row.headers });
  return auditRetainedWebBotAuth(request, { recordedAt: new Date(row.now), fetcher: async () => Response.json(row.directory, { headers: { 'Content-Type': 'application/http-message-signatures-directory+json' } }), ...changes });
}

test('redacted or absent covered input cannot establish an invalid original request', async () => {
  const { records } = await retainedSignatureFixture();
  for (const [name, row] of Object.entries(records)) {
    const r = await assessRetainedCase(row);
    assert.equal(r.originalRequestValidity, 'not-established', name);
    assert.equal(r.directorySnapshotEquivalence, 'not-established', name);
    assert.equal(r.recordedClock, 'supplied');
    assert.equal(r.capturedInputAudit.verifiedCandidates, ['original', 'literal', 'unsignedMarker', 'mixed'].includes(name) ? 1 : 0, name);
    assert.equal(r.availability.placeholderShapedHeaderComponents, ['redacted', 'literal', 'mixed'].includes(name) ? 1 : 0, name);
    assert.equal(r.availability.missingHeaderComponents, name === 'missing' ? 1 : 0, name);
    if (name === 'missing') { assert.equal(r.capturedInputAudit.indeterminateCandidates, 1); assert.equal(r.capturedInputAudit.notVerifiedByProfileCandidates, 0); }
    assert.equal(r.availability.uninspectedCandidates, 0);
    for (const canary of ['synthetic-session', 'private-canary', 'fixture.example', 'user-agent', 'cookie', row.headers.Signature]) assert.equal(JSON.stringify(r).includes(canary), false, name);
  }
});
test('a verified second proof does not erase the first captured-context failure or budget', async () => {
  const { records } = await retainedSignatureFixture();
  const r = await assessRetainedCase(records.mixed);
  assert.equal(r.replayInterpretation, 'verified-captured-context'); assert.equal(r.capturedInputAudit.notVerifiedByProfileCandidates, 1);
  const limited = await assessRetainedCase(records.mixed, { maxCandidates: 1 });
  assert.equal(limited.replayInterpretation, 'not-verified-captured-context'); assert.equal(limited.capturedInputAudit.termination, 'candidate-limit');
  assert.equal(limited.availability.inspectedCandidates, 1); assert.equal(limited.availability.uninspectedCandidates, 1);
});
test('historical replay requires a valid explicit clock and preserves unavailable resolution', async () => {
  const { records } = await retainedSignatureFixture();
  let calls = 0;
  for (const recordedAt of [undefined, null, new Date(NaN)]) {
    const r = await assessRetainedCase(records.original, { recordedAt, fetcher: async () => { calls++; throw Error('must not resolve'); } });
    assert.equal(r.recordedClock, 'missing-or-invalid'); assert.equal(r.capturedInputAudit, null); assert.equal(r.availability.uninspectedCandidates, null);
  }
  assert.equal(calls, 0);
  const r = await assessRetainedCase(records.original, { fetcher: async () => new Response(null, { status: 503 }) });
  assert.equal(r.capturedInputAudit.unavailableCandidates, 1); assert.equal(r.capturedInputAudit.notVerifiedByProfileCandidates, 0);
  assert.equal(r.replayInterpretation, 'not-verified-captured-context');
});
test('malformed, unsupported and over-budget representations retain unassessed availability', async () => {
  const { records } = await retainedSignatureFixture();
  const row = records.original;
  const huge = { ...row, headers: { ...row.headers, Signature: 'a'.repeat(32769) } };
  const budget = await assessRetainedCase(huge); assert.equal(budget.capturedInputAudit.termination, 'header-budget'); assert.equal(budget.availability.uninspectedCandidates, null);
  const malformed = await assessRetainedCase({ ...row, headers: { ...row.headers, 'Signature-Input': 'broken' } });
  assert.equal(malformed.capturedInputAudit.assessment, 'not-assessed'); assert.equal(malformed.availability.uninspectedCandidates, null);
  const unsupported = await assessRetainedCase({ ...row, headers: { ...row.headers, 'Signature-Input': row.headers['Signature-Input'].replace('"cookie"', '"cookie";bs') } });
  assert.equal(unsupported.availability.unresolvedComponents, 1);
  const duplicate = await assessRetainedCase({ ...row, headers: { ...row.headers, 'Signature-Input': row.headers['Signature-Input'].replace('"cookie"', '"cookie" "cookie"') } });
  assert.equal(duplicate.availability.inspectedCandidates, 0); assert.equal(duplicate.availability.uninspectedCandidates, 1);
});
test('request and clock mutation during resolution cannot alter availability facts', async () => {
  const { records } = await retainedSignatureFixture(), row = records.original;
  const request = new Request(row.url, { headers: row.headers }), clock = new Date(row.now);
  const r = await auditRetainedWebBotAuth(request, { recordedAt: clock, fetcher: async () => {
    request.headers.set('cookie', 'REDACTED'); clock.setTime(NaN);
    return Response.json(row.directory, { headers: { 'Content-Type': 'application/http-message-signatures-directory+json' } });
  } });
  assert.equal(r.capturedInputAudit.verifiedCandidates, 1); assert.equal(r.availability.placeholderShapedHeaderComponents, 0);
});

test('covered URL markers expose possible capture loss without invalidating a signed literal or unsigned URL', async () => {
  const { trials } = await nativeTraceSignatureFixture();
  for (const row of trials) {
    const original = await assessRetainedCase(row);
    assert.equal(original.availability.placeholderShapedUrlComponents, row.name === 'literal-url-marker' ? 1 : 0);
    assert.equal(original.capturedInputAudit.verifiedCandidates, Number(row.expected.producerVerified));
    if (['covered-target-uri', 'covered-path', 'covered-query', 'unsigned-url'].includes(row.name)) {
      const url = row.url.replace('0123456789abcdef0123456789abcdef', 'REDACTED');
      const altered = await assessRetainedCase({ ...row, url });
      assert.equal(altered.availability.placeholderShapedUrlComponents, row.name === 'unsigned-url' ? 0 : 1);
      assert.equal(altered.capturedInputAudit.verifiedCandidates, row.name === 'unsigned-url' ? 1 : 0);
      assert.equal(altered.originalRequestValidity, 'not-established');
    }
    if (row.name === 'baseline') {
      const hostMarker = await assessRetainedCase({ ...row, url: 'https://REDACTED.example/fixture' });
      assert.equal(hostMarker.availability.placeholderShapedUrlComponents, 1);
      assert.equal(hostMarker.capturedInputAudit.verifiedCandidates, 0);
    }
  }
});

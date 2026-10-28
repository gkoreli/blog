import assert from 'node:assert/strict';
import test from 'node:test';
import { auditWebBotAuthReuse } from '../.test-dist/webbotauth-reuse-audit.js';
import { signatureReuseFixture } from './fixtures/signature-reuse.mjs';
import { checkSignatureReuseFixture } from './fixtures/signature-reuse-assertions.mjs';

test('reuse audit distinguishes proved reuse, nonce scope and duplicate exports', async () => {
  const fixture = await signatureReuseFixture();
  const fetcher = async url => { assert.ok(Object.hasOwn(fixture.directories, String(url))); return Response.json(fixture.directories[String(url)], { headers: { 'Content-Type': 'application/http-message-signatures-directory+json' } }); };
  const invoke = (rows, options = {}) => auditWebBotAuthReuse(rows.map(row => ({ reference: row.reference, request: new Request(row.url, { method: row.method, headers: row.headers }), observedAt: new Date(row.observedAt) })), { fetcher, ...options });
  await checkSignatureReuseFixture(fixture, invoke);
  const limited = await invoke(fixture.cohorts[0].rows, { maxObservations: 1 });
  assert.equal(limited.assessment, 'not-assessed'); assert.equal(limited.unassessedObservations, 2); assert.equal(limited.duplicateReferenceRecords, null);
  const missing = await invoke([{ ...fixture.records.original, reference: '' }]); assert.equal(missing.missingReferenceRecords, 1); assert.equal(missing.assessment, 'partial');
  const badTime = await invoke([{ ...fixture.records.original, reference: 'one', observedAt: 'bad' }]); assert.equal(badTime.invalidContextRecords, 1);
  const unavailable = await invoke(fixture.cohorts[0].rows, { fetcher: async () => new Response(null, { status: 503 }) });
  assert.equal(unavailable.assessment, 'partial'); assert.equal(unavailable.unresolvedCandidates, 2); assert.equal(unavailable.repeatedProofGroups, 0);
  const candidates = await invoke([{ ...fixture.records.multi, reference: 'one' }], { maxCandidatesPerObservation: 1 });
  assert.equal(candidates.assessment, 'partial'); assert.equal(candidates.unassessedKnownCandidates, 1); assert.equal(candidates.verifiedCandidates, 1);
  let aborted = false;
  const deadline = await invoke([{ ...fixture.records.original, reference: 'one' }, { ...fixture.records.otherPublisher, reference: 'two' }], {
    deadlineMs: 100,
    fetcher: (url, init) => String(url).includes('second.example')
      ? new Promise((resolve, reject) => init.signal.addEventListener('abort', () => { aborted = true; reject(new Error('Fixture abort')); }, { once: true })) : fetcher(url),
  });
  assert.equal(deadline.assessment, 'partial'); assert.equal(deadline.termination, 'deadline'); assert.equal(deadline.verifiedCandidates, 1); assert.equal(aborted, true);
});

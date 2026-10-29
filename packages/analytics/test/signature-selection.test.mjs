import test from 'node:test';
import assert from 'node:assert/strict';
import { signatureSelectionFixture } from './fixtures/signature-selection.mjs';
import { createWebBotAuthCache, verifyWebBotAuth } from '../.test-dist/webbotauth.js';
import { storedObservationReceipt } from '../.test-dist/observation-receipt.js';
import { verificationEvidence } from '../.test-dist/signature-evidence.js';
import { analyzeTraffic } from '../.test-dist/classify.js';

test('first-valid selection records its scope without claiming all candidates or signers were assessed', async () => {
  const fixture = await signatureSelectionFixture();
  for (const trial of fixture.cases) {
    const request = new Request('https://publication.example/article', { headers: trial.headers });
    let fetches = 0;
    const result = await verifyWebBotAuth(request, { now: fixture.now, includeEvidence: true, cache: createWebBotAuthCache(), fetcher: async url => {
      fetches++; assert.ok(Object.hasOwn(fixture.directories, String(url)));
      return Response.json(fixture.directories[String(url)], { headers: { 'Content-Type': 'application/http-message-signatures-directory+json' } });
    } });
    assert.equal(result.status, 'verified', trial.name); assert.equal(result.agent, trial.selectedOrigin, trial.name);
    assert.equal(result.evidence.version, '2026-10-28.1');
    const [matchedCandidates, taggedCandidates, attemptedCandidates, unassessedCandidates] = trial.counts;
    assert.deepEqual(result.evidence.selection, { policy: 'first-valid-in-input-order', matchedCandidates, taggedCandidates, attemptedCandidates, unassessedCandidates }, trial.name);
    assert.equal(fetches, attemptedCandidates);
    const evidence = verificationEvidence(request, result, false, ['ExaSearchBot']);
    const receipt = storedObservationReceipt({ readerKind: 'ai-search', signatureStatus: 'verified', signatureAgent: result.agent,
      classificationEvidence: { version: '2026-10-27.2', classifierProfile: '2026-10-27.5', declarations: analyzeTraffic('ExaSearchBot/1.0').declarations, categoryAgreement: 'single-match' }, signatureEvidence: evidence });
    assert.equal(receipt.version, '2026-10-29.1'); assert.deepEqual(receipt.signature.selection, result.evidence.selection);
    const closed = JSON.stringify(receipt); for (const secret of [trial.selectedOrigin, 'one.fixture.example', trial.headers.Signature, trial.headers['Signature-Input']]) assert.equal(closed.includes(secret), false);
  }
});

test('selection telemetry remains opt-in; unsuccessful verification cannot acquire a successful selection assessment', async () => {
  const fixture = await signatureSelectionFixture(), headers = fixture.cases[0].headers;
  const config = { now: fixture.now, cache: createWebBotAuthCache(), fetcher: async url => Response.json(fixture.directories[String(url)], { headers: { 'Content-Type': 'application/http-message-signatures-directory+json' } }) };
  const selected = await verifyWebBotAuth(new Request('https://publication.example/a', { headers }), config);
  assert.deepEqual(selected, { status: 'verified', agent: 'https://one.fixture.example' });
  const failed = await verifyWebBotAuth(new Request('https://tampered.example/a', { headers }), { ...config, includeEvidence: true });
  assert.equal(failed.status, 'unverified'); assert.equal(failed.reason, 'signature-invalid'); assert.equal(failed.evidence, undefined);
});

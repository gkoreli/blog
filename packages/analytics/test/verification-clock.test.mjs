import test from 'node:test';
import assert from 'node:assert/strict';
import { signatureSelectionFixture } from './fixtures/signature-selection.mjs';
import { verificationClockCases } from './fixtures/verification-clock.mjs';
import { verifyWebBotAuth, verifyWebBotAuthCandidate, createWebBotAuthCache } from '../.test-dist/webbotauth.js';
import { auditWebBotAuth } from '../.test-dist/webbotauth-audit.js';
import { verificationEvidence, verificationOutcome } from '../.test-dist/signature-evidence.js';

const modes = ['default', 'selected', 'audit'];
const run = (mode, request, options) => mode === 'default' ? verifyWebBotAuth(request, options)
  : mode === 'selected' ? verifyWebBotAuthCandidate(request, 'one', options) : auditWebBotAuth(request, options);

test('unusable caller clocks abstain before discovery; ordinary freshness and key-expiry checks remain effective', async () => {
  const fixture = await signatureSelectionFixture();
  for (const trial of [...verificationClockCases(fixture.now), { name: 'out-of-range-date-like', now: { getTime: () => 9e15 }, unusable: true }]) {
    if (trial.unsigned) continue;
    const request = new Request('https://publication.example/a', { headers: fixture.cases[0].headers });
    for (const mode of modes) {
      let fetches = 0;
      const result = await run(mode, request, { now: trial.now, includeEvidence: true, cache: createWebBotAuthCache(), fetcher: async url => {
        fetches++; const body = structuredClone(fixture.directories[String(url)]); assert.ok(body);
        if (trial.expiredKey) body.keys = body.keys.map(key => ({ ...key, exp: Math.floor(fixture.now.getTime() / 1000) - 100 }));
        return Response.json(body, { headers: { 'Content-Type': 'application/http-message-signatures-directory+json' } });
      } });
      const context = trial.name + '/' + mode;
      if (trial.unusable) {
        assert.equal(fetches, 0, context);
        if (mode === 'audit') {
          assert.equal(result.assessment, 'not-assessed', context); assert.equal(result.termination, 'invalid-options');
          assert.equal(result.policy, null); assert.equal(result.taggedCandidates, null); assert.equal(result.attemptedCandidates, 0);
        } else {
          assert.deepEqual(result, { status: 'unverified', reason: 'invalid-verification-time' }, context);
          assert.equal(verificationOutcome(result), 'indeterminate');
          assert.equal(verificationEvidence(request, result).localReason, 'invalid-verification-time');
        }
      } else if (mode === 'audit') {
        assert.equal(result.verifiedCandidates, trial.name === 'valid' ? 1 : 0, context);
        assert.equal(result.assessment, trial.expiredKey ? 'partial' : 'complete', context);
      } else {
        assert.equal(result.status, trial.name === 'valid' ? 'verified' : 'unverified', context);
        if (trial.name !== 'valid') assert.equal(result.reason, trial.expiredKey ? 'key-expired' : trial.name === 'expired-signature' ? 'expired' : 'not-yet-valid');
        else assert.equal(Number.isFinite(result.evidence.ageSeconds), true);
      }
      assert.equal(JSON.stringify(result).includes('private-clock-canary'), false);
    }
  }
});

test('clock is read once before resolver mutation, including Date-like callers at runtime', async () => {
  const fixture = await signatureSelectionFixture();
  for (const mode of modes) {
    let reads = 0;
    const now = { getTime() { reads++; return reads === 1 ? fixture.now.getTime() : NaN; } };
    const result = await run(mode, new Request('https://publication.example/a', { headers: fixture.cases[0].headers }), {
      now, includeEvidence: true, cache: createWebBotAuthCache(), fetcher: async url => Response.json(fixture.directories[String(url)], {
        headers: { 'Content-Type': 'application/http-message-signatures-directory+json' },
      }),
    });
    assert.equal(reads, 1, mode); assert.equal(mode === 'audit' ? result.verifiedCandidates : result.status, mode === 'audit' ? 1 : 'verified');
  }
});

test('absent input requires no verifier clock; audit configuration admission deliberately precedes inspection', async () => {
  const request = new Request('https://publication.example/a');
  for (const mode of modes) {
    const result = await run(mode, request, { now: new Date(NaN), fetcher: async () => { throw Error('must not discover'); } });
    if (mode === 'audit') { assert.equal(result.assessment, 'not-assessed'); assert.equal(result.termination, 'invalid-options'); }
    else assert.deepEqual(result, { status: 'absent' });
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { signatureSelectionFixture } from './fixtures/signature-selection.mjs';
import { auditWebBotAuth } from '../.test-dist/webbotauth-audit.js';
import { verifyWebBotAuthCandidate } from '../.test-dist/webbotauth.js';

const request = trial => new Request('https://publication.example/a?private=canary', { headers: trial.headers });
function transport(fixture) {
  return async url => {
    assert.ok(Object.hasOwn(fixture.directories, String(url)));
    return Response.json(fixture.directories[String(url)], { headers: { 'Content-Type': 'application/http-message-signatures-directory+json' } });
  };
}
function accounted(result) {
  assert.equal(result.taggedCandidates, result.verifiedCandidates + result.notVerifiedByProfileCandidates + result.unavailableCandidates + result.unsupportedCandidates + result.indeterminateCandidates + result.unassessedCandidates);
  assert.equal(result.attemptedCandidates, result.taggedCandidates - result.unassessedCandidates);
}
test('all eligible proofs are independently assessed; input order does not hide another valid publisher', async () => {
  const fixture = await signatureSelectionFixture();
  for (const trial of fixture.cases) {
    const result = await auditWebBotAuth(request(trial), { now: fixture.now, fetcher: transport(fixture) });
    const two = trial.name.startsWith('both-valid'), oneInvalid = ['first-invalid', 'later-invalid-unassessed'].includes(trial.name);
    assert.equal(result.assessment, trial.name.startsWith('unpaired-') ? 'partial' : 'complete', trial.name); assert.equal(result.termination, 'exhausted'); accounted(result);
    assert.equal(result.verifiedCandidates, two ? 2 : 1, trial.name);
    assert.equal(result.notVerifiedByProfileCandidates, oneInvalid ? 1 : 0, trial.name);
    assert.equal(result.verifiedPublisherOriginLowerBound, two ? 2 : 1, trial.name);
    assert.equal(result.unresolvedCandidates, 0); assert.equal(result.unassessedCandidates, 0);
    assert.equal(result.unpairedInputs + result.unpairedSignatures, trial.name.startsWith('unpaired-') ? 1 : 0);
    const publicText = JSON.stringify(result);
    for (const canary of ['fixture.example', 'private=canary', trial.headers.Signature, trial.headers['Signature-Input']]) assert.equal(publicText.includes(canary), false);
  }
});
test('candidate budgets preserve a known positive and leave the remaining denominator unresolved', async () => {
  const fixture = await signatureSelectionFixture();
  const result = await auditWebBotAuth(request(fixture.cases[1]), { now: fixture.now, fetcher: transport(fixture), maxCandidates: 1 });
  assert.equal(result.assessment, 'partial'); assert.equal(result.termination, 'candidate-limit');
  assert.equal(result.policy.maxCandidates, 1); assert.equal(result.policy.maxAgeSeconds,86400); assert.equal(result.policy.clockSource,'caller-supplied');
  assert.equal(result.verifiedCandidates, 1); assert.equal(result.unassessedCandidates, 1); assert.equal(result.unresolvedCandidates, 1); accounted(result);
});
test('unavailable and unsupported candidate outcomes cannot become a complete assessment', async () => {
  const fixture = await signatureSelectionFixture();
  const unavailable = await auditWebBotAuth(request(fixture.cases[1]), { now: fixture.now, fetcher: async url => String(url).startsWith('https://two.') ? new Response(null, { status: 503 }) : transport(fixture)(url) });
  assert.equal(unavailable.assessment, 'partial'); assert.equal(unavailable.termination, 'exhausted');
  assert.equal(unavailable.verifiedCandidates, 1); assert.equal(unavailable.unavailableCandidates, 1); assert.equal(unavailable.unassessedCandidates, 0); accounted(unavailable);
  const headers = { ...fixture.cases[0].headers, 'Signature-Input': fixture.cases[0].headers['Signature-Input'].replace('ed25519', 'rsa-pss-sha512') };
  const unsupported = await auditWebBotAuth(request({ headers }), { now: fixture.now, fetcher: async () => { throw Error('must not fetch'); } });
  assert.equal(unsupported.assessment, 'partial'); assert.equal(unsupported.unsupportedCandidates, 1); assert.equal(unsupported.directoryFetches, 0); accounted(unsupported);
});
test('one global deadline aborts the extra lookup without erasing an earlier verified proof', async () => {
  const fixture = await signatureSelectionFixture(); let aborted = false;
  const result = await auditWebBotAuth(request(fixture.cases[1]), { now: fixture.now, deadlineMs: 1000, fetcher: async (url, init) => {
    if (String(url).startsWith('https://one.')) return transport(fixture)(url);
    return new Promise((resolve, reject) => init.signal.addEventListener('abort', () => { aborted = true; reject(new Error('private-abort-canary')); }, { once: true }));
  } });
  assert.equal(aborted, true); assert.equal(result.assessment, 'partial'); assert.equal(result.termination, 'deadline');
  assert.equal(result.verifiedCandidates, 1); assert.equal(result.unavailableCandidates, 1); assert.equal(result.directoryFetches, 2); accounted(result);
  assert.equal(JSON.stringify(result).includes('private-abort-canary'), false);
});
test('late noncooperative resolver completion cannot upgrade the already returned assessment', async () => {
  const fixture = await signatureSelectionFixture(); let finish;
  const result = await auditWebBotAuth(request(fixture.cases[0]), { now: fixture.now, deadlineMs: 10, fetcher: () => new Promise(resolve => { finish = resolve; }) });
  assert.equal(result.assessment, 'partial'); assert.equal(result.verifiedCandidates, 0); assert.equal(result.unavailableCandidates, 1); accounted(result);
  const before = structuredClone(result); finish(await transport(fixture)(Object.keys(fixture.directories)[0]));
  await new Promise(resolve => setTimeout(resolve, 50)); assert.deepEqual(result, before);
});
test('message and verification clock are snapshotted for the entire audit', async () => {
  const fixture = await signatureSelectionFixture(), original = request(fixture.cases[1]);
  const now = new Date(fixture.now);
  const result = await auditWebBotAuth(original, { now, fetcher: async url => {
    original.headers.set('Signature', 'changed-private-canary'); original.headers.set('Signature-Agent', 'changed'); now.setTime(NaN);
    return transport(fixture)(url);
  } });
  assert.equal(result.assessment, 'complete'); assert.equal(result.verifiedCandidates, 2); accounted(result);
});
test('a crypto runtime exception remains unresolved after every candidate was attempted', async () => {
  const fixture=await signatureSelectionFixture(),original=crypto.subtle.verify;
  try {
    crypto.subtle.verify=async()=>{throw Error('private-engine-canary');};
    const result=await auditWebBotAuth(request(fixture.cases[0]),{now:fixture.now,fetcher:transport(fixture)});
    assert.equal(result.assessment,'partial');assert.equal(result.termination,'exhausted');assert.equal(result.indeterminateCandidates,1);assert.equal(result.unassessedCandidates,0);accounted(result);
    assert.equal(JSON.stringify(result).includes('private-engine-canary'),false);
  } finally {crypto.subtle.verify=original;}
});
test('preflight unknowns, known absence and excluded protocol tags remain different', async () => {
  const fixture = await signatureSelectionFixture(); let calls = 0; const fetcher = async () => { calls++; throw Error('must not fetch'); };
  for (const options of [{ maxCandidates: 0 }, { deadlineMs: 0 }, { maxAgeSeconds: -1 }, { now: new Date(NaN) }, { fetcher: undefined }]) {
    const r = await auditWebBotAuth(request(fixture.cases[0]), { fetcher, ...options });
    assert.equal(r.assessment, 'not-assessed'); assert.equal(r.termination, 'invalid-options'); assert.equal(r.taggedCandidates, null); assert.equal(r.policy,null);
  }
  const oversized = request(fixture.cases[0]); oversized.headers.set('Signature', 'a'.repeat(32769));
  assert.equal((await auditWebBotAuth(oversized, { fetcher })).termination, 'header-budget');
  const absent = await auditWebBotAuth(new Request('https://publication.example/a'), { fetcher });
  assert.equal(absent.assessment, 'absent'); assert.equal(absent.taggedCandidates, 0);
  const malformed = request(fixture.cases[0]); malformed.headers.set('Signature-Input', 'not-a-list');
  assert.equal((await auditWebBotAuth(malformed, { fetcher })).taggedCandidates, null);
  const unrelated = request(fixture.cases[0]); unrelated.headers.set('Signature-Input', unrelated.headers.get('Signature-Input').replace('web-bot-auth', 'another-protocol'));
  assert.equal((await auditWebBotAuth(unrelated, { fetcher })).assessment, 'not-applicable'); assert.equal(calls, 0);
  assert.equal((await verifyWebBotAuthCandidate(request(fixture.cases[0]), 'missing', { fetcher })).reason, 'no-web-bot-auth-signature');
});

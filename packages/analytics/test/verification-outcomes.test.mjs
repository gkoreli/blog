import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { FAILURE_OUTCOMES, verificationEvidence, verificationOutcome } from '../.test-dist/signature-evidence.js';
import { vendorSignatureEvidence } from '../.test-dist/vendor-signatures.js';
import { buildSignatureBase, createWebBotAuthCache, ed25519JwkThumbprint, verifyWebBotAuth } from '../.test-dist/webbotauth.js';

const request = new Request('https://publication.example/');
test('all implementation failure codes have explicit semantics; unknown codes and mixed outcomes abstain', () => {
  for (const file of ['webbotauth.ts', 'index.ts']) {
    const source = readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8');
    for (const [, reason] of source.matchAll(/reason: '([^']+)'/g)) assert.ok(Object.hasOwn(FAILURE_OUTCOMES, reason), reason);
  }
  for (const [reason, expected] of Object.entries(FAILURE_OUTCOMES)) assert.equal(verificationOutcome({ status: 'unverified', reason }), expected);
  assert.equal(verificationOutcome({ status: 'unverified', reason: 'future-private-error' }), 'indeterminate');
  assert.equal(verificationOutcome({ status: 'unverified', reason: 'signature-invalid', reasons: ['directory-unavailable'] }), 'indeterminate');
  assert.equal(verificationOutcome({ status: 'unverified', reason: 'signature-invalid', reasons: ['missing-signature'] }), 'invalid');
  assert.equal(verificationOutcome({ status: 'verified', agent: 'https://fixture.example' }), 'verified');
  assert.equal(verificationOutcome({ status: 'absent' }), 'absent');
  assert.equal(verificationOutcome({ status: 'unverified', reason: 'signature-invalid' }, true), 'test-injected');
});

test('closed reason evidence cannot retain injected free text; complete failure sets stay within JSON budget', () => {
  const evidence = verificationEvidence(request, { status: 'unverified', reason: 'private-canary'.repeat(4000), reasons: [...Object.keys(FAILURE_OUTCOMES), 'other-private-canary'] });
  assert.equal(evidence.localReason, 'unrecognized-verifier-reason');
  assert.equal(evidence.localOutcome, 'indeterminate');
  assert.equal(JSON.stringify(evidence).includes('private-canary'), false);
  assert.ok(Buffer.byteLength(JSON.stringify(evidence)) <= 2048);
});

test('documented Exa methods do not grant trust to arbitrary keys, unmapped declarations or injected verdicts', () => {
  const verified = { status: 'verified', agent: 'https://crawler.exa.ai' };
  const matching = vendorSignatureEvidence(['ExaUser', 'ExaSearchBot', 'GPTBot'], verified);
  assert.equal(matching.status, 'matching-origin');
  assert.equal(matching.documentedDeclarationCount, 2); assert.equal(matching.unmappedDeclarationCount, 1);
  assert.equal(matching.userAgentCovered, null);
  for (const agent of ['https://crawler.exa.ai.evil.example', 'https://ahrefs.com', 'https://private-canary.example']) {
    const result = vendorSignatureEvidence(['ExaUser'], { status: 'verified', agent });
    assert.equal(result.status, 'different-origin'); assert.equal(JSON.stringify(result).includes(agent), false);
  }
  assert.equal(vendorSignatureEvidence(['AhrefsBot'], verified).status, 'not-configured');
  assert.equal(vendorSignatureEvidence([], verified).status, 'no-declaration');
  assert.equal(vendorSignatureEvidence(['ExaUser'], { status: 'absent' }).status, 'not-verified');
  assert.equal(vendorSignatureEvidence(['ExaUser'], verified, true).status, 'test-injected');
  assert.equal(vendorSignatureEvidence(['ExaUser'], { ...verified, evidence: { covered: { userAgent: true } } }).userAgentCovered, true);
});

test('real multiple-signature failures preserve all outcomes independent of label order; crypto runtime errors abstain', async () => {
  const now = new Date('2026-10-27T01:00:00Z'); const epoch = now.getTime() / 1000;
  const pair = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
  const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey); const kid = await ed25519JwkThumbprint(jwk);
  const headers = { 'Signature-Agent': '"https://fixture.example"', 'Signature-Input': `sig=("@authority" "signature-agent");created=${epoch};expires=${epoch + 300};keyid="${kid}";alg="ed25519";tag="web-bot-auth"` };
  const unsigned = new Request('https://publication.example/a', { headers });
  const signature = Buffer.from(await crypto.subtle.sign('Ed25519', pair.privateKey, new TextEncoder().encode(buildSignatureBase(unsigned, 'sig')))).toString('base64');
  const options = { now, cache: createWebBotAuthCache(), includeEvidence: true, fetcher: async () => Response.json({ keys: [jwk] }, { headers: { 'Content-Type': 'application/http-message-signatures-directory+json' } }) };
  const valid = await verifyWebBotAuth(new Request(unsigned, { headers: { ...headers, Signature: `sig=:${signature}:` } }), options);
  assert.equal(valid.status, 'verified');
  const unsupported = headers['Signature-Input'].replace(/^sig=/, 'other=').replace('alg="ed25519"', 'alg="rsa-pss-sha512"');
  for (const inputs of [headers['Signature-Input'] + ', ' + unsupported, unsupported + ', ' + headers['Signature-Input']]) {
    const result = await verifyWebBotAuth(new Request('https://tampered.example/a', { headers: { ...headers, 'Signature-Input': inputs, Signature: `sig=:${signature}:, other=:${signature}:` } }), options);
    assert.deepEqual(result.reasons, ['signature-invalid', 'unsupported-alg']);
    const evidence = verificationEvidence(request, result);
    assert.equal(evidence.localOutcome, 'indeterminate'); assert.deepEqual(evidence.localReasons, result.reasons);
  }
  const original = crypto.subtle.verify;
  try {
    crypto.subtle.verify = async () => { throw new Error('private-runtime-canary'); };
    const result = await verifyWebBotAuth(new Request(unsigned, { headers: { ...headers, Signature: `sig=:${signature}:` } }), options);
    assert.deepEqual(result, { status: 'unverified', reason: 'verification-error' });
    assert.equal(verificationOutcome(result), 'indeterminate');
  } finally { crypto.subtle.verify = original; }
});

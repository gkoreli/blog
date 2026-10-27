import assert from 'node:assert/strict';
import test from 'node:test';
import { signatureAsciiFixture } from './fixtures/signature-ascii.mjs';
import { buildSignatureBase, createWebBotAuthCache, verifyWebBotAuth } from '../.test-dist/webbotauth.js';
import { verificationEvidence } from '../.test-dist/signature-evidence.js';

test('unwrapped non-ASCII fields cannot be erased or UTF-8-signed into an accepted RFC base', async () => {
  const fixture = await signatureAsciiFixture();
  let fetches = 0;
  const options = { includeEvidence: true, cache: createWebBotAuthCache(), fetcher: async () => {
    fetches++;
    return Response.json({ keys: [fixture.jwk] }, { headers: { 'Content-Type': 'application/http-message-signatures-directory+json' } });
  } };
  const baseline = 'SyntheticClient/1.0';
  for (const received of [baseline, ' \t' + baseline + '\t ', 'SyntheticClient/1.0']) {
    const request = new Request('https://publication.example/article', { headers: await fixture.headers(baseline, received) });
    assert.equal((await verifyWebBotAuth(request, options)).status, 'verified');
  }
  assert.equal(fetches, 1);
  for (const value of ['\u00a0' + baseline, baseline + '\u00a0', '\u00a0' + baseline + '\u00a0', 'Synthetic\u00a0Client/1.0', '\u0080' + baseline, 'SyntheticCli\u00e9nt/1.0']) {
    // Both a mutation of an ASCII signature and valid crypto over raw UTF-8
    // must fail base construction. Raw UTF-8 is not an RFC 9421 ASCII base.
    for (const signed of [baseline, value]) {
      const request = new Request('https://publication.example/article', { headers: await fixture.headers(signed, value) });
      assert.equal(request.headers.get('User-Agent'), value);
      assert.equal(buildSignatureBase(request, 'sig'), null);
      const result = await verifyWebBotAuth(request, options);
      assert.deepEqual(result, { status: 'unverified', reason: 'non-ascii-signature-base' });
      const evidence = verificationEvidence(request, result);
      assert.equal(evidence.localOutcome, 'unsupported');
      assert.equal(evidence.coverage, null);
    }
  }
  assert.equal(fetches, 1, 'unsupported base must fail before directory discovery');
  const unsigned = await fixture.headers();
  unsigned['X-Uncovered'] = '\u00a0private-canary';
  const result = await verifyWebBotAuth(new Request('https://publication.example/article', { headers: unsigned }), options);
  assert.equal(result.status, 'verified');
  assert.equal(result.evidence.covered.userAgent, true);
  assert.equal(JSON.stringify(result).includes('private-canary'), false);
});

test('non-HTTP whitespace cannot repair malformed structured signer fields', async () => {
  const fixture = await signatureAsciiFixture();
  for (const form of ['sig="https://fixture.example";type=directory', '"https://fixture.example"', 'https://fixture.example']) {
    for (const value of ['\u00a0' + form, form + '\u00a0']) {
      const headers = await fixture.headers(); headers['Signature-Agent'] = value;
      let fetches = 0;
      const result = await verifyWebBotAuth(new Request('https://publication.example/article', { headers }), { fetcher: async () => { fetches++; throw Error('Unexpected lookup'); } });
      assert.deepEqual(result, { status: 'unverified', reason: 'malformed-signature-agent' });
      assert.equal(fetches, 0);
    }
  }
});

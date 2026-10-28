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

test('constructed ASCII control fields reject before discovery instead of gaining verified coverage', async () => {
  const fixture = await signatureAsciiFixture();
  for (const code of [1, 7, 8, 11, 12, 14, 31, 127]) {
    const value = 'Synthetic' + String.fromCharCode(code) + 'Client/1.0';
    const request = new Request('https://publication.example/article', { headers: await fixture.headers(value) });
    assert.equal(request.headers.get('User-Agent'), value);
    assert.equal(buildSignatureBase(request, 'sig'), null);
    let fetches = 0;
    const result = await verifyWebBotAuth(request, { fetcher: async () => { fetches++; throw Error('Unexpected lookup'); } });
    assert.deepEqual(result, { status: 'unverified', reason: 'malformed-field-component' });
    assert.equal(verificationEvidence(request, result).localOutcome, 'invalid');
    assert.equal(verificationEvidence(request, result).coverage, null);
    assert.equal(fetches, 0);
  }
});

test('programmatic non-HTTP or fragment-bearing targets cannot authenticate an HTTP request context', async () => {
  const fixture = await signatureAsciiFixture();
  for (const target of ['https://publication.example/a#part', 'https://publication.example/a#', 'http://publication.example/a?x=1#part', 'ftp://publication.example/a', 'data:text/plain,fixture']) {
    const request = new Request(target, { headers: await fixture.headers() });
    let fetches = 0;
    const result = await verifyWebBotAuth(request, { fetcher: async () => { fetches++; throw Error('Unexpected lookup'); } });
    assert.deepEqual(result, { status: 'unverified', reason: 'invalid-request-target' });
    assert.equal(buildSignatureBase(request, 'sig'), null);
    assert.equal(verificationEvidence(request, result).localOutcome, 'invalid');
    assert.equal(fetches, 0);
  }
  for (const target of ['https://publication.example/a%23part?q=%23value', 'http://publication.example/a']) {
    const result = await verifyWebBotAuth(new Request(target, { headers: await fixture.headers() }), {
      cache: createWebBotAuthCache(), fetcher: async () => Response.json({ keys: [fixture.jwk] }, { headers: { 'Content-Type': 'application/http-message-signatures-directory+json' } }),
    });
    assert.equal(result.status, 'verified');
  }
});

test('supported derived-component vectors preserve HTTP target and method semantics', () => {
  const vectors = [
    ['https://publication.example/a?x=1', 'GET', 'publication.example', '/a', '?x=1', 'https'],
    ['https://publication.example/a?', 'GET', 'publication.example', '/a', '?', 'https'],
    ['https://publication.example/a', 'GET', 'publication.example', '/a', '?', 'https'],
    ['https://publication.example/a%2Fb/%7e?q=%2F&z=two+words', 'GET', 'publication.example', '/a%2Fb/%7e', '?q=%2F&z=two+words', 'https'],
    ['https://PUBLICATION.example:443/a', 'GET', 'publication.example', '/a', '?', 'https'],
    ['https://[2001:db8::1]:8443/a?x=y', 'GET', '[2001:db8::1]:8443', '/a', '?x=y', 'https'],
    ['https://publication.example/a', 'CuStOm', 'publication.example', '/a', '?', 'https'],
  ];
  const parameters = '("@authority" "@method" "@path" "@query" "@scheme");created=1;keyid="fixture"';
  for (const [url, method, authority, path, query, scheme] of vectors) {
    const request = new Request(url, { method, headers: { 'Signature-Input': 'sig=' + parameters } });
    assert.equal(buildSignatureBase(request, 'sig'), [
      '"@authority": ' + authority, '"@method": ' + method, '"@path": ' + path,
      '"@query": ' + query, '"@scheme": ' + scheme, '"@signature-params": ' + parameters,
    ].join('\n'));
  }
});

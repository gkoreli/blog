import assert from 'node:assert/strict';
import { createWebBotAuthCache, ed25519JwkThumbprint, verifyWebBotAuth } from '../../.test-dist/webbotauth.js';
import { vendorSignatureEvidence } from '../../.test-dist/vendor-signatures.js';

/** Independent signing bytes; all discovery intercepted, never a vendor key. */
export async function attributionExperiment() {
  const now = new Date('2026-10-27T19:00:00Z'), epoch = now.getTime() / 1000;
  const pair = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
  const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
  const kid = await ed25519JwkThumbprint(jwk);
  let directoryFetches = 0;
  const options = { now, includeEvidence: true, cache: createWebBotAuthCache(), fetcher: async url => {
    assert.equal(String(url), 'https://fixture.example/.well-known/http-message-signatures-directory');
    directoryFetches++;
    return Response.json({ keys: [jwk] }, { headers: { 'Content-Type': 'application/http-message-signatures-directory+json' } });
  } };
  async function signed(bound = false, body = null) {
    const digest = body === null ? null : 'sha-256=:' + Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body))).toString('base64') + ':';
    const components = ['"@authority"', ...(bound ? ['"user-agent"', '"@path"'] : []), ...(body === null ? [] : ['"@method"', '"content-digest"']), '"signature-agent";key="agent2"'];
    const values = { '"@authority"': 'publication.example', '"user-agent"': 'ExaSearchBot/1.0', '"@path"': '/a', '"@method"': 'POST', '"content-digest"': digest, '"signature-agent";key="agent2"': '"https://fixture.example"' };
    const params = `(${components.join(' ')});created=${epoch};expires=${epoch + 60};nonce="synthetic-fixed-nonce";keyid="${kid}";alg="ed25519";tag="web-bot-auth"`;
    const base = [...components.map(component => `${component}: ${values[component]}`), `"@signature-params": ${params}`].join('\n');
    const bytes = await crypto.subtle.sign('Ed25519', pair.privateKey, new TextEncoder().encode(base));
    assert.equal(await crypto.subtle.verify('Ed25519', pair.publicKey, bytes, new TextEncoder().encode(base)), true);
    return new Request('https://publication.example/a', { method: body === null ? 'GET' : 'POST', body, headers: { 'User-Agent': 'ExaSearchBot/1.0', ...(digest === null ? {} : { 'Content-Digest': digest }),
      'Signature-Agent': 'agent2="https://fixture.example"', 'Signature-Input': `sig2=${params}`,
      Signature: `sig2=:${Buffer.from(bytes).toString('base64')}:` } });
  }
  const minimal = await signed(), bound = await signed(true), digestBound = await signed(false, 'original fixture body');
  const change = (request, updates = {}, url = request.url) => {
    const headers = new Headers(request.headers);
    for (const [name, value] of Object.entries(updates)) headers.set(name, value);
    return new Request(url, { headers });
  };
  const cases = [
    ['minimal-selected-member', minimal, options, 'verified'],
    ['bound-role-and-path-positive', bound, options, 'verified'],
    ['unsigned-role-and-path-change', change(minimal, { 'User-Agent': 'ExaUser/1.0' }, 'https://publication.example/b'), options, 'verified'],
    ['unsigned-exa-member-injection', change(minimal, { 'Signature-Agent': 'agent2="https://fixture.example", exa="https://crawler.exa.ai"' }), options, 'verified'],
    ['outer-label-renamed', change(minimal, { 'Signature-Input': minimal.headers.get('Signature-Input').replace(/^sig2=/, 'renamed='), Signature: minimal.headers.get('Signature').replace(/^sig2=/, 'renamed=') }), options, 'verified'],
    ['same-nonce-repeat', minimal, options, 'verified'],
    ['digest-header-positive', digestBound, options, 'verified'],
    ['body-changed-digest-header-unchanged', new Request(digestBound.url, { method: 'POST', headers: digestBound.headers, body: 'changed fixture body' }), options, 'verified'],
    ['covered-role-change', change(bound, { 'User-Agent': 'ExaUser/1.0' }), options, 'unverified'],
    ['covered-path-change', change(bound, {}, 'https://publication.example/b'), options, 'unverified'],
    ['covered-authority-change', change(minimal, {}, 'https://other.example/a'), options, 'unverified'],
    ['expired-beyond-skew', minimal, { ...options, now: new Date(now.getTime() + 121000) }, 'unverified'],
  ];
  const trials = [];
  for (const [label, request, config, expected] of cases) {
    const verdict = await verifyWebBotAuth(request, config);
    assert.equal(verdict.status, expected, `${label}: ${verdict.reason ?? verdict.status}`);
    if (expected === 'verified') {
      assert.equal(verdict.agent, 'https://fixture.example');
      assert.equal(verdict.evidence.covered.userAgent, label === 'bound-role-and-path-positive');
      assert.equal(verdict.evidence.replayPolicy, 'expiry-only');
    } else assert.equal(verdict.reason, label === 'expired-beyond-skew' ? 'expired' : 'signature-invalid');
    const declared = request.headers.get('User-Agent').startsWith('ExaUser/') ? 'ExaUser' : 'ExaSearchBot';
    const vendor = vendorSignatureEvidence([declared], verdict);
    assert.equal(vendor.status, expected === 'verified' ? 'different-origin' : 'not-verified');
    trials.push({ label, status: verdict.status, reason: verdict.reason ?? null,
      authenticatedFixtureOrigin: verdict.status === 'verified', declaredClient: declared,
      documentedVendorOrigin: vendor.status, userAgentCovered: verdict.evidence?.covered.userAgent ?? null,
      contentDigestHeaderCovered: verdict.evidence?.covered.contentDigest ?? null,
      replayPolicy: verdict.evidence?.replayPolicy ?? null });
  }
  assert.equal(directoryFetches, 1);
  return { trials, interceptedDirectoryFetches: directoryFetches, networkCalls: 0, productionCalls: 0 };
}

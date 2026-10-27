import assert from 'node:assert/strict';
import test from 'node:test';
import { KNOWN_TEST_KEYS, PUBLIC_KEY_POLICY_VERSION, knownTestKeyId, knownTestPublicKey } from '../.test-dist/known-test-keys.js';
import { buildSignatureBase, createWebBotAuthCache, ed25519JwkThumbprint, verifyWebBotAuth } from '../.test-dist/webbotauth.js';
import { verificationEvidence } from '../.test-dist/signature-evidence.js';

const now = new Date('2026-10-27T20:00:00Z'), epoch = now.getTime() / 1000;
function request(keyid, form = 'dictionary') {
  return new Request('https://publication.example/article', { headers: {
    'Signature-Agent': form === 'dictionary' ? 'sig="https://fixture.example";type=directory' : '"https://fixture.example"',
    'Signature-Input': `sig=("@authority" "signature-agent"${form === 'dictionary' ? ';key="sig"' : ''});created=${epoch};expires=${epoch + 60};keyid="${keyid}";tag="web-bot-auth"`,
    Signature: `sig=:${Buffer.alloc(64).toString('base64')}:`,
  } });
}
function directory(keys) { return Response.json({ keys }, { headers: { 'Content-Type': 'application/http-message-signatures-directory+json' } }); }

test('reviewed public example key thumbprints match, and material matching survives encoding aliases', async () => {
  assert.equal(KNOWN_TEST_KEYS.length, 2);
  for (const known of KNOWN_TEST_KEYS) {
    const jwk = { kty: 'OKP', crv: 'Ed25519', x: known.x };
    assert.equal(await ed25519JwkThumbprint(jwk), known.id);
    assert.equal(knownTestKeyId(known.id), true);
    for (const x of [known.x, known.x + '=', known.x.replace(/-/g, '+').replace(/_/g, '/') + '=']) {
      const value = { ...jwk, x };
      assert.equal(knownTestPublicKey(value), true);
      // Native import accepts these encodings as the same physical key.
      assert.equal((await crypto.subtle.importKey('jwk', value, 'Ed25519', false, ['verify'])).algorithm.name, 'Ed25519');
    }
  }
  assert.equal(knownTestKeyId('unknown'), false);
  assert.equal(knownTestPublicKey({ kty: 'OKP', crv: 'Ed25519', x: 'not a key' }), false);
});

test('known thumbprints reject before discovery in both supported wire forms, without fabricating coverage or vendor identity', async () => {
  for (const known of KNOWN_TEST_KEYS) for (const form of ['dictionary', 'quoted-string']) {
    let fetches = 0;
    const input = request(known.id, form);
    const result = await verifyWebBotAuth(input, { now, cache: createWebBotAuthCache(), fetcher: async () => { fetches++; throw Error('must not fetch'); } });
    assert.deepEqual(result, { status: 'unverified', reason: 'known-test-key' });
    assert.equal(fetches, 0);
    const evidence = verificationEvidence(input, result, false, ['ExaSearchBot']);
    assert.equal(evidence.localOutcome, 'policy-rejected'); assert.equal(evidence.coverage, null);
    assert.equal(evidence.vendor.status, 'not-verified'); assert.equal(evidence.vendor.userAgentCovered, null);
  }
});

test('changed x encodings cannot bypass the policy or populate imported keys; old-policy cache entries are rechecked', async () => {
  for (const known of KNOWN_TEST_KEYS) {
    const jwk = { kty: 'OKP', crv: 'Ed25519', x: known.x + '=' };
    const keyid = await ed25519JwkThumbprint(jwk); assert.notEqual(keyid, known.id);
    const cache = createWebBotAuthCache();
    cache.keys.set('https://fixture.example/.well-known/http-message-signatures-directory\n' + keyid, {
      key: await crypto.subtle.importKey('jwk', jwk, 'Ed25519', false, ['verify']), expiresAt: now.getTime() + 60000, keyPolicy: 'old-policy',
    });
    let fetches = 0;
    const options = { now, cache, fetcher: async () => { fetches++; return directory([jwk]); } };
    for (let i = 0; i < 2; i++) assert.deepEqual(await verifyWebBotAuth(request(keyid), options), { status: 'unverified', reason: 'known-test-key' });
    assert.equal(fetches, 1); assert.equal(cache.keys.size, 0);
  }
});

test('a mixed directory still verifies the independently selected genuine key and caches its reviewed policy', async () => {
  const pair = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
  const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey), kid = await ed25519JwkThumbprint(jwk);
  const input = request(kid), headers = new Headers(input.headers);
  const signature = await crypto.subtle.sign('Ed25519', pair.privateKey, new TextEncoder().encode(buildSignatureBase(input, 'sig')));
  headers.set('Signature', `sig=:${Buffer.from(signature).toString('base64')}:`);
  const signed = new Request(input, { headers });
  const cache = createWebBotAuthCache(); let fetches = 0;
  const options = { now, cache, fetcher: async () => { fetches++; return directory([...KNOWN_TEST_KEYS.map(k => ({ kty: 'OKP', crv: 'Ed25519', x: k.x })), jwk]); } };
  assert.deepEqual(await verifyWebBotAuth(signed, options), { status: 'verified', agent: 'https://fixture.example' });
  assert.equal((await verifyWebBotAuth(signed, options)).status, 'verified'); assert.equal(fetches, 1);
  assert.equal(cache.keys.size, 1); assert.equal([...cache.keys.values()][0].keyPolicy, PUBLIC_KEY_POLICY_VERSION);
});

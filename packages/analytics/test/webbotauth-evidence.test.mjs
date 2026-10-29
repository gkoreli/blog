import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSignatureBase, createWebBotAuthCache, ed25519JwkThumbprint, verifyWebBotAuth } from '../.test-dist/webbotauth.js';
import { verificationEvidence } from '../.test-dist/signature-evidence.js';

const now = new Date('2026-10-27T01:00:00Z');
const epoch = Math.floor(now.getTime() / 1000);
async function signer() {
  const pair = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
  const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
  const kid = await ed25519JwkThumbprint(jwk);
  return { jwk: { ...jwk, kid }, async request(components = '"@authority" "signature-agent";key="sig"', lifetime = 300) {
    const headers = { 'User-Agent': 'SyntheticClient/1.0', 'Signature-Agent': 'sig="https://fixture.example";type=directory',
      'Signature-Input': `sig=(${components});created=${epoch};expires=${epoch + lifetime};keyid="${kid}";alg="ed25519";tag="web-bot-auth"` };
    const request = new Request('https://publication.example/a?x=1', { headers });
    const base = buildSignatureBase(request, 'sig'); assert.notEqual(base, null);
    headers.Signature = `sig=:${Buffer.from(await crypto.subtle.sign('Ed25519', pair.privateKey, new TextEncoder().encode(base))).toString('base64')}:`;
    return new Request(request, { headers });
  } };
}
function directory(keys, cache = 'max-age=300', extras = {}) {
  return Response.json({ keys }, { headers: { 'Content-Type': 'application/http-message-signatures-directory+json', 'Cache-Control': cache, ...extras } });
}
function altered(request, url, changes = {}) { return new Request(url ?? request.url, { headers: { ...Object.fromEntries(request.headers), ...changes } }); }

test('verified evidence records actual signed fields; unsigned UA/path changes remain outside that proof', async () => {
  const key = await signer(); const request = await key.request();
  const options = { now, includeEvidence: true, cache: createWebBotAuthCache(), fetcher: async () => directory([key.jwk]) };
  const original = await verifyWebBotAuth(request, options);
  assert.equal(original.status, 'verified');
  assert.deepEqual(original.evidence, { version: '2026-10-28.1', selection: { policy: 'first-valid-in-input-order', matchedCandidates: 1, taggedCandidates: 1, attemptedCandidates: 1, unassessedCandidates: 0 }, headerForm: 'dictionary',
    covered: { authority: true, targetUri: false, method: false, path: false, query: false, userAgent: false, contentDigest: false },
    otherComponentCount: 0, validitySeconds: 300, ageSeconds: 0, replayPolicy: 'expiry-only' });
  assert.equal((await verifyWebBotAuth(altered(request, 'https://publication.example/b', { 'User-Agent': 'AnotherClaim/1.0' }), options)).status, 'verified');
  assert.equal((await verifyWebBotAuth(altered(request, 'https://other.example/a?x=1'), options)).status, 'unverified');
  const bound = await key.request('"@authority" "@method" "@path" "user-agent" "signature-agent";key="sig"');
  const verified = await verifyWebBotAuth(bound, options);
  assert.equal(verified.evidence.covered.userAgent, true); assert.equal(verified.evidence.covered.path, true); assert.equal(verified.evidence.covered.method, true);
  assert.equal((await verifyWebBotAuth(altered(bound, null, { 'User-Agent': 'Changed' }), options)).status, 'unverified');
  assert.equal((await verifyWebBotAuth(altered(bound, 'https://publication.example/b?x=1'), options)).status, 'unverified');
});

test('publisher max-age and Age bound both directory and imported-key reuse', async () => {
  const key = await signer(); const request = await key.request(); let fetches = 0;
  const options = { now, cache: createWebBotAuthCache(), fetcher: async () => { fetches++; return directory([key.jwk], 'max-age=300', { Age: '100' }); } };
  assert.equal((await verifyWebBotAuth(request, options)).status, 'verified');
  assert.equal((await verifyWebBotAuth(request, { ...options, now: new Date(now.getTime() + 199000) })).status, 'verified');
  assert.equal(fetches, 1);
  assert.equal((await verifyWebBotAuth(request, { ...options, now: new Date(now.getTime() + 201000) })).status, 'verified');
  assert.equal(fetches, 2);
});

test('no-store directories do not leave reusable directory or imported-key entries', async () => {
  const key = await signer(); const request = await key.request(); let fetches = 0;
  const options = { now, cache: createWebBotAuthCache(), fetcher: async () => { fetches++; return directory([key.jwk], 'no-store'); } };
  await verifyWebBotAuth(request, options); await verifyWebBotAuth(request, options);
  assert.equal(fetches, 2);
});

test('unknown-key rotation refreshes once, evicts removed imported keys and bounds repeated key misses', async () => {
  const first = await signer(), second = await signer(), unknown = await signer(); let fetches = 0;
  const options = { now, cache: createWebBotAuthCache(), fetcher: async () => { fetches++; return directory([fetches === 1 ? first.jwk : second.jwk]); } };
  assert.equal((await verifyWebBotAuth(await first.request(), options)).status, 'verified');
  assert.equal((await verifyWebBotAuth(await second.request(), options)).status, 'verified');
  assert.equal(fetches, 2);
  assert.deepEqual(await verifyWebBotAuth(await first.request(), options), { status: 'unverified', reason: 'key-not-found' });
  assert.deepEqual(await verifyWebBotAuth(await unknown.request(), options), { status: 'unverified', reason: 'key-not-found' });
  assert.equal(fetches, 2);
});

test('directory key activation and expiry are enforced, including imported-key expiry', async () => {
  const key = await signer(); const request = await key.request();
  const options = { now, cache: createWebBotAuthCache(), fetcher: async () => directory([{ ...key.jwk, nbf: epoch + 10, exp: epoch + 20 }]) };
  assert.deepEqual(await verifyWebBotAuth(request, options), { status: 'unverified', reason: 'key-not-yet-valid' });
  assert.equal((await verifyWebBotAuth(request, { ...options, now: new Date(now.getTime() + 11000) })).status, 'verified');
  assert.deepEqual(await verifyWebBotAuth(request, { ...options, now: new Date(now.getTime() + 21000) }), { status: 'unverified', reason: 'key-expired' });
});

test('wrong media type, redirect and oversized directory bodies fail without granting identity', async () => {
  const key = await signer(); const request = await key.request();
  for (const [response,reason] of [[Response.json({ keys: [key.jwk] }),'dir-media-type'], [new Response(null, { status: 302, headers: { Location: 'https://other.example' } }),'dir-http-status'], [new Response('x'.repeat(65537), { headers: { 'Content-Type': 'application/http-message-signatures-directory+json' } }),'dir-body-limit']]) {
    const verdict = await verifyWebBotAuth(request, { now, cache: createWebBotAuthCache(), fetcher: async (url, init) => { assert.equal(init.redirect, 'manual'); return response; } });
    assert.deepEqual(verdict, { status: 'unverified', reason });
  }
});

test('production lifetime policy rejects oversized signature windows before key discovery', async () => {
  const key = await signer(); let fetches = 0;
  const result = await verifyWebBotAuth(await key.request(undefined, 86401), { now, maxAgeSeconds: 86400, fetcher: async () => { fetches++; return directory([key.jwk]); } });
  assert.deepEqual(result, { status: 'unverified', reason: 'validity-policy-exceeded' }); assert.equal(fetches, 0);
});

test('directory concurrency is bounded while an existing origin shares its pending lookup', async () => {
  const key = await signer(); const request = await key.request(); const cache = createWebBotAuthCache();
  for (let i = 0; i < 64; i++) cache.pendingDirectories.set(`https://pending-${i}.example/.well-known/http-message-signatures-directory`, Promise.resolve({reason:'dir-fetch-failed'}));
  let fetches = 0;
  const options = { now, cache, fetcher: async () => { fetches++; return directory([key.jwk]); } };
  assert.deepEqual(await verifyWebBotAuth(request, options), { status: 'unverified', reason: 'dir-concurrency-limit' });
  assert.equal(fetches, 0);
  cache.pendingDirectories.set('https://fixture.example/.well-known/http-message-signatures-directory', Promise.resolve({directory:{ keys: [{ jwk: key.jwk, notBefore: null, expires: null }], expiresAt: now.getTime() + 300000 }}));
  assert.equal((await verifyWebBotAuth(request, options)).status, 'verified');
  assert.equal(fetches, 0);
});

test('native unavailability stays null, false stays false, and injected verdicts do not claim cryptographic coverage', () => {
  const request = new Request('https://publication.example');
  assert.deepEqual(verificationEvidence(request, { status: 'absent' }).native, { verifiedBot: null, signedAgent: null, category: { version: '2026-10-27.1', status: 'unavailable', value: null } });
  Object.defineProperty(request, 'cf', { value: { botManagement: { verifiedBot: false, signedAgent: true, secret: 'private-native-canary' } } });
  const evidence = verificationEvidence(request, { status: 'verified', agent: 'https://private-origin.example' }, true);
  assert.deepEqual(evidence.native, { verifiedBot: false, signedAgent: true, category: { version: '2026-10-27.1', status: 'unavailable', value: null } });
  assert.equal(evidence.source, 'test-injected'); assert.equal(evidence.coverage, null); assert.equal(evidence.verifierProfile, null);
  assert.equal(JSON.stringify(evidence).includes('private-'), false);
});

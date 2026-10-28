import assert from 'node:assert/strict';
import test from 'node:test';
import { signatureSelectionFixture } from './fixtures/signature-selection.mjs';
import { keyMetadataCases, keyMetadataMatrix } from './fixtures/key-metadata.mjs';
import { verifyWebBotAuth, createWebBotAuthCache, ed25519JwkThumbprint } from '../.test-dist/webbotauth.js';
import { verificationEvidence, verificationOutcome } from '../.test-dist/signature-evidence.js';
import { PUBLIC_KEY_POLICY_VERSION } from '../.test-dist/known-test-keys.js';

const request = fixture => new Request('https://publication.example/a', { headers: fixture.cases[0].headers });
const response = keys => Response.json({ keys }, { headers: { 'Content-Type': 'application/http-message-signatures-directory+json' } });
const material = key => ({ kty: key.kty, crv: key.crv, x: key.x });

test('published key constraints survive normalization; malformed or conflicting metadata cannot verify', async () => {
  const fixture = await signatureSelectionFixture();
  const rows = await keyMetadataMatrix(fixture, verifyWebBotAuth, createWebBotAuthCache);
  assert.equal(rows.length, 16);
  for (const row of rows) {
    assert.equal(row.local.status === 'verified', row.applicationPolicyAccepts, row.name);
    assert.equal(row.local.reason, row.applicationPolicyAccepts ? null : row.name.startsWith('conflicting-key') ? 'key-metadata-conflict' : 'key-metadata-rejected');
    if (!row.applicationPolicyAccepts) {
      const result = { status: 'unverified', reason: row.local.reason };
      assert.equal(verificationOutcome(result), 'policy-rejected');
      const evidence = verificationEvidence(request(fixture), result, false, ['ExaSearchBot']);
      assert.equal(evidence.vendor.status, 'not-verified'); assert.equal(evidence.coverage, null);
    }
  }
  assert.equal(JSON.stringify(rows).includes('metadata-canary'), false);
});

test('RFC 7638 key identity remains independent of optional permission metadata', async () => {
  const fixture = await signatureSelectionFixture(), key = material(Object.values(fixture.directories)[0].keys[0]);
  const expected = await ed25519JwkThumbprint(key); assert.ok(expected);
  for (const trial of keyMetadataCases()) assert.equal(await ed25519JwkThumbprint({ ...key, ...trial.patch }), expected, trial.name);
  assert.equal(await ed25519JwkThumbprint({ ...key, crv: 'X25519' }), null);
});

test('old imported-key and directory cache policies cannot bypass new metadata admission', async () => {
  const fixture = await signatureSelectionFixture(), key = material(Object.values(fixture.directories)[0].keys[0]);
  const url = Object.keys(fixture.directories)[0], id = await ed25519JwkThumbprint(key), cache = createWebBotAuthCache();
  const expiresAt = new Date(fixture.now).getTime() + 60000;
  cache.keys.set(url + '\n' + id, { key: await crypto.subtle.importKey('jwk', key, 'Ed25519', false, ['verify']), expiresAt, keyPolicy: '2026-10-27.1' });
  cache.directories.set(url, { expiresAt, keyPolicy: '2026-10-27.1', keys: [{ jwk: key, notBefore: null, expires: null }] });
  let fetches = 0;
  const options = { now: fixture.now, cache, fetcher: async () => { fetches++; return response([{ ...key, alg: 'RS256' }]); } };
  for (let i = 0; i < 2; i++) assert.deepEqual(await verifyWebBotAuth(request(fixture), options), { status: 'unverified', reason: 'key-metadata-rejected' });
  assert.equal(fetches, 1); assert.equal(cache.keys.size, 0); assert.equal(cache.directories.get(url).keyPolicy, PUBLIC_KEY_POLICY_VERSION);
  const stale = createWebBotAuthCache();
  stale.directories.set(url, { expiresAt, keyPolicy: '2026-10-27.1', keys: [] });
  let missingFetches = 0;
  const missing = await verifyWebBotAuth(request(fixture), { now: fixture.now, cache: stale, fetcher: async () => { missingFetches++; return response([]); } });
  assert.equal(missing.reason, 'key-not-found'); assert.equal(missingFetches, 1, 'an old-policy directory is not a fresh rotation cache');
});

test('accepted aliases retain constraints; an unrelated rejected key does not poison the selected identity', async () => {
  const fixture = await signatureSelectionFixture(), keys = Object.values(fixture.directories).map(d => material(d.keys[0])), cache = createWebBotAuthCache();
  const key = { ...keys[0], alg: 'Ed25519', use: 'sig', key_ops: ['verify'], ext: false };
  const result = await verifyWebBotAuth(request(fixture), { now: fixture.now, cache, fetcher: async () => response([
    { ...keys[1], alg: 'RS256' }, key, { ...key, alg: 'EdDSA' },
  ]) });
  assert.equal(result.status, 'verified'); assert.equal(cache.keys.size, 1);
  const stored = [...cache.directories.values()][0].keys[1].jwk;
  assert.equal(stored.alg, 'EdDSA'); assert.equal(stored.use, 'sig'); assert.equal(stored.ext, false); assert.deepEqual(stored.key_ops, ['verify']);
  const imported = [...cache.keys.values()][0]; assert.equal(imported.keyPolicy, PUBLIC_KEY_POLICY_VERSION);
  assert.equal(imported.key.extractable, false); assert.deepEqual(imported.key.usages, ['verify']);
});

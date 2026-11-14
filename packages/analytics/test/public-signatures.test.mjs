import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { publicSignatureFixture, runPublicSignatures } from './fixtures/public-signatures.mjs';
import * as requestApi from '../.test-dist/webbotauth.js';
import { auditDirectoryResponse } from '../.test-dist/directory-response-audit.js';
import { publicKeyThumbprint, importPublicVerificationKey, verifyPublicSignature, directoryKey } from '../.test-dist/http-signature-key.js';
import { knownTestKeyId, knownTestPublicKey } from '../.test-dist/known-test-keys.js';

const fixture = publicSignatureFixture();

test('all five public-key algorithms verify independent signed requests and directory proofs, with tamper/salt/encoding negatives', async () => {
  const rows = await runPublicSignatures(fixture, { ...requestApi, auditDirectoryResponse });
  assert.equal(rows.length, 5);
  for (const row of rows) {
    assert.equal(row.valid.status, 'verified', row.algorithm);
    assert.equal(row.valid.evidence.algorithm, row.algorithm);
    assert.equal(row.dictionary.status, 'verified', row.algorithm);
    assert.equal(row.dictionary.evidence.headerForm, 'dictionary');
    assert.equal(row.implicit.status, 'verified', row.algorithm);
    assert.equal(row.implicit.evidence.algorithm, row.algorithm);
    assert.equal(row.incompatible.status, 'unverified', row.algorithm);
    assert.equal(row.incompatible.reason, 'key-metadata-rejected', row.algorithm);
    assert.equal(row.tampered, 'unverified');
    assert.equal(row.proof.profiles.ietfProtocol01DomainBinding.verifiedKeys, 1, row.algorithm);
    assert.equal(row.proof.profiles.ietfProtocol01DomainBinding.allAdmittedKeysVerified, true);
    assert.ok(row.alternatives.every(value => value === 'unverified'));
  }
});

test('published RFC 9421 signatures verify at the primitive boundary; their public demonstration keys stay inadmissible for attribution', async () => {
  const data = JSON.parse(readFileSync(new URL('fixtures/rfc9421-public-vectors.json', import.meta.url)));
  for (const row of data.vectors) {
    assert.equal(await publicKeyThumbprint(row.jwk), row.thumbprint);
    const key = await importPublicVerificationKey(row.jwk, row.algorithm);
    assert.ok(!('reason' in key), row.section);
    assert.equal(await verifyPublicSignature(key, Buffer.from(row.signature, 'base64'), new TextEncoder().encode(row.base)), true, row.section);
    assert.equal(knownTestKeyId(row.thumbprint), true);
    assert.equal(knownTestPublicKey(row.jwk), true);
  }
});

test('key metadata and requested algorithms can only narrow a compatible public key', async () => {
  const rsa = fixture.cases.find(row => row.algorithm === 'rsa-pss-sha512');
  const ed = fixture.cases[0];
  assert.equal((await importPublicVerificationKey(ed.jwk, 'rsa-pss-sha512')).reason, 'key-algorithm-mismatch');
  assert.equal((await importPublicVerificationKey({ ...rsa.jwk, alg: 'PS512' }, 'rsa-v1_5-sha256')).reason, 'key-algorithm-mismatch');
  assert.equal((await importPublicVerificationKey({ ...rsa.jwk, n: rsa.jwk.n.slice(0, 100) }, 'rsa-pss-sha512')).reason, 'key-invalid');
  for (const row of fixture.cases) {
    for (const patch of [{ d: '' }, { use: 'enc' }, { key_ops: ['sign'] }, { alg: 'HS256' }]) {
      assert.equal(directoryKey({ ...row.jwk, ...patch }).metadataRejected, true, row.algorithm);
      assert.equal(await publicKeyThumbprint({ ...row.jwk, ...patch }), row.kid);
    }
  }
});

test('RSA policy measures actual modulus bits rather than rejecting valid non-byte-aligned keys', async () => {
  const row = fixture.oddModulus;
  const key = await importPublicVerificationKey(row.jwk, row.algorithm);
  assert.ok(!('reason' in key));
  assert.equal(await verifyPublicSignature(key, Buffer.from(row.signature, 'base64'), new TextEncoder().encode(row.base)), true);
});

test('one RSA identity cannot confuse cached key algorithms or contradictory duplicate permissions', async () => {
  const rsa = fixture.cases.filter(row => row.algorithm.startsWith('rsa-'));
  const cache = requestApi.createWebBotAuthCache();
  const run = (row, keys = [row.jwk]) => requestApi.verifyWebBotAuth(new Request(row.request.url, { headers: row.request.headers }), {
    cache, now: new Date(fixture.now), fetcher: async () => Response.json({ keys }, { headers: {
      'Content-Type': 'application/http-message-signatures-directory+json', 'Cache-Control': 'max-age=300',
    } }),
  });
  for (const row of [rsa[0], rsa[1], rsa[0], rsa[1]]) assert.equal((await run(row)).status, 'verified');
  assert.equal(cache.keys.size, 2);
  const duplicate = await requestApi.verifyWebBotAuth(new Request(rsa[0].request.url, { headers: rsa[0].request.headers }), {
    now: new Date(fixture.now), cache: requestApi.createWebBotAuthCache(), fetcher: async () => Response.json({ keys: [
      { ...rsa[0].jwk, alg: 'PS512' }, { ...rsa[0].jwk, alg: 'RS256' },
    ] }, { headers: { 'Content-Type': 'application/http-message-signatures-directory+json' } }),
  });
  assert.equal(duplicate.reason, 'key-metadata-conflict');
});

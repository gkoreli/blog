import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildSignatureBase,
  createWebBotAuthCache,
  ed25519JwkThumbprint,
  parseSignatureAgentHeader,
  verifyWebBotAuth,
} from '../.test-dist/webbotauth.js';

const DRAFT_PUBLIC_KEY = {
  kty: 'OKP',
  crv: 'Ed25519',
  x: 'JrQLj5P_89iXES9-vFgrIy29clF9CC_oPPsw3c5D0bs',
  use: 'sig',
};
const DRAFT_KEY_ID = 'poqkLGiymh_W0uP6PZFw-dvez3QJT5SolqXBCW38r0U';
const EMPTY_SIGNATURE = Buffer.alloc(64).toString('base64');

function jsonDirectory() {
  return new Response(JSON.stringify({ keys: [DRAFT_PUBLIC_KEY] }), {
    status: 200,
    headers: { 'Content-Type': 'application/http-message-signatures-directory+json' },
  });
}

function draftRequest() {
  return new Request('https://example.com/', { headers: {
    'Signature-Agent': 'agent2="https://signature-agent.test"',
    'Signature-Input': 'sig2=("@authority" "signature-agent";key="agent2");created=1735689600;keyid="poqkLGiymh_W0uP6PZFw-dvez3QJT5SolqXBCW38r0U";alg="ed25519";expires=4889289600;nonce="n9p433xm+NJ3ph3upfBIGmsuwHw387YV7Q/F+6BSpGCVjYCqQw6rznNA8PVVLySrAWsv0hQtFioQb6E1YsauiA==";tag="web-bot-auth"',
    Signature: 'sig2=:RdNFx5Bj6au3YgAMQL/RzmUlZE8QZLIaXGRpw985hWnwPfMxT228NMk6ehRS1PSl4e8PhbNZACSanGdhEwYCCg==:',
  } });
}

test('Signature-Agent parser accepts dictionary members and the deprecated bare string', () => {
  assert.deepEqual(parseSignatureAgentHeader('sig="https://agent.example";type=directory'), [
    { key: 'sig', uri: 'https://agent.example', legacy: false },
  ]);
  assert.deepEqual(parseSignatureAgentHeader('"https://legacy.example"'), [
    { key: null, uri: 'https://legacy.example', legacy: true },
  ]);
  assert.equal(parseSignatureAgentHeader('sig=http://agent.example'), null);
});

test('signature-base construction matches RFC 9421 and Web Bot Auth draft vectors', () => {
  const rfcRequest = new Request('https://example.com/foo?param=Value&Pet=dog', {
    method: 'POST',
    headers: {
      Date: 'Tue, 20 Apr 2021 02:07:55 GMT',
      'Content-Type': 'application/json',
      'Content-Length': '18',
      'Signature-Input': 'sig1=("date" "@method" "@path" "@authority" "content-type" "content-length");created=1618884473;keyid="test-key-ed25519"',
    },
  });
  assert.equal(buildSignatureBase(rfcRequest, 'sig1'), [
    '"date": Tue, 20 Apr 2021 02:07:55 GMT',
    '"@method": POST',
    '"@path": /foo',
    '"@authority": example.com',
    '"content-type": application/json',
    '"content-length": 18',
    '"@signature-params": ("date" "@method" "@path" "@authority" "content-type" "content-length");created=1618884473;keyid="test-key-ed25519"',
  ].join('\n'));

  assert.equal(buildSignatureBase(draftRequest(), 'sig2'), [
    '"@authority": example.com',
    '"signature-agent";key="agent2": "https://signature-agent.test"',
    '"@signature-params": ("@authority" "signature-agent";key="agent2");created=1735689600;keyid="poqkLGiymh_W0uP6PZFw-dvez3QJT5SolqXBCW38r0U";alg="ed25519";expires=4889289600;nonce="n9p433xm+NJ3ph3upfBIGmsuwHw387YV7Q/F+6BSpGCVjYCqQw6rznNA8PVVLySrAWsv0hQtFioQb6E1YsauiA==";tag="web-bot-auth"',
  ].join('\n'));
});

test('Ed25519 JWK thumbprint matches RFC 8037 Appendix A.3', async () => {
  assert.equal(await ed25519JwkThumbprint({
    kty: 'OKP',
    crv: 'Ed25519',
    x: '11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo',
  }), 'kPrK_qmxVWaYVA9wwBF6Iuo3vVzz7TxHCTwXBygrS4k');
});

test('Web Bot Auth verifier accepts the draft Ed25519 test vector', async () => {
  const requested = [];
  const result = await verifyWebBotAuth(draftRequest(), {
    now: new Date('2026-09-03T00:00:00Z'),
    cache: createWebBotAuthCache(),
    async fetcher(url) {
      requested.push(String(url));
      return jsonDirectory();
    },
  });
  assert.deepEqual(result, { status: 'verified', agent: 'https://signature-agent.test' });
  assert.deepEqual(requested, [
    'https://signature-agent.test/.well-known/http-message-signatures-directory',
  ]);
});

test('Web Bot Auth verifier enforces expiry and future-created skew before discovery', async () => {
  let fetches = 0;
  const fetcher = async () => {
    fetches += 1;
    return jsonDirectory();
  };
  const headers = (created, expires) => ({
    'Signature-Agent': 'sig="https://agent.example"',
    'Signature-Input': `sig=("@authority" "signature-agent";key="sig");created=${created};expires=${expires};keyid="${DRAFT_KEY_ID}";alg="ed25519";tag="web-bot-auth"`,
    Signature: `sig=:${EMPTY_SIGNATURE}:`,
  });
  const now = new Date('2026-09-03T00:00:00Z');
  const nowSeconds = Math.floor(now.getTime() / 1_000);
  assert.deepEqual(await verifyWebBotAuth(new Request('https://example.com', {
    headers: headers(nowSeconds - 600, nowSeconds - 61),
  }), { now, fetcher }), { status: 'unverified', reason: 'expired' });
  assert.deepEqual(await verifyWebBotAuth(new Request('https://example.com', {
    headers: headers(nowSeconds + 61, nowSeconds + 600),
  }), { now, fetcher }), { status: 'unverified', reason: 'not-yet-valid' });
  assert.equal(fetches, 0);
});

test('Web Bot Auth cache isolates the same key by directory URL and key', async () => {
  const cache = createWebBotAuthCache();
  const fetches = new Map();
  const fetcher = async (url) => {
    const value = String(url);
    fetches.set(value, (fetches.get(value) ?? 0) + 1);
    return jsonDirectory();
  };
  const now = new Date('2026-09-03T00:00:00Z');
  const nowSeconds = Math.floor(now.getTime() / 1_000);
  const signed = agent => new Request('https://example.com', { headers: {
    'Signature-Agent': `sig="${agent}"`,
    'Signature-Input': `sig=("@authority" "signature-agent";key="sig");created=${nowSeconds};expires=${nowSeconds + 300};keyid="${DRAFT_KEY_ID}";alg="ed25519";tag="web-bot-auth"`,
    Signature: `sig=:${EMPTY_SIGNATURE}:`,
  } });

  assert.deepEqual(await verifyWebBotAuth(signed('https://one.example'), { now, cache, fetcher }), {
    status: 'unverified', reason: 'signature-invalid',
  });
  assert.deepEqual(await verifyWebBotAuth(signed('https://two.example'), { now, cache, fetcher }), {
    status: 'unverified', reason: 'signature-invalid',
  });
  await verifyWebBotAuth(signed('https://one.example'), { now, cache, fetcher });

  assert.deepEqual(Object.fromEntries(fetches), {
    'https://one.example/.well-known/http-message-signatures-directory': 1,
    'https://two.example/.well-known/http-message-signatures-directory': 1,
  });
});

test('Web Bot Auth verifier rejects non-HTTPS Signature-Agent values without fetching', async () => {
  let fetches = 0;
  const request = new Request('https://example.com', { headers: {
    'Signature-Agent': 'sig="http://127.0.0.1:8080"',
    'Signature-Input': `sig=("@authority" "signature-agent";key="sig");created=1788393600;expires=1788393900;keyid="${DRAFT_KEY_ID}";tag="web-bot-auth"`,
    Signature: `sig=:${EMPTY_SIGNATURE}:`,
  } });
  const result = await verifyWebBotAuth(request, {
    now: new Date('2026-09-03T00:00:00Z'),
    async fetcher() {
      fetches += 1;
      return jsonDirectory();
    },
  });
  assert.deepEqual(result, { status: 'unverified', reason: 'invalid-signature-agent' });
  assert.equal(fetches, 0);
});

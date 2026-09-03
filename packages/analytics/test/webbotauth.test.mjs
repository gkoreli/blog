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
const DUCKDUCKBOT_AGENT = 'https://bot.duckduckgo.com';
const DUCKDUCKBOT_KEY_ID = '5HvpfNA946z6lcCXEIOOpzlN5l0mdZE42jdqimEwPf8';
const DUCKDUCKBOT_PUBLIC_KEY = {
  kty: 'OKP',
  crv: 'Ed25519',
  x: 'pVqc2ohmGpL_H1OJGq7mIGkxAk65mm5JkY7qSdJachE',
  kid: DUCKDUCKBOT_KEY_ID,
};
const DUCKDUCKBOT_CAPTURES = [
  {
    now: '2026-09-03T04:59:34Z',
    signatureInput: `sig1=("@method" "@authority" "@path" "signature-agent");created=1788411573;expires=1788412173;alg="ed25519";tag="web-bot-auth";keyid="${DUCKDUCKBOT_KEY_ID}"`,
    signature: 'sig1=:63joPbtMnsFXGyPmWp8mkRzsxiT0Ugujee2gB5dFajTA/ODK8bTRdkuM1/gYaU1f5DpDBvn5KMvoRkreGyWtCQ==:',
  },
  {
    now: '2026-09-03T05:14:33Z',
    signatureInput: `sig1=("@method" "@authority" "@path" "signature-agent");created=1788412472;expires=1788413072;alg="ed25519";tag="web-bot-auth";keyid="${DUCKDUCKBOT_KEY_ID}"`,
    signature: 'sig1=:gAD62RXq84zpB3ILRjPYkJqt/+RUy7R0zux2xWu1ezA9f+9q1HHltDwS0BzQyJ9JrdVBVMXN8x41duwLDGsdCg==:',
  },
  {
    now: '2026-09-03T06:23:31Z',
    signatureInput: `sig1=("@method" "@authority" "@path" "signature-agent");created=1788416610;expires=1788417210;alg="ed25519";tag="web-bot-auth";keyid="${DUCKDUCKBOT_KEY_ID}"`,
    signature: 'sig1=:OOBHjBnAwkkBDGpV26WHYjNhnooOXwjPrKRnlij7pXsG0cfX84LHHXQBYnMTMVyA1KKkzC0XlnqJYlEIRt4ZAA==:',
  },
];
const AHREFSBOT_AGENT = 'https://ahrefs.com';
const AHREFSBOT_PUBLIC_KEYS = [
  {
    kty: 'OKP',
    crv: 'Ed25519',
    x: '0g1xFRWdVlSOm1h92tZ4VFl7FWGtvRnTZ0PwuBdJuDU',
    kid: 'e3vpiy0B6M1Wdxnizw3dqRSgpqS6SXM2qiQ6HtUwZ5g',
    use: 'sig',
  },
  {
    kty: 'OKP',
    crv: 'Ed25519',
    x: 'v02owuOay4qEWYA4r-BZzdwy7ySHU8o1FESfuY4ICro',
    kid: '0227KWFT1389RBnlR8TLhbMaA_Of2MbNPhmlNICS7eI',
    use: 'sig',
  },
];
const AHREFSBOT_CAPTURE = {
  now: '2026-09-03T06:31:53Z',
  signatureInput: 'sig=("@authority" "signature-agent");created=1788417112;keyid="e3vpiy0B6M1Wdxnizw3dqRSgpqS6SXM2qiQ6HtUwZ5g";alg="ed25519";expires=1788417172;nonce="G1Ywem9vmQEo0fdcGB7X5U9zPBDn7t1bL_ThO2xn3SomHhITaea-gLCYBUaHp0YRIDGvnVmofZM9h6dNaVTTig";tag="web-bot-auth"',
  signature: 'sig=:+B/zW07ZjErBYQKeX5yYs7W/hTzbARoe9EDTg8WehmDZ6lsQfNgUR0Wrv/ggxa0JCu4RAfBi72XAFYw4I9FNAg==:',
};

function jsonDirectory(keys = [DRAFT_PUBLIC_KEY]) {
  return new Response(JSON.stringify({ keys }), {
    status: 200,
    headers: { 'Content-Type': 'application/http-message-signatures-directory+json' },
  });
}

function duckDuckBotRequest(capture, path = '/favicon.ico') {
  return new Request(`https://gkoreli.com${path}`, { headers: {
    'User-Agent': 'DuckDuckBot/1.1; (+http://duckduckgo.com/duckduckbot.html)',
    'Signature-Agent': DUCKDUCKBOT_AGENT,
    'Signature-Input': capture.signatureInput,
    Signature: capture.signature,
  } });
}

function draftRequest() {
  return new Request('https://example.com/', { headers: {
    'Signature-Agent': 'agent2="https://signature-agent.test"',
    'Signature-Input': 'sig2=("@authority" "signature-agent";key="agent2");created=1735689600;keyid="poqkLGiymh_W0uP6PZFw-dvez3QJT5SolqXBCW38r0U";alg="ed25519";expires=4889289600;nonce="n9p433xm+NJ3ph3upfBIGmsuwHw387YV7Q/F+6BSpGCVjYCqQw6rznNA8PVVLySrAWsv0hQtFioQb6E1YsauiA==";tag="web-bot-auth"',
    Signature: 'sig2=:RdNFx5Bj6au3YgAMQL/RzmUlZE8QZLIaXGRpw985hWnwPfMxT228NMk6ehRS1PSl4e8PhbNZACSanGdhEwYCCg==:',
  } });
}

test('Signature-Agent parser accepts dictionary, sf-string, and bare-URI legacy forms', () => {
  assert.deepEqual(parseSignatureAgentHeader('sig="https://agent.example";type=directory'), [
    { key: 'sig', uri: 'https://agent.example', legacy: false },
  ]);
  assert.deepEqual(parseSignatureAgentHeader('"https://legacy.example"'), [
    { key: null, uri: 'https://legacy.example', legacy: true },
  ]);
  assert.deepEqual(parseSignatureAgentHeader(' \thttps://bot.duckduckgo.com\t '), [
    { key: null, uri: DUCKDUCKBOT_AGENT, legacy: true },
  ]);
  for (const invalid of [
    'http://bot.duckduckgo.com',
    'https://bot.duckduckgo.com path',
    'https://bot.duckduckgo.com,other',
    'https://bot.duckduckgo.com;type=directory',
    'https://bot.duckduckgo.com=other',
    'https://bot.duckduckgo.com"',
  ]) {
    assert.equal(parseSignatureAgentHeader(invalid), null);
  }
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

  const legacyDraftRequest = new Request('https://example.com/', { headers: {
    'Signature-Agent': '"https://signature-agent.test"',
    'Signature-Input': 'sig2=("@authority" "signature-agent");created=1735689600;keyid="poqkLGiymh_W0uP6PZFw-dvez3QJT5SolqXBCW38r0U";alg="ed25519";expires=1735693200;nonce="e8N7S2MFd/qrd6T2R3tdfAuuANngKI7LFtKYI/vowzk4lAZYadIX6wW25MwG7DCT9RUKAJ0qVkU0mEeLElW1qg==";tag="web-bot-auth"',
  } });
  assert.equal(buildSignatureBase(legacyDraftRequest, 'sig2'), [
    '"@authority": example.com',
    '"signature-agent": "https://signature-agent.test"',
    '"@signature-params": ("@authority" "signature-agent");created=1735689600;keyid="poqkLGiymh_W0uP6PZFw-dvez3QJT5SolqXBCW38r0U";alg="ed25519";expires=1735693200;nonce="e8N7S2MFd/qrd6T2R3tdfAuuANngKI7LFtKYI/vowzk4lAZYadIX6wW25MwG7DCT9RUKAJ0qVkU0mEeLElW1qg==";tag="web-bot-auth"',
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

test('captured DuckDuckBot bare-URI signatures verify with injected directory and fixed clocks', async () => {
  for (const capture of DUCKDUCKBOT_CAPTURES) {
    const request = duckDuckBotRequest(capture);
    const base = buildSignatureBase(request, 'sig1');
    assert.notEqual(base, null);
    assert.match(base, /\n"signature-agent": https:\/\/bot\.duckduckgo\.com\n/);
    const requested = [];
    const result = await verifyWebBotAuth(request, {
      now: new Date(capture.now),
      cache: createWebBotAuthCache(),
      async fetcher(url) {
        requested.push(String(url));
        return jsonDirectory([DUCKDUCKBOT_PUBLIC_KEY]);
      },
    });
    assert.deepEqual(result, { status: 'verified', agent: DUCKDUCKBOT_AGENT });
    assert.deepEqual(requested, [
      'https://bot.duckduckgo.com/.well-known/http-message-signatures-directory',
    ]);
  }
});

test('failed bare-URI Signature-Agent verification records the legacy-form reason', async () => {
  const capture = DUCKDUCKBOT_CAPTURES[0];
  const result = await verifyWebBotAuth(duckDuckBotRequest(capture, '/changed'), {
    now: new Date(capture.now),
    cache: createWebBotAuthCache(),
    async fetcher() {
      return jsonDirectory([DUCKDUCKBOT_PUBLIC_KEY]);
    },
  });
  assert.deepEqual(result, { status: 'unverified', reason: 'bare-uri-signature-agent' });
});

test('captured AhrefsBot sf-string signature with nonce verifies with injected directory and fixed clock', async () => {
  assert.deepEqual(await Promise.all(AHREFSBOT_PUBLIC_KEYS.map(ed25519JwkThumbprint)), [
    'e3vpiy0B6M1Wdxnizw3dqRSgpqS6SXM2qiQ6HtUwZ5g',
    '0227KWFT1389RBnlR8TLhbMaA_Of2MbNPhmlNICS7eI',
  ]);
  const request = new Request('https://gkoreli.com/robots.txt', { headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)',
    'Signature-Agent': `"${AHREFSBOT_AGENT}"`,
    'Signature-Input': AHREFSBOT_CAPTURE.signatureInput,
    Signature: AHREFSBOT_CAPTURE.signature,
  } });
  const requested = [];
  const result = await verifyWebBotAuth(request, {
    now: new Date(AHREFSBOT_CAPTURE.now),
    cache: createWebBotAuthCache(),
    async fetcher(url) {
      requested.push(String(url));
      return jsonDirectory(AHREFSBOT_PUBLIC_KEYS);
    },
  });
  assert.deepEqual(result, { status: 'verified', agent: AHREFSBOT_AGENT });
  assert.deepEqual(requested, [
    'https://ahrefs.com/.well-known/http-message-signatures-directory',
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

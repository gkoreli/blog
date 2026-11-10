import assert from 'node:assert/strict';
import test from 'node:test';
import { extractRequestEvidence, extractDiagnosticInputs, privateHeaderEvidence, MAX_UA_EVIDENCE_BYTES } from '../.test-dist/request-evidence.js';

function req(headers = {}) { return new Request('https://example.test/article?private=discarded', { headers }); }
const response = new Response('page', { headers: { 'Content-Type': 'text/html' } });

test('retains useful browser/OS premises without treating a declared version as a real device identity', () => {
  const evidence = extractRequestEvidence(req({ 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/152.0.0.0 Safari/537.36 Edg/152.0', 'Accept-Language': 'en-US,en;q=0.8,fr;q=0.5' }), response);
  assert.equal(evidence.browserFamily, 'edge');
  assert.equal(evidence.browserMajor, 152);
  assert.equal(evidence.osFamily, 'windows-nt');
  assert.equal(evidence.osMajor, 10); // Does not invent Windows 11 from NT 10.
  assert.equal(evidence.primaryLanguage, 'en');
  assert.equal(evidence.claimsFetchMetadataSupport, true);
  assert.equal(evidence.declaredClientForm, 'browser');
  assert.equal(JSON.stringify(evidence).includes('en-US'), false);
  assert.equal(JSON.stringify(evidence).includes('private='), false);
});

test('keeps WebView, headless, HTTP client, bot and unknown declarations distinct', () => {
  for (const [userAgent, form] of [
    ['Mozilla/5.0 (Linux; Android 14; wv) Chrome/120.0.0.0', 'webview'],
    ['Mozilla/5.0 Redroid Chrome/114.0.0.0', 'webview'],
    ['Mozilla/5.0 HeadlessChrome/152.0.0.0', 'headless'],
    ['curl/8.0', 'http-client'],
    ['FixtureBot/1.0', 'bot'],
    ['unknown-client', 'unknown'],
  ]) assert.equal(extractRequestEvidence(req({ 'User-Agent': userAgent }), response).declaredClientForm, form);
  const absent = extractRequestEvidence(req(), response);
  assert.equal(absent.browserFamily, 'unknown');
  assert.equal(absent.browserMajor, null);
  assert.equal(absent.primaryLanguage, null);
});

test('registered HTTP software claims keep the optional form coherent even with a browser-shaped prefix', () => {
  const browser = 'Mozilla/5.0 AppleWebKit/537.36 Chrome/150.0 Safari/537.36';
  for (const token of ['python-httpx/0.28.1', 'axios/1.13.1', 'node-fetch']) {
    for (const ua of [token, `${browser} ${token}`]) {
      const evidence = extractRequestEvidence(req({ 'User-Agent': ua }), response);
      assert.equal(evidence.declaredClientForm, 'http-client', ua);
      assert.equal(evidence.version, '2026-11-10.1');
    }
  }
  assert.equal(extractRequestEvidence(req({ 'User-Agent': `${browser} node-fetch axios/1.13.1` }), response).declaredClientForm, 'http-client', 'compatible software claims preserve their shared form without choosing one identity');
  assert.equal(extractRequestEvidence(req({ 'User-Agent': `${browser} node-fetch GPTBot/1.0` }), response).declaredClientForm, 'bot', 'conflicting role claims do not silently select the HTTP software form');
});

test('optional browser, OS and software form claims share URI exclusion and exact browser products', () => {
  for (const ua of ['https://example.test/Chrome/150.0', 'https://example.test/;Chrome/150.0',
    'https://example.test/;Edg/150.0', 'https://example.test/;OPR/150.0',
    'https://example.test/;HeadlessChrome/150.0', 'https://example.test/;curl/8.0',
    'https://example.test/Android 14', 'https://example.test/iPhone OS 17_0']) {
    const e = extractRequestEvidence(req({ 'User-Agent': ua }), response);
    assert.equal(e.browserFamily, 'unknown', ua);
    assert.equal(e.browserMajor, null, ua);
    assert.equal(e.osFamily, 'unknown', ua);
    assert.equal(e.osMajor, null, ua);
    assert.equal(e.declaredClientForm, 'unknown', ua);
    assert.equal(e.claimsFetchMetadataSupport, false, ua);
  }
  for (const [ua, family, version] of [['Edg/150.0', 'edge', 150], ['EdgA/130.0', 'edge', 130],
    ['EdgiOS/130.0', 'edge', 130], ['OPR/120.0', 'opera', 120], ['firefox/150.0', 'firefox', 150],
    ['Chromium/150.0', 'chromium', 150], ['CriOS/150.0', 'chromium', 150],
    ['Version/17.0 Mobile/15E148 Safari/604.1', 'safari', 17]]) {
    const e = extractRequestEvidence(req({ 'User-Agent': ua }), response);
    assert.equal(e.browserFamily, family, ua); assert.equal(e.browserMajor, version, ua);
  }
  const ua = 'Chrome/150.0 AppleWebKit/605.1 (+https://example.test/iPhone OS 16_3)';
  const e = extractRequestEvidence(req({ 'User-Agent': ua }), response);
  assert.equal(e.browserFamily, 'chromium'); assert.equal(e.browserMajor, 150);
  assert.equal(e.osFamily, 'unknown'); assert.equal(e.claimsFetchMetadataSupport, true);
});

test('optional selected browser and capability abstain together on incompatible family declarations', () => {
  for (const ua of ['Firefox/89.0 Chrome/150.0', 'Firefox/150.0 Chrome/75.0', 'Chrome/150.0 Firefox/89.0',
    'Edg/150.0 Firefox/150.0', 'OPR/120.0 Firefox/150.0',
    '(iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1 FxiOS/150.0 CriOS/150.0']) {
    const e = extractRequestEvidence(req({ 'User-Agent': ua }), response);
    assert.equal(e.browserFamily, 'unknown', ua); assert.equal(e.browserMajor, null, ua);
    assert.equal(e.claimsFetchMetadataSupport, false, ua);
    assert.equal(e.declaredClientForm, 'unknown', ua);
  }
  for (const [ua, family] of [['Chrome/150.0 Edg/150.0 Safari/537.36', 'edge'],
    ['Chrome/150.0 OPR/120.0 Safari/537.36', 'opera'], ['Chrome/150.0 Safari/537.36', 'chromium']]) {
    const e = extractRequestEvidence(req({ 'User-Agent': ua }), response);
    assert.equal(e.browserFamily, family, ua); assert.equal(e.claimsFetchMetadataSupport, true, ua);
  }
});

test('limits source evidence by UTF-8 bytes with explicit loss flags and preserves absent values', () => {
  const bounded = privateHeaderEvidence('é'.repeat(600), MAX_UA_EVIDENCE_BYTES);
  assert.equal(new TextEncoder().encode(bounded.value).byteLength, MAX_UA_EVIDENCE_BYTES);
  assert.equal(bounded.truncated, true);
  assert.equal(bounded.redacted, false);
  assert.deepEqual(privateHeaderEvidence(null, 10), { value: null, truncated: false, redacted: false });
  assert.equal(privateHeaderEvidence('', 10).value, '');
});

test('redacts familiar credentials, contact identifiers, addresses and URL detail without erasing browser product versions', () => {
  const input = 'Chrome/152.0.0.0 Fixture/1 email=person@example.test ip=192.0.2.7 [2001:db8::1] secret=private-value Bearer private-credential 123e4567-e89b-12d3-a456-426614174000 (+https://example.test/person/name?token=private#fragment)';
  const evidence = privateHeaderEvidence(input, 1024);
  assert.equal(evidence.redacted, true);
  assert.equal(evidence.truncated, false);
  assert.ok(evidence.value.includes('Chrome/152.0.0.0'));
  assert.ok(evidence.value.includes('https://example.test'));
  for (const excluded of ['person@example', '192.0.2.7', '2001:db8', 'private-value', 'private-credential', '123e4567', '/person/name', '?token', '#fragment']) assert.equal(evidence.value.includes(excluded), false, excluded);
});

test('diagnostic extraction uses explicit fields and never serializes unrelated request headers or arbitrary cf fields', () => {
  const request = req({ 'User-Agent': 'FixtureBot/1.0', Accept: 'text/html;q=0, text/markdown;q=1', Authorization: 'Bearer private-auth', Cookie: 'private-cookie', Referer: 'https://private.example/person?secret=private-query', 'CF-Connecting-IP': '192.0.2.7' });
  Object.defineProperty(request, 'cf', { value: { httpProtocol: 'HTTP/3', tlsVersion: 'TLSv1.3', tlsCipher: 'AEAD-AES128-GCM-SHA256', colo: 'SJC', city: 'private-city', latitude: 'private-coordinate', tlsClientRandom: 'private-random' } });
  const evidence = extractDiagnosticInputs(request);
  assert.equal(evidence.userAgent.value, 'FixtureBot/1.0');
  assert.equal(evidence.accept.value, 'text/html;q=0, text/markdown;q=1');
  assert.deepEqual(evidence.transport, { httpProtocol: 'HTTP/3', tlsVersion: 'TLSv1.3', tlsCipher: 'AEAD-AES128-GCM-SHA256', colo: 'SJC' });
  assert.equal(JSON.stringify(evidence).includes('private-'), false);
  assert.equal(JSON.stringify(evidence).includes('192.0.2.7'), false);
});


test('language summary respects quality exclusions without retaining ordered preferences', () => {
  for (const [value, expected] of [['en;q=0,fr;q=1', 'fr'], ['en-US;q=0.2,de;q=0.8', 'de'], ['zh-Hant-TW', 'zh'], ['en;q=2', null], ['*', null], ['person@example.test', null]]) {
    assert.equal(extractRequestEvidence(req({ 'Accept-Language': value }), response).primaryLanguage, expected);
  }
});


test('a large source remains explicitly partial even when redaction makes its retained value short', () => {
  const evidence = privateHeaderEvidence('password=' + 'x'.repeat(100000), 1024);
  assert.equal(evidence.redacted, true);
  assert.equal(evidence.truncated, true);
  assert.ok(new TextEncoder().encode(evidence.value).byteLength <= 1024);
});

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

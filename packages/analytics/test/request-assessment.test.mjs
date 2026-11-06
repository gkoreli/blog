import assert from 'node:assert/strict';
import test from 'node:test';
import { assessRequest, trustedEdgeAddress } from '../.test-dist/request-assessment.js';

function incoming(headers, cf = { asn: 13335 }) {
  const request = new Request('https://publication.site/api/request-check', { headers });
  if (cf !== null) Object.defineProperty(request, 'cf', { value: cf });
  return request;
}

test('request assessment keeps mixed declarations and spoofed provider headers independent', async () => {
  const report = await assessRequest(incoming({ 'User-Agent': 'GPTBot/1.0 ChatGPT-User/1.0 private@example.invalid',
    'CF-Verified-Bot': 'true', 'CF-Signed-Agent': 'true', 'CF-Connecting-IP': '8.8.8.8' }));
  assert.equal(report.classification.readerKind, 'unresolved');
  assert.deepEqual([...report.evidence.declarations.candidates].sort(), ['ChatGPT-User', 'GPTBot']);
  assert.equal(report.evidence.categoryAgreement, 'multiple-categories');
  assert.equal(report.signature.localOutcome, 'absent');
  assert.equal(report.signature.native.verifiedBot, null);
  assert.equal(report.signature.native.signedAgent, null);
  assert.doesNotMatch(JSON.stringify(report), /private@example|8\.8\.8\.8/);
});

test('a missing browser signal stays unresolved, and a real navigation-shaped request stays a signal', async () => {
  const browser = 'Mozilla/5.0 Chrome/130.0.0.0 Safari/537.36';
  const absent = await assessRequest(incoming({ 'User-Agent': browser }));
  assert.equal(absent.classification.readerKind, 'unresolved');
  assert.equal(absent.classification.reason, 'fetch-metadata-absent');
  const navigation = await assessRequest(incoming({ 'User-Agent': browser, Accept: 'text/html', 'Accept-Language': 'en',
    'Sec-Fetch-Mode': 'navigate', 'Sec-Fetch-Dest': 'document', 'Sec-Fetch-Site': 'none', 'Sec-Fetch-User': '?1' }));
  assert.equal(navigation.classification.readerKind, 'browser');
  assert.equal(navigation.evidence.navigationShaped, true);
  assert.equal(navigation.evidence.activation, 'true-claim');
  assert.equal(navigation.signature.localOutcome, 'absent');
});

test('partial or injected signature evidence never authenticates arbitrary source text', async () => {
  const partial = await assessRequest(incoming({ 'Signature-Agent': 'https://private-secret.example.invalid' }));
  assert.equal(partial.signature.localOutcome, 'invalid');
  assert.equal(partial.signature.localReason, 'missing-signature-input');
  assert.equal(partial.signature.signer, null);
  assert.doesNotMatch(JSON.stringify(partial), /private-secret/);
  const injected = await assessRequest(incoming({ 'Signature-Agent': 'fixture' }), {
    verifySignature: async () => ({ status: 'verified', agent: 'https://unreviewed-publisher.site/private-secret' }),
  });
  assert.equal(injected.signature.source, 'test-injected');
  assert.equal(injected.signature.localOutcome, 'test-injected');
  assert.equal(injected.signature.coverage, null);
  assert.equal(injected.signature.signer, 'Other');
  assert.doesNotMatch(JSON.stringify(injected), /private-secret|unreviewed-publisher/);
});

test('admission address requires actual edge context and rejects subrequests or special addresses', () => {
  assert.equal(trustedEdgeAddress(incoming({ 'CF-Connecting-IP': '8.8.8.8' })), '8.8.8.8');
  assert.equal(trustedEdgeAddress(incoming({ 'CF-Connecting-IP': '8.8.8.8' }, null)), null);
  assert.equal(trustedEdgeAddress(incoming({ 'CF-Connecting-IP': '8.8.8.8', 'CF-Worker': 'untrusted.site' })), null);
  for (const ip of ['127.0.0.1', '10.0.0.1', '::1', '2a06:98c0:3600::103', '2130706433', '010.0.0.1']) assert.equal(trustedEdgeAddress(incoming({ 'CF-Connecting-IP': ip })), null);
  assert.equal(trustedEdgeAddress(incoming({ 'CF-Connecting-IP': '240.0.0.1', 'CF-Connecting-IPv6': '2606:4700:4700::1111' })), '2606:4700:4700::1111');
});

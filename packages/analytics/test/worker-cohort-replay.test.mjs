import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeWorkerCohort } from '../../blog/drafts/research/analytics-retrospective/analyze-worker-cohort.mjs';

function event(headers = {}, cf = {}, extra = {}) {
  return { dataset: 'cloudflare-workers', timestamp: '2026-10-24T12:00:00Z', $metadata: { id: 'fixture-private-event' },
    $workers: { truncated: false, event: { request: { url: 'https://example.test/article?email=fixture@example.invalid', method: 'GET',
      headers: { 'user-agent': 'Mozilla/5.0 Chrome/152.0.0.0', accept: 'text/html', 'accept-language': 'en-US',
        'sec-fetch-mode': 'navigate', 'sec-fetch-dest': 'document', 'sec-fetch-site': 'none', 'sec-fetch-user': '?1',
        referer: 'https://private-referrer.example/person?token=private-token', 'cf-connecting-ip': '192.0.2.1', ...headers },
      cf: { asn: 64512, country: 'US', city: 'private-city', tlsClientRandom: 'private-tls-secret', ...cf } }, response: { status: 200 } } }, ...extra };
}

test('replays actual rule premises without turning browser-rule matches into known humans', () => {
  const report = analyzeWorkerCohort([event(), event({}, { asn: 16509 }), event({ 'user-agent': 'ExaSearchBot/1.0', 'signature-agent': 'https://private-signer.example' })]);
  assert.deepEqual(report.dimensions.readerKind, { browser: 1, 'cloud-browser': 1, 'ai-search': 1 });
  assert.equal(report.signatureHeaderEvents, 1);
  assert.ok(report.limits.some(s => s.includes('not a historical classification rewrite')));
  assert.equal(report.duplicateEventIds, 2);
});

test('public replay summaries do not copy raw identifiers, header values, private URLs or provider fields', () => {
  const input = event({ 'sec-fetch-site': 'private-header@example.invalid', 'sec-fetch-mode': 'private-mode@example.invalid', 'user-agent': 'PrivateName@example.invalid Chrome/152.0' }, {}, { dataset: 'private-dataset@example.invalid' });
  const report = analyzeWorkerCohort([input]);
  const serialized = JSON.stringify(report);
  for (const value of ['example.invalid', 'private-referrer', 'private-signer', 'private-event', '192.0.2.1', 'private-city', 'private-tls-secret', 'private-token']) assert.equal(serialized.includes(value), false, value);
  assert.deepEqual(report.dimensions.fetchSite, { unrecognized: 1 });
  assert.deepEqual(report.dimensions.dataset, { unrecognized: 1 });
});

test('retains invalid, missing-ID and truncation counts instead of silently dropping bad evidence', () => {
  const partial = event(); partial.$workers.truncated = true; delete partial.$metadata.id;
  const invalid = event(); invalid.$workers.event.response.status = 'unknown';
  const report = analyzeWorkerCohort([partial, invalid, {}]);
  assert.equal(report.inputRows, 3); assert.equal(report.invalidRows, 2); assert.equal(report.missingEventIds, 1); assert.equal(report.truncatedEvents, 1);
  assert.equal(Object.values(report.dimensions.readerKind).reduce((a,b)=>a+b,0), 1);
});

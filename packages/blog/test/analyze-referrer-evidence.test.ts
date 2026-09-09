import assert from 'node:assert/strict';
import test from 'node:test';
import type { ReferralPolicy } from '../../analytics/src/referral-policy.js';
import { analyzeReferrerEvidence } from '../scripts/analyze-referrer-evidence.js';

const policy: ReferralPolicy = {
  version: '2026-09-06.2', sha256: 'a'.repeat(64), evaluator: 'host-suffix-v1',
  source: { provider: 'matomo', revision: 'b'.repeat(40), sha256: 'c'.repeat(64), capturedAt: '2026-09-06T00:00:00Z', entryCount: 1 },
  upstreamHosts: ['spam.example'], localRules: [], publicHosts: ['news.ycombinator.com'],
};

function fixture() {
  const base = {
    referrerHost: null, country: 'US', deviceType: 'desktop', asn: 123,
    fetchSite: 'none', fetchUser: 1, representation: 'html', readerKind: 'browser',
    day: '2026-09-07', asnSource: 'request', views: 2,
  };
  const groups = [
    base,
    { ...base, referrerHost: 'news.ycombinator.com', views: 3 },
    { ...base, referrerHost: 'unreviewed.example', views: 4, signatureAgent: 'https://private.example', daily_client_id: 'do-not-export' },
    { ...base, referrerHost: 'spam.example', views: 5 },
    { ...base, referrerHost: 'unreviewed.example', readerKind: 'cloud-browser', views: 6 },
  ];
  const results = groups.map(data => ({ panel: 'request-groups', data: JSON.stringify(data) }));
  results.push({ panel: 'no-referrer-repeat', data: JSON.stringify({ viewsPerDailyId: 2, dailyIds: 1 }) });
  results.push({ panel: 'no-referrer-hours', data: JSON.stringify({ hour: '2026-09-07 12', fetchSite: 'none', views: 2 }) });
  return {
    capturedAt: '2026-09-09T01:16:37Z', httpStatus: 200,
    response: { success: true, result: [{ success: true, meta: { rows_read: 40, rows_written: 0 }, results }] },
  };
}

test('reconciles distinct referral categories and preserves the separate Browser population', () => {
  const report = analyzeReferrerEvidence(fixture(), policy);
  assert.equal(report.rawViews, 20);
  assert.equal(report.includedViews, 15);
  assert.equal(report.excludedViews, 5);
  assert.equal(report.browser.views, 9);
  assert.equal(report.noReferrer.views, 2);
  assert.equal(report.noReferrer.dailyIds, 1);
  assert.deepEqual(report.browser.namedReferrers, [{ value: 'news.ycombinator.com', views: 3 }]);
  assert.equal(report.browser.byReferrerCategory.find(row => row.value === 'other')?.views, 4);
  assert.equal(report.hn.views, 3);
  for (const privateValue of ['unreviewed.example', 'private.example', 'spam.example', 'do-not-export']) {
    assert.equal(JSON.stringify(report).includes(privateValue), false);
  }
});

test('rejects failed, mutating, truncated, or inconsistent captures', () => {
  const failed = fixture();
  failed.response.success = false;
  assert.throws(() => analyzeReferrerEvidence(failed, policy));
  const mutating = fixture();
  mutating.response.result[0]!.meta.rows_written = 1;
  assert.throws(() => analyzeReferrerEvidence(mutating, policy));
  const truncated = fixture();
  const first = truncated.response.result[0]!.results[0]!;
  truncated.response.result[0]!.results = Array.from({ length: 10001 }, () => first);
  assert.throws(() => analyzeReferrerEvidence(truncated, policy));
  const incomplete = fixture();
  incomplete.response.result[0]!.results = incomplete.response.result[0]!.results.filter(row => row.panel !== 'no-referrer-repeat');
  assert.throws(() => analyzeReferrerEvidence(incomplete, policy), /do not reconcile/);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { NATIVE_BOT_CATEGORIES, nativeCategoryEvidence, nativeCategoryLabel } from '../.test-dist/native-bot-evidence.js';
import { verificationEvidence } from '../.test-dist/signature-evidence.js';
import { queryStats } from '../.test-dist/stats.js';

function request(cf) {
  const req = new Request('https://publication.example/article', { headers: { 'Verified-Bot-Category': 'AI Assistant' } });
  if (cf !== undefined) Object.defineProperty(req, 'cf', { value: cf });
  return req;
}
test('provider category is exact closed metadata, independent of booleans and request headers', () => {
  for (const value of NATIVE_BOT_CATEGORIES) {
    const e = verificationEvidence(request({ verifiedBotCategory: value }), { status: 'absent' });
    assert.deepEqual(e.native.category, { version: '2026-10-27.1', status: 'known', value });
    assert.equal(e.native.verifiedBot, null); assert.equal(e.native.signedAgent, null);
    assert.equal(e.localStatus, 'absent'); assert.equal(nativeCategoryLabel(value), value);
  }
  for (const cf of [undefined, {}, { verifiedBotCategory: null }]) assert.equal(nativeCategoryEvidence(cf).status, 'unavailable');
  assert.equal(nativeCategoryEvidence({ verifiedBotCategory: '' }).status, 'empty');
  for (const value of ['ai assistant', ' AI Assistant', 'private-canary@example.test', 1, {}, []]) {
    const e = nativeCategoryEvidence({ verifiedBotCategory: value });
    assert.equal(e.status, 'unrecognized'); assert.equal(e.value, null); assert.equal(JSON.stringify(e).includes('canary'), false);
  }
  const e = verificationEvidence(request({ botManagement: { verifiedBot: false, signedAgent: false }, verifiedBotCategory: 'AI Search' }), { status: 'absent' });
  assert.equal(e.native.verifiedBot, false); assert.equal(e.native.signedAgent, false); assert.equal(e.native.category.status, 'known');
});

test('category report partitions the selected population, closes arbitrary records and preserves history/exclusions', async () => {
  const sqlite = new DatabaseSync(':memory:'); sqlite.exec(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'));
  let alter = rows => rows;
  const db = { prepare(sql) { return { bind(...values) { return { execute() { return { results: alter(sqlite.prepare(sql).all(...values)) }; } }; } }; }, async batch(statements) { return statements.map(s => s.execute()); } };
  const add = sqlite.prepare("INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,observed_at,signature_evidence,referrer_host) VALUES(?,'00000000000000000000000000000000','browser','desktop',?,'browser','fixture',?,?,?)");
  const base = verificationEvidence(request({ verifiedBotCategory: 'Search Engine Crawler' }), { status: 'absent' });
  const rows = [base, verificationEvidence(request({ verifiedBotCategory: '' }), { status: 'absent' }), verificationEvidence(request(), { status: 'absent' }),
    verificationEvidence(request({ verifiedBotCategory: 'private-canary@example.test' }), { status: 'absent' }), null,
    { ...base, version: 'future' }, { ...base, source: null },
    { ...base, native: { ...base.native, category: { version: '2026-10-27.1', status: 'known', value: 'private-canary@example.test' } } }];
  for (const row of rows) add.run('/article', 0, '2026-10-27 01:00:00', row === null ? null : JSON.stringify(row), null);
  sqlite.prepare("UPDATE page_observations SET reader_kind='private-canary' WHERE signature_evidence IS NULL").run();
  add.run('/article', 0, '2026-10-27 01:00:00', JSON.stringify(base), null);
  sqlite.prepare("UPDATE page_observations SET reader_kind='ai-search' WHERE id=(SELECT MAX(id) FROM page_observations)").run();
  add.run('/article', 1, '2026-10-27 01:00:00', JSON.stringify(base), null);
  add.run('/article', 0, '2026-10-27 01:00:00', JSON.stringify(base), 'traffic2cash.xyz');
  add.run('/another', 0, '2026-10-27 01:00:00', JSON.stringify(base), null);
  add.run('/article', 0, '2026-10-28 01:00:00', JSON.stringify(base), null);
  const query = { range: '7d', traffic: 'all', path: '/article' }, now = new Date('2026-10-27T02:00:00Z');
  const report = await queryStats(db, query, now);
  assert.equal(report.totals.views, 9); assert.equal(report.referralPolicy.excludedViews, 1);
  const marginal = {};
  for (const row of report.byKindNativeCategory) marginal[row.basis] = (marginal[row.basis] ?? 0) + row.views;
  assert.deepEqual(marginal, { unrecognized: 4, 'Search Engine Crawler': 2, empty: 1, 'not-recorded': 1, unavailable: 1 });
  assert.deepEqual(report.byKindNativeCategory.filter(r => r.basis === 'Search Engine Crawler').map(r => r.kind).sort(), ['ai-search','browser']);
  assert.ok(report.byKindNativeCategory.some(r => r.basis === 'not-recorded' && r.kind === null));
  assert.equal(report.byKindNativeCategory.reduce((n, r) => n + r.views, 0), report.totals.views);
  assert.equal(report.verification.nativeAvailableViews, 0); assert.equal(JSON.stringify(report).includes('private-canary'), false);
  assert.deepEqual((await queryStats(db, { ...query, path: '/missing' }, now)).byKindNativeCategory, []);
  assert.deepEqual((await queryStats(db, { ...query, kind: 'ai-search' }, now)).byKindNativeCategory, [{ kind: 'ai-search', basis: 'Search Engine Crawler', views: 1 }]);
  for (const transform of [payload => payload.slice(1), payload => [...payload, payload[0]], payload => [{ key1: 'browser', key2: 'private-canary', views: 9 }], payload => [{ key1: 1, key2: 'unavailable', views: 9 }]]) {
    alter = rows => rows.map(row => row.section === 'native-category' ? { ...row, payload: JSON.stringify(transform(JSON.parse(row.payload))) } : row);
    await assert.rejects(() => queryStats(db, query, now), /malformed|invalid/i);
  }
});

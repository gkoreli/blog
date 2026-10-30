import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { nativeDatabase } from './evidence-delta.mjs';
import { queryArticleReach } from '../../analytics/.test-dist/article-reach.js';
import { consistentArticleReach } from '../../analytics/.test-dist/article-reach-contract.js';
import { seedReach } from '../../analytics/test/fixtures/article-reach.mjs';

const [output] = process.argv.slice(2);
assert.ok(output, 'Provide a fresh aggregate output path');
const { db, mf } = await nativeDatabase();
const now = new Date('2026-10-30T12:00:00Z');
const catalogue = [{ path: '/fixture', title: 'Fixture', publishedOn: '2026-09-01' }];
try {
  await db.prepare('DROP TABLE page_observations').run();
  await db.prepare('DROP TABLE owner_clients').run();
  const schema = readFileSync('packages/analytics/schema.sql', 'utf8').replace(/^\s*--.*$/gm, '');
  for (const sql of schema.split(';').map(s => s.trim()).filter(Boolean)) await db.prepare(sql).run();
  const rows = Array.from({ length: 16 }, (_, i) => ({
    path: '/fixture', daily_client_id: i.toString(16).padStart(32, '0'),
    traffic_class: 'browser', device_type: 'desktop', reader_kind: 'browser', is_owner: 0,
    referrer_state: 'absent', referrer_host: null,
    classifier_version: i % 4 < 2 ? 'fixture-A' : 'fixture-B',
    observed_at: `2026-10-${String(3 + Math.floor(i / 4) * 7).padStart(2, '0')} 12:00:00`,
  }));
  await seedReach(db, rows);
  const meters = [];
  const mixed = await queryArticleReach(db, catalogue, now, undefined, m => meters.push(m));
  assert.ok(consistentArticleReach(mixed));
  const grouped = () => db.prepare('SELECT substr(observed_at,1,10) AS day,classifier_version AS profile,COUNT(*) AS views FROM page_observations GROUP BY day,profile ORDER BY day,profile').all();
  const mixedGroups = (await grouped()).results;
  await db.prepare("UPDATE page_observations SET classifier_version=CASE WHEN observed_at<'2026-10-16' THEN 'fixture-A' ELSE 'fixture-B' END").run();
  const switched = await queryArticleReach(db, catalogue, now, undefined, m => meters.push(m));
  const switchedGroups = (await grouped()).results;
  assert.ok(consistentArticleReach(switched));
  assert.deepEqual(mixed, switched);
  assert.notDeepEqual(mixedGroups, switchedGroups);
  assert.equal(mixedGroups.length, 8);
  assert.equal(switchedGroups.length, 4);
  assert.deepEqual(mixed.weeks.map(w => w.site.views), [4, 4, 4, 4]);
  assert.deepEqual(mixed.classification, { recordedProfiles: 2, unversionedViews: 0 });
  assert.ok(meters.every(m => m.reportedRowsWritten === 0));
  const files = ['packages/analytics/src/article-reach.ts', 'packages/analytics/src/article-reach-contract.ts', 'packages/blog/src/client/article-reach.ts', 'packages/blog/src/pages/article-reach.ts', 'packages/blog/scripts/check-readership-profile-ambiguity.mjs'];
  const result = {
    checkedAt: new Date().toISOString(), method: 'Paired local native D1, full current schema, same 16 constructed stored-Browser events; only classifier stamps change.',
    reportEqual: true, distinctUnderlyingWeeklyProfileDistributions: true,
    mixedWeeklyProfiles: mixedGroups, switchedWeeklyProfiles: switchedGroups,
    reportClassification: mixed.classification, weeklyEvents: mixed.weeks.map(w => w.site.views),
    reportMeters: meters, productionCalls: 0, newLabels: 0,
    sourceSha256: Object.fromEntries(files.map(f => [f, createHash('sha256').update(readFileSync(f)).digest('hex')])),
    limits: 'Demonstrates report information loss about stored measurement profiles, not an actual rule change, its effect on traffic, comparable population, human count or growth correction. Profile equality alone would not prove semantic stability.',
  };
  writeFileSync(output, JSON.stringify(result, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify({ reportEqual: true, mixedGroups: 8, switchedGroups: 4, reads: meters.map(m => m.reportedRowsRead) }));
} finally {
  await mf.dispose();
}

import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { nativeDatabase } from './evidence-delta.mjs';
import { queryArticleReach } from '../../analytics/.test-dist/article-reach.js';
import { consistentArticleReach } from '../../analytics/.test-dist/article-reach-contract.js';
import { seedReach } from '../../analytics/test/fixtures/article-reach.mjs';
import { catalogue as fixtureCatalogue, now as fixtureNow } from '../../analytics/test/fixtures/article-reach.mjs';
import { measurementCases, checkMeasurementHistory, measurementMutations } from '../../analytics/test/fixtures/measurement-history.mjs';

const [output] = process.argv.slice(2);
assert.ok(output, 'Provide a fresh aggregate output path');
const baselineCommit = '1af6696';
const previous = execFileSync('git', ['show', baselineCommit + ':packages/analytics/src/article-reach.ts'], { encoding: 'utf8' });
const previousContract = execFileSync('git', ['show', baselineCommit + ':packages/analytics/src/article-reach-contract.ts'], { encoding: 'utf8' });
const bundle = await build({ stdin: { contents: previous.replace("'./article-reach-contract.js'", "'fixture:previous-contract'"), resolveDir: resolve('packages/analytics/src'), loader: 'ts' },
  bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent', plugins: [{ name: 'pinned-contract', setup(build) {
    build.onResolve({ filter: /^fixture:previous-contract$/ }, () => ({ path: 'contract', namespace: 'pinned' }));
    build.onLoad({ filter: /.*/, namespace: 'pinned' }, () => ({ contents: previousContract, loader: 'ts' }));
  } }] });
const baselinePath = resolve(output + '.baseline.mjs');
writeFileSync(baselinePath, bundle.outputFiles[0].text, { flag: 'wx', mode: 0o600 });
const baseline = await import(pathToFileURL(baselinePath));
const common = report => { const { version, measurementHistory, ...rest } = report; return rest; };
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
    classifier_version: i % 4 < 2 ? '2026-10-01.1' : '2026-10-16.1',
    observed_at: `2026-10-${String(3 + Math.floor(i / 4) * 7).padStart(2, '0')} 12:00:00`,
  }));
  await seedReach(db, rows);
  const meters = [];
  const mixed = await queryArticleReach(db, catalogue, now, undefined, m => meters.push(m));
  const mixedBefore = await baseline.queryArticleReach(db, catalogue, now);
  assert.ok(consistentArticleReach(mixed));
  const grouped = () => db.prepare('SELECT substr(observed_at,1,10) AS day,classifier_version AS profile,COUNT(*) AS views FROM page_observations GROUP BY day,profile ORDER BY day,profile').all();
  const mixedGroups = (await grouped()).results;
  await db.prepare("UPDATE page_observations SET classifier_version=CASE WHEN observed_at<'2026-10-16' THEN '2026-10-01.1' ELSE '2026-10-16.1' END").run();
  const switched = await queryArticleReach(db, catalogue, now, undefined, m => meters.push(m));
  const switchedBefore = await baseline.queryArticleReach(db, catalogue, now);
  const switchedGroups = (await grouped()).results;
  assert.ok(consistentArticleReach(switched));
  assert.deepEqual(mixedBefore, switchedBefore);
  assert.deepEqual(common(mixed), common(mixedBefore));
  assert.deepEqual(common(switched), common(switchedBefore));
  assert.notDeepEqual(mixed.measurementHistory, switched.measurementHistory);
  assert.notDeepEqual(mixedGroups, switchedGroups);
  assert.equal(mixedGroups.length, 8);
  assert.equal(switchedGroups.length, 4);
  assert.deepEqual(mixed.weeks.map(w => w.site.views), [4, 4, 4, 4]);
  assert.deepEqual(mixed.classification, { recordedProfiles: 2, unversionedViews: 0 });
  assert.ok(meters.every(m => m.reportedRowsWritten === 0));
  await db.prepare('DELETE FROM page_observations').run();
  await seedReach(db, measurementCases.map(c => c.row));
  const fixture = await queryArticleReach(db, fixtureCatalogue, fixtureNow);
  const fixtureBefore = await baseline.queryArticleReach(db, fixtureCatalogue, fixtureNow);
  assert.deepEqual(common(fixture), common(fixtureBefore)); checkMeasurementHistory(fixture);
  for (const mutate of measurementMutations()) { const broken = structuredClone(fixture); mutate(broken); assert.equal(consistentArticleReach(broken), false); }
  const scale = [];
  for (const scenario of ['historical', 'mixed', 'distinct']) {
    await db.prepare('DELETE FROM page_observations').run();
    const synthetic = Array.from({ length: 512 }, (_, i) => ({ ...rows[i % rows.length],
      daily_client_id: i.toString(16).padStart(32, '0'),
      classifier_version: scenario === 'historical' ? null : scenario === 'distinct' ? '2026-10-01.' + i : rows[i % rows.length].classifier_version,
    }));
    await seedReach(db, synthetic);
    let beforeCost, afterCost;
    const before = await baseline.queryArticleReach(db, catalogue, now, undefined, e => { beforeCost = e; });
    const after = await queryArticleReach(db, catalogue, now, undefined, e => { afterCost = e; });
    assert.deepEqual(common(after), common(before)); assert.ok(consistentArticleReach(after));
    assert.equal(afterCost.reportedRowsWritten, 0); assert.ok(afterCost.reportedRowsRead < 50000);
    scale.push({ scenario, rows: 512, beforeReads: beforeCost.reportedRowsRead, afterReads: afterCost.reportedRowsRead, writes: afterCost.reportedRowsWritten });
  }
  const files = ['packages/analytics/src/article-reach.ts', 'packages/analytics/src/article-reach-contract.ts', 'packages/blog/src/client/article-reach.ts', 'packages/blog/src/pages/article-reach.ts', 'packages/analytics/test/fixtures/measurement-history.mjs', 'packages/blog/scripts/check-readership-profile-ambiguity.mjs'];
  const result = {
    checkedAt: new Date().toISOString(), method: 'Paired local native D1, full current schema, same 16 constructed stored-Browser events; only syntactically valid classifier stamps change. Pinned prior source/contract comparison.',
    baselineCommit, priorReportsEqual: true, currentHistoryDiffers: true, otherReportFieldsUnchanged: true, distinctUnderlyingWeeklyProfileDistributions: true,
    mixedWeeklyProfiles: mixedGroups, switchedWeeklyProfiles: switchedGroups,
    reportClassification: mixed.classification, weeklyEvents: mixed.weeks.map(w => w.site.views),
    reportMeters: meters, independentLabelledRecordCases: measurementCases.length, contractNegatives: measurementMutations().length,
    scale, mixedHistory: mixed.measurementHistory, switchedHistory: switched.measurementHistory, fixture,
    productionCalls: 0, newLabels: 0,
    sourceSha256: Object.fromEntries(files.map(f => [f, createHash('sha256').update(readFileSync(f)).digest('hex')])),
    limits: 'Constructed report history, not actual rule changes or measured production cost/growth. Unsupported non-date-shaped stamps are folded into unrecognized, not displayed. Profile equality does not prove semantic stability; Browser-selected rows cannot reveal requests excluded by old rules.',
  };
  writeFileSync(output, JSON.stringify(result, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify({ priorReportsEqual: true, currentHistoryDiffers: true, cases: measurementCases.length, scale }));
} finally {
  await mf.dispose();
}

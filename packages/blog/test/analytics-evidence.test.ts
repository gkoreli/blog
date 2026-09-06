import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { buildQueries, compareDay, d1Schema, daysBetween, parseRum, rumQuery, type RumGroup } from '../scripts/analytics-evidence.models.ts';

const day = '2020-01-01';
function group(path = '/', count = 1, interval = 1): RumGroup {
  return { count, avg: { sampleInterval: interval }, sum: { visits: count }, dimensions: { date: day, requestPath: path, navigationType: 'navigate', deliveryType: 'unknown' } };
}
function response(groups: RumGroup[]) {
  return { errors: null, data: { viewer: { accounts: [{ rumPageloadEventsAdaptiveGroups: groups }] } } };
}
const daily = [{ day, reader_kind: 'browser', representation: 'html', views: 7 }];
const paths = [{ day, path: '/', reader_kind: 'browser', representation: 'html', views: 7 }];

test('UTC windows reject invalid dates, SQL input, partial days and oversized ranges', () => {
  const now = new Date('2020-03-02T12:00:00Z');
  assert.deepEqual(daysBetween('2020-02-28', '2020-03-02', now), ['2020-02-28', '2020-02-29', '2020-03-01']);
  for (const [start, end] of [['2020-02-30', '2020-03-01'], [day, "2020-01-02'; DELETE FROM x;"], [day, day], [day, '2020-03-01'], ['2020-03-02', '2020-03-03']]) {
    assert.throws(() => daysBetween(start!, end!, now));
  }
});

test('D1 queries apply owner exclusion and export aggregates without client IDs', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(readFileSync(new URL('../../analytics/schema.sql', import.meta.url), 'utf8'));
    db.exec('CREATE TABLE d1_migrations (id INTEGER, name TEXT, applied_at TEXT)');
    const insert = db.prepare(`INSERT INTO page_observations (path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,representation,observed_at) VALUES (?,?,?,?,?,?,?,?)`);
    insert.run('/', 'a'.repeat(32), 'browser', 'desktop', 0, 'browser', 'html', day + ' 01:00:00');
    insert.run('/', 'b'.repeat(32), 'browser', 'desktop', 1, 'browser', 'html', day + ' 01:00:00');
    insert.run('/', 'c'.repeat(32), 'browser', 'desktop', 0, 'browser', 'html', day + ' 01:00:00');
    db.prepare('INSERT INTO owner_clients (daily_client_id,utc_date) VALUES (?,?)').run('c'.repeat(32), day);
    insert.run('/', 'd'.repeat(32), 'browser', 'desktop', 0, 'browser', 'html', '2020-01-02 00:00:00');
    const queries = buildQueries(day, '2020-01-02');
    for (const query of queries) {
      assert.match(query.sql, /^SELECT /);
      const rows = db.prepare(query.sql).all();
      assert.equal(JSON.stringify(rows).includes('daily_client_id'), false);
      for (const id of ['a','b','c','d']) assert.equal(JSON.stringify(rows).includes(id.repeat(32)), false);
      if (query.name === 'daily') assert.equal(rows.reduce((n, r) => n + Number(r.views), 0), 1);
      if (query.name === 'browser_clusters') assert.equal(rows[0]?.daily_clients, 1);
    }
  } finally { db.close(); }
});

test('D1 evidence refuses write metadata, failed statements and absent results', () => {
  assert.throws(() => d1Schema.parse([{ success: true, results: [], meta: { rows_written: 1 } }]));
  assert.throws(() => d1Schema.parse([{ success: false, results: [], meta: { rows_written: 0 } }]));
  assert.throws(() => d1Schema.parse([{ success: true, meta: { rows_written: 0 } }]));
});

test('RUM comparison excludes stats and APIs, retains all other loads, and does not use visits as views', () => {
  const rum = group('/', 2); rum.sum.visits = 1;
  const c = compareDay(day, daily, paths, [rum, group('/stats', 3), group('/stats/detail'), group('/api/stats')]);
  assert.equal(c.rumLoads, 2);
  assert.equal(c.excludedRumLoads, 5);
  assert.equal(c.ratio, 3.5);
});

test('sampled RUM counts are preserved without rescaling or producing a ratio', () => {
  const c = compareDay(day, daily, paths, [group('/', 2, 10)]);
  assert.equal(c.rumLoads, 2);
  assert.equal(c.ratio, null);
});

test('RUM-only paths, missing denominators and inconsistent D1 panels withhold ratios', () => {
  const unmatched = compareDay(day, daily, paths, [group('/rum-only')]);
  assert.deepEqual(unmatched.unmatchedPaths, ['/rum-only']);
  assert.equal(unmatched.rumLoads, 1);
  assert.equal(unmatched.ratio, null);
  assert.equal(compareDay(day, daily, paths, []).ratio, null);
  assert.equal(compareDay(day, daily, [], [group()]).reconciles, false);
});

test('partial GraphQL data, group limit, missing sampling and unexpected days are rejected', () => {
  assert.throws(() => parseRum({ ...response([group()]), errors: [{ message: 'partial' }] }, day));
  assert.throws(() => parseRum(response(Array.from({ length: 10_000 }, () => group())), day));
  const wrongDay = group(); wrongDay.dimensions.date = '2020-01-02';
  assert.throws(() => parseRum(response([wrongDay]), day));
  assert.throws(() => parseRum(response([group('/', 1, 0)]), day));
  assert.deepEqual(parseRum(response([]), day), []);
});

test('RUM query pins host, exclusive UTC bounds, and separate bot-filter variants', () => {
  const query = rumQuery('a'.repeat(32), day, true);
  assert.match(query, /requestHost:"gkoreli.com",bot:0/);
  assert.match(query, /datetime_lt:"2020-01-02T00:00:00Z"/);
  assert.equal(rumQuery('a'.repeat(32), day, false).includes('bot:0'), false);
  assert.throws(() => rumQuery('bad"account', day, true));
});

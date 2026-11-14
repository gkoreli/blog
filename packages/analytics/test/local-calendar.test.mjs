import test from 'node:test';
import assert from 'node:assert/strict';
import { queryStats, queryProjectedStats, parseStatsQuery } from '../.test-dist/stats.js';
import { createStatsHandler } from '../.test-dist/report-cache.js';
import { reportingStore, memoryReportCache } from './fixtures/reporting-store.mjs';
import { reportProjectionSql } from '../.test-dist/report-projection.js';
import { referralReportProjectionSql, REFERRAL_REPORT_RULES_JSON } from '../.test-dist/referral-report-projection.js';

function seed(fixture, instants) {
  const insert = fixture.sqlite.prepare(`INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,observed_at,referrer_state)
    VALUES(?,?,'browser','desktop',0,'browser','navigation-shaped-network-unlisted',?,'absent')`);
  for (const [i, at] of instants.entries()) insert.run('/event-' + i, i.toString(16).padStart(32, '0'), at);
}

test('local report selection and daily groups use the same midnight boundaries', async () => {
  const f = reportingStore();
  try {
    seed(f, ['2026-10-16 06:59:59','2026-10-16 07:00:00','2026-11-14 07:59:59','2026-11-14 08:00:00','2026-11-15 07:59:59','2026-11-15 08:00:00']);
    const q = { range: '30d', traffic: 'all', timeZone: 'America/Los_Angeles' }, now = new Date('2026-11-14T20:00:00Z');
    const report = await queryStats(f.db, q, now);
    assert.equal(report.period.startInclusive, '2026-10-16T07:00:00.000Z');
    assert.equal(report.period.endExclusive, '2026-11-15T08:00:00.000Z');
    assert.equal(report.period.timeZone, q.timeZone);
    assert.equal(report.totals.views, 4);
    assert.deepEqual(report.timeSeries.filter(b => b.views).map(b => [b.bucket,b.views]), [
      ['2026-10-16T07:00:00.000Z',1],['2026-11-13T08:00:00.000Z',1],['2026-11-14T08:00:00.000Z',2],
    ]);
    assert.deepEqual(await queryProjectedStats(f.db, q, now), report);
    f.sqlite.prepare(reportProjectionSql('range')).run(0, Number.MAX_SAFE_INTEGER);
    f.sqlite.prepare(referralReportProjectionSql()).run(0, Number.MAX_SAFE_INTEGER, REFERRAL_REPORT_RULES_JSON);
    const batches = f.batches();
    assert.deepEqual(await queryProjectedStats(f.db, q, now), report);
    assert.equal(f.batches() - batches, 1, 'the complete projection serves one two-statement batch');
  } finally { f.sqlite.close(); }
});

test('a repeated local hour remains two distinct UTC buckets', async () => {
  const f = reportingStore();
  try {
    seed(f, ['2026-11-01 08:15:00','2026-11-01 09:15:00']);
    const r = await queryStats(f.db, { range: '7d', traffic: 'all', timeZone: 'America/Los_Angeles' }, new Date('2026-11-02T20:00:00Z'));
    assert.deepEqual(r.timeSeries.filter(b => b.views).map(b => b.bucket), ['2026-11-01T08:00:00.000Z','2026-11-01T09:00:00.000Z']);
    assert.equal(r.timeSeries.filter(b => b.bucket >= '2026-11-01T07:00:00.000Z' && b.bucket < '2026-11-02T08:00:00.000Z').length, 25);
  } finally { f.sqlite.close(); }
});

test('identifier totals remain distinct while a local day can span UTC rotations', async () => {
  const f = reportingStore();
  try {
    seed(f, ['2026-11-13 23:59:59','2026-11-14 00:00:00','2026-11-14 08:00:00']);
    f.sqlite.prepare('UPDATE page_observations SET daily_client_id=? WHERE path IN (?,?)').run('1'.repeat(32),'/event-1','/event-2');
    const before=f.sqlite.prepare('SELECT observed_at,daily_client_id FROM page_observations ORDER BY id').all();
    const r=await queryStats(f.db,{range:'30d',traffic:'all',timeZone:'America/Los_Angeles'},new Date('2026-11-14T20:00:00Z'));
    assert.equal(r.totals.dailyClients,2);
    assert.deepEqual(r.timeSeries.filter(b=>b.views).map(b=>[b.views,b.dailyClients]),[[2,2],[1,1]]);
    assert.equal(r.timeSeries.reduce((n,b)=>n+b.dailyClients,0),3);
    assert.deepEqual(f.sqlite.prepare('SELECT observed_at,daily_client_id FROM page_observations ORDER BY id').all(),before);
  }finally{f.sqlite.close();}
});

for (const [zone, input, expected] of [
  ['Asia/Kolkata',['2026-11-14 18:45:00','2026-11-14 19:05:00','2026-11-14 19:30:00'],[['2026-11-14T18:30:00.000Z',2],['2026-11-14T19:30:00.000Z',1]]],
  ['Asia/Kathmandu',['2026-11-14 18:20:00','2026-11-14 18:59:00','2026-11-14 19:15:00'],[['2026-11-14T18:15:00.000Z',2],['2026-11-14T19:15:00.000Z',1]]],
  ['Australia/Lord_Howe',['2026-10-03 15:29:59','2026-10-03 15:30:00','2026-10-03 15:45:00','2026-10-03 16:00:00'],[['2026-10-03T14:30:00.000Z',1],['2026-10-03T15:30:00.000Z',2],['2026-10-03T16:00:00.000Z',1]]],
]) test('SQL and calendar agree for ' + zone, async () => {
  const f = reportingStore();
  try {
    seed(f, input);
    const now = new Date(zone === 'Australia/Lord_Howe' ? '2026-10-04T04:00:00Z' : '2026-11-15T05:00:00Z');
    const r = await queryStats(f.db, { range: '7d', traffic: 'all', timeZone: zone }, now);
    assert.deepEqual(r.timeSeries.filter(b => b.views).map(b => [b.bucket,b.views]), expected);
    assert.equal(r.timeSeries.reduce((n,b) => n+b.views,0), input.length);
  } finally { f.sqlite.close(); }
});

test('timezone validation precedes database/cache work and aliases share one key', async () => {
  assert.equal(typeof parseStatsQuery(new URLSearchParams('timeZone=No%2FSuchZone')), 'string');
  assert.equal(typeof parseStatsQuery(new URLSearchParams('timeZone=UTC&timeZone=US%2FPacific')), 'string');
  const store = memoryReportCache(); let loads = 0;
  const handler = createStatsHandler(store, async () => { loads++; return Response.json({ ok: true }); }, { now: () => Date.parse('2026-11-14T12:00:00Z') });
  const request = zone => new Request('https://site.example/api/stats?timeZone=' + encodeURIComponent(zone));
  assert.equal((await handler(request('bad-zone'), {})).status, 400); assert.equal(loads, 0);
  await handler(request('US/Pacific'), {}); await handler(request('America/Los_Angeles'), {}); assert.equal(loads, 1);
  await handler(request('UTC'), {}); assert.equal(loads, 2);
});

test('a zoned cached report expires at its own midnight and cannot leak across calendars', async () => {
  const store = memoryReportCache(); let loads = 0, clock = Date.parse('2026-11-14T07:59:30Z');
  const handler = createStatsHandler(store, async () => Response.json({ load: ++loads }), { now: () => clock });
  const local = new Request('https://site.example/api/stats?timeZone=America%2FLos_Angeles');
  const first = await handler(local, {}); assert.equal(first.headers.get('Expires'), 'Sat, 14 Nov 2026 08:00:00 GMT');
  assert.equal((await handler(local, {})).headers.get('X-Stats-Cache'), 'HIT');
  clock = Date.parse('2026-11-14T08:00:00Z'); assert.equal((await handler(local, {})).headers.get('X-Stats-Cache'), 'MISS');
  assert.equal(loads, 2);
});

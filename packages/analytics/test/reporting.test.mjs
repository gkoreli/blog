import test from 'node:test';
import assert from 'node:assert/strict';
import { createD1ReportAdmission, createAnalyticsReportHandler, renderAnalyticsReport } from '../.test-dist/reporting.js';
import { reportingStore, memoryReportCache } from './fixtures/reporting-store.mjs';

const now = new Date('2026-11-13T12:00:00Z');
const policy = { maxColdFillsPerDay: 2, maxReportedRowsReadPerDay: 100 };

test('durable admission serializes independent callers, charges once and denies later work at the read threshold', async () => {
  const f = reportingStore();
  try {
    const a = createD1ReportAdmission(f.db, policy), b = createD1ReportAdmission(f.db, policy);
    const reserved = await Promise.all([a.reserve(now), b.reserve(now)]);
    assert.equal(reserved.filter(Boolean).length, 1);
    const first = reserved.find(Boolean);
    await Promise.all([first.complete({ reportedRowsRead: 40 }), first.complete({ reportedRowsRead: 90 })]);
    assert.equal(f.sqlite.prepare('SELECT reported_rows_read FROM analytics_report_budget_days').get().reported_rows_read, 40);
    const second = await b.reserve(now); assert.ok(second);
    await second.complete({ reportedRowsRead: 70 });
    assert.equal(await a.reserve(now), null);
    assert.deepEqual({ ...f.sqlite.prepare('SELECT cold_fills,reported_rows_read,unmetered_fills FROM analytics_report_budget_days').get() },
      { cold_fills: 2, reported_rows_read: 110, unmetered_fills: 0 });
    assert.ok(await a.reserve(new Date('2026-11-14T00:00:00Z')));
  } finally { f.sqlite.close(); }
});

test('unknown meters, abandoned/failed settlements and a conflicting policy never silently reopen the day', async () => {
  for (const condition of ['unknown', 'abandoned', 'settlement-failure', 'policy-conflict']) {
    const f = reportingStore();
    try {
      const a = createD1ReportAdmission(f.db, policy);
      const reservation = await a.reserve(now); assert.ok(reservation);
      if (condition === 'unknown') await reservation.complete({ reportedRowsRead: null });
      if (condition === 'policy-conflict') await reservation.complete({ reportedRowsRead: 1 });
      if (condition === 'settlement-failure') {
        const batch = f.db.batch;
        f.db.batch = async () => { throw Error('Synthetic settlement failure'); };
        await assert.rejects(reservation.complete({ reportedRowsRead: 1 }));
        f.db.batch = batch;
      }
      const next = condition === 'policy-conflict' ? createD1ReportAdmission(f.db, { ...policy, maxColdFillsPerDay: 3 }) : a;
      assert.equal(await next.reserve(now), null, condition);
      assert.ok(await next.reserve(new Date('2026-11-14T00:00:00Z')), condition);
    } finally { f.sqlite.close(); }
  }
});

test('cached/coalesced complete reports spend one reservation; invalid scopes spend none and errors remain unavailable', async () => {
  const f = reportingStore(), cache = memoryReportCache();
  try {
    const serve = createAnalyticsReportHandler(cache, { now: () => now.getTime(),
      admission: env => createD1ReportAdmission(env.DB, policy), allowedRanges: ['7d', '30d'] });
    const request = query => new Request('https://operator.example/api/stats' + (query ? '?' + query : ''));
    assert.equal((await serve(request('range=90d'), { DB: f.db })).status, 400);
    assert.equal(f.batches(), 0);
    const [a, b] = await Promise.all([serve(request(), { DB: f.db }), serve(request('traffic=all'), { DB: f.db })]);
    assert.equal(a.status, 200); assert.equal(b.status, 200);
    assert.deepEqual(await a.clone().json(), await b.json());
    const hit = await serve(request(), { DB: f.db });
    assert.equal(hit.headers.get('X-Stats-Cache'), 'HIT');
    assert.equal(f.sqlite.prepare('SELECT cold_fills FROM analytics_report_budget_days').get().cold_fills, 1);
    const report = await a.json();
    report.byPath = [{ path: '<script>alert("x")</script>', views: 1, dailyClients: 1 }];
    report.filters.path = '/notes?x="<&';
    const html = renderAnalyticsReport(report, { title: '<unsafe>' });
    assert.ok(html.includes('&lt;unsafe&gt;')); assert.ok(!html.includes('<script'));
    assert.ok(html.includes('rotating daily identifiers')); assert.ok(html.includes('not people or sessions'));
    assert.ok(html.includes('Browser signals do not authenticate a human'));
    assert.ok(html.includes('path=%2Fnotes%3Fx%3D%22%3C%26'));
  } finally { f.sqlite.close(); }
});

test('a failed report with unknown work closes future fills while existing cached reports remain available', async () => {
  const f = reportingStore(), cache = memoryReportCache();
  try {
    const serve = createAnalyticsReportHandler(cache, { now: () => now.getTime(), admission: env => createD1ReportAdmission(env.DB, policy) });
    const request = path => new Request('https://operator.example/api/stats?path=' + path);
    assert.equal((await serve(request('/cached'), { DB: f.db })).status, 200);
    const original = f.db.batch;
    let calls = 0;
    f.db.batch = statements => { if (++calls === 2) throw Error('Synthetic report failure'); return original(statements); };
    assert.equal((await serve(request('/uncached'), { DB: f.db })).status, 503);
    f.db.batch = original;
    assert.equal(f.sqlite.prepare('SELECT unmetered_fills FROM analytics_report_budget_days').get().unmetered_fills, 1);
    assert.equal((await serve(request('/cached'), { DB: f.db })).headers.get('X-Stats-Cache'), 'HIT');
    assert.equal((await serve(request('/another'), { DB: f.db })).status, 503);
  } finally { f.sqlite.close(); }
});

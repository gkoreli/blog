import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

import { classifyTraffic } from '../.test-dist/classify.js';
import { completeTimeSeries, createStatsWindow } from '../.test-dist/dates.js';
import { isEligiblePageResponse } from '../.test-dist/eligibility.js';
import { createDailyClientId } from '../.test-dist/hash.js';
import { observePageResponse } from '../.test-dist/index.js';
import { extractRequestMetadata } from '../.test-dist/metadata.js';
import { queryStats } from '../.test-dist/stats.js';

const html = new Response('<!doctype html>', {
  status: 200,
  headers: { 'Content-Type': 'text/html; charset=utf-8' },
});

function request(path, init = {}) {
  return new Request(`https://gkoreli.com${path}`, init);
}

class D1Statement {
  constructor(database, sql, values = []) {
    this.database = database;
    this.sql = sql;
    this.values = values;
  }

  bind(...values) {
    return new D1Statement(this.database, this.sql, values);
  }

  execute() {
    return { results: this.database.prepare(this.sql).all(...this.values) };
  }

  run() {
    return this.database.prepare(this.sql).run(...this.values);
  }
}

class D1Adapter {
  constructor(database) {
    this.database = database;
  }

  prepare(sql) {
    return new D1Statement(this.database, sql);
  }

  async batch(statements) {
    return statements.map(statement => statement.execute());
  }
}

function analyticsDatabase() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'));
  return { sqlite, d1: new D1Adapter(sqlite) };
}

function insertObservation(sqlite, observation) {
  sqlite.prepare(`INSERT INTO page_observations (
    path, referrer_host, country, daily_client_id, traffic_class,
    agent_name, device_type, is_owner, observed_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    observation.path,
    observation.referrerHost ?? null,
    observation.country ?? null,
    observation.dailyClientId,
    observation.trafficClass,
    observation.agentName ?? null,
    observation.deviceType ?? 'desktop',
    observation.isOwner ? 1 : 0,
    observation.observedAt,
  );
}

test('eligibility accepts only successful, non-prefetch HTML GET page responses', () => {
  assert.equal(isEligiblePageResponse(request('/article'), html), true);
  assert.equal(isEligiblePageResponse(request('/api/stats'), html), false);
  assert.equal(isEligiblePageResponse(request('/stats'), html), false);
  assert.equal(isEligiblePageResponse(request('/article', { method: 'HEAD' }), html), false);
  assert.equal(isEligiblePageResponse(request('/article', { headers: { Purpose: 'prefetch' } }), html), false);
  assert.equal(isEligiblePageResponse(request('/article'), new Response('no', { status: 500, headers: { 'Content-Type': 'text/html' } })), false);
  assert.equal(isEligiblePageResponse(request('/article'), new Response('# markdown', { headers: { 'Content-Type': 'text/markdown' } })), false);
});

test('AI rules have priority and classifiers return nullable named matches', () => {
  assert.deepEqual(classifyTraffic('Mozilla/5.0 Chrome/130'), { trafficClass: 'browser', agentName: null });
  assert.deepEqual(classifyTraffic('Googlebot/2.1'), { trafficClass: 'bot', agentName: 'Googlebot' });
  assert.deepEqual(classifyTraffic('custom-crawler/1.0'), { trafficClass: 'bot', agentName: null });
  assert.deepEqual(classifyTraffic('Googlebot GPTBot/1.0'), { trafficClass: 'ai', agentName: 'GPTBot' });
  assert.deepEqual(classifyTraffic('ChatGPT-User/1.0'), { trafficClass: 'ai', agentName: 'ChatGPT-User' });
  assert.deepEqual(classifyTraffic('Google-CloudVertexBot/1.0'), { trafficClass: 'ai', agentName: 'Google-CloudVertexBot' });
});

test('daily client HMAC is stable and separated by every scoped input', async () => {
  const base = {
    masterKey: 'secret-one',
    siteHost: 'gkoreli.com',
    utcDate: '2026-08-25',
    ip: '203.0.113.1',
    userAgent: 'Browser/1.0',
  };
  const expected = await createDailyClientId(base);
  assert.match(expected, /^[0-9a-f]{32}$/);
  assert.equal(await createDailyClientId(base), expected);

  const variants = [
    { ...base, masterKey: 'secret-two' },
    { ...base, siteHost: 'www.gkoreli.com' },
    { ...base, utcDate: '2026-08-26' },
    { ...base, ip: '203.0.113.2' },
    { ...base, userAgent: 'Browser/2.0' },
  ];
  for (const variant of variants) assert.notEqual(await createDailyClientId(variant), expected);
});

test('UTC presets contain exact dates and required granularity', () => {
  const now = new Date('2026-08-25T13:42:30.000Z');
  const seven = createStatsWindow('7d', now);
  const thirty = createStatsWindow('30d', now);
  const ninety = createStatsWindow('90d', now);

  assert.deepEqual([seven.start, seven.end, seven.granularity], ['2026-08-19', '2026-08-25', 'hour']);
  assert.deepEqual([thirty.start, thirty.end, thirty.granularity], ['2026-07-27', '2026-08-25', 'day']);
  assert.deepEqual([ninety.start, ninety.end, ninety.granularity], ['2026-05-28', '2026-08-25', 'day']);
  assert.equal(completeTimeSeries(seven, [], now).length, 158);
  assert.equal(completeTimeSeries(thirty, [], now).length, 30);
  assert.equal(completeTimeSeries(ninety, [], now).length, 90);
});

test('bucket completion preserves observations and zero-fills missing UTC buckets', () => {
  const now = new Date('2026-08-25T02:15:00.000Z');
  const window = createStatsWindow('7d', now);
  const points = completeTimeSeries(window, [
    { bucket: '2026-08-25T01:00:00Z', views: 3, dailyClients: 2 },
  ], now);

  assert.deepEqual(points.at(-2), { bucket: '2026-08-25T01:00:00Z', views: 3, dailyClients: 2 });
  assert.deepEqual(points.at(-1), { bucket: '2026-08-25T02:00:00Z', views: 0, dailyClients: 0 });
  assert.equal(points.filter((point) => point.views === 0).length, points.length - 1);
});

test('request metadata keeps only the page path, external referrer host, and coarse request fields', () => {
  const observed = request('/article?private=yes', {
    headers: {
      'CF-Connecting-IP': '203.0.113.10',
      Referer: 'https://www.example.com/private/path?token=secret',
      'User-Agent': 'Browser/1.0',
    },
  });
  Object.defineProperty(observed, 'cf', { value: { country: 'GE' } });

  assert.deepEqual(extractRequestMetadata(observed, '203.0.113.9, 203.0.113.10'), {
    path: '/article',
    siteHost: 'gkoreli.com',
    referrerHost: 'example.com',
    ip: '203.0.113.10',
    country: 'GE',
    userAgent: 'Browser/1.0',
    isOwner: true,
  });

  const selfReferral = request('/article', { headers: { Referer: 'https://www.gkoreli.com/about' } });
  assert.equal(extractRequestMetadata(selfReferral, undefined).referrerHost, null);
  const malformed = request('/article', { headers: { Referer: 'not a url' } });
  assert.equal(extractRequestMetadata(malformed, undefined).referrerHost, null);
});

test('edge observation schedules one constrained write and fails closed on a missing HMAC secret', async () => {
  const { sqlite, d1 } = analyticsDatabase();
  const observed = request('/article?ignored=yes', {
    headers: {
      'CF-Connecting-IP': '203.0.113.20',
      Referer: 'https://example.com/source/path',
      'User-Agent': 'GPTBot/1.0',
    },
  });
  Object.defineProperty(observed, 'cf', { value: { country: 'US' } });
  const pending = [];
  const context = { waitUntil(promise) { pending.push(promise); } };

  observePageResponse(observed, html, {
    DB: d1,
    ANALYTICS_HASH_KEY: 'test-key',
    OWNER_IPS: '',
  }, context);
  assert.equal(pending.length, 1);
  await pending[0];

  const row = sqlite.prepare('SELECT * FROM page_observations').get();
  assert.equal(row.path, '/article');
  assert.equal(row.referrer_host, 'example.com');
  assert.equal(row.traffic_class, 'ai');
  assert.equal(row.agent_name, 'GPTBot');
  assert.match(row.daily_client_id, /^[0-9a-f]{32}$/);

  const missingSecret = [];
  observePageResponse(observed, html, {
    DB: d1,
    ANALYTICS_HASH_KEY: undefined,
    OWNER_IPS: '',
  }, { waitUntil(promise) { missingSecret.push(promise); } });
  assert.equal(missingSecret.length, 1);
  await assert.rejects(missingSecret[0], /ANALYTICS_HASH_KEY must not be empty/);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM page_observations').get().count, 1);
});

test('stats queries enforce one UTC window, class partition, owner exclusion, and legacy isolation', async () => {
  const { sqlite, d1 } = analyticsDatabase();
  sqlite.exec('CREATE TABLE page_views (id INTEGER PRIMARY KEY, path TEXT NOT NULL)');
  sqlite.prepare('INSERT INTO page_views (path) VALUES (?)').run('/legacy-sentinel');

  insertObservation(sqlite, {
    path: '/before-window',
    dailyClientId: 'e'.repeat(32),
    trafficClass: 'browser',
    observedAt: '2026-07-26 23:59:59',
  });
  insertObservation(sqlite, {
    path: '/article',
    referrerHost: 'example.com',
    country: 'US',
    dailyClientId: 'a'.repeat(32),
    trafficClass: 'browser',
    observedAt: '2026-07-27 00:00:00',
  });
  insertObservation(sqlite, {
    path: '/article',
    country: 'US',
    dailyClientId: 'a'.repeat(32),
    trafficClass: 'browser',
    observedAt: '2026-07-27 01:00:00',
  });
  insertObservation(sqlite, {
    path: '/bot',
    dailyClientId: 'b'.repeat(32),
    trafficClass: 'bot',
    agentName: 'Googlebot',
    observedAt: '2026-08-20 12:00:00',
  });
  insertObservation(sqlite, {
    path: '/ai',
    dailyClientId: 'c'.repeat(32),
    trafficClass: 'ai',
    agentName: 'GPTBot',
    observedAt: '2026-08-25 11:00:00',
  });
  insertObservation(sqlite, {
    path: '/owner',
    dailyClientId: 'd'.repeat(32),
    trafficClass: 'browser',
    isOwner: true,
    observedAt: '2026-08-25 11:30:00',
  });
  insertObservation(sqlite, {
    path: '/end-boundary',
    dailyClientId: 'f'.repeat(32),
    trafficClass: 'browser',
    observedAt: '2026-08-26 00:00:00',
  });

  const now = new Date('2026-08-25T12:00:00.000Z');
  const browser = await queryStats(d1, { range: '30d', traffic: 'browser' }, now);
  const bot = await queryStats(d1, { range: '30d', traffic: 'bot' }, now);
  const ai = await queryStats(d1, { range: '30d', traffic: 'ai' }, now);
  const all = await queryStats(d1, { range: '30d', traffic: 'all' }, now);

  assert.deepEqual([browser.totals.views, bot.totals.views, ai.totals.views, all.totals.views], [2, 1, 1, 4]);
  assert.equal(all.totals.views, browser.totals.views + bot.totals.views + ai.totals.views);
  assert.equal(all.totals.dailyClients, 3);
  assert.equal(all.timeSeries.reduce((sum, point) => sum + point.views, 0), all.totals.views);
  assert.equal(all.byPath.reduce((sum, row) => sum + row.views, 0), all.totals.views);
  assert.equal(all.timeSeries.length, 30);
  assert.deepEqual([all.period.start, all.period.end], ['2026-07-27', '2026-08-25']);

  const aiAllTime = await queryStats(d1, { range: 'all', traffic: 'ai' }, now);
  const emptyAllTime = await queryStats(d1, { range: 'all', traffic: 'ai', path: '/missing' }, now);
  assert.equal(aiAllTime.period.start, '2026-07-26');
  assert.equal(emptyAllTime.period.start, aiAllTime.period.start);
  assert.equal(emptyAllTime.totals.views, 0);
});

test('legacy continuity migration preserves source rows and backfills a source-marked read model', () => {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(`
    CREATE TABLE page_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT NOT NULL,
      referrer TEXT,
      country TEXT,
      city TEXT,
      continent TEXT,
      visitor_hash TEXT,
      visitor_type INTEGER DEFAULT 0,
      is_owner INTEGER DEFAULT 0,
      device_type TEXT DEFAULT 'desktop',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
  sqlite.exec(readFileSync(new URL('../migrations/0001_create_page_observations.sql', import.meta.url), 'utf8'));
  sqlite.prepare(`INSERT INTO page_observations (
    path, referrer_host, country, daily_client_id, traffic_class,
    agent_name, device_type, is_owner, observed_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    '/edge',
    null,
    'US',
    'f'.repeat(32),
    'browser',
    null,
    'desktop',
    0,
    '2026-08-26 15:00:00',
  );
  sqlite.prepare(`INSERT INTO page_views (
    path, referrer, country, city, continent, visitor_hash,
    visitor_type, is_owner, device_type, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    '/legacy',
    'reddit.com/r/test',
    'US',
    'Portland',
    'NA',
    'a'.repeat(16),
    0,
    0,
    'mobile',
    '2026-03-07 01:00:00',
  );
  sqlite.prepare(`INSERT INTO page_views (
    path, referrer, country, city, continent, visitor_hash,
    visitor_type, is_owner, device_type, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    '/legacy-ai',
    null,
    'DE',
    null,
    'EU',
    'b'.repeat(16),
    2,
    0,
    'desktop',
    '2026-03-08 01:00:00',
  );

  sqlite.exec(readFileSync(new URL('../migrations/0002_backfill_legacy_page_views.sql', import.meta.url), 'utf8'));

  assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM page_views').get().count, 2);
  assert.deepEqual(
    sqlite.prepare(`SELECT path, referrer_host, daily_client_id, traffic_class,
      observation_source, source_event_id
      FROM page_observations ORDER BY observed_at`).all().map(row => ({ ...row })),
    [
      {
        path: '/legacy',
        referrer_host: 'reddit.com',
        daily_client_id: 'a'.repeat(32),
        traffic_class: 'browser',
        observation_source: 'beacon',
        source_event_id: 1,
      },
      {
        path: '/legacy-ai',
        referrer_host: null,
        daily_client_id: 'b'.repeat(32),
        traffic_class: 'ai',
        observation_source: 'beacon',
        source_event_id: 2,
      },
      {
        path: '/edge',
        referrer_host: null,
        daily_client_id: 'f'.repeat(32),
        traffic_class: 'browser',
        observation_source: 'edge',
        source_event_id: null,
      },
    ],
  );
});

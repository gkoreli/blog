import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

import { classifyTraffic, KNOWN_AGENT_NAMES } from '../.test-dist/classify.js';
import { completeTimeSeries, createStatsWindow } from '../.test-dist/dates.js';
import { isEligiblePageResponse } from '../.test-dist/eligibility.js';
import { createDailyClientId } from '../.test-dist/hash.js';
import { observePageResponse } from '../.test-dist/index.js';
import { extractRequestMetadata } from '../.test-dist/metadata.js';
import { HOSTING_ASNS, isHostingAsn } from '../.test-dist/networks.js';
import { partitionPredicate } from '../.test-dist/partition.js';
import { handleStats, queryStats } from '../.test-dist/stats.js';

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
    agent_name, device_type, is_owner, observation_source, asn, as_org,
    sec_fetch_mode, sec_fetch_dest, sec_fetch_site, sec_fetch_user,
    accepts_html, has_accept_language, observed_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    observation.path,
    observation.referrerHost ?? null,
    observation.country ?? null,
    observation.dailyClientId,
    observation.trafficClass,
    observation.agentName ?? null,
    observation.deviceType ?? 'desktop',
    observation.isOwner ? 1 : 0,
    observation.observationSource ?? 'edge',
    observation.asn ?? null,
    observation.asOrg ?? null,
    observation.secFetchMode ?? null,
    observation.secFetchDest ?? null,
    observation.secFetchSite ?? null,
    observation.secFetchUser ?? null,
    observation.acceptsHtml ?? null,
    observation.hasAcceptLanguage ?? null,
    observation.observedAt,
  );
}

const NAVIGATION_EVIDENCE = {
  asn: 64512,
  secFetchMode: 'navigate',
  secFetchDest: 'document',
  acceptsHtml: 1,
  hasAcceptLanguage: 1,
};

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
  assert.equal(KNOWN_AGENT_NAMES.has('GPTBot'), true);
  assert.equal(KNOWN_AGENT_NAMES.has('Googlebot'), true);
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

test('request metadata extracts bounded request evidence and reports absent values', () => {
  const observed = request('/article?private=yes', {
    headers: {
      'CF-Connecting-IP': '203.0.113.10',
      Referer: 'https://www.example.com/private/path?token=secret',
      'User-Agent': 'Browser/1.0',
      'Sec-Fetch-Mode': 'Navigate',
      'Sec-Fetch-Dest': 'DOCUMENT',
      'Sec-Fetch-Site': 'Same-Origin',
      'Sec-Fetch-User': '?1',
      Accept: 'application/xhtml+xml, text/html;q=0.9',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });
  const longOrganization = `  ${'Cloud Provider '.repeat(20)}  `;
  Object.defineProperty(observed, 'cf', { value: {
    country: 'GE',
    asn: 16509,
    asOrganization: longOrganization,
  } });

  assert.deepEqual(extractRequestMetadata(observed, '203.0.113.9, 203.0.113.10'), {
    path: '/article',
    siteHost: 'gkoreli.com',
    referrerHost: 'example.com',
    ip: '203.0.113.10',
    country: 'GE',
    userAgent: 'Browser/1.0',
    isOwner: true,
    asn: 16509,
    asOrg: longOrganization.trim().slice(0, 128),
    secFetchMode: 'navigate',
    secFetchDest: 'document',
    secFetchSite: 'same-origin',
    secFetchUser: 1,
    acceptsHtml: 1,
    hasAcceptLanguage: 1,
  });

  const selfReferral = request('/article', { headers: { Referer: 'https://www.gkoreli.com/about' } });
  assert.equal(extractRequestMetadata(selfReferral, undefined).referrerHost, null);
  const malformed = request('/article', { headers: { Referer: 'not a url' } });
  assert.equal(extractRequestMetadata(malformed, undefined).referrerHost, null);

  const absent = extractRequestMetadata(request('/absent'), undefined);
  assert.deepEqual({
    asn: absent.asn,
    asOrg: absent.asOrg,
    secFetchMode: absent.secFetchMode,
    secFetchDest: absent.secFetchDest,
    secFetchSite: absent.secFetchSite,
    secFetchUser: absent.secFetchUser,
    acceptsHtml: absent.acceptsHtml,
    hasAcceptLanguage: absent.hasAcceptLanguage,
  }, {
    asn: null,
    asOrg: null,
    secFetchMode: null,
    secFetchDest: null,
    secFetchSite: null,
    secFetchUser: null,
    acceptsHtml: null,
    hasAcceptLanguage: 0,
  });

  const negative = extractRequestMetadata(request('/negative', { headers: {
    'Sec-Fetch-User': '?0',
    Accept: 'application/json',
    'Accept-Language': '   ',
  } }), undefined);
  assert.deepEqual(
    [negative.secFetchUser, negative.acceptsHtml, negative.hasAcceptLanguage],
    [0, 0, 0],
  );

  const wildcard = extractRequestMetadata(request('/wildcard', { headers: {
    Accept: '*/*',
    'Sec-Fetch-Site': 'A'.repeat(40),
  } }), undefined);
  assert.equal(wildcard.acceptsHtml, 1);
  assert.equal(wildcard.secFetchSite, 'a'.repeat(32));
});

test('edge observation schedules one constrained write and fails closed on a missing HMAC secret', async () => {
  const { sqlite, d1 } = analyticsDatabase();
  const observed = request('/article?ignored=yes', {
    headers: {
      'CF-Connecting-IP': '203.0.113.20',
      Referer: 'https://example.com/source/path',
      'User-Agent': 'GPTBot/1.0',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Site': 'cross-site',
      'Sec-Fetch-User': '?1',
      Accept: 'text/html',
      'Accept-Language': 'en',
    },
  });
  Object.defineProperty(observed, 'cf', { value: {
    country: 'US',
    asn: 16509,
    asOrganization: 'Amazon.com, Inc.',
  } });
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
  assert.equal(row.asn, 16509);
  assert.equal(row.as_org, 'Amazon.com, Inc.');
  assert.equal(row.sec_fetch_mode, 'navigate');
  assert.equal(row.sec_fetch_dest, 'document');
  assert.equal(row.sec_fetch_site, 'cross-site');
  assert.equal(row.sec_fetch_user, 1);
  assert.equal(row.accepts_html, 1);
  assert.equal(row.has_accept_language, 1);
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

test('hosting list excludes relay/CDN ASNs and partition SQL inlines only validated numbers', () => {
  for (const prohibited of [15169, 13335, 36183, 20940, 54113]) {
    assert.equal(HOSTING_ASNS.has(prohibited), false);
    assert.equal(isHostingAsn(prohibited), false);
  }
  assert.equal(isHostingAsn(16509), true);
  assert.equal(isHostingAsn(null), false);
  const browser = partitionPredicate('browser');
  assert.equal(browser.values.length, 0);
  assert.match(browser.sql, /asn NOT IN \([\d, ]+\)/);
  assert.match(browser.sql, /observation_source = 'beacon'/);
});

test('browser partition keeps beacons, unchecked edge rows, and navigation-shaped edge rows while each failed signal demotes', async () => {
  const { sqlite, d1 } = analyticsDatabase();
  const observedAt = '2026-09-03 12:00:00';
  insertObservation(sqlite, {
    path: '/beacon',
    dailyClientId: 'a'.repeat(32),
    trafficClass: 'browser',
    observationSource: 'beacon',
    observedAt,
  });
  insertObservation(sqlite, {
    path: '/edge-navigation',
    dailyClientId: 'b'.repeat(32),
    trafficClass: 'browser',
    ...NAVIGATION_EVIDENCE,
    observedAt,
  });
  insertObservation(sqlite, {
    path: '/unchecked-edge',
    dailyClientId: 'c'.repeat(32),
    trafficClass: 'browser',
    observedAt,
  });
  const failures = [
    { path: '/bad-mode', ...NAVIGATION_EVIDENCE, secFetchMode: 'cors' },
    { path: '/bad-dest', ...NAVIGATION_EVIDENCE, secFetchDest: 'iframe' },
    { path: '/no-html', ...NAVIGATION_EVIDENCE, acceptsHtml: 0 },
    { path: '/no-language', ...NAVIGATION_EVIDENCE, hasAcceptLanguage: 0 },
    { path: '/hosting', ...NAVIGATION_EVIDENCE, asn: 16509 },
  ];
  failures.forEach((failure, index) => insertObservation(sqlite, {
    path: failure.path,
    dailyClientId: String(index + 2).repeat(32),
    trafficClass: 'browser',
    ...failure,
    observedAt,
  }));

  const now = new Date('2026-09-03T13:00:00.000Z');
  const browsers = await queryStats(d1, { range: '7d', traffic: 'browser' }, now);
  const browserlike = await queryStats(d1, { range: '7d', traffic: 'browserlike' }, now);
  assert.deepEqual(browsers.byPath.map((row) => row.path).sort(), ['/beacon', '/edge-navigation', '/unchecked-edge']);
  assert.deepEqual(browserlike.byPath.map((row) => row.path).sort(), failures.map((row) => row.path).sort());
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
    ...NAVIGATION_EVIDENCE,
    observedAt: '2026-07-27 00:00:00',
  });
  insertObservation(sqlite, {
    path: '/article',
    country: 'US',
    dailyClientId: 'a'.repeat(32),
    trafficClass: 'browser',
    ...NAVIGATION_EVIDENCE,
    observedAt: '2026-07-27 01:00:00',
  });
  insertObservation(sqlite, {
    path: '/browserlike',
    dailyClientId: '9'.repeat(32),
    trafficClass: 'browser',
    ...NAVIGATION_EVIDENCE,
    hasAcceptLanguage: 0,
    observedAt: '2026-08-21 12:00:00',
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
  const browserlike = await queryStats(d1, { range: '30d', traffic: 'browserlike' }, now);
  const all = await queryStats(d1, { range: '30d', traffic: 'all' }, now);

  assert.deepEqual(
    [browser.totals.views, browserlike.totals.views, bot.totals.views, ai.totals.views, all.totals.views],
    [2, 1, 1, 1, 5],
  );
  assert.equal(
    all.totals.views,
    browser.totals.views + browserlike.totals.views + bot.totals.views + ai.totals.views,
  );
  assert.equal(all.totals.dailyClients, 4);
  assert.equal(all.timeSeries.reduce((sum, point) => sum + point.views, 0), all.totals.views);
  assert.equal(all.byPath.reduce((sum, row) => sum + row.views, 0), all.totals.views);
  assert.equal(all.timeSeries.length, 30);
  assert.deepEqual([all.period.start, all.period.end], ['2026-07-27', '2026-08-25']);
  assert.deepEqual(all.filters, { traffic: 'all', range: '30d', path: null, agent: null });
  assert.equal(
    all.totals.unattributedViews + all.byReferrer.reduce((sum, row) => sum + row.views, 0),
    all.totals.views,
  );

  const aiAllTime = await queryStats(d1, { range: 'all', traffic: 'ai' }, now);
  const emptyAllTime = await queryStats(d1, { range: 'all', traffic: 'ai', path: '/missing' }, now);
  assert.equal(aiAllTime.period.start, '2026-07-26');
  assert.equal(emptyAllTime.period.start, aiAllTime.period.start);
  assert.equal(emptyAllTime.totals.views, 0);
});

test('path and agent filters scope every aggregate and API rejects unknown or conflicting agents', async () => {
  const { sqlite, d1 } = analyticsDatabase();
  const rows = [
    {
      path: '/article', referrerHost: 'example.com', country: 'US', dailyClientId: 'a'.repeat(32),
      trafficClass: 'ai', agentName: 'GPTBot', deviceType: 'desktop', observedAt: '2026-09-03 10:00:00',
    },
    {
      path: '/other', country: 'DE', dailyClientId: 'b'.repeat(32), trafficClass: 'ai',
      agentName: 'GPTBot', deviceType: 'mobile', observedAt: '2026-09-03 11:00:00',
    },
    {
      path: '/article', referrerHost: 'search.example', country: 'CA', dailyClientId: 'c'.repeat(32),
      trafficClass: 'bot', agentName: 'Googlebot', deviceType: 'tablet', observedAt: '2026-09-03 12:00:00',
    },
  ];
  rows.forEach((row) => insertObservation(sqlite, row));
  const now = new Date('2026-09-03T13:00:00.000Z');

  const path = await queryStats(d1, { range: '7d', traffic: 'all', path: '/article' }, now);
  assert.equal(path.totals.views, 2);
  assert.deepEqual(path.filters, { traffic: 'all', range: '7d', path: '/article', agent: null });
  assert.deepEqual(path.byPath.map((row) => row.path), ['/article']);
  assert.deepEqual(path.byCountry.map((row) => row.country).sort(), ['CA', 'US']);
  assert.deepEqual(path.byReferrer.map((row) => row.referrerHost).sort(), ['example.com', 'search.example']);
  assert.deepEqual(path.byDevice.map((row) => row.deviceType).sort(), ['desktop', 'tablet']);
  assert.deepEqual(path.byAgent.map((row) => row.agentName).sort(), ['GPTBot', 'Googlebot']);
  assert.equal(path.timeSeries.reduce((sum, row) => sum + row.views, 0), 2);

  const agent = await queryStats(d1, { range: '7d', traffic: 'all', agent: 'GPTBot' }, now);
  assert.equal(agent.totals.views, 2);
  assert.deepEqual(agent.filters, { traffic: 'all', range: '7d', path: null, agent: 'GPTBot' });
  assert.deepEqual(agent.byPath.map((row) => row.path).sort(), ['/article', '/other']);
  assert.deepEqual(agent.byCountry.map((row) => row.country).sort(), ['DE', 'US']);
  assert.deepEqual(agent.byReferrer.map((row) => row.referrerHost), ['example.com']);
  assert.deepEqual(agent.byDevice.map((row) => row.deviceType).sort(), ['desktop', 'mobile']);
  assert.deepEqual(agent.byAgent.map((row) => row.agentName), ['GPTBot']);
  assert.equal(agent.timeSeries.reduce((sum, row) => sum + row.views, 0), 2);
  assert.equal(
    agent.totals.unattributedViews + agent.byReferrer.reduce((sum, row) => sum + row.views, 0),
    agent.totals.views,
  );

  const composed = await queryStats(d1, {
    range: '7d',
    traffic: 'ai',
    path: '/article',
    agent: 'GPTBot',
  }, now);
  assert.equal(composed.totals.views, 1);
  assert.deepEqual(composed.byPath.map((row) => row.path), ['/article']);
  assert.deepEqual(composed.byCountry.map((row) => row.country), ['US']);
  assert.deepEqual(composed.byReferrer.map((row) => row.referrerHost), ['example.com']);
  assert.deepEqual(composed.byDevice.map((row) => row.deviceType), ['desktop']);
  assert.deepEqual(composed.byAgent.map((row) => row.agentName), ['GPTBot']);
  assert.equal(composed.timeSeries.reduce((sum, row) => sum + row.views, 0), 1);

  const agentDefault = await handleStats(request('/api/stats?agent=GPTBot'), { DB: d1 });
  assert.equal(agentDefault.status, 200);
  assert.equal((await agentDefault.json()).filters.traffic, 'all');

  const browserConflict = await handleStats(request('/api/stats?agent=GPTBot&traffic=browser'), { DB: d1 });
  assert.equal(browserConflict.status, 400);
  assert.match((await browserConflict.json()).error, /cannot be combined/);
  const browserlikeConflict = await handleStats(request('/api/stats?agent=GPTBot&traffic=browserlike'), { DB: d1 });
  assert.equal(browserlikeConflict.status, 400);
  assert.match((await browserlikeConflict.json()).error, /cannot be combined/);
  const classConflict = await handleStats(request('/api/stats?agent=GPTBot&traffic=bot'), { DB: d1 });
  assert.equal(classConflict.status, 400);
  assert.match((await classConflict.json()).error, /cannot be combined/);
  const unknown = await handleStats(request('/api/stats?agent=UnknownBot'), { DB: d1 });
  assert.equal(unknown.status, 400);
  assert.match((await unknown.json()).error, /known matched User-Agent rule/);
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

  sqlite.exec(readFileSync(new URL('../migrations/0003_add_request_evidence.sql', import.meta.url), 'utf8'));
  const oldRows = sqlite.prepare(`SELECT asn, as_org, sec_fetch_mode, sec_fetch_dest,
    sec_fetch_site, sec_fetch_user, accepts_html, has_accept_language
    FROM page_observations ORDER BY id`).all();
  assert.equal(oldRows.length, 3);
  for (const row of oldRows) {
    assert.deepEqual({ ...row }, {
      asn: null,
      as_org: null,
      sec_fetch_mode: null,
      sec_fetch_dest: null,
      sec_fetch_site: null,
      sec_fetch_user: null,
      accepts_html: null,
      has_accept_language: null,
    });
  }
  assert.throws(
    () => sqlite.prepare(`UPDATE page_observations SET accepts_html = 2 WHERE path = '/edge'`).run(),
    /CHECK constraint failed/,
  );
});

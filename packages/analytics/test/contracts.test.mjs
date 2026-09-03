import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

import { classifyTraffic, KNOWN_AGENT_NAMES } from '../.test-dist/classify.js';
import { completeTimeSeries, createStatsWindow } from '../.test-dist/dates.js';
import { isEligiblePageResponse } from '../.test-dist/eligibility.js';
import { createDailyClientId } from '../.test-dist/hash.js';
import { handleOwner, observePageResponse } from '../.test-dist/index.js';
import { extractRequestMetadata } from '../.test-dist/metadata.js';
import {
  ARCHIVER_NETWORKS,
  HOSTING_ASNS,
  HOSTING_NETWORKS,
  isArchiverAsn,
  isHostingAsn,
} from '../.test-dist/networks.js';
import { partitionPredicate } from '../.test-dist/partition.js';
import { classifyReaderKind, READER_KINDS } from '../.test-dist/readerkind.js';
import { READER_GROUPS, readerGroupOf } from '../.test-dist/contracts.js';
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
  const derived = observation.readerKind === undefined
    ? classifyReaderKind({
      trafficClass: observation.trafficClass,
      agentName: observation.agentName ?? null,
      observationSource: observation.observationSource ?? 'edge',
      asn: observation.asn ?? null,
      secFetchMode: observation.secFetchMode ?? null,
      secFetchDest: observation.secFetchDest ?? null,
      secFetchSite: observation.secFetchSite ?? null,
      secFetchUser: observation.secFetchUser ?? null,
      acceptsHtml: observation.acceptsHtml ?? null,
      hasAcceptLanguage: observation.hasAcceptLanguage ?? null,
      signature: observation.signatureStatus === 'verified'
        ? { status: 'verified', agent: observation.signatureAgent }
        : { status: 'absent' },
      userAgent: observation.userAgent ?? 'Mozilla/5.0 Chrome/152',
    })
    : null;
  sqlite.prepare(`INSERT INTO page_observations (
    path, referrer_host, country, daily_client_id, traffic_class,
    agent_name, device_type, is_owner, observation_source, asn, as_org,
    sec_fetch_mode, sec_fetch_dest, sec_fetch_site, sec_fetch_user,
    accepts_html, has_accept_language, representation, signature_agent, signature_status,
    reader_kind, reader_reason, observed_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
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
    observation.representation ?? null,
    observation.signatureAgent ?? null,
    observation.signatureStatus ?? null,
    observation.readerKind ?? derived?.kind ?? null,
    observation.readerReason ?? derived?.reason ?? null,
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

test('eligibility accepts HTML and negotiated Markdown page GETs but rejects direct Markdown assets', () => {
  const markdown = new Response('# markdown', { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
  assert.equal(isEligiblePageResponse(request('/article'), html, 'html'), true);
  assert.equal(isEligiblePageResponse(request('/article'), markdown, 'markdown'), true);
  assert.equal(isEligiblePageResponse(request('/article.md'), markdown, 'markdown'), false);
  assert.equal(isEligiblePageResponse(request('/api/stats'), html, 'html'), false);
  assert.equal(isEligiblePageResponse(request('/stats'), html, 'html'), false);
  assert.equal(isEligiblePageResponse(request('/article', { method: 'HEAD' }), html, 'html'), false);
  assert.equal(isEligiblePageResponse(request('/article', { headers: { Purpose: 'prefetch' } }), html, 'html'), false);
  assert.equal(isEligiblePageResponse(request('/article'), new Response('no', { status: 500, headers: { 'Content-Type': 'text/html' } }), 'html'), false);
  assert.equal(isEligiblePageResponse(request('/article'), markdown, 'html'), false);
  assert.equal(isEligiblePageResponse(request('/article'), html, 'markdown'), false);
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

test('named classifier rules cover every added agent, crawler, spoofed token, and headless marker', () => {
  const cases = [
    ['Claude-User/1.0', 'ai', 'Claude-User'],
    ['Perplexity-User/1.0', 'ai', 'Perplexity-User'],
    ['meta-externalfetcher/1.1', 'ai', 'Meta-ExternalFetcher'],
    ['MistralAI-User/1.0', 'ai', 'MistralAI-User'],
    ['MistralAI-Index/1.0', 'ai', 'MistralAI-Index'],
    ['MistralAI-Training/1.0', 'ai', 'MistralAI-Training'],
    ['Amzn-User/1.0', 'ai', 'Amzn-User'],
    ['Amzn-SearchBot/1.0', 'ai', 'Amzn-SearchBot'],
    ['Google-Agent/1.0', 'ai', 'Google-Agent'],
    ['Google-GeminiNotebook/1.0', 'ai', 'Google-GeminiNotebook'],
    ['OAI-SearchBot/1.0', 'ai', 'OAI-SearchBot'],
    ['Claude-SearchBot/1.0', 'ai', 'Claude-SearchBot'],
    ['Meta-WebIndexer/1.0', 'ai', 'Meta-WebIndexer'],
    ['Applebot/0.1', 'ai', 'Applebot'],
    ['Google-Extended', 'bot', 'Google-Extended'],
    ['Applebot-Extended', 'bot', 'Applebot-Extended'],
    ['Mozilla/5.0 HeadlessChrome/152.0.0.0', 'bot', 'HeadlessChrome'],
    ['Mozilla/5.0 Cypress/15.0 Chrome/140 Electron/38', 'bot', 'Cypress'],
    ['Lightpanda/1.0', 'bot', 'Lightpanda'],
  ];
  for (const [userAgent, trafficClass, agentName] of cases) {
    assert.deepEqual(classifyTraffic(userAgent), { trafficClass, agentName });
    assert.equal(KNOWN_AGENT_NAMES.has(agentName), true);
  }
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

test('owner endpoint rejects non-POST methods', async () => {
  const { d1 } = analyticsDatabase();
  const response = await handleOwner(request('/api/owner', {
    method: 'GET',
    headers: { Authorization: 'Bearer owner-secret' },
  }), {
    DB: d1,
    ADMIN_SECRET: 'owner-secret',
    ANALYTICS_HASH_KEY: 'analytics-secret',
  });

  assert.equal(response.status, 405);
  assert.equal(response.headers.get('allow'), 'POST');
  assert.deepEqual(await response.json(), { error: 'Method Not Allowed' });
});

test('owner endpoint fails closed when a required secret is unset', async () => {
  const { d1 } = analyticsDatabase();
  const authorized = request('/api/owner', {
    method: 'POST',
    headers: { Authorization: 'Bearer owner-secret' },
  });

  const missingAdmin = await handleOwner(authorized, {
    DB: d1,
    ANALYTICS_HASH_KEY: 'analytics-secret',
  });
  assert.equal(missingAdmin.status, 500);

  const missingHashKey = await handleOwner(authorized, {
    DB: d1,
    ADMIN_SECRET: 'owner-secret',
    ANALYTICS_HASH_KEY: '',
  });
  assert.equal(missingHashKey.status, 500);
});

test('owner endpoint rejects missing and incorrect bearer credentials', async () => {
  const { d1 } = analyticsDatabase();
  const env = {
    DB: d1,
    ADMIN_SECRET: 'owner-secret',
    ANALYTICS_HASH_KEY: 'analytics-secret',
  };

  const missing = await handleOwner(request('/api/owner', { method: 'POST' }), env);
  assert.equal(missing.status, 401);
  assert.deepEqual(await missing.json(), { error: 'Unauthorized' });

  const incorrect = await handleOwner(request('/api/owner', {
    method: 'POST',
    headers: { Authorization: 'Bearer wrong-secret' },
  }), env);
  assert.equal(incorrect.status, 401);
});

test('owner endpoint marks the ingestion identity without exposing it and preserves the first mark', async () => {
  const { sqlite, d1 } = analyticsDatabase();
  const now = new Date('2026-09-03T23:59:59.000Z');
  const ip = '203.0.113.42';
  const userAgent = 'Browser/1.0';
  const adminSecret = 'owner-secret';
  const hashKey = 'analytics-secret';
  const ownerRequest = request('/api/owner?ignored=yes', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminSecret}`,
      'CF-Connecting-IP': ip,
      'User-Agent': userAgent,
    },
  });
  const env = {
    DB: d1,
    ADMIN_SECRET: adminSecret,
    ANALYTICS_HASH_KEY: hashKey,
    OWNER_IPS: ip,
  };

  const expectedId = await createDailyClientId({
    masterKey: hashKey,
    siteHost: 'gkoreli.com',
    utcDate: '2026-09-03',
    ip,
    userAgent,
  });
  const first = await handleOwner(ownerRequest, env, now);
  const firstText = await first.text();
  assert.equal(first.status, 200);
  assert.deepEqual(JSON.parse(firstText), { marked: true, utcDate: '2026-09-03' });
  assert.equal(first.headers.get('cache-control'), 'no-store');
  assert.equal(firstText.includes(expectedId), false);
  assert.equal(firstText.includes(adminSecret), false);
  assert.equal(firstText.includes(hashKey), false);

  assert.deepEqual({ ...sqlite.prepare(
    'SELECT daily_client_id, utc_date FROM owner_clients',
  ).get() }, {
    daily_client_id: expectedId,
    utc_date: '2026-09-03',
  });

  sqlite.prepare(
    "UPDATE owner_clients SET marked_at = '2000-01-01 00:00:00' WHERE daily_client_id = ?",
  ).run(expectedId);
  const repeated = await handleOwner(ownerRequest, env, now);
  assert.equal(repeated.status, 200);
  assert.deepEqual({ ...sqlite.prepare(
    'SELECT COUNT(*) AS count, MIN(marked_at) AS marked_at FROM owner_clients',
  ).get() }, {
    count: 1,
    marked_at: '2000-01-01 00:00:00',
  });
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
    hasSignatureHeaders: false,
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
    hasSignatureHeaders: absent.hasSignatureHeaders,
  }, {
    asn: null,
    asOrg: null,
    secFetchMode: null,
    secFetchDest: null,
    secFetchSite: null,
    secFetchUser: null,
    acceptsHtml: null,
    hasAcceptLanguage: 0,
    hasSignatureHeaders: false,
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
  assert.equal(extractRequestMetadata(request('/signed', {
    headers: { 'Signature-Input': 'sig=("@authority")' },
  }), undefined).hasSignatureHeaders, true);
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

  observePageResponse(observed, html, 'html', {
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
  assert.equal(row.representation, 'html');
  assert.equal(row.signature_agent, null);
  assert.equal(row.signature_status, null);
  assert.equal(row.reader_kind, 'ai-crawler');
  assert.equal(row.reader_reason, 'GPTBot');
  assert.match(row.daily_client_id, /^[0-9a-f]{32}$/);

  const missingSecret = [];
  observePageResponse(observed, html, 'html', {
    DB: d1,
    ANALYTICS_HASH_KEY: undefined,
    OWNER_IPS: '',
  }, { waitUntil(promise) { missingSecret.push(promise); } });
  assert.equal(missingSecret.length, 1);
  await assert.rejects(missingSecret[0], /ANALYTICS_HASH_KEY must not be empty/);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM page_observations').get().count, 1);
});

test('negotiated Markdown observations store their representation on the page path', async () => {
  const { sqlite, d1 } = analyticsDatabase();
  const observed = request('/article', {
    headers: {
      'CF-Connecting-IP': '203.0.113.30',
      'User-Agent': 'OpenClaw/1.0',
      Accept: 'text/markdown, text/html;q=0.9',
    },
  });
  const markdown = new Response('# markdown', {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
  const pending = [];

  observePageResponse(observed, markdown, 'markdown', {
    DB: d1,
    ANALYTICS_HASH_KEY: 'test-key',
    OWNER_IPS: '',
  }, { waitUntil(promise) { pending.push(promise); } });
  assert.equal(pending.length, 1);
  await pending[0];

  const row = sqlite.prepare('SELECT path, representation FROM page_observations').get();
  assert.deepEqual({ ...row }, { path: '/article', representation: 'markdown' });
});

test('ingestion stores an unverified signature reason without trusting its claimed agent', async () => {
  const { sqlite, d1 } = analyticsDatabase();
  const observed = request('/claimed-agent', { headers: {
    'CF-Connecting-IP': '203.0.113.21',
    'User-Agent': 'Mozilla/5.0 Chrome/152',
    'Signature-Agent': 'sig="https://claimed.example"',
  } });
  const pending = [];
  observePageResponse(observed, html, 'html', {
    DB: d1,
    ANALYTICS_HASH_KEY: 'test-key',
  }, { waitUntil(promise) { pending.push(promise); } });
  await pending[0];

  assert.deepEqual({ ...sqlite.prepare(`SELECT signature_agent, signature_status,
    reader_kind, reader_reason FROM page_observations`).get() }, {
    signature_agent: null,
    signature_status: 'unverified',
    reader_kind: 'http-client',
    reader_reason: 'no-fetch-metadata; signature:missing-signature-input',
  });
});

test('hosting list excludes relay/CDN ASNs and partition SQL inlines only validated numbers', () => {
  for (const prohibited of [15169, 13335, 36183, 20940, 54113, 6939, 7941, 46997]) {
    assert.equal(HOSTING_ASNS.has(prohibited), false);
    assert.equal(isHostingAsn(prohibited), false);
  }
  assert.equal(isHostingAsn(16509), true);
  assert.equal(isHostingAsn(null), false);
  const browser = partitionPredicate('browser');
  assert.equal(browser.values.length, 0);
  assert.equal(browser.sql, "reader_kind IN ('browser')");
  assert.equal(partitionPredicate('all').sql, '');
  const grouped = ['browser', 'agents', 'crawlers', 'automation'].flatMap((group) => READER_GROUPS[group]);
  assert.deepEqual([...grouped].sort(), [...READER_KINDS].sort(), 'groups are disjoint and cover every kind');
  for (const kind of READER_KINDS) assert.equal(READER_GROUPS[readerGroupOf(kind)].includes(kind), true);
});

test('network registries contain the exact ADR-0016.4 hosting and archiver entries', () => {
  const addedAsns = new Set([29802, 64267, 150436, 59711, 25820]);
  assert.deepEqual(
    HOSTING_NETWORKS
      .filter((network) => addedAsns.has(network.asn))
      .map((network) => ({ ...network })),
    [
      { asn: 29802, provider: 'Hivelocity', checkedOn: '2026-09-03' },
      { asn: 64267, provider: 'Sprious (Rayobyte)', checkedOn: '2026-09-03' },
      { asn: 150436, provider: 'Byteplus', checkedOn: '2026-09-03' },
      { asn: 59711, provider: 'HZ Hosting', checkedOn: '2026-09-03' },
      { asn: 25820, provider: 'IT7 Networks', checkedOn: '2026-09-03' },
    ],
  );
  for (const asn of addedAsns) assert.equal(isHostingAsn(asn), true);
  assert.deepEqual([...ARCHIVER_NETWORKS], [[7941, 'internet-archive']]);
  assert.equal(isArchiverAsn(7941), true);
  assert.equal(isArchiverAsn(29802), false);
  assert.equal(isArchiverAsn(null), false);
});

test('reader-kind classifier maps every closed-set code and records one reason', () => {
  const base = {
    trafficClass: 'browser',
    agentName: null,
    observationSource: 'edge',
    asn: 64512,
    secFetchMode: 'navigate',
    secFetchDest: 'document',
    secFetchSite: 'none',
    secFetchUser: 1,
    acceptsHtml: 1,
    hasAcceptLanguage: 1,
    signature: { status: 'absent' },
    userAgent: 'Mozilla/5.0 Chrome/152',
  };
  const cases = [
    [{ ...base, signature: { status: 'verified', agent: 'https://agent.example' } }, 'signed-agent', 'https://agent.example'],
    [{ ...base, trafficClass: 'ai', agentName: 'Claude-User' }, 'ai-assistant', 'Claude-User'],
    [{ ...base, trafficClass: 'ai', agentName: 'OAI-SearchBot' }, 'ai-search', 'OAI-SearchBot'],
    [{ ...base, trafficClass: 'ai', agentName: 'GPTBot' }, 'ai-crawler', 'GPTBot'],
    [{ ...base, trafficClass: 'bot', agentName: 'Googlebot' }, 'search-crawler', 'Googlebot'],
    [{ ...base, trafficClass: 'bot', agentName: 'Slackbot' }, 'preview-or-feed', 'Slackbot'],
    [{ ...base, trafficClass: 'bot', agentName: 'HeadlessChrome', userAgent: 'HeadlessChrome/152' }, 'headless-browser', 'HeadlessChrome'],
    [{ ...base, trafficClass: 'bot', agentName: null }, 'other-bot', 'generic-bot'],
    [{ ...base, asn: 16509 }, 'cloud-browser', 'hosting-asn:16509'],
    [{ ...base, secFetchMode: 'cors', secFetchDest: 'empty' }, 'http-client', 'not-navigation-shaped'],
    [{ ...base, secFetchMode: null, secFetchDest: null, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148' }, 'legacy-browser', 'pre-fetch-metadata-ua'],
    [{ ...base, observationSource: 'beacon', hasAcceptLanguage: null }, 'browser', 'beacon-script-ran'],
    [{ ...base, hasAcceptLanguage: null }, 'browser', 'user-agent-only'],
  ];

  const seen = [];
  for (const [facts, kind, reason] of cases) {
    assert.deepEqual(classifyReaderKind(facts), { kind, reason });
    seen.push(kind);
  }
  assert.deepEqual([...new Set(seen)], [...READER_KINDS]);
  assert.deepEqual(
    classifyReaderKind({ ...base, secFetchMode: null, secFetchDest: null, userAgent: 'Mozilla/5.0 (Windows NT 10.0) Chrome/152.0.0.0 Safari/537.36' }),
    { kind: 'http-client', reason: 'no-fetch-metadata' },
  );
  assert.deepEqual(
    classifyReaderKind({ ...base, secFetchMode: null, secFetchDest: null, userAgent: 'Mozilla/5.0 (Windows NT 6.1) Chrome/49.0.2623.112 Safari/537.36' }),
    { kind: 'legacy-browser', reason: 'pre-fetch-metadata-ua' },
  );
  assert.deepEqual(
    classifyReaderKind({ ...base, asn: 132203, secFetchMode: null, secFetchDest: null, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2 like Mac OS X) AppleWebKit/605.1.15 Version/13.0.3 Mobile/15E148 Safari/604.1' }),
    { kind: 'cloud-browser', reason: 'hosting-asn:132203' },
    'hosting network is a verdict before request shape',
  );
  assert.deepEqual(classifyReaderKind({
    ...base,
    trafficClass: 'ai',
    agentName: 'GPTBot',
    signature: { status: 'unverified', reason: 'expired' },
  }), { kind: 'ai-crawler', reason: 'GPTBot; signature:expired' });
  assert.deepEqual(classifyReaderKind({
    ...base,
    trafficClass: 'bot',
    agentName: 'DuckDuckBot',
    signature: { status: 'unverified', reason: 'bare-uri-signature-agent' },
  }), { kind: 'search-crawler', reason: 'DuckDuckBot; signature:bare-uri-signature-agent' });
});

test('archiver ASN classifies unnamed requests while named agents retain priority', () => {
  const base = {
    trafficClass: 'browser',
    agentName: null,
    observationSource: 'edge',
    asn: 7941,
    secFetchMode: 'navigate',
    secFetchDest: 'document',
    secFetchSite: 'cross-site',
    secFetchUser: 1,
    acceptsHtml: 1,
    hasAcceptLanguage: 1,
    signature: { status: 'absent' },
    userAgent: 'Mozilla/5.0 Chrome/152',
  };

  assert.deepEqual(classifyReaderKind(base), {
    kind: 'preview-or-feed',
    reason: 'archiver-asn:7941',
  });
  assert.deepEqual(classifyReaderKind({ ...base, trafficClass: 'bot' }), {
    kind: 'preview-or-feed',
    reason: 'archiver-asn:7941',
  });
  assert.deepEqual(classifyReaderKind({
    ...base,
    trafficClass: 'bot',
    agentName: 'Googlebot',
    userAgent: 'Googlebot/2.1',
  }), { kind: 'search-crawler', reason: 'Googlebot' });
  assert.deepEqual(classifyReaderKind({
    ...base,
    trafficClass: 'bot',
    agentName: 'HeadlessChrome',
    userAgent: 'HeadlessChrome/152',
  }), { kind: 'headless-browser', reason: 'HeadlessChrome' });
  assert.deepEqual(classifyReaderKind({
    ...base,
    signature: { status: 'verified', agent: 'https://agent.example' },
  }), { kind: 'signed-agent', reason: 'https://agent.example' });
});

test('browser partition keeps beacons, pre-evidence edge rows, and navigation-shaped edge rows while each failed signal demotes', async () => {
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
  const automation = await queryStats(d1, { range: '7d', traffic: 'automation' }, now);
  assert.deepEqual(browsers.byPath.map((row) => row.path).sort(), ['/beacon', '/edge-navigation', '/unchecked-edge']);
  assert.deepEqual(automation.byPath.map((row) => row.path).sort(), failures.map((row) => row.path).sort());
  assert.deepEqual(
    browsers.byKind.map((row) => [row.kind, row.reason]).sort(),
    [['browser', 'beacon-script-ran'], ['browser', 'navigation-shaped'], ['browser', 'user-agent-only']],
  );
  assert.deepEqual(
    automation.byKind.map((row) => [row.kind, row.reason, row.views]).sort(),
    [['cloud-browser', 'hosting-asn:16509', 1], ['http-client', 'not-navigation-shaped', 4]],
  );
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
  const agents = await queryStats(d1, { range: '30d', traffic: 'agents' }, now);
  const crawlers = await queryStats(d1, { range: '30d', traffic: 'crawlers' }, now);
  const automation = await queryStats(d1, { range: '30d', traffic: 'automation' }, now);
  const all = await queryStats(d1, { range: '30d', traffic: 'all' }, now);

  assert.deepEqual(
    [browser.totals.views, agents.totals.views, crawlers.totals.views, automation.totals.views, all.totals.views],
    [2, 0, 2, 1, 5],
  );
  assert.equal(
    all.totals.views,
    browser.totals.views + agents.totals.views + crawlers.totals.views + automation.totals.views,
  );
  assert.equal(all.totals.dailyClients, 4);
  assert.equal(all.timeSeries.reduce((sum, point) => sum + point.views, 0), all.totals.views);
  assert.equal(all.byPath.reduce((sum, row) => sum + row.views, 0), all.totals.views);
  assert.equal(all.timeSeries.length, 30);
  assert.deepEqual([all.period.start, all.period.end], ['2026-07-27', '2026-08-25']);
  assert.deepEqual(all.filters, { traffic: 'all', range: '30d', path: null, agent: null, kind: null });
  assert.equal(
    all.totals.unattributedViews + all.byReferrer.reduce((sum, row) => sum + row.views, 0),
    all.totals.views,
  );

  const aiAllTime = await queryStats(d1, { range: 'all', traffic: 'crawlers' }, now);
  const emptyAllTime = await queryStats(d1, { range: 'all', traffic: 'crawlers', path: '/missing' }, now);
  assert.equal(aiAllTime.period.start, '2026-07-26');
  assert.equal(emptyAllTime.period.start, aiAllTime.period.start);
  assert.equal(emptyAllTime.totals.views, 0);
});

test('stats exclude marked daily clients from every aggregate and the all-time boundary', async () => {
  const { sqlite, d1 } = analyticsDatabase();
  insertObservation(sqlite, {
    path: '/marked-earliest',
    referrerHost: 'marked.example',
    country: 'DE',
    dailyClientId: 'a'.repeat(32),
    trafficClass: 'browser',
    deviceType: 'mobile',
    ...NAVIGATION_EVIDENCE,
    observedAt: '2026-08-01 12:00:00',
  });
  insertObservation(sqlite, {
    path: '/reader',
    referrerHost: 'reader.example',
    country: 'US',
    dailyClientId: 'b'.repeat(32),
    trafficClass: 'browser',
    ...NAVIGATION_EVIDENCE,
    observedAt: '2026-08-02 12:00:00',
  });
  insertObservation(sqlite, {
    path: '/marked-agent',
    referrerHost: 'agent.example',
    country: 'CA',
    dailyClientId: 'c'.repeat(32),
    trafficClass: 'ai',
    agentName: 'GPTBot',
    deviceType: 'tablet',
    observedAt: '2026-09-03 11:00:00',
  });
  const markOwner = sqlite.prepare(
    'INSERT INTO owner_clients (daily_client_id, utc_date) VALUES (?, ?)',
  );
  markOwner.run('a'.repeat(32), '2026-08-01');
  markOwner.run('c'.repeat(32), '2026-09-03');

  const stats = await queryStats(
    d1,
    { range: 'all', traffic: 'all' },
    new Date('2026-09-03T13:00:00.000Z'),
  );

  assert.equal(stats.period.start, '2026-08-02');
  assert.deepEqual(stats.totals, { views: 1, dailyClients: 1, unattributedViews: 0 });
  assert.deepEqual(stats.byPath, [{ path: '/reader', views: 1, dailyClients: 1 }]);
  assert.deepEqual(stats.byCountry, [{ country: 'US', views: 1 }]);
  assert.deepEqual(stats.byReferrer, [{ referrerHost: 'reader.example', views: 1 }]);
  assert.deepEqual(stats.byDevice, [{ deviceType: 'desktop', views: 1 }]);
  assert.deepEqual(stats.byAgent, []);
  assert.deepEqual(stats.byKind, [{
    kind: 'browser',
    reason: 'navigation-shaped',
    views: 1,
    dailyClients: 1,
  }]);
  assert.equal(stats.timeSeries.reduce((sum, point) => sum + point.views, 0), 1);
  assert.equal(sqlite.prepare(`SELECT COUNT(*) AS count FROM page_observations
    WHERE daily_client_id IN (?, ?) AND is_owner = 0`).get('a'.repeat(32), 'c'.repeat(32)).count, 2);
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
  assert.deepEqual(path.filters, { traffic: 'all', range: '7d', path: '/article', agent: null, kind: null });
  assert.deepEqual(path.byPath.map((row) => row.path), ['/article']);
  assert.deepEqual(path.byCountry.map((row) => row.country).sort(), ['CA', 'US']);
  assert.deepEqual(path.byReferrer.map((row) => row.referrerHost).sort(), ['example.com', 'search.example']);
  assert.deepEqual(path.byDevice.map((row) => row.deviceType).sort(), ['desktop', 'tablet']);
  assert.deepEqual(path.byAgent.map((row) => row.agentName).sort(), ['GPTBot', 'Googlebot']);
  assert.equal(path.timeSeries.reduce((sum, row) => sum + row.views, 0), 2);

  const agent = await queryStats(d1, { range: '7d', traffic: 'all', agent: 'GPTBot' }, now);
  assert.equal(agent.totals.views, 2);
  assert.deepEqual(agent.filters, { traffic: 'all', range: '7d', path: null, agent: 'GPTBot', kind: null });
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
    traffic: 'crawlers',
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
  const agentsConflict = await handleStats(request('/api/stats?agent=GPTBot&traffic=agents'), { DB: d1 });
  assert.equal(agentsConflict.status, 400);
  assert.match((await agentsConflict.json()).error, /cannot be combined/);
  const classConflict = await handleStats(request('/api/stats?agent=GPTBot&traffic=automation'), { DB: d1 });
  assert.equal(classConflict.status, 400);
  assert.match((await classConflict.json()).error, /cannot be combined/);
  const kindOk = await handleStats(request('/api/stats?kind=ai-crawler'), { DB: d1 });
  assert.equal(kindOk.status, 200);
  const kindBody = await kindOk.json();
  assert.equal(kindBody.filters.traffic, 'all');
  assert.equal(kindBody.filters.kind, 'ai-crawler');
  assert.equal(kindBody.totals.views, 2);
  assert.deepEqual(kindBody.byKind, [{ kind: 'ai-crawler', reason: 'GPTBot', views: 2, dailyClients: 2 }]);
  const kindConflict = await handleStats(request('/api/stats?kind=ai-crawler&traffic=browser'), { DB: d1 });
  assert.equal(kindConflict.status, 400);
  const kindAgentConflict = await handleStats(request('/api/stats?kind=search-crawler&agent=GPTBot'), { DB: d1 });
  assert.equal(kindAgentConflict.status, 400);
  const kindUnknown = await handleStats(request('/api/stats?kind=humans'), { DB: d1 });
  assert.equal(kindUnknown.status, 400);
  const unknown = await handleStats(request('/api/stats?agent=UnknownBot'), { DB: d1 });
  assert.equal(unknown.status, 400);
  assert.match((await unknown.json()).error, /known matched User-Agent rule/);
});

test('migrations 0005 to 0007 apply after the existing chain and backfill legacy identity idempotently', () => {
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

  sqlite.exec(readFileSync(new URL('../migrations/0004_add_representation.sql', import.meta.url), 'utf8'));
  const representations = sqlite.prepare(
    'SELECT representation FROM page_observations ORDER BY id',
  ).all();
  assert.equal(representations.length, 3);
  for (const row of representations) assert.equal(row.representation, null);
  sqlite.prepare(`UPDATE page_observations SET representation = 'html' WHERE path = '/edge'`).run();
  assert.throws(
    () => sqlite.prepare(`UPDATE page_observations SET representation = 'pdf' WHERE path = '/edge'`).run(),
    /CHECK constraint failed/,
  );

  sqlite.exec(readFileSync(new URL('../migrations/0005_add_reader_identity.sql', import.meta.url), 'utf8'));
  const identityBeforeBackfill = sqlite.prepare(`SELECT signature_agent, signature_status,
    reader_kind, reader_reason FROM page_observations ORDER BY id`).all();
  for (const row of identityBeforeBackfill) {
    assert.deepEqual({ ...row }, {
      signature_agent: null,
      signature_status: null,
      reader_kind: null,
      reader_reason: null,
    });
  }
  assert.throws(
    () => sqlite.prepare(`UPDATE page_observations SET signature_status = 'claimed'`).run(),
    /CHECK constraint failed/,
  );

  const backfill = readFileSync(new URL('../migrations/0006_backfill_reader_kind.sql', import.meta.url), 'utf8');
  sqlite.exec(backfill);
  assert.deepEqual(
    sqlite.prepare(`SELECT path, reader_kind, reader_reason
      FROM page_observations ORDER BY observed_at`).all().map(row => ({ ...row })),
    [
      { path: '/legacy', reader_kind: 'browser', reader_reason: 'beacon-script-ran' },
      { path: '/legacy-ai', reader_kind: 'other-bot', reader_reason: 'generic-bot' },
      { path: '/edge', reader_kind: 'browser', reader_reason: 'user-agent-only' },
    ],
  );
  sqlite.exec(backfill);
  assert.equal(sqlite.prepare(`SELECT COUNT(*) AS count FROM page_observations
    WHERE reader_kind IS NULL OR reader_reason IS NULL`).get().count, 0);

  // 0007 adds asn_source, marks request-derived networks, and its row-specific
  // reconstruction statements are no-ops on ids that do not exist here.
  sqlite.prepare(`UPDATE page_observations SET asn = 64512 WHERE path = '/edge'`).run();
  sqlite.exec(readFileSync(new URL('../migrations/0007_reconstruct_pre_evidence_asn.sql', import.meta.url), 'utf8'));
  assert.deepEqual(
    sqlite.prepare(`SELECT path, asn, asn_source FROM page_observations ORDER BY observed_at`).all().map(row => ({ ...row })),
    [
      { path: '/legacy', asn: null, asn_source: null },
      { path: '/legacy-ai', asn: null, asn_source: null },
      { path: '/edge', asn: 64512, asn_source: 'request' },
    ],
  );
  assert.throws(
    () => sqlite.prepare(`UPDATE page_observations SET asn_source = 'guess'`).run(),
    /CHECK constraint failed/,
  );
});

test('migration 0008 creates owner clients and narrowly reclassifies bounded network history', () => {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(`CREATE TABLE page_observations (
    path TEXT NOT NULL,
    asn INTEGER,
    reader_kind TEXT,
    reader_reason TEXT,
    observed_at TEXT NOT NULL
  )`);
  const insert = sqlite.prepare(`INSERT INTO page_observations
    (path, asn, reader_kind, reader_reason, observed_at) VALUES (?, ?, ?, ?, ?)`);
  const beforeBoundary = '2026-09-03 23:59:59';
  const hostingAsns = [29802, 64267, 150436, 59711, 25820];
  hostingAsns.forEach((asn, index) => insert.run(
    `/hosting-${asn}`,
    asn,
    index % 2 === 0 ? 'browser' : 'legacy-browser',
    'old-browser-reason',
    beforeBoundary,
  ));
  insert.run('/archiver-browser', 7941, 'browser', 'navigation-shaped', beforeBoundary);
  insert.run('/archiver-legacy', 7941, 'legacy-browser', 'pre-fetch-metadata-ua', '2026-01-01 00:00:00');
  insert.run('/hosting-at-cutoff', 29802, 'browser', 'navigation-shaped', '2026-09-04 00:00:00');
  insert.run('/archiver-at-cutoff', 7941, 'browser', 'navigation-shaped', '2026-09-04 00:00:00');
  insert.run('/old-hosting', 16509, 'browser', 'navigation-shaped', beforeBoundary);
  insert.run('/hurricane-electric', 6939, 'browser', 'navigation-shaped', beforeBoundary);
  insert.run('/black-mesa', 46997, 'browser', 'navigation-shaped', beforeBoundary);

  const protectedKinds = [
    ['signed-agent', 'https://agent.example'],
    ['ai-assistant', 'ChatGPT-User'],
    ['ai-search', 'OAI-SearchBot'],
    ['ai-crawler', 'GPTBot'],
    ['search-crawler', 'Googlebot'],
    ['preview-or-feed', 'Slackbot'],
    ['headless-browser', 'HeadlessChrome'],
    ['other-bot', 'generic-bot'],
    ['http-client', 'not-navigation-shaped'],
    ['cloud-browser', 'hosting-asn:29802'],
  ];
  protectedKinds.forEach(([kind, reason], index) => insert.run(
    `/protected-${kind}`,
    index % 2 === 0 ? 29802 : 7941,
    kind,
    reason,
    beforeBoundary,
  ));

  const migration = readFileSync(
    new URL('../migrations/0008_owner_clients_and_network_reclassification.sql', import.meta.url),
    'utf8',
  );
  sqlite.exec(migration);

  for (const asn of hostingAsns) {
    assert.deepEqual({ ...sqlite.prepare(`SELECT reader_kind, reader_reason
      FROM page_observations WHERE path = ?`).get(`/hosting-${asn}`) }, {
      reader_kind: 'cloud-browser',
      reader_reason: `hosting-asn:${asn}`,
    });
  }
  for (const path of ['/archiver-browser', '/archiver-legacy']) {
    assert.deepEqual({ ...sqlite.prepare(`SELECT reader_kind, reader_reason
      FROM page_observations WHERE path = ?`).get(path) }, {
      reader_kind: 'preview-or-feed',
      reader_reason: 'archiver-asn:7941',
    });
  }
  assert.deepEqual(
    sqlite.prepare(`SELECT path, reader_kind, reader_reason FROM page_observations
      WHERE path IN ('/hosting-at-cutoff', '/archiver-at-cutoff', '/old-hosting',
        '/hurricane-electric', '/black-mesa') ORDER BY path`).all().map((row) => ({ ...row })),
    [
      { path: '/archiver-at-cutoff', reader_kind: 'browser', reader_reason: 'navigation-shaped' },
      { path: '/black-mesa', reader_kind: 'browser', reader_reason: 'navigation-shaped' },
      { path: '/hosting-at-cutoff', reader_kind: 'browser', reader_reason: 'navigation-shaped' },
      { path: '/hurricane-electric', reader_kind: 'browser', reader_reason: 'navigation-shaped' },
      { path: '/old-hosting', reader_kind: 'browser', reader_reason: 'navigation-shaped' },
    ],
  );
  for (const [kind, reason] of protectedKinds) {
    assert.deepEqual({ ...sqlite.prepare(`SELECT reader_kind, reader_reason
      FROM page_observations WHERE path = ?`).get(`/protected-${kind}`) }, {
      reader_kind: kind,
      reader_reason: reason,
    });
  }

  sqlite.prepare(`INSERT INTO owner_clients (daily_client_id, utc_date)
    VALUES (?, ?)`).run('a'.repeat(32), '2026-09-03');
  const owner = sqlite.prepare(`SELECT daily_client_id, utc_date, marked_at
    FROM owner_clients`).get();
  assert.equal(owner.daily_client_id, 'a'.repeat(32));
  assert.equal(owner.utc_date, '2026-09-03');
  assert.equal(typeof owner.marked_at, 'string');
  assert.throws(
    () => sqlite.prepare(`INSERT INTO owner_clients (daily_client_id, utc_date)
      VALUES (?, ?)`).run('A'.repeat(32), '2026-09-03'),
    /CHECK constraint failed/,
  );
});

test('SQL reader-kind migrations inline exactly the current network registries', () => {
  const backfill = readFileSync(new URL('../migrations/0006_backfill_reader_kind.sql', import.meta.url), 'utf8');
  const originalLists = [...backfill.matchAll(/asn IN \(([^)]*)\)/g)].map(match =>
    match[1].split(',').map(value => Number(value.trim())).filter(Number.isFinite).sort((a, b) => a - b),
  );
  assert.equal(originalLists.length, 2);
  assert.deepEqual(originalLists[0], originalLists[1]);

  const migration = readFileSync(
    new URL('../migrations/0008_owner_clients_and_network_reclassification.sql', import.meta.url),
    'utf8',
  );
  const additionLists = [...migration.matchAll(/WHERE asn IN \(([^)]*)\)/g)].map(match =>
    match[1].split(',').map(value => Number(value.trim())).filter(Number.isFinite).sort((a, b) => a - b),
  );
  assert.equal(additionLists.length, 1);
  const originalSet = new Set(originalLists[0]);
  assert.deepEqual(
    additionLists[0],
    [...HOSTING_ASNS].filter((asn) => !originalSet.has(asn)).sort((a, b) => a - b),
  );
  assert.deepEqual(
    [...new Set([...originalLists[0], ...additionLists[0]])].sort((a, b) => a - b),
    [...HOSTING_ASNS].sort((a, b) => a - b),
  );
  const archiverAsns = [...migration.matchAll(/WHERE asn = (\d+)/g)]
    .map((match) => Number(match[1])).sort((a, b) => a - b);
  assert.deepEqual(archiverAsns, [...ARCHIVER_NETWORKS.keys()].sort((a, b) => a - b));
  assert.equal((migration.match(/observed_at < '2026-09-04 00:00:00'/g) ?? []).length, 2);
});

test('SQL reader-kind backfill uses the same closed-set mapping as ingestion', () => {
  const { sqlite } = analyticsDatabase();
  const observedAt = '2026-09-03 12:00:00';
  const rows = [
    { path: '/signed', trafficClass: 'browser', signatureAgent: 'https://agent.example', signatureStatus: 'verified' },
    { path: '/assistant', trafficClass: 'ai', agentName: 'ChatGPT-User' },
    { path: '/ai-search', trafficClass: 'ai', agentName: 'Applebot' },
    { path: '/ai-crawler', trafficClass: 'ai', agentName: 'ClaudeBot' },
    { path: '/search', trafficClass: 'bot', agentName: 'Bingbot' },
    { path: '/preview', trafficClass: 'bot', agentName: 'LinkedInBot' },
    { path: '/headless', trafficClass: 'bot', agentName: 'Lightpanda' },
    { path: '/other', trafficClass: 'bot' },
    { path: '/cloud', trafficClass: 'browser', asn: 16509, hasAcceptLanguage: 1 },
    { path: '/client', trafficClass: 'browser', secFetchMode: 'cors', secFetchDest: 'empty', hasAcceptLanguage: 1 },
    { path: '/browser', trafficClass: 'browser', observationSource: 'beacon' },
  ];
  rows.forEach((row, index) => insertObservation(sqlite, {
    dailyClientId: (index % 10).toString().repeat(32),
    observedAt,
    ...row,
  }));

  const backfill = readFileSync(new URL('../migrations/0006_backfill_reader_kind.sql', import.meta.url), 'utf8');
  sqlite.exec(backfill);
  assert.deepEqual(
    sqlite.prepare(`SELECT reader_kind FROM page_observations ORDER BY id`).all()
      .map(row => row.reader_kind),
    // The raw User-Agent is not stored, so history cannot be version-gated:
    // the backfill never emits legacy-browser and labels those rows http-client.
    READER_KINDS.filter(kind => kind !== 'legacy-browser'),
  );
});

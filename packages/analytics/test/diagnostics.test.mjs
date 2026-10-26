import assert from 'node:assert/strict';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { observePageResponse, SIGNATURE_DEADLINE_MS } from '../.test-dist/index.js';
import { allowsDiagnostics, diagnosticExpiry, readRecentDiagnostics, purgeExpiredDiagnostics } from '../.test-dist/diagnostics.js';
import { queryStats } from '../.test-dist/stats.js';

function fixture() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'));
  const db = {
    prepare(sql) {
      return {
        bind(...values) {
          return {
            async run() {
              const r = sqlite.prepare(sql).run(...values);
              return { success: true, meta: { last_row_id: Number(r.lastInsertRowid), changes: Number(r.changes) } };
            },
            async all() { return { success: true, results: sqlite.prepare(sql).all(...values) }; },
          };
        },
      };
    },
    async batch(statements) { return Promise.all(statements.map(statement => statement.all())); },
  };
  return { sqlite, db };
}
function request(path = '/article', headers = {}) {
  return new Request(`https://example.test${path}`, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0) Chrome/152.0.0.0', Accept: 'text/html', 'Accept-Language': 'en-US', ...headers } });
}
async function observe(db, req = request(), mode = 'private-v1', options = {}) {
  const work = [];
  observePageResponse(req, new Response('page', { headers: { 'Content-Type': 'text/html' } }), 'html', { DB: db, ANALYTICS_HASH_KEY: 'fixture-only-key', ANALYTICS_DIAGNOSTICS: mode }, { waitUntil(p) { work.push(p); } }, { publicPagePaths: async () => new Set(['/article']), ...options });
  await Promise.all(work);
}

test('capture is off by default, fails closed for invalid modes and skips optional evidence for privacy signals', () => {
  for (const mode of [undefined, '', 'true', 'public', 'off']) assert.equal(allowsDiagnostics(mode, request()), false);
  assert.equal(allowsDiagnostics('private-v1', request()), true);
  assert.equal(allowsDiagnostics('private-v1', request('/article', { 'Sec-GPC': '1' })), false);
  assert.equal(allowsDiagnostics('private-v1', request('/article', { DNT: '1' })), false);
});

test('private mode stores structured facts and bounded replay evidence without copying identifying headers', async () => {
  const { sqlite, db } = fixture();
  await observe(db, request('/article?token=private-url-value', {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0) Chrome/152.0.0.0 contact=person@example.test',
    Cookie: 'private-cookie', Authorization: 'Bearer private-credential',
    'CF-Connecting-IP': '192.0.2.7', 'CF-Ray': '1234567890abcdef-SJC',
  }));
  const observation = sqlite.prepare('SELECT * FROM page_observations').get();
  const structured = JSON.parse(observation.request_evidence);
  assert.equal(structured.browserMajor, 152);
  assert.equal(structured.primaryLanguage, 'en');
  const diagnostic = sqlite.prepare('SELECT * FROM page_observation_diagnostics').get();
  assert.equal(diagnostic.observation_id, observation.id);
  assert.equal(diagnostic.expires_at, diagnosticExpiry(observation.observed_at));
  const payload = JSON.parse(diagnostic.payload);
  assert.equal(payload.userAgent.redacted, true);
  assert.equal(payload.userAgent.truncated, false);
  assert.ok(payload.userAgent.value.includes('Chrome/152.0.0.0'));
  assert.equal(payload.requestRayId, '1234567890abcdef-SJC');
  assert.equal(payload.signatureOutcome, 'absent');
  for (const excluded of ['person@example.test', 'private-url-value', 'private-cookie', 'private-credential', '192.0.2.7']) assert.equal(diagnostic.payload.includes(excluded), false, excluded);
});

test('unknown paths and failed trusted-path lookups do not gain diagnostics and never erase the base event', async () => {
  const { sqlite, db } = fixture();
  await observe(db, request('/not-a-public-article'));
  await observe(db, request(), 'private-v1', { publicPagePaths: async () => { throw new Error('private failure detail'); } });
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM page_observations').get().n, 2);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM page_observation_diagnostics').get().n, 0);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM page_observations WHERE request_evidence IS NOT NULL').get().n, 0);
});

test('optional diagnostic failure preserves the acknowledged page event and does not log payload/DB details', async () => {
  const { sqlite, db } = fixture();
  sqlite.exec('DROP TABLE page_observation_diagnostics');
  const warnings = []; const warn = console.warn;
  console.warn = (...args) => warnings.push(args);
  try { await observe(db, request('/article', { 'User-Agent': 'FixtureBot/1.0 secret=fixture-secret' })); }
  finally { console.warn = warn; }
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM page_observations').get().n, 1);
  assert.ok(warnings.some(args => args[0] === 'analytics.diagnostic_write_failed'));
  assert.equal(JSON.stringify(warnings).includes('fixture-secret'), false);
  assert.equal(JSON.stringify(warnings).includes('no such table'), false);
});

test('expired source evidence is unreadable and cleanup leaves audience observations intact', async () => {
  const { sqlite, db } = fixture(); await observe(db);
  const stored = sqlite.prepare('SELECT * FROM page_observation_diagnostics').get();
  const expiry = new Date(stored.expires_at.replace(' ', 'T') + 'Z');
  assert.equal((await readRecentDiagnostics(db, new Date(expiry.getTime() - 1000))).length, 1);
  assert.equal((await readRecentDiagnostics(db, expiry)).length, 0);
  const cleanup = await purgeExpiredDiagnostics(db, expiry);
  assert.deepEqual(cleanup, { deleted: 1, atLimit: false });
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM page_observations').get().n, 1);
  await assert.rejects(readRecentDiagnostics(db, expiry, 101), /limit/);
});

test('a stalled signature verifier has a deadline and cannot prevent the eligible page/diagnostic write', async () => {
  const { sqlite, db } = fixture(); const start = Date.now();
  await observe(db, request('/article', { 'Signature-Agent': 'https://example.test' }), 'private-v1', { verifySignature: () => new Promise(() => {}) });
  assert.ok(Date.now() - start >= SIGNATURE_DEADLINE_MS - 25);
  const row = sqlite.prepare('SELECT * FROM page_observations').get();
  assert.equal(row.signature_status, 'unverified');
  assert.ok(row.reader_reason.includes('verification-timeout'));
  const payload = JSON.parse(sqlite.prepare('SELECT payload FROM page_observation_diagnostics').get().payload);
  assert.equal(payload.signatureReason, 'verification-timeout');
});

test('public reports never expose the original UA, replay payload, transport or request correlation IDs', async () => {
  const { sqlite, db } = fixture();
  await observe(db, request('/article', { 'User-Agent': 'distinctive-private-browser/1.0', 'CF-Ray': '1234567890abcdef-SJC' }));
  const report = await queryStats(db, { range: '7d', traffic: 'all' });
  const text = JSON.stringify(report);
  for (const excluded of ['distinctive-private-browser', '1234567890abcdef', 'request_evidence', 'browserMajor', 'userAgent', 'verifierProfile', 'transport']) assert.equal(text.includes(excluded), false, excluded);
  assert.equal(report.totals.views, 1);
});


test('privacy preferences and disabled configuration preserve the existing count without adding optional evidence', async () => {
  const { sqlite, db } = fixture();
  await observe(db, request(), 'off');
  await observe(db, request('/article', { 'Sec-GPC': '1' }));
  await observe(db, request('/article', { DNT: '1' }));
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM page_observations').get().n, 3);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM page_observations WHERE request_evidence IS NOT NULL').get().n, 0);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM page_observation_diagnostics').get().n, 0);
});

test('the additive migration preserves historical rows and rejects invalid or over-budget diagnostic JSON', () => {
  const sqlite = new DatabaseSync(':memory:');
  const fresh = readFileSync(new URL('../schema.sql', import.meta.url), 'utf8');
  const old = fresh.split('-- Private diagnostic evidence')[0].split('\n').filter(line => !line.trim().startsWith('request_evidence ')).join('\n');
  sqlite.exec(old);
  sqlite.exec("INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner) VALUES('/historical','00000000000000000000000000000000','browser','desktop',0)");
  sqlite.exec(readFileSync(new URL('../migrations/0011_request_evidence.sql', import.meta.url), 'utf8'));
  assert.equal(sqlite.prepare('SELECT request_evidence FROM page_observations').get().request_evidence, null);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM page_observation_diagnostics').get().n, 0);
  const insert = sqlite.prepare("INSERT INTO page_observation_diagnostics VALUES(1,'fixture','2026-10-26 00:00:00','2026-12-25 00:00:00',?)");
  assert.throws(() => insert.run('not-json'));
  assert.throws(() => insert.run(JSON.stringify({ value: 'x'.repeat(4096) })));
});


test('an optional page-index timeout cannot stall the base observation', async () => {
  const { sqlite, db } = fixture();
  await observe(db, request(), 'private-v1', { publicPagePaths: () => new Promise(() => {}) });
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM page_observations').get().n, 1);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM page_observation_diagnostics').get().n, 0);
});


test('the diagnostic retention contract keeps the UTC clock and handles calendar boundaries', () => {
  assert.equal(diagnosticExpiry('2026-10-26 23:59:59'), '2026-12-25 23:59:59');
  assert.equal(diagnosticExpiry('2028-01-01 00:00:00'), '2028-03-01 00:00:00');
  assert.throws(() => diagnosticExpiry('not-a-date'));
});

test('cleanup stops at its bounded cap, reports it and can finish later without deleting audience rows', async () => {
  const { sqlite, db } = fixture();
  const observation = sqlite.prepare("INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner) VALUES('/fixture','00000000000000000000000000000000','browser','desktop',0)");
  const diagnostic = sqlite.prepare("INSERT INTO page_observation_diagnostics VALUES(?,'fixture','2026-01-01 00:00:00','2026-01-02 00:00:00','{}')");
  for (let index=0; index<10001; index++) {
    const result=observation.run(); diagnostic.run(Number(result.lastInsertRowid));
  }
  const now=new Date('2026-02-01T00:00:00Z');
  assert.deepEqual(await purgeExpiredDiagnostics(db,now),{deleted:10000,atLimit:true});
  assert.equal((await readRecentDiagnostics(db,now)).length,0);
  assert.deepEqual(await purgeExpiredDiagnostics(db,now),{deleted:1,atLimit:false});
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM page_observations').get().n,10001);
});

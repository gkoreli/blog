import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildEvidenceSummary } from './build-request-evidence-summary.mjs';
const req = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(req.resolve('miniflare', { paths: [dirname(req.resolve('wrangler/package.json'))] })));
const { observePageResponse } = await import(pathToFileURL(resolve('packages/analytics/.test-dist/index.js')));
const { readRecentDiagnostics, purgeExpiredDiagnostics, DIAGNOSTIC_RETENTION_DAYS } = await import(pathToFileURL(resolve('packages/analytics/.test-dist/diagnostics.js')));
const { queryStats } = await import(pathToFileURL(resolve('packages/analytics/.test-dist/stats.js')));
const mf = new Miniflare({ modules: true, script: 'export default {fetch(){return new Response("fixture")}}', compatibilityDate: '2026-03-06', d1Databases: { DB: 'request-evidence-fixture' } });
try {
  const db = await mf.getD1Database('DB');
  const fresh = readFileSync('packages/analytics/schema.sql', 'utf8');
  const old = fresh.split('-- Private diagnostic evidence')[0].split('\n').filter(line => !line.trim().startsWith('request_evidence ')).join('\n');
  await db.batch(old.split(';').map(s => s.trim()).filter(Boolean).map(s => db.prepare(s)));
  await db.prepare("INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,observed_at) VALUES('/legacy',?,'browser','desktop',0,'2026-09-09 00:00:00')").bind('0'.repeat(32)).run();
  await db.batch(readFileSync('packages/analytics/migrations/0011_request_evidence.sql', 'utf8').replace(/^--.*$/gm, '').split(';').map(s => s.trim()).filter(Boolean).map(s => db.prepare(s)));
  assert.equal((await db.prepare("SELECT request_evidence FROM page_observations WHERE path='/legacy'").first()).request_evidence, null);
  async function capture(path = '/fixture', headers = {}, mode = 'private-v1', targetDb = db, options = {}) {
    const request = new Request(`https://example.test${path}`, { headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0) Chrome/152.0.0.0 contact=fixture@example.invalid',
      Accept: 'text/html;q=0.9,text/markdown;q=1', 'Accept-Language': 'en-US,en;q=0.8',
      Cookie: 'fixture-cookie', Authorization: 'Bearer fixture-credential',
      'CF-Connecting-IP': '192.0.2.1', 'CF-Ray': '1234567890abcdef-SJC', ...headers,
    } });
    Object.defineProperty(request, 'cf', { value: { asn: 64512, country: 'US', httpProtocol: 'HTTP/3', tlsVersion: 'TLSv1.3', tlsCipher: 'AEAD-AES128-GCM-SHA256', colo: 'SJC', city: 'fixture-city' } });
    const work = [];
    observePageResponse(request, new Response('page', { headers: { 'Content-Type': 'text/html' } }), 'html', { DB: targetDb, ANALYTICS_HASH_KEY: 'fixture-only', ANALYTICS_DIAGNOSTICS: mode }, { waitUntil(p) { work.push(p); } }, { publicPagePaths: async () => new Set(['/fixture']), ...options });
    await Promise.all(work);
  }
  await capture();
  await capture('/fixture', {}, 'off');
  await capture('/fixture', { 'Sec-GPC': '1' });
  await capture('/fixture', { DNT: '1' });
  await capture('/unrecognized-path');
  await capture('/fixture', { 'Signature-Agent': 'https://example.test' }, 'private-v1', db, { verifySignature: async () => ({ status: 'unverified', reason: 'signature-invalid' }) });
  await capture('/fixture', { 'Signature-Agent': 'https://example.test' }, 'private-v1', db, { verifySignature: () => new Promise(() => {}) });
  const failingDb = { prepare(sql) { if (sql.startsWith('INSERT INTO page_observation_diagnostics')) throw new Error('fixture-private-database-error'); return db.prepare(sql); } };
  await capture('/fixture', {}, 'private-v1', failingDb);
  await capture('/fixture', {}, 'private-v1', db, { publicPagePaths: () => new Promise(() => {}) });
  const counts = await db.prepare(`SELECT COUNT(*) observations, SUM(request_evidence IS NOT NULL) structured
    FROM page_observations WHERE path <> '/legacy'`).first();
  assert.equal(counts.observations, 9); assert.equal(counts.structured, 4);
  const privateRows = (await db.prepare('SELECT payload, expires_at FROM page_observation_diagnostics ORDER BY expires_at').all()).results;
  assert.equal(privateRows.length, 3);
  for (const row of privateRows) {
    for (const excluded of ['fixture@example.invalid', 'fixture-cookie', 'fixture-credential', '192.0.2.1', 'fixture-city', 'fixture-private-database-error']) assert.equal(row.payload.includes(excluded), false, excluded);
    const payload = JSON.parse(row.payload);
    assert.ok(payload.userAgent.value.includes('Chrome/152.0.0.0'));
    assert.equal(payload.userAgent.redacted, true);
    assert.equal(payload.transport.httpProtocol, 'HTTP/3');
  }
  assert.ok(privateRows.some(row => JSON.parse(row.payload).signatureReason === 'verification-timeout'));
  const report = await queryStats(db, { range: '7d', traffic: 'all' });
  assert.equal(report.totals.views, 9);
  const publicText = JSON.stringify(report);
  for (const excluded of ['fixture@example', 'Chrome/152', '1234567890abcdef', 'userAgent', 'request_evidence', 'tlsCipher']) assert.equal(publicText.includes(excluded), false, excluded);
  const today = new Date(); const tomorrow = new Date(today.getTime() + 86400000);
  const summary = (await db.prepare(buildEvidenceSummary(today.toISOString().slice(0,10), tomorrow.toISOString().slice(0,10), today)).all()).results.flatMap(row => JSON.parse(row.payload));
  assert.equal(summary.find(row => row.section==='coverage' && row.key1==='stored-observations').views,9);
  assert.equal(summary.find(row => row.section==='coverage' && row.key1==='structured-captures').views,4);
  assert.equal(summary.find(row => row.section==='coverage' && row.key1==='available-unexpired-diagnostics').views,3);
  for (const excluded of ['Chrome/152', 'fixture@example', '1234567890abcdef']) assert.equal(JSON.stringify(summary).includes(excluded),false);
  assert.throws(() => buildEvidenceSummary('2026-02-31','2026-03-01'));
  assert.throws(() => buildEvidenceSummary('2026-01-01','2026-12-01'));
  assert.throws(() => buildEvidenceSummary("2026-10-01' OR 1=1",'2026-11-01'));
  const latestExpiry = new Date(privateRows.at(-1).expires_at.replace(' ', 'T') + 'Z');
  assert.equal((await readRecentDiagnostics(db, latestExpiry)).length, 0);
  const cleanup = await purgeExpiredDiagnostics(db, latestExpiry);
  assert.equal(cleanup.deleted, 3);
  assert.equal((await db.prepare('SELECT COUNT(*) n FROM page_observations').first()).n, 10);
  const sizes = privateRows.map(row => new TextEncoder().encode(row.payload).byteLength);
  const result = { checkedAt: new Date().toISOString(), runtime: 'Actual collector code with Miniflare/workerd local D1', productionCalls: 0, migration: '0011_request_evidence.sql', legacyEvidenceUnchanged: true, currentObservationCases: 9, structuredRows: 4, privateDiagnosticRows: 3, diagnosticFailurePreservesBase: true, signatureTimeoutPreservesBase: true, optOutModeAndUnknownPathCasesOmitOptionalEvidence: true, identifyingCanariesAbsent: true, publicReportViews: 9, privateCanariesAbsentFromReport: true, expiryReadVisibleRows: 0, cleanupDeleted: cleanup.deleted, audienceRowsAfterCleanup: 10, candidateRetentionDays: DIAGNOSTIC_RETENTION_DAYS, privateSummaryCoveragePasses: true, serializedPayloadBytes: { min: Math.min(...sizes), max: Math.max(...sizes) }, limits: 'Synthetic fixtures; no production metering, legal applicability, real vendor identity or zero-loss guarantee.' };
  writeFileSync('/tmp/gk-request-evidence-local.json', JSON.stringify(result, null, 2) + '\n');
  console.log('Native local D1 migration, optional capture, privacy canaries, expiry, isolation and timeout pass.');
} finally { await mf.dispose(); }

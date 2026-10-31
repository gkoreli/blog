import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { verifyWebBotAuth, createWebBotAuthCache } from '../../analytics/.test-dist/webbotauth.js';
import { verificationEvidence } from '../../analytics/.test-dist/signature-evidence.js';
import { verifierProfileSql, CURRENT_VERIFIER_PROFILE } from '../../analytics/.test-dist/verifier-profile.js';
import { queryStats } from '../../analytics/.test-dist/stats.js';

const [output, fixturePath, racePath] = process.argv.slice(2); assert.ok(output && fixturePath && racePath);
const f = JSON.parse(readFileSync(fixturePath, 'utf8')), race = JSON.parse(readFileSync(racePath, 'utf8'));
const sha = file => createHash('sha256').update(readFileSync(file)).digest('hex');
assert.equal(sha(fixturePath), race.inputSha256);
const failure = race.rows[0].cases.find(row => row.condition === 'late-old-import').results[0];
assert.equal(failure.status, 'unverified'); assert.equal(failure.reason, 'reload');
const request = new Request(f.requests[0].url, { headers: f.requests[0].headers });
const positive = await verifyWebBotAuth(request, { now: new Date(f.now), includeEvidence: true, cache: createWebBotAuthCache(),
  fetcher: async url => { assert.equal(String(url), f.url); return Response.json({ keys: [f.keys[0].jwk] }, { headers: { 'Content-Type': 'application/http-message-signatures-directory+json' } }); },
});
assert.equal(positive.status, 'verified');
const evidence = [verificationEvidence(request, positive), verificationEvidence(request, failure)];
assert.equal(evidence[1].localOutcome, 'unavailable'); assert.equal(evidence[1].localReason, 'reload');
const require = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] })));
const mf = new Miniflare({ modules: true, script: 'export default{fetch(){return new Response("local report control")}}', compatibilityDate: '2026-03-06', cf: {}, d1Databases: { DB: 'lifecycle-profile' } });
try {
  const db = await mf.getD1Database('DB');
  const schema = readFileSync('packages/analytics/schema.sql', 'utf8').replace(/^\s*--.*$/gm, '');
  await db.batch(schema.split(';').map(s => s.trim()).filter(Boolean).map(sql => db.prepare(sql)));
  for (const [index, value] of evidence.entries()) await db.prepare(`INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,observed_at,signature_status,signature_evidence,collection_version,classifier_version)
    VALUES('/article',?,'bot','desktop',0,'other-bot','fixture','2026-10-30 23:50:00',?,?,'2026-10-30.1','2026-10-29.3')`).bind(String(index + 1).padStart(32, '0'), value.localStatus, JSON.stringify(value)).run();
  const projected = await db.prepare(`SELECT ${verifierProfileSql()} AS profile FROM page_observations ORDER BY id`).all();
  assert.deepEqual(projected.results.map(row => row.profile), [CURRENT_VERIFIER_PROFILE, CURRENT_VERIFIER_PROFILE]);
  const report = await queryStats(db, { range: 'all', traffic: 'all' }, new Date('2026-10-30T23:59:00Z'));
  assert.equal(report.totals.views, 2); assert.equal(report.byKindSignature.reduce((n, row) => n + row.views, 0), 2);
  assert.ok(report.byKindSignature.every(row => row.profile === CURRENT_VERIFIER_PROFILE));
  writeFileSync(output, JSON.stringify({ checkedAt: new Date().toISOString(), source: 'Actual local D1 stored-envelope SQL and full report decoder',
    verifierProfile: CURRENT_VERIFIER_PROFILE, storedRows: 2, currentProfileRows: 2, unavailableReason: evidence[1].localReason,
    unavailableOutcome: evidence[1].localOutcome, totals: report.totals.views, byKindSignature: report.byKindSignature,
    largestStoredEnvelopeBytes: Math.max(...evidence.map(e => Buffer.byteLength(JSON.stringify(e)))), productionStatements: 0 }, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify({ rows: 2, profile: CURRENT_VERIFIER_PROFILE, unavailableReason: 'reload', recognized: true }));
} finally { await mf.dispose(); }

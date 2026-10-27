import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { observePageResponse } from '../../../../analytics/.test-dist/index.js';
import { queryStats } from '../../../../analytics/.test-dist/stats.js';
import { COLLECTION_VERSION, CLASSIFIER_VERSION, VERIFIER_PROFILE_VERSION } from '../../../../analytics/.test-dist/versions.js';

const output = process.argv[2];
assert.ok(output, 'Provide a new aggregate receipt path');
const require = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] })));
const mf = new Miniflare({ modules: true, script: 'export default {fetch(){return new Response("fixture")}}', compatibilityDate: '2026-03-06', d1Databases: { DB: 'component-checks' } });
const originalFetch = globalThis.fetch;
let directoryFetches = 0;
globalThis.fetch = async () => { directoryFetches++; throw new Error('Unexpected directory fetch'); };
try {
  const db = await mf.getD1Database('DB');
  const schema = readFileSync('packages/analytics/schema.sql', 'utf8').replace(/^\s*--.*$/gm, '');
  await db.batch(schema.split(';').map(s => s.trim()).filter(Boolean).map(s => db.prepare(s)));
  await db.prepare("INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,observed_at) VALUES('/historical','00000000000000000000000000000000','browser','desktop',0,'browser','fixture',datetime('now'))").run();
  const trials = [];
  for (const [label, components] of [
    ['authority', '"@authority" "@authority" "signature-agent";key="sig"'],
    ['header', '"@authority" "user-agent" "user-agent" "signature-agent";key="sig"'],
    ['member', '"@authority" "signature-agent";key="sig" "signature-agent";key="sig"'],
    ['unsigned', null], ['excluded', '"@authority" "@authority" "signature-agent";key="sig"'],
  ]) {
    const epoch = Math.floor(Date.now() / 1000);
    const headers = { 'User-Agent': 'SyntheticClient/1.0', Accept: 'text/html' };
    if (components !== null) Object.assign(headers, { 'Signature-Agent': 'sig="https://fixture.example"',
      'Signature-Input': `sig=(${components});created=${epoch};expires=${epoch + 300};keyid="synthetic-control";alg="ed25519";tag="web-bot-auth"`,
      Signature: `sig=:${Buffer.alloc(64).toString('base64')}:`,
    });
    if (label === 'excluded') headers.Referer = 'https://traffic2cash.xyz/';
    const pending = [];
    const path = label === 'excluded' ? '/privacy' : '/' + label;
    observePageResponse(new Request(`https://publication.example${path}`, { headers }), new Response('fixture', { headers: { 'Content-Type': 'text/html' } }), 'html',
      { DB: db, ANALYTICS_HASH_KEY: 'local-fixture-only' }, { waitUntil: p => pending.push(p) });
    await Promise.all(pending);
    const row = await db.prepare('SELECT signature_evidence,request_evidence,collection_version,classifier_version FROM page_observations WHERE path=?').bind(path).first();
    const evidence = JSON.parse(row.signature_evidence);
    assert.equal(evidence.verifierProfile, VERIFIER_PROFILE_VERSION);
    assert.equal(evidence.localOutcome, label === 'unsigned' ? 'absent' : 'invalid');
    assert.deepEqual(evidence.localReasons, label === 'unsigned' ? [] : ['duplicate-component']);
    assert.equal(evidence.coverage, null); assert.equal(row.request_evidence, null);
    assert.equal(row.collection_version, COLLECTION_VERSION); assert.equal(row.classifier_version, CLASSIFIER_VERSION);
    assert.ok(Buffer.byteLength(row.signature_evidence) <= 2048);
    trials.push({ label, outcome: evidence.localOutcome, reasons: evidence.localReasons, bytes: Buffer.byteLength(row.signature_evidence) });
  }
  assert.equal(directoryFetches, 0);
  const report = await queryStats(db, { range: '7d', traffic: 'all' });
  assert.equal(report.totals.views, 5); assert.equal(report.referralPolicy.excludedViews, 1);
  assert.equal(report.verification.localInvalidViews, 3); assert.equal(report.verification.localAbsentViews, 1); assert.equal(report.verification.notRecordedViews, 1);
  assert.equal((await db.prepare("SELECT signature_evidence FROM page_observations WHERE path='/historical'").first()).signature_evidence, null);
  const controlSql = readFileSync('packages/blog/drafts/research/analytics-retrospective/signature-components-control-acceptance.sql', 'utf8');
  const controls = (await db.prepare(controlSql).bind('2000-01-01 00:00:00', '2100-01-01 00:00:00').all()).results;
  assert.equal(controls.length, 1); assert.equal(controls[0].outcome, 'invalid'); assert.equal(controls[0].verifierProfile, VERIFIER_PROFILE_VERSION);
  assert.equal(controls[0].coverageAbsent, 1); assert.equal(controls[0].optionalCaptureAbsent, 1);
  const files = ['webbotauth.ts', 'signature-evidence.ts', 'versions.ts', 'index.ts', 'stats.ts'];
  writeFileSync(output, JSON.stringify({ checkedAt: new Date().toISOString(), runtime: process.version,
    method: 'Actual Node collector and workerd D1; malformed-component controls have dummy signature bytes, not vendor proofs; independent signed cases are in the separate component probe',
    collectionVersion: COLLECTION_VERSION, classifierVersion: CLASSIFIER_VERSION, verifierProfile: VERIFIER_PROFILE_VERSION, trials,
    checks: { nativeD1: true, closedReasonPersisted: true, invalidSummary: true, referralExclusion: true, historyUnchanged: true, optionalCaptureOff: true, noDirectoryFetch: true, narrowProductionSql: true },
    sourceSha256: Object.fromEntries(files.map(file => [file, createHash('sha256').update(readFileSync('packages/analytics/src/' + file)).digest('hex')])),
    directoryFetches, productionCalls: 0,
  }, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ trials: trials.length, directoryFetches, productionCalls: 0 }));
} finally { globalThis.fetch = originalFetch; await mf.dispose(); }

import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { queryStats } from '../../analytics/.test-dist/stats.js';
import { VERIFIER_PROFILE_VERSION } from '../../analytics/.test-dist/versions.js';

const output = process.argv[2];
assert.ok(output, 'Provide a new aggregate receipt path');
const req = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(req.resolve('miniflare', { paths: [dirname(req.resolve('wrangler/package.json'))] })));
const bundle = await build({ stdin: { resolveDir: process.cwd(), contents: `
  import { observePageResponse } from './packages/analytics/src/index.ts';
  let directoryFetches = 0;
  globalThis.fetch = async () => { directoryFetches++; throw Error('Unexpected fixture directory fetch'); };
  export default { fetch(request, env, ctx) {
    if (new URL(request.url).pathname === '/__fetch-count') return Response.json({directoryFetches});
    const response = new Response('Native collector fixture', {headers:{'Content-Type':'text/html'}});
    observePageResponse(request, response, 'html', env, ctx);
    return response;
  } };
` }, bundle: true, write: false, format: 'esm', platform: 'browser', logLevel: 'silent' });
const mf = new Miniflare({ modules: true, script: bundle.outputFiles[0].text, compatibilityDate: '2026-03-06', d1Databases: { DB: 'discovery-controls' }, bindings: { ANALYTICS_HASH_KEY: 'local-fixture-only' } });
try {
  const db = await mf.getD1Database('DB');
  const schema = readFileSync('packages/analytics/schema.sql', 'utf8').replace(/^\s*--.*$/gm, '');
  await db.batch(schema.split(';').map(s => s.trim()).filter(Boolean).map(s => db.prepare(s)));
  await db.prepare("INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,observed_at) VALUES('/historical','00000000000000000000000000000000','browser','desktop',0,'browser','fixture',datetime('now'))").run();
  const trials = [];
  for (const [label, target] of [['loopback', 'https://127.1'], ['local-name', 'https://service.localhost.'], ['port', 'https://fixture.example:8443'], ['unsigned', null], ['excluded', 'https://[::1]']]) {
    const epoch = Math.floor(Date.now() / 1000), headers = { 'User-Agent': 'SyntheticClient/1.0', Accept: 'text/html' };
    if (target) Object.assign(headers, { 'Signature-Agent': JSON.stringify(target),
      'Signature-Input': `sig=("@authority" "signature-agent");created=${epoch};expires=${epoch + 300};keyid="synthetic-control";alg="ed25519";tag="web-bot-auth"`, Signature: `sig=:${Buffer.alloc(64).toString('base64')}:` });
    if (label === 'excluded') headers.Referer = 'https://traffic2cash.xyz/';
    const path = label === 'excluded' ? '/privacy' : '/' + label;
    assert.equal((await mf.dispatchFetch('https://publication.example' + path, { headers })).status, 200);
    let row;
    for (let i = 0; i < 20; i++) {
      row = await db.prepare('SELECT signature_evidence,request_evidence FROM page_observations WHERE path=?').bind(path).first();
      if (row) break;
      await new Promise(resolve => setTimeout(resolve, 25));
    }
    assert.ok(row);
    const evidence = JSON.parse(row.signature_evidence);
    assert.equal(evidence.verifierProfile, VERIFIER_PROFILE_VERSION);
    assert.equal(evidence.localOutcome, target ? 'policy-rejected' : 'absent');
    assert.deepEqual(evidence.localReasons, target ? ['discovery-policy-rejected'] : []);
    assert.equal(evidence.coverage, null); assert.equal(row.request_evidence, null);
    trials.push({ label, outcome: evidence.localOutcome, reasons: evidence.localReasons, evidenceBytes: Buffer.byteLength(row.signature_evidence) });
  }
  const directory = await (await mf.dispatchFetch('https://publication.example/__fetch-count')).json();
  assert.equal(directory.directoryFetches, 0);
  const report = await queryStats(db, { range: '7d', traffic: 'all' });
  assert.equal(report.totals.views, 5); assert.equal(report.referralPolicy.excludedViews, 1);
  assert.equal(report.verification.localPolicyRejectedViews, 3); assert.equal(report.verification.localInvalidViews, 0);
  assert.equal(report.verification.localAbsentViews, 1); assert.equal(report.verification.notRecordedViews, 1);
  const sql = readFileSync('packages/blog/drafts/research/analytics-retrospective/signature-discovery-control-acceptance.sql', 'utf8');
  const bindings = ['2000-01-01 00:00:00', '2100-01-01 00:00:00'];
  const controls = (await db.prepare(sql).bind(...bindings).all()).results;
  assert.equal(controls.length, 1); assert.equal(controls[0].outcome, 'policy-rejected');
  assert.equal(controls[0].coverageAbsent, 1); assert.equal(controls[0].optionalCaptureAbsent, 1);
  const queryPlan = (await db.prepare('EXPLAIN QUERY PLAN ' + sql).bind(...bindings).all()).results;
  assert.ok(queryPlan.some(row => row.detail.includes('idx_page_observations_public_path_time')));
  const files = ['packages/analytics/src/directory-discovery.ts', 'packages/analytics/src/webbotauth.ts', 'packages/analytics/src/signature-evidence.ts', 'packages/analytics/src/versions.ts', 'packages/blog/drafts/research/analytics-retrospective/signature-discovery-control-acceptance.sql'];
  writeFileSync(output, JSON.stringify({ checkedAt: new Date().toISOString(), runtime: process.version,
    method: 'Actual bundled collector in native local workerd/D1/crypto, with a fixture response wrapper and intercepted directory fetches. Dummy signature bytes: URL policy rejects before crypto.',
    verifierProfile: VERIFIER_PROFILE_VERSION, trials, queryPlan,
    checks: { closedOutcomePersistence: true, policySummary: true, invalidSummaryUnchanged: true, historicalNull: true, referralExclusion: true, optionalCaptureOff: true, indexedAcceptanceSql: true },
    sourceSha256: Object.fromEntries(files.map(file => [file, createHash('sha256').update(readFileSync(file)).digest('hex')])),
    networkCalls: 0, productionCalls: 0, directoryFetches: directory.directoryFetches,
    limits: ['No DNS resolution, egress enforcement, rebinding, vendor identity or native-provider acceptance is tested.', 'The fixture response wrapper is not the production blog routing. Independent signed cases are recorded separately.'],
  }, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ trials: trials.length, directoryFetches: directory.directoryFetches, productionCalls: 0 }));
} finally { await mf.dispose(); }

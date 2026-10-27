import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { signatureAsciiFixture } from '../../analytics/test/fixtures/signature-ascii.mjs';
import { queryStats } from '../../analytics/.test-dist/stats.js';
import { COLLECTION_VERSION, VERIFIER_PROFILE_VERSION } from '../../analytics/.test-dist/versions.js';

const output = process.argv[2]; assert.ok(output, 'Provide a new closed receipt path');
const require = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] })));
const fixture = await signatureAsciiFixture();
const bundle = await build({ stdin: { resolveDir: process.cwd(), contents: `
  import { observePageResponse } from './packages/analytics/src/index.ts';
  let directoryFetches = 0;
  globalThis.fetch = async (url) => {
    directoryFetches++;
    if (String(url) !== 'https://fixture.example/.well-known/http-message-signatures-directory') throw Error('Unexpected fixture lookup');
    return Response.json({keys:[${JSON.stringify(fixture.jwk)}]}, {headers:{'Content-Type':'application/http-message-signatures-directory+json'}});
  };
  export default { fetch(request, env, ctx) {
    if (new URL(request.url).pathname === '/__fetch-count') return Response.json({directoryFetches});
    const response = new Response('Native ASCII fixture', {headers:{'Content-Type':'text/html'}});
    observePageResponse(request, response, 'html', env, ctx);
    return response;
  } };
` }, bundle: true, write: false, format: 'esm', platform: 'browser', logLevel: 'silent' });
const mf = new Miniflare({ modules: true, script: bundle.outputFiles[0].text, compatibilityDate: '2026-03-06',
  cf: {}, d1Databases: { DB: 'signature-ascii-controls' }, bindings: { ANALYTICS_HASH_KEY: 'local-fixture-only' } });
try {
  const db = await mf.getD1Database('DB');
  const schema = readFileSync('packages/analytics/schema.sql', 'utf8').replace(/^\s*--.*$/gm, '');
  await db.batch(schema.split(';').map(value => value.trim()).filter(Boolean).map(sql => db.prepare(sql)));
  await db.prepare("INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,observed_at) VALUES('/historical','00000000000000000000000000000000','browser','desktop',0,'browser','fixture',datetime('now'))").run();
  const baseline = 'SyntheticClient/1.0';
  const controls = [
    ['ascii', baseline, baseline, 'verified'],
    ['http-ows', baseline, ' \t' + baseline + '\t ', 'verified'],
    ['nbsp-mutation', baseline, '\u00a0' + baseline + '\u00a0', 'unsupported'],
    ['raw-utf8', 'Synthetic\u00a0Client/1.0', 'Synthetic\u00a0Client/1.0', 'unsupported'],
    ['signer-whitespace', baseline, baseline, 'invalid'],
    ['excluded', baseline, '\u00a0' + baseline, 'unsupported'],
  ];
  const trials = [];
  for (const [label, signed, received, outcome] of controls) {
    const headers = { ...await fixture.headers(signed, received), Accept: 'text/html' };
    if (label === 'signer-whitespace') headers['Signature-Agent'] = '\u00a0' + headers['Signature-Agent'];
    if (label === 'excluded') headers.Referer = 'https://traffic2cash.xyz/';
    const path = label === 'excluded' ? '/privacy' : '/' + label;
    assert.equal((await mf.dispatchFetch('https://publication.example' + path, { headers })).status, 200);
    let row;
    for (let attempt = 0; attempt < 40; attempt++) {
      row = await db.prepare('SELECT collection_version,signature_agent,signature_evidence,request_evidence FROM page_observations WHERE path=?').bind(path).first();
      if (row) break; await new Promise(resolve => setTimeout(resolve, 25));
    }
    assert.ok(row); const evidence = JSON.parse(row.signature_evidence);
    assert.equal(row.collection_version, COLLECTION_VERSION); assert.equal(evidence.verifierProfile, VERIFIER_PROFILE_VERSION);
    assert.equal(evidence.localOutcome, outcome); assert.equal(row.request_evidence, null);
    assert.equal(evidence.native.verifiedBot, null); assert.equal(evidence.native.signedAgent, null);
    if (outcome === 'verified') assert.equal(evidence.coverage.covered.userAgent, true);
    else { assert.equal(evidence.coverage, null); assert.equal(row.signature_agent, null); }
    assert.deepEqual(evidence.localReasons, outcome === 'verified' ? [] : [outcome === 'unsupported' ? 'non-ascii-signature-base' : 'malformed-signature-agent']);
    trials.push({ label, outcome, reasons: evidence.localReasons, coverageRecorded: evidence.coverage !== null });
  }
  const directory = await (await mf.dispatchFetch('https://publication.example/__fetch-count')).json();
  assert.equal(directory.directoryFetches, 1);
  const report = await queryStats(db, { range: '7d', traffic: 'all' });
  assert.equal(report.totals.views, 6); assert.equal(report.referralPolicy.excludedViews, 1);
  assert.equal(report.verification.localVerifiedViews, 2); assert.equal(report.verification.localUnsupportedViews, 2);
  assert.equal(report.verification.localInvalidViews, 1); assert.equal(report.verification.notRecordedViews, 1);
  const sql = readFileSync('packages/blog/drafts/research/analytics-retrospective/signature-ascii-control-acceptance.sql', 'utf8');
  const bindings = ['2000-01-01 00:00:00', '2100-01-01 00:00:00'];
  const rows = (await db.prepare(sql).bind(...bindings).all()).results;
  assert.equal(rows.length, 1); assert.equal(rows[0].outcome, 'unsupported'); assert.equal(rows[0].coverageAbsent, 1);
  const plan = (await db.prepare('EXPLAIN QUERY PLAN ' + sql).bind(...bindings).all()).results;
  assert.ok(plan.some(row => row.detail.includes('idx_page_observations_public_path_time')));
  const files = ['packages/analytics/src/webbotauth.ts', 'packages/analytics/src/signature-evidence.ts', 'packages/analytics/src/versions.ts', 'packages/analytics/test/fixtures/signature-ascii.mjs', 'packages/blog/drafts/research/analytics-retrospective/signature-ascii-control-acceptance.sql'];
  writeFileSync(output, JSON.stringify({ checkedAt: new Date().toISOString(), method: 'Actual bundled collector in native local workerd/D1/WebCrypto; independent ephemeral signer, intercepted directory and explicitly empty fixture cf metadata, not a provider request.',
    collectionVersion: COLLECTION_VERSION, verifierProfile: VERIFIER_PROFILE_VERSION, trials, directoryFetches: directory.directoryFetches,
    checks: { closedPersistence: true, noCoverageForUnsupported: true, historicalUnknown: true, completeReport: true, referralExclusion: true, optionalCaptureOff: true, indexedAcceptanceSql: true },
    queryPlan: plan, networkCalls: 0, productionCalls: 0,
    sourceSha256: Object.fromEntries(files.map(file => [file, createHash('sha256').update(readFileSync(file)).digest('hex')])),
    limits: ['No production/provider-native or human acceptance.', 'Raw UTF-8 crypto validity is not RFC-valid signature-base construction.', 'Binary-wrapped ;bs remains unsupported.'] }, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ controls: trials.length, directoryFetches: directory.directoryFetches, productionCalls: 0 }));
} finally { await mf.dispose(); }

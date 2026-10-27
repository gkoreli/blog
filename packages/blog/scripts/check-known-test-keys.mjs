import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { queryStats } from '../../analytics/.test-dist/stats.js';
import { ed25519JwkThumbprint } from '../../analytics/.test-dist/webbotauth.js';
import { VERIFIER_PROFILE_VERSION } from '../../analytics/.test-dist/versions.js';
import { KNOWN_TEST_KEYS } from '../../analytics/.test-dist/known-test-keys.js';

const output = process.argv[2]; assert.ok(output, 'Provide a new aggregate receipt path');
const req = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(req.resolve('miniflare', { paths: [dirname(req.resolve('wrangler/package.json'))] })));
const pair = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
const publicJwk = await crypto.subtle.exportKey('jwk', pair.publicKey), positiveKid = await ed25519JwkThumbprint(publicJwk);
const example = KNOWN_TEST_KEYS[0], paddedJwk = { kty: 'OKP', crv: 'Ed25519', x: example.x + '=' }, paddedKid = await ed25519JwkThumbprint(paddedJwk);
const bundle = await build({ stdin: { resolveDir: process.cwd(), contents: `
  import { observePageResponse } from './packages/analytics/src/index.ts';
  let directoryFetches = 0;
  globalThis.fetch = async (url) => {
    directoryFetches++;
    if (String(url) !== 'https://fixture.example/.well-known/http-message-signatures-directory') throw Error('Unexpected fixture directory');
    return Response.json({keys:${JSON.stringify([paddedJwk, publicJwk])}}, {headers:{'Content-Type':'application/http-message-signatures-directory+json'}});
  };
  export default { fetch(request, env, ctx) {
    if (new URL(request.url).pathname === '/__fetch-count') return Response.json({directoryFetches});
    const response = new Response('Native collector fixture', {headers:{'Content-Type':'text/html'}});
    observePageResponse(request, response, 'html', env, ctx); return response;
  } };
` }, bundle: true, write: false, format: 'esm', platform: 'browser', logLevel: 'silent' });
const mf = new Miniflare({ modules: true, script: bundle.outputFiles[0].text, compatibilityDate: '2026-03-06', d1Databases: { DB: 'known-test-key-controls' }, bindings: { ANALYTICS_HASH_KEY: 'local-fixture-only' } });
try {
  const db = await mf.getD1Database('DB');
  const schema = readFileSync('packages/analytics/schema.sql', 'utf8').replace(/^\s*--.*$/gm, '');
  await db.batch(schema.split(';').map(s => s.trim()).filter(Boolean).map(s => db.prepare(s)));
  await db.prepare("INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,observed_at) VALUES('/historical','00000000000000000000000000000000','browser','desktop',0,'browser','fixture',datetime('now'))").run();
  const trials = [];
  for (const label of ['canonical', 'padded-alias', 'declared-exa', 'genuine-positive', 'excluded']) {
    const epoch = Math.floor(Date.now() / 1000), positive = label === 'genuine-positive';
    const path = label === 'excluded' ? '/privacy' : '/' + label;
    const exa = ['declared-exa', 'excluded'].includes(label), agent = exa ? 'https://crawler.exa.ai' : 'https://fixture.example';
    const kid = positive ? positiveKid : label === 'padded-alias' ? paddedKid : example.id;
    const params = `("@authority" "@method" "@path" "signature-agent");created=${epoch};expires=${epoch + 60};keyid="${kid}";alg="ed25519";tag="web-bot-auth"`;
    const base = `"@authority": publication.example\n"@method": GET\n"@path": ${path}\n"signature-agent": "${agent}"\n"@signature-params": ${params}`;
    const bytes = positive ? await crypto.subtle.sign('Ed25519', pair.privateKey, new TextEncoder().encode(base)) : new Uint8Array(64);
    const headers = { 'User-Agent': exa ? 'ExaSearchBot/1.0' : 'SyntheticClient/1.0', Accept: 'text/html', 'Signature-Agent': JSON.stringify(agent), 'Signature-Input': 'sig=' + params, Signature: `sig=:${Buffer.from(bytes).toString('base64')}:` };
    if (label === 'excluded') headers.Referer = 'https://traffic2cash.xyz/';
    assert.equal((await mf.dispatchFetch('https://publication.example' + path, { headers })).status, 200);
    let row;
    for (let i = 0; i < 20; i++) {
      row = await db.prepare('SELECT signature_agent,signature_evidence,request_evidence FROM page_observations WHERE path=?').bind(path).first();
      if (row) break; await new Promise(resolve => setTimeout(resolve, 25));
    }
    assert.ok(row); const evidence = JSON.parse(row.signature_evidence);
    assert.equal(evidence.verifierProfile, VERIFIER_PROFILE_VERSION); assert.equal(row.request_evidence, null);
    assert.equal(evidence.localOutcome, positive ? 'verified' : 'policy-rejected');
    assert.deepEqual(evidence.localReasons, positive ? [] : ['known-test-key']);
    if (!positive) { assert.equal(evidence.coverage, null); assert.equal(row.signature_agent, null); }
    else { assert.equal(evidence.coverage.covered.method, true); assert.equal(evidence.coverage.covered.path, true); }
    if (exa) { assert.equal(evidence.vendor.status, 'not-verified'); assert.equal(evidence.vendor.userAgentCovered, null); }
    trials.push({ label, outcome: evidence.localOutcome, reasons: evidence.localReasons, vendorStatus: evidence.vendor.status, coverageRecorded: evidence.coverage !== null });
  }
  const counts = await (await mf.dispatchFetch('https://publication.example/__fetch-count')).json(); assert.equal(counts.directoryFetches, 1);
  const report = await queryStats(db, { range: '7d', traffic: 'all' });
  assert.equal(report.totals.views, 5); assert.equal(report.referralPolicy.excludedViews, 1);
  assert.equal(report.verification.localPolicyRejectedViews, 3); assert.equal(report.verification.localVerifiedViews, 1);
  assert.equal(report.verification.vendorMatchingOriginViews, 0); assert.equal(report.verification.vendorNotVerifiedViews, 1);
  assert.equal(report.verification.notRecordedViews, 1);
  const sql = readFileSync('packages/blog/drafts/research/analytics-retrospective/known-test-key-control-acceptance.sql', 'utf8');
  const bindings = ['2000-01-01 00:00:00', '2100-01-01 00:00:00'];
  const rows = (await db.prepare(sql).bind(...bindings).all()).results; assert.equal(rows.length, 1);
  assert.equal(rows[0].outcome, 'policy-rejected'); assert.equal(rows[0].vendorStatus, 'not-verified');
  assert.equal(rows[0].authenticatedSignerAbsent, 1); assert.equal(rows[0].declaredAgent, 'ExaSearchBot');
  const queryPlan = (await db.prepare('EXPLAIN QUERY PLAN ' + sql).bind(...bindings).all()).results;
  assert.ok(queryPlan.some(row => row.detail.includes('idx_page_observations_public_path_time')));
  const files = ['packages/analytics/src/known-test-keys.ts', 'packages/analytics/src/webbotauth.ts', 'packages/analytics/src/signature-evidence.ts', 'packages/analytics/src/versions.ts', 'packages/blog/drafts/research/analytics-retrospective/known-test-key-control-acceptance.sql'];
  writeFileSync(output, JSON.stringify({ checkedAt: new Date().toISOString(), runtime: process.version,
    method: 'Actual bundled collector in native local workerd/D1/crypto with fixture HTTP wrapper and intercepted directory. Genuine positive is independently signed with an ephemeral key; rejected controls use dummy bytes. Real example-key signing is checked separately.',
    verifierProfile: VERIFIER_PROFILE_VERSION, trials, queryPlan,
    checks: { closedOutcomePersistence: true, policySummary: true, genuineSignatureAccepted: true, noAuthenticatedExaFromRejectedKey: true, historicalNull: true, referralExclusion: true, optionalCaptureOff: true, indexedAcceptanceSql: true },
    sourceSha256: Object.fromEntries(files.map(file => [file, createHash('sha256').update(readFileSync(file)).digest('hex')])),
    directoryFetches: counts.directoryFetches, networkCalls: 0, productionCalls: 0,
    limits: ['Two reviewed public example keys, not all possible demonstration or compromised keys.', 'Fixture wrapper does not execute blog routing or native Cloudflare verification; no vendor identity/human proof.'],
  }, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ trials: trials.length, directoryFetches: counts.directoryFetches, productionCalls: 0 }));
} finally { await mf.dispose(); }

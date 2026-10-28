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
  import { buildSignatureBase } from './packages/analytics/src/webbotauth.ts';
  let directoryFetches = 0, wireInvocations = 0;
  globalThis.fetch = async (url) => {
    directoryFetches++;
    if (String(url) !== 'https://fixture.example/.well-known/http-message-signatures-directory') throw Error('Unexpected fixture lookup');
    return Response.json({keys:[${JSON.stringify(fixture.jwk)}]}, {headers:{'Content-Type':'application/http-message-signatures-directory+json'}});
  };
  export default { fetch(incoming, env, ctx) {
    const url = new URL(incoming.url);
    if (url.pathname === '/__counts') return Response.json({directoryFetches,wireInvocations});
    if (url.pathname === '/__wire') { wireInvocations++; return Response.json({arrived:true,fragmentVisible:incoming.url.includes('#')}); }
    if (url.pathname === '/__construct') {
      const code = Number(url.searchParams.get('code')); let request;
      try { request = new Request('https://publication.example/a', {headers:{'x-fixture':'a'+String.fromCharCode(code)+'b','Signature-Input':'sig=("@authority" "x-fixture");created=1;keyid="fixture"'}}); }
      catch (error) { return Response.json({constructorRejected:true}); }
      return Response.json({constructorRejected:false,fieldPreserved:request.headers.get('x-fixture')==='a'+String.fromCharCode(code)+'b',localProducedBase:buildSignatureBase(request,'sig')!==null});
    }
    const mode = incoming.headers.get('X-Fixture-Mode'), headers = new Headers(incoming.headers);
    if (mode === 'control' || mode === 'excluded') headers.set('User-Agent','Synthetic'+String.fromCharCode(1)+'Client/1.0');
    if (mode === 'del') headers.set('User-Agent','Synthetic'+String.fromCharCode(127)+'Client/1.0');
    if (mode === 'non-ascii') headers.set('User-Agent','Synthetic'+String.fromCharCode(160)+'Client/1.0');
    const target = incoming.url + (mode === 'fragment' ? '#part' : mode === 'empty-fragment' ? '#' : '');
    const request = new Request(target, {method:'GET',headers});
    const response = new Response('Constructed-context fixture', {headers:{'Content-Type':'text/html'}});
    observePageResponse(request,response,'html',env,ctx); return response;
  } };
` }, bundle: true, write: false, format: 'esm', platform: 'browser', logLevel: 'silent' });
const mf = new Miniflare({ modules: true, script: bundle.outputFiles[0].text, compatibilityDate: '2026-03-06', cf: {},
  d1Databases: { DB: 'signature-context-controls' }, bindings: { ANALYTICS_HASH_KEY: 'local-fixture-only' } });
try {
  const db = await mf.getD1Database('DB');
  const schema = readFileSync('packages/analytics/schema.sql', 'utf8').replace(/^\s*--.*$/gm, '');
  await db.batch(schema.split(';').map(value => value.trim()).filter(Boolean).map(sql => db.prepare(sql)));
  await db.prepare("INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,observed_at) VALUES('/historical','00000000000000000000000000000000','browser','desktop',0,'browser','fixture',datetime('now'))").run();
  const trials = [];
  for (const mode of ['ascii', 'control', 'del', 'fragment', 'empty-fragment', 'non-ascii', 'excluded']) {
    const value = mode === 'control' || mode === 'excluded' ? 'Synthetic\u0001Client/1.0' : mode === 'del' ? 'Synthetic\u007fClient/1.0' : 'SyntheticClient/1.0';
    // Malformed characters are injected inside workerd after the local HTTP
    // boundary. The wire carries only ASCII; do not call these ingress labels.
    const headers = { ...await fixture.headers(value, 'SyntheticClient/1.0'), 'X-Fixture-Mode': mode, Accept: 'text/html' };
    if (mode === 'excluded') headers.Referer = 'https://traffic2cash.xyz/';
    const path = mode === 'excluded' ? '/privacy' : '/' + mode;
    assert.equal((await mf.dispatchFetch('https://publication.example' + path, { headers })).status, 200);
    let row;
    for (let attempt = 0; attempt < 40; attempt++) {
      row = await db.prepare('SELECT signature_agent,signature_evidence,request_evidence FROM page_observations WHERE path=?').bind(path).first();
      if (row) break; await new Promise(resolve => setTimeout(resolve, 25));
    }
    assert.ok(row); const evidence = JSON.parse(row.signature_evidence);
    const reason = mode === 'ascii' ? null : mode === 'non-ascii' ? 'non-ascii-signature-base' : mode.includes('fragment') ? 'invalid-request-target' : 'malformed-field-component';
    assert.equal(evidence.verifierProfile, VERIFIER_PROFILE_VERSION); assert.equal(evidence.localReason, reason);
    assert.equal(evidence.localOutcome, mode === 'ascii' ? 'verified' : mode === 'non-ascii' ? 'unsupported' : 'invalid');
    assert.equal(row.request_evidence, null); assert.equal(evidence.native.verifiedBot, null); assert.equal(evidence.native.signedAgent, null);
    assert.equal(evidence.coverage !== null, mode === 'ascii');
    if (mode !== 'ascii') assert.equal(row.signature_agent, null);
    trials.push({ mode, outcome: evidence.localOutcome, reason, coverageRecorded: evidence.coverage !== null });
  }
  const boundaries = [];
  for (const code of [0, 1, 9, 10, 13, 31, 32, 127, 160]) {
    const construct = await (await mf.dispatchFetch('https://publication.example/__construct?code=' + code)).json();
    const before = await (await mf.dispatchFetch('https://publication.example/__counts')).json();
    let wireStatus = null, clientRejected = false;
    try { wireStatus = (await mf.dispatchFetch('https://publication.example/__wire', { headers: { 'x-fixture': 'a' + String.fromCharCode(code) + 'b' } })).status; }
    catch { clientRejected = true; }
    const after = await (await mf.dispatchFetch('https://publication.example/__counts')).json();
    assert.equal(after.wireInvocations - before.wireInvocations, [9,32,160].includes(code) ? 1 : 0);
    if (!construct.constructorRejected) assert.equal(construct.localProducedBase, [9,32].includes(code));
    boundaries.push({ code, construct, wireStatus, clientRejected, workerWireInvocations: after.wireInvocations - before.wireInvocations });
  }
  const fragmentTransport = [];
  for (const suffix of ['#part', '#']) {
    const received = await (await mf.dispatchFetch('https://publication.example/__wire' + suffix)).json();
    assert.equal(received.arrived, true); assert.equal(received.fragmentVisible, false);
    fragmentTransport.push({ kind: suffix === '#' ? 'empty-fragment' : 'fragment', workerSawFragment: received.fragmentVisible });
  }
  const report = await queryStats(db, { range: '7d', traffic: 'all' });
  assert.equal(report.totals.views, 7); assert.equal(report.referralPolicy.excludedViews, 1);
  assert.equal(report.verification.localVerifiedViews, 1); assert.equal(report.verification.localInvalidViews, 4);
  assert.equal(report.verification.localUnsupportedViews, 1); assert.equal(report.verification.notRecordedViews, 1);
  const counts = await (await mf.dispatchFetch('https://publication.example/__counts')).json(); assert.equal(counts.directoryFetches, 1);
  const exactSql = readFileSync('packages/blog/drafts/research/analytics-retrospective/signature-ascii-storage-reference.sql', 'utf8');
  const excluded = await db.prepare("SELECT CAST(id AS TEXT) AS reference FROM page_observations WHERE path='/privacy'").first(); assert.ok(excluded);
  const exact = await db.prepare(exactSql).bind(excluded.reference, COLLECTION_VERSION).all();
  assert.equal(exact.results.length, 1); assert.equal(exact.results[0].reason, 'malformed-field-component');
  assert.equal(exact.meta.rows_read, 1); assert.equal(exact.meta.rows_written, 0);
  writeFileSync(output, JSON.stringify({ checkedAt: new Date().toISOString(), collectionVersion: COLLECTION_VERSION, verifierProfile: VERIFIER_PROFILE_VERSION,
    method: 'Actual local workerd/collector/D1/WebCrypto with independent signer, intercepted directory and empty fixture cf. Invalid contexts are constructed inside the Worker; boundary matrix measures a local HTTP client, not Cloudflare production ingress.',
    trials, boundaries, fragmentTransport, directoryFetches: counts.directoryFetches, exactReference: { rows: 1, rowsRead: exact.meta.rows_read, rowsWritten: exact.meta.rows_written },
    sourceSha256: Object.fromEntries(['packages/analytics/src/webbotauth.ts','packages/analytics/src/signature-evidence.ts','packages/analytics/src/versions.ts','packages/blog/scripts/check-signature-context.mjs'].map(file=>[file,createHash('sha256').update(readFileSync(file)).digest('hex')])),
    productionCalls: 0, externalCalls: 0, limits: ['No malformed production input or human/vendor label.', 'Native constructor acceptance and local HTTP client rejection are separate boundaries.'] }, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ collectorControls: trials.length, boundaryControls: boundaries.length, directoryFetches: counts.directoryFetches, productionCalls: 0 }));
} finally { await mf.dispose(); }

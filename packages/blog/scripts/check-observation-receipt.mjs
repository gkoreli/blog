import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
import { ed25519JwkThumbprint } from '../../analytics/.test-dist/webbotauth.js';
import { COLLECTION_VERSION } from '../../analytics/.test-dist/versions.js';

const [output, privateOutput] = process.argv.slice(2);
assert.ok(output && privateOutput && !existsSync(output) && !existsSync(privateOutput));
const pair = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey), kid = await ed25519JwkThumbprint(jwk);
const req = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(req.resolve('miniflare', { paths: [dirname(req.resolve('wrangler/package.json'))] })));
const bundle = await build({ stdin: { resolveDir: process.cwd(), contents: `
  import { observePageResponse } from './packages/analytics/src/index.ts';
  const logs=[]; let directoryFetches=0;
  console.log=(event,fields)=>logs.push({event,...fields});
  console.warn=(event,fields)=>logs.push({event,...fields});
  globalThis.fetch=async (url)=>{
    directoryFetches++;
    const origin=new URL(String(url)).origin;
    if(origin==='https://timeout.example') return new Promise(()=>{});
    if(!['https://fixture.example','https://crawler.exa.ai'].includes(origin)) throw Error('Unexpected fixture discovery');
    return Response.json({keys:[${JSON.stringify(jwk)}]},{headers:{'Content-Type':'application/http-message-signatures-directory+json','Cache-Control':'max-age=300'}});
  };
  export default { async fetch(request,env,ctx) {
    const mode=request.headers.get('X-Fixture-Mode'), start=logs.length, pending=[];
    const DB={prepare(sql){return{bind(...values){const bound=env.DB.prepare(sql).bind(...values);return{async run(){
      if(mode==='write-error'||mode==='diagnostic-error'&&sql.includes('INSERT INTO page_observation_diagnostics')) throw Error('private-error@example.invalid');
      if(mode==='ack-without-write')return{success:false,meta:{changes:0}};
      const result=await bound.run();
      if(mode==='ack-false')return{...result,success:false};
      if(mode==='ack-zero')return{...result,meta:{...result.meta,changes:0}};
      return result;
    }}}}}};
    const copy=new Request(request);
    Object.defineProperty(copy,'cf',{value:mode==='unknown-category'?{verifiedBotCategory:'private-category@example.invalid'}:{verifiedBotCategory:'Search Engine Crawler',botManagement:{verifiedBot:false}}});
    const options=mode==='injected'?{verifySignature:async()=>({status:'verified',agent:'https://crawler.exa.ai'})}
      :mode==='diagnostic-error'?{publicPagePaths:async()=>new Set([new URL(request.url).pathname])}:{};
    const environment={...env,DB,...mode==='diagnostic-error'?{ANALYTICS_DIAGNOSTICS:'private-v1'}:{}};
    observePageResponse(copy,new Response('Native receipt fixture',{headers:{'Content-Type':'text/html'}}),'html',environment,
      {waitUntil(p){pending.push(p);ctx.waitUntil(p.catch(()=>{}));}},options);
    const settled=await Promise.allSettled(pending);
    return Response.json({logs:logs.slice(start),settlements:settled.map(item=>item.status),directoryFetches});
  }};
` }, bundle: true, write: false, format: 'esm', platform: 'browser', logLevel: 'silent' });
const mf = new Miniflare({ modules: true, script: bundle.outputFiles[0].text, compatibilityDate: '2026-03-06', d1Databases: { DB: 'observation-receipts' }, bindings: { ANALYTICS_HASH_KEY: 'local-fixture-only' } });
try {
  const db = await mf.getD1Database('DB');
  const schema = readFileSync('packages/analytics/schema.sql', 'utf8').replace(/^\s*--.*$/gm, '');
  await db.batch(schema.split(';').map(s => s.trim()).filter(Boolean).map(s => db.prepare(s)));
  const trials = [], captures = [];
  for (const mode of ['verified-fixture','reviewed-origin-fixture','invalid-signature','directory-timeout','unsigned','unknown-category','injected','write-error','ack-without-write','ack-false','ack-zero','diagnostic-error','referral','ineligible']) {
    const path = mode === 'ineligible' ? '/api/stats' : mode === 'referral' ? '/privacy' : '/' + mode;
    const headers = { 'User-Agent': 'ExaSearchBot/1.0', Accept: 'text/html', 'X-Fixture-Mode': mode };
    if (mode === 'referral') headers.Referer = 'https://traffic2cash.xyz/';
    if (['verified-fixture','reviewed-origin-fixture','invalid-signature','directory-timeout','injected'].includes(mode)) {
      const origin = mode === 'reviewed-origin-fixture' || mode === 'injected' ? 'https://crawler.exa.ai' : mode === 'directory-timeout' ? 'https://timeout.example' : 'https://fixture.example';
      const epoch = Math.floor(Date.now() / 1000), agent = JSON.stringify(origin);
      const input = `("@authority" "signature-agent");created=${epoch};expires=${epoch + 300};keyid="${kid}";alg="ed25519";tag="web-bot-auth"`;
      const base = `"@authority": ${mode === 'invalid-signature' ? 'changed.example' : 'publication.example'}\n"signature-agent": ${agent}\n"@signature-params": ${input}`;
      headers['Signature-Agent'] = agent; headers['Signature-Input'] = `sig=${input}`;
      headers.Signature = `sig=:${Buffer.from(await crypto.subtle.sign('Ed25519', pair.privateKey, new TextEncoder().encode(base))).toString('base64')}:`;
    }
    const response = await mf.dispatchFetch('https://publication.example' + path, { headers }); assert.equal(response.status, 200);
    const capture = await response.json(); captures.push({ mode, ...capture });
    const rows = (await db.prepare('SELECT reader_kind,collection_version,signature_status,signature_evidence,classification_evidence FROM page_observations WHERE path=?').bind(path).all()).results;
    const stored = capture.logs.filter(log => log.event === 'analytics.observation_stored');
    const failure = capture.logs.find(log => log.event === 'analytics.observation_write_failed');
    if (['write-error','ack-without-write','ack-false','ack-zero'].includes(mode)) {
      assert.equal(capture.settlements[0], 'rejected'); assert.equal(stored.length, 0);
      assert.equal(rows.length, ['write-error','ack-without-write'].includes(mode) ? 0 : 1);
      assert.equal(failure.reason, mode === 'write-error' ? 'persistence-or-processing' : 'unacknowledged-insert');
    } else if (mode === 'ineligible') { assert.equal(rows.length, 0); assert.equal(capture.logs.length, 0); }
    else {
      assert.equal(rows.length, 1); assert.equal(stored.length, 1); assert.equal(capture.settlements[0], 'fulfilled');
      const row = rows[0], evidence = JSON.parse(row.signature_evidence), classification = JSON.parse(row.classification_evidence), receipt = stored[0].receipt;
      assert.equal(stored[0].operationId, capture.logs.find(log => log.event === 'analytics.observation_attempt').operationId);
      assert.equal(stored[0].collectionVersion, row.collection_version); assert.equal(row.collection_version, COLLECTION_VERSION);
      assert.equal(receipt.readerKind, row.reader_kind); assert.equal(receipt.classifierProfile, classification.classifierProfile);
      assert.deepEqual(receipt.declarations.candidates, classification.declarations.candidates);
      for (const [outputKey, inputKey] of [['status','localStatus'],['outcome','localOutcome'],['source','source'],['verifierProfile','verifierProfile'],['evidenceVersion','version']])
        assert.equal(receipt.signature[outputKey], evidence[inputKey]);
      assert.equal(receipt.signature.documentedVendorStatus, evidence.vendor.status);
      assert.equal(receipt.signature.reason, evidence.localReason); assert.deepEqual(receipt.signature.reasons, evidence.localReasons);
      assert.equal(receipt.signature.userAgentCovered, evidence.vendor.userAgentCovered);
      if (evidence.coverage === null) assert.equal(receipt.signature.coverage, null);
      else for (const [key, value] of Object.entries(evidence.coverage.covered)) assert.equal(receipt.signature.coverage[key], value);
      assert.equal(receipt.native.verifiedBot, evidence.native.verifiedBot); assert.equal(receipt.native.signedAgent, evidence.native.signedAgent);
      assert.equal(receipt.native.categoryStatus, evidence.native.category.status); assert.equal(receipt.native.categoryValue, evidence.native.category.value);
      const expected = ['verified-fixture','reviewed-origin-fixture'].includes(mode) ? 'verified' : mode === 'invalid-signature' ? 'invalid' : mode === 'directory-timeout' ? 'unavailable' : mode === 'injected' ? 'test-injected' : 'absent';
      assert.equal(receipt.signature.outcome, expected);
      if (mode === 'directory-timeout') assert.ok(receipt.signature.reasons.includes('verification-timeout'));
      assert.equal(receipt.signature.signer, mode === 'verified-fixture' ? 'Other' : mode === 'reviewed-origin-fixture' ? 'Exa' : null);
      if (mode === 'diagnostic-error') assert.ok(capture.logs.some(log => log.event === 'analytics.diagnostic_write_failed'));
      if (mode === 'unknown-category') assert.equal(receipt.native.categoryStatus, 'unrecognized');
    }
    assert.equal(JSON.stringify(capture.logs).includes('private-error'), false);
    assert.equal(JSON.stringify(capture.logs).includes('private-category'), false);
    trials.push({ mode, observations: rows.length, receipts: stored.length, settlement: capture.settlements[0] ?? 'not-scheduled',
      outcome: stored[0]?.receipt.signature.outcome ?? null, failureReason: failure?.reason ?? null,
      receiptBytes: stored[0] ? Buffer.byteLength(JSON.stringify(stored[0].receipt)) : 0 });
  }
  const sql = readFileSync('packages/blog/drafts/research/analytics-retrospective/observation-receipt-control.sql','utf8');
  const controls = (await db.prepare(sql).bind('2000-01-01 00:00:00','2100-01-01 00:00:00').all()).results;
  assert.equal(controls.length, 1); assert.equal(controls[0].localOutcome, 'absent');
  assert.equal(controls[0].categoryValue, 'Search Engine Crawler'); assert.equal(controls[0].optionalCaptureAbsent, 1);
  const plan = (await db.prepare('EXPLAIN QUERY PLAN '+sql).bind('2000-01-01 00:00:00','2100-01-01 00:00:00').all()).results;
  assert.ok(plan.some(row => row.detail.includes('idx_page_observations_public_path_time')));
  writeFileSync(privateOutput, JSON.stringify({ captures }, null, 2)+'\n', {flag:'wx',mode:0o600});
  const files = ['packages/analytics/src/index.ts','packages/analytics/src/db.ts','packages/analytics/src/observation-receipt.ts','packages/analytics/src/versions.ts'];
  writeFileSync(output, JSON.stringify({checkedAt:new Date().toISOString(),method:'Actual collector, workerd, D1 and crypto; intercepted fixture directories, supplied provider metadata and controlled acknowledgement failures. Wrapper awaits captured waitUntil work for deterministic inspection.',collectionVersion:COLLECTION_VERSION,trials,acceptanceQueryPlan:plan,
    sourceSha256:Object.fromEntries(files.map(file=>[file,createHash('sha256').update(readFileSync(file)).digest('hex')])),productionRequests:0,externalNetworkCalls:0,
    limits:['Ephemeral fixture keys and substituted directories, including the reviewed-origin case, are not real vendor authentication.','Provider metadata is deliberately supplied, not an actual Cloudflare bot verdict.','No human/device label, complete-log guarantee or production activation is established.','An unacknowledged insert can leave a stored row; absence of a receipt does not establish absence of a write.']},null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({trials:trials.length,acceptedReceipts:trials.reduce((n,t)=>n+t.receipts,0),externalNetworkCalls:0}));
} finally { await mf.dispose(); }

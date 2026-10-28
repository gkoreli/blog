import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
import { ed25519JwkThumbprint } from '../../analytics/.test-dist/webbotauth.js';
import { COLLECTION_VERSION } from '../../analytics/.test-dist/versions.js';
import { queryStats } from '../../analytics/.test-dist/stats.js';
import { reconcileReceiptStorage } from '../drafts/research/analytics-retrospective/reconcile-receipt-storage.mjs';

const [output, privateOutput, historicalFixtures] = process.argv.slice(2);
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
    if(!['https://fixture.example','https://crawler.exa.ai','https://ahrefs.com','https://agent.bot.goog'].includes(origin)) throw Error('Unexpected fixture discovery');
    return Response.json({keys:[${JSON.stringify(jwk)}]},{headers:{'Content-Type':'application/http-message-signatures-directory+json','Cache-Control':'max-age=300'}});
  };
  export default { async fetch(request,env,ctx) {
    const mode=request.headers.get('X-Fixture-Mode'), start=logs.length, pending=[], databaseWork=[];
    const DB={prepare(sql){return{bind(...values){const effectiveSql=mode==='without-returning-baseline'?sql.split('RETURNING CAST(id AS TEXT) AS observation_id')[0]:sql;
      const bound=env.DB.prepare(effectiveSql).bind(...values);return{async run(){
      if(mode==='write-error'||mode==='diagnostic-error'&&sql.includes('INSERT INTO page_observation_diagnostics')) throw Error('private-error@example.invalid');
      if(mode==='ack-without-write')return{success:false,meta:{changes:0}};
      const result=await bound.run();
      databaseWork.push({returning:effectiveSql.includes('RETURNING'),rowsRead:result.meta.rows_read,rowsWritten:result.meta.rows_written,changes:result.meta.changes});
      if(mode==='ack-false')return{...result,success:false};
      if(mode==='ack-zero')return{...result,meta:{...result.meta,changes:0}};
      if(mode==='missing-reference')return{...result,results:[]};
      if(mode==='numeric-reference')return{...result,results:[{observation_id:result.meta.last_row_id}]};
      if(mode==='duplicate-reference')return{...result,results:[...result.results,...result.results]};
      return result;
    }}}}}};
    const copy=new Request(request);
    Object.defineProperty(copy,'cf',{value:mode==='unknown-category'?{verifiedBotCategory:'private-category@example.invalid'}:{verifiedBotCategory:'Search Engine Crawler',botManagement:{verifiedBot:false}}});
    const options=mode==='injected'?{verifySignature:async()=>({status:'verified',agent:'https://crawler.exa.ai'})}
      :['diagnostic-error','large-rowid'].includes(mode)?{publicPagePaths:async()=>new Set([new URL(request.url).pathname])}:{};
    const environment={...env,DB,...['diagnostic-error','large-rowid'].includes(mode)?{ANALYTICS_DIAGNOSTICS:'private-v1'}:{}};
    observePageResponse(copy,new Response('Native receipt fixture',{headers:{'Content-Type':'text/html'}}),'html',environment,
      {waitUntil(p){pending.push(p);ctx.waitUntil(p.catch(()=>{}));}},options);
    const settled=await Promise.allSettled(pending);
    return Response.json({logs:logs.slice(start),settlements:settled.map(item=>item.status),directoryFetches,databaseWork});
  }};
` }, bundle: true, write: false, format: 'esm', platform: 'browser', logLevel: 'silent' });
const mf = new Miniflare({ modules: true, script: bundle.outputFiles[0].text, compatibilityDate: '2026-03-06', d1Databases: { DB: 'observation-receipts' }, bindings: { ANALYTICS_HASH_KEY: 'local-fixture-only' } });
try {
  const db = await mf.getD1Database('DB');
  const schema = readFileSync('packages/analytics/schema.sql', 'utf8').replace(/^\s*--.*$/gm, '');
  await db.batch(schema.split(';').map(s => s.trim()).filter(Boolean).map(s => db.prepare(s)));
  const trials = [], captures = [];
  for (const mode of ['verified-fixture','reviewed-origin-fixture','invalid-signature','directory-timeout','unsigned','without-returning-baseline','conflicting-roles','unknown-category','injected','write-error','ack-without-write','ack-false','ack-zero','diagnostic-error','referral','ineligible','missing-reference','numeric-reference','duplicate-reference','no-declaration','unconfigured-declaration','partial-mapping','conflicting-publishers','ahrefs-origin-fixture','google-origin-fixture','google-conflicting-publishers','google-partial-mapping','google-unsigned','large-rowid']) {
    if (mode === 'large-rowid') await db.prepare("UPDATE sqlite_sequence SET seq=9007199254740994 WHERE name='page_observations'").run();
    const path = mode === 'ineligible' ? '/api/stats' : mode === 'referral' ? '/privacy' : '/' + mode;
    const headers = { 'User-Agent': 'ExaSearchBot/1.0', Accept: 'text/html', 'X-Fixture-Mode': mode };
    if (mode === 'conflicting-roles') headers['User-Agent'] = 'ExaUser/1.0 ExaSearchBot/1.0';
    if (mode === 'no-declaration') headers['User-Agent'] = 'curl/8.7.1';
    if (mode === 'unconfigured-declaration') headers['User-Agent'] = 'GPTBot/1.0';
    if (mode === 'partial-mapping') headers['User-Agent'] = 'ExaSearchBot/1.0 GPTBot/1.0';
    if (mode === 'conflicting-publishers') headers['User-Agent'] = 'ExaSearchBot/1.0 AhrefsBot/7.0';
    if (mode === 'ahrefs-origin-fixture') headers['User-Agent'] = 'AhrefsBot/7.0';
    if (mode.startsWith('google-')) headers['User-Agent'] = mode==='google-conflicting-publishers'?'Google-Agent ExaUser/1.0':mode==='google-partial-mapping'?'Google-Agent Google-GeminiNotebook':'Google-Agent';
    if (mode === 'referral') headers.Referer = 'https://traffic2cash.xyz/';
    if (['verified-fixture','reviewed-origin-fixture','invalid-signature','directory-timeout','injected','conflicting-publishers','ahrefs-origin-fixture','google-origin-fixture','google-conflicting-publishers','google-partial-mapping'].includes(mode)) {
      const origin = mode.startsWith('google-')?'https://agent.bot.goog':mode === 'ahrefs-origin-fixture' ? 'https://ahrefs.com' : mode === 'reviewed-origin-fixture' || mode === 'injected' || mode === 'conflicting-publishers' ? 'https://crawler.exa.ai' : mode === 'directory-timeout' ? 'https://timeout.example' : 'https://fixture.example';
      const epoch = Math.floor(Date.now() / 1000), agent = JSON.stringify(origin);
      const input = `("@authority" "signature-agent");created=${epoch};expires=${epoch + 300};keyid="${kid}";alg="ed25519";tag="web-bot-auth"`;
      const base = `"@authority": ${mode === 'invalid-signature' ? 'changed.example' : 'publication.example'}\n"signature-agent": ${agent}\n"@signature-params": ${input}`;
      headers['Signature-Agent'] = agent; headers['Signature-Input'] = `sig=${input}`;
      headers.Signature = `sig=:${Buffer.from(await crypto.subtle.sign('Ed25519', pair.privateKey, new TextEncoder().encode(base))).toString('base64')}:`;
    }
    const response = await mf.dispatchFetch('https://publication.example' + path, { headers }); assert.equal(response.status, 200);
    const capture = await response.json(); captures.push({ mode, ...capture });
    const rows = (await db.prepare('SELECT CAST(id AS TEXT) observation_id,reader_kind,collection_version,signature_status,signature_evidence,classification_evidence FROM page_observations WHERE path=?').bind(path).all()).results;
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
      assert.equal(receipt.version, '2026-10-28.2');
      assert.equal(stored[0].operationId, capture.logs.find(log => log.event === 'analytics.observation_attempt').operationId);
      assert.equal(stored[0].collectionVersion, row.collection_version); assert.equal(row.collection_version, COLLECTION_VERSION);
      const storage = stored[0].storage;
      assert.equal(storage.version, '2026-10-27.1');
      if (['without-returning-baseline','missing-reference','numeric-reference','duplicate-reference'].includes(mode)) {
        assert.deepEqual(storage, { version: '2026-10-27.1', status: 'unavailable', observationId: 'unavailable' });
      } else {
        assert.deepEqual(storage, { version: '2026-10-27.1', status: 'returned', observationId: row.observation_id });
      }
      if (mode === 'large-rowid') {
        assert.equal(storage.observationId, '9007199254740995');
        const diagnostic = await db.prepare('SELECT CAST(observation_id AS TEXT) observation_id FROM page_observation_diagnostics').first();
        assert.equal(diagnostic.observation_id, storage.observationId);
        assert.equal(capture.logs.some(log => log.event === 'analytics.diagnostic_write_failed'), false);
      }
      assert.deepEqual(receipt.directoryPublication, evidence.directoryPublication);
      if (mode === 'ahrefs-origin-fixture') { assert.equal(receipt.directoryPublication.status,'matching-publisher'); assert.equal(receipt.signature.documentedVendorStatus,'not-configured'); }
      if (mode === 'google-origin-fixture') {assert.equal(receipt.directoryPublication.status,'matching-publisher');assert.equal(receipt.signature.documentedVendorStatus,'matching-origin');}
      if (mode === 'google-conflicting-publishers') {assert.equal(receipt.directoryPublication.status,'conflicting-publishers');assert.equal(receipt.signature.documentedVendorStatus,'conflicting-origins');}
      if (mode === 'google-partial-mapping') assert.equal(receipt.directoryPublication.status,'partial-mapping');
      if (mode === 'google-unsigned') assert.equal(receipt.directoryPublication.status,'not-verified');
      if (mode === 'conflicting-publishers') assert.equal(receipt.directoryPublication.status,'conflicting-publishers');
      if (['partial-mapping','no-declaration'].includes(mode)) assert.equal(receipt.directoryPublication.status,mode);
      if (mode === 'unconfigured-declaration') assert.equal(receipt.directoryPublication.status,'not-configured');
      assert.equal(receipt.readerKind, row.reader_kind); assert.equal(receipt.classifierProfile, classification.classifierProfile);
      assert.equal(receipt.declarations.candidateCount, classification.declarations.candidates.length);
      assert.equal(receipt.declarations.candidateNames, [...classification.declarations.candidates].sort().join(',') || 'none');
      for (const [outputKey, inputKey] of [['status','localStatus'],['outcome','localOutcome'],['source','source'],['evidenceVersion','version']])
        assert.equal(receipt.signature[outputKey], evidence[inputKey]);
      assert.equal(receipt.signature.verifierProfile, evidence.verifierProfile ?? 'not-applicable');
      assert.equal(receipt.signature.documentedVendorStatus, evidence.vendor.status);
      assert.equal(receipt.signature.signerDisplayProfile,'2026-10-28.1');
      assert.equal(receipt.signature.reason, evidence.localReason ?? 'none');
      assert.equal(receipt.signature.reasonCount, evidence.localReasons.length);
      assert.equal(receipt.signature.reasonNames, [...evidence.localReasons].sort().join(',') || 'none');
      const state = value => value === null ? 'unavailable' : String(value);
      assert.equal(receipt.signature.userAgentCovered, state(evidence.vendor.userAgentCovered));
      if (evidence.coverage === null) assert.deepEqual(receipt.signature.coverage, { status: 'unavailable' });
      else for (const [key, value] of Object.entries(evidence.coverage.covered)) assert.equal(receipt.signature.coverage[key], value);
      assert.equal(receipt.native.verifiedBot, state(evidence.native.verifiedBot)); assert.equal(receipt.native.signedAgent, state(evidence.native.signedAgent));
      assert.equal(receipt.native.categoryStatus, evidence.native.category.status); assert.equal(receipt.native.categoryValue, evidence.native.category.value ?? 'none');
      const expected = ['verified-fixture','reviewed-origin-fixture','conflicting-publishers','ahrefs-origin-fixture','google-origin-fixture','google-conflicting-publishers','google-partial-mapping'].includes(mode) ? 'verified' : mode === 'invalid-signature' ? 'invalid' : mode === 'directory-timeout' ? 'unavailable' : mode === 'injected' ? 'test-injected' : 'absent';
      assert.equal(receipt.signature.outcome, expected);
      if (mode === 'directory-timeout') assert.ok(receipt.signature.reasonNames.split(',').includes('verification-timeout'));
      assert.equal(receipt.signature.signer, mode === 'verified-fixture' ? 'Other' : ['reviewed-origin-fixture','conflicting-publishers'].includes(mode) ? 'Exa' : mode === 'ahrefs-origin-fixture' ? 'Ahrefs' : ['google-origin-fixture','google-conflicting-publishers','google-partial-mapping'].includes(mode)?'Google':'none');
      if (mode === 'diagnostic-error') assert.ok(capture.logs.some(log => log.event === 'analytics.diagnostic_write_failed'));
      if (mode === 'unknown-category') assert.equal(receipt.native.categoryStatus, 'unrecognized');
      if (mode === 'conflicting-roles') { assert.equal(receipt.readerKind, 'unresolved'); assert.equal(receipt.declarations.candidateCount, 2); assert.equal(receipt.declarations.candidateNames, 'ExaSearchBot,ExaUser'); assert.equal(receipt.declarations.categoryAgreement, 'multiple-categories'); }
      const scalarOnly = value => { assert.notEqual(value, null); assert.equal(Array.isArray(value), false); assert.notEqual(value, ''); if (typeof value === 'object') for (const item of Object.values(value)) scalarOnly(item); };
      scalarOnly(receipt);
    }
    assert.equal(JSON.stringify(capture.logs).includes('private-error'), false);
    assert.equal(JSON.stringify(capture.logs).includes('private-category'), false);
    trials.push({ mode, observations: rows.length, receipts: stored.length, settlement: capture.settlements[0] ?? 'not-scheduled',
      outcome: stored[0]?.receipt.signature.outcome ?? null, failureReason: failure?.reason ?? null,
      receiptBytes: stored[0] ? Buffer.byteLength(JSON.stringify(stored[0].receipt)) : 0,
      databaseWork: capture.databaseWork,
      directoryPublication: stored[0]?.receipt.directoryPublication.status ?? 'no-receipt',
      storageReference: stored[0]?.storage.status ?? 'no-receipt', exactReferenceMatches: stored[0]?.storage.status === 'returned' ? stored[0].storage.observationId === rows[0].observation_id : null });
  }
  const sql = readFileSync('packages/blog/drafts/research/analytics-retrospective/storage-reference-control.sql','utf8');
  const controlReference = captures.find(capture => capture.mode === 'referral').logs.find(log => log.event === 'analytics.observation_stored').storage.observationId;
  const controlResult = await db.prepare(sql).bind(controlReference, COLLECTION_VERSION).all();
  const controls = controlResult.results;
  assert.equal(controls.length, 1); assert.equal(controls[0].localOutcome, 'absent');
  assert.equal(controls[0].categoryValue, 'Search Engine Crawler'); assert.equal(controls[0].optionalCaptureAbsent, 1);
  assert.equal(controls[0].referralControl, 1);
  assert.equal((await db.prepare(sql).bind('9223372036854775807', COLLECTION_VERSION).all()).results.length, 0);
  const plan = (await db.prepare('EXPLAIN QUERY PLAN '+sql).bind(controlReference, COLLECTION_VERSION).all()).results;
  assert.ok(plan.some(row => row.detail.includes('INTEGER PRIMARY KEY')));
  const publicationSql = readFileSync('packages/blog/drafts/research/analytics-retrospective/directory-publication-control.sql','utf8');
  const publicationControl = await db.prepare(publicationSql).bind(controlReference, COLLECTION_VERSION).all();
  assert.equal(publicationControl.results.length,1);
  assert.equal(publicationControl.results[0].publicationStatus,'not-verified');
  assert.equal(publicationControl.results[0].publicationProfile,'2026-10-28.1');
  assert.equal(publicationControl.results[0].configuredDeclarationCount,1);
  assert.equal(publicationControl.results[0].optionalCaptureAbsent,1);
  const googleReports=[];
  for (const [mode,basis] of [['google-origin-fixture','matching-publisher'],['google-conflicting-publishers','conflicting-publishers'],['google-partial-mapping','partial-mapping']]) {
    const report=await queryStats(db,{range:'7d',traffic:'all',path:'/'+mode},new Date());
    assert.equal(report.totals.views,1);assert.deepEqual(report.bySigner,[{signatureAgent:'Google',views:1}]);
    assert.deepEqual(report.byDirectoryPublication,[{basis,views:1}]);
    googleReports.push({mode,views:report.totals.views,signer:report.bySigner[0].signatureAgent,basis});
  }
  let historicalReconciliation=null;
  if(historicalFixtures) {
    const historical=JSON.parse(readFileSync(historicalFixtures,'utf8')).captures;
    const candidates=[],records=[];
    for(const [i,capture] of historical.entries()) {
      const row=capture.row,stored=capture.capture.logs.find(log=>log.event==='analytics.observation_stored');
      candidates.push({privateReference:String(row.id),observedAt:row.observed_at,path:row.path,collectionVersion:row.collection_version,classifierVersion:row.classifier_version,readerKind:row.reader_kind,signatureStatus:row.signature_status,signatureAgent:row.signature_agent,classificationEvidence:row.classification_evidence,signatureEvidence:row.signature_evidence});
      records.push({timestamp:new Date().toISOString(),$metadata:{id:'local-archive-'+i,type:'cf-worker',requestId:'local-request-'+i},$workers:{truncated:false},source:{message:'analytics.observation_stored',operationId:stored.operationId,collectionVersion:row.collection_version,storage:stored.storage,receipt:stored.receipt}});
    }
    historicalReconciliation=reconcileReceiptStorage(candidates,records);
    assert.equal(historicalReconciliation.identicalProjectionPairs,historical.length);
    assert.equal(historicalReconciliation.differentProjectionPairs,0);
  }
  writeFileSync(privateOutput, JSON.stringify({ captures }, null, 2)+'\n', {flag:'wx',mode:0o600});
  const files = ['packages/analytics/src/index.ts','packages/analytics/src/db.ts','packages/analytics/src/observation-receipt.ts','packages/analytics/src/observation-storage.ts','packages/analytics/src/diagnostics.ts','packages/analytics/src/versions.ts'];
  writeFileSync(output, JSON.stringify({checkedAt:new Date().toISOString(),method:'Actual collector, workerd, D1 and crypto; intercepted fixture directories, supplied provider metadata and controlled acknowledgement failures. Wrapper awaits captured waitUntil work for deterministic inspection. Historical reconciliation uses saved local fixture rows/receipts with constructed pair metadata, not real provider records.',collectionVersion:COLLECTION_VERSION,trials,googleReports,historicalReconciliation,acceptanceQueryPlan:plan,acceptanceQuery:{sha256:createHash('sha256').update(sql).digest('hex'),rowsRead:controlResult.meta.rows_read,rowsWritten:controlResult.meta.rows_written,productionReadCeiling:100},
    publicationAcceptanceQuery:{sha256:createHash('sha256').update(publicationSql).digest('hex'),rowsRead:publicationControl.meta.rows_read,rowsWritten:publicationControl.meta.rows_written,productionReadCeiling:100},
    sourceSha256:Object.fromEntries(files.map(file=>[file,createHash('sha256').update(readFileSync(file)).digest('hex')])),productionRequests:0,externalNetworkCalls:0,
    limits:['Ephemeral fixture keys and substituted directories, including the reviewed-origin case, are not real vendor authentication.','Provider metadata is deliberately supplied, not an actual Cloudflare bot verdict.','No human/device label, complete-log guarantee or production activation is established.','An unacknowledged insert can leave a stored row; absence of a receipt does not establish absence of a write.']},null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({trials:trials.length,acceptedReceipts:trials.reduce((n,t)=>n+t.receipts,0),externalNetworkCalls:0}));
} finally { await mf.dispose(); }

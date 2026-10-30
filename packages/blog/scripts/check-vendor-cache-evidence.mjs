import assert from 'node:assert/strict';
import { readFileSync,writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname,resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { verifyVendorIp,createVendorIpCache } from '../../analytics/.test-dist/vendor-ip.js';
import { vendorNetworkStateSql } from '../../analytics/.test-dist/vendor-network-summary.js';
import { vendorIpReceipt } from '../../analytics/.test-dist/vendor-ip-receipt.js';
import { queryStats } from '../../analytics/.test-dist/stats.js';
import { COLLECTION_VERSION,CLASSIFIER_VERSION } from '../../analytics/.test-dist/versions.js';
import { cacheEvidenceCases,cacheAccessCases } from '../../analytics/test/fixtures/vendor-cache-evidence.mjs';
import { validNetworkReceipt } from '../drafts/research/analytics-retrospective/network-receipt-fields.mjs';
import { projectStoredReceipt } from '../drafts/research/analytics-retrospective/reconcile-receipt-storage.mjs';
const [output,privateOutput]=process.argv.slice(2);assert.ok(output&&privateOutput);
const baseline='c1b9166';
const bundle=async contents=>(await build({stdin:{contents,resolveDir:resolve('packages/analytics/src'),loader:'ts'},bundle:true,platform:'browser',format:'esm',write:false,logLevel:'silent'})).outputFiles[0].text;
const oldSource=execFileSync('git',['show',baseline+':packages/analytics/src/vendor-ip.ts'],{encoding:'utf8'});
const oldBundle=await bundle(oldSource);
const old=await import('data:text/javascript;base64,'+Buffer.from(oldBundle).toString('base64'));
const oldStateSource=execFileSync('git',['show',baseline+':packages/analytics/src/vendor-network-summary.ts'],{encoding:'utf8'});
const oldState=await import('data:text/javascript;base64,'+Buffer.from(await bundle(oldStateSource)).toString('base64'));
const previousStatsBundle=await build({stdin:{contents:readFileSync('packages/analytics/src/stats.ts','utf8'),resolveDir:resolve('packages/analytics/src'),loader:'ts'},
  bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent',plugins:[{name:'pinned-network-validator',setup(build){
    build.onLoad({filter:/\/vendor-network-summary\.ts$/},()=>({contents:oldStateSource,loader:'ts',resolveDir:resolve('packages/analytics/src')}));
  }}]});
const previousStats=await import('data:text/javascript;base64,'+Buffer.from(previousStatsBundle.outputFiles[0].text).toString('base64'));
const before={policies:await cacheEvidenceCases(old.verifyVendorIp,old.createVendorIpCache),access:await cacheAccessCases(old.verifyVendorIp,old.createVendorIpCache)};
const node={policies:await cacheEvidenceCases(verifyVendorIp,createVendorIpCache),access:await cacheAccessCases(verifyVendorIp,createVendorIpCache)};
const nativeBundle=await build({entryPoints:['packages/blog/test/fixtures/vendor-cache-evidence-worker.js'],bundle:true,platform:'browser',format:'esm',write:false,logLevel:'silent'});
const require=createRequire(new URL('../package.json',import.meta.url));
const {Miniflare}=await import(pathToFileURL(require.resolve('miniflare',{paths:[dirname(require.resolve('wrangler/package.json'))]})));
const mf=new Miniflare({modules:true,script:nativeBundle.outputFiles[0].text,compatibilityDate:'2026-03-06',cf:{},d1Databases:{DB:'cache-evidence'},bindings:{ANALYTICS_HASH_KEY:'fixture-only',OWNER_IPS:'66.249.66.1'}});
const project=e=>{const {profile,...rest}=e;return {...rest,checks:e.checks.map(c=>{const {cache,...rest}=c;return rest;})};};
const all=results=>[...results.policies,...results.access].flatMap(row=>[row.first,row.second,...(row.third?[row.third]:[])]);
const hash=value=>createHash('sha256').update(value).digest('hex');
try{
  const response=await mf.dispatchFetch('https://fixture.invalid/probe');assert.equal(response.status,200);
  const native=await response.json();assert.deepEqual({policies:native.policies,access:native.access},node);
  assert.equal(JSON.stringify(native).includes('raw-publisher-canary'),false);
  assert.equal(JSON.stringify(native).includes('66.249.66.1'),false);
  assert.equal(all(node).length,45);assert.deepEqual(all(node).map(project),all(before).map(project));
  for(const row of node.policies){const check=row.first.checks[0];assert.deepEqual(check.cache.policy.blockers,row.expected.blockers,row.label);assert.equal(check.cache.policy.lifetimeSource,row.expected.lifetimeSource);assert.equal(row.stored,row.expected.stored);assert.equal(row.fetchCalls,1);}
  for(const e of all(node))assert.equal(validNetworkReceipt(vendorIpReceipt(e)),true);
  const db=await mf.getD1Database('DB');const schema=readFileSync('packages/analytics/schema.sql','utf8').replace(/^\s*--.*$/gm,'');
  await db.batch(schema.split(';').map(s=>s.trim()).filter(Boolean).map(s=>db.prepare(s)));
  const insert=(id,e)=>db.prepare("INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,observed_at,vendor_ip_evidence) VALUES('/fixture',?,'browser','desktop',0,'browser','fixture','2026-10-30 09:00:00',?)").bind(String(id).padStart(32,'0'),e===null?null:JSON.stringify(e));
  const historical=all(before),current=all(node),positive=current[0],zero=current[6],cooldown=current[7];
  const negatives=[];
  const bad=(label,e,mutate)=>{const clone=structuredClone(e);mutate(clone);negatives.push({label,e:clone});};
  bad('missing-cache',positive,e=>delete e.checks[0].cache);
  bad('null-cache-on-match',positive,e=>e.checks[0].cache=null);
  bad('wrong-access',positive,e=>e.checks[0].cache.access='cooldown');
  bad('missing-policy',positive,e=>e.checks[0].cache.policy=null);
  bad('unknown-blocker',zero,e=>e.checks[0].cache.policy.blockers=['private-canary']);
  bad('duplicate-blocker',zero,e=>e.checks[0].cache.policy.blockers=['no-cache','no-cache']);
  bad('blocked-positive-window',positive,e=>e.checks[0].cache.policy.blockers=['no-cache']);
  bad('zero-without-cause',zero,e=>e.checks[0].cache.policy.blockers=[]);
  bad('future-policy',positive,e=>e.checks[0].cache.policy.assessedAt='2026-10-31T09:00:00.000Z');
  bad('memory-after-expiry',positive,e=>{e.checks[0].cache.access='memory';e.checkedAt=e.checks[0].snapshot.freshUntil;});
  bad('cooldown-claims-fetch',cooldown,e=>e.checks[0].cache.access='fetched');
  bad('default-invalid-lifetime',zero,e=>{e.checks[0].cache.policy.lifetimeSource='default';e.checks[0].cache.policy.blockers=['invalid-lifetime'];});
  bad('incompatible-age',zero,e=>e.checks[0].cache.policy.blockers=['invalid-age','age-exhausted']);
  bad('budget-with-cache',native.fanout,e=>e.checks[4].cache=structuredClone(e.checks[0].cache));
  const stored=[...current,...historical,native.fanout,...negatives.map(n=>n.e),null];
  await db.batch(stored.map((e,i)=>insert(i+1,e)));
  const states=(await db.prepare(`SELECT id,(${vendorNetworkStateSql()}) state,length(CAST(vendor_ip_evidence AS BLOB)) bytes FROM page_observations ORDER BY id`).all()).results;
  assert.deepEqual(states.map(r=>r.state),[...Array(91).fill('recognized'),...Array(negatives.length).fill('unrecognized'),'not-recorded']);
  const bytes=states[90].bytes;assert.ok(bytes<=4096);assert.equal(bytes,Buffer.byteLength(JSON.stringify(native.fanout)));
  const query={range:'7d',traffic:'all',path:'/fixture'},now=new Date('2026-10-30T10:00:00Z');
  const report=await queryStats(db,query,now);assert.equal(report.vendorNetwork.recognizedViews,91);assert.equal(report.vendorNetwork.unrecognizedViews,negatives.length);assert.equal(report.vendorNetwork.notRecordedViews,1);
  let beforeMeta,afterMeta;const tap=callback=>({prepare:s=>db.prepare(s),async batch(s){const r=await db.batch(s);callback(r[0].meta);return r;}});
  await db.prepare('DELETE FROM page_observations').run();
  // Identical historical records isolate report-validator overhead without changed outcomes.
  for(let batch=0;batch<8;batch++)await db.batch(Array.from({length:64},(_,i)=>insert(batch*64+i+1,historical[i%historical.length])));
  const raw=`SELECT SUM((${oldState.vendorNetworkStateSql()})='recognized') recognized FROM page_observations`;
  const newer=`SELECT SUM((${vendorNetworkStateSql()})='recognized') recognized FROM page_observations`;
  const oldCost=await db.prepare(raw).all(),newCost=await db.prepare(newer).all();assert.deepEqual(oldCost.results,newCost.results);
  const prior=await previousStats.queryStats(tap(m=>{beforeMeta=m;}),query,now);
  const measured=await queryStats(tap(m=>{afterMeta=m;}),query,now);assert.equal(measured.vendorNetwork.recognizedViews,512);
  assert.deepEqual(measured,prior);
  await db.prepare('DELETE FROM page_observations').run();
  for(let batch=0;batch<8;batch++)await db.batch(Array.from({length:64},(_,i)=>insert(batch*64+i+1,current[i%current.length])));
  let currentMeta;const newProfileReport=await queryStats(tap(m=>{currentMeta=m;}),query,now);assert.equal(newProfileReport.vendorNetwork.recognizedViews,512);
  const collector=[];
  for(const relay of [false,false,true]){
    const r=await(await mf.dispatchFetch('https://fixture.invalid/collect',{headers:relay?{'X-Fixture-Relay':'1'}:{}})).json();assert.deepEqual(r.settlements,['fulfilled']);
    const acknowledged=r.logs.filter(l=>l.event==='analytics.observation_stored');assert.equal(acknowledged.length,1);
    const row=await db.prepare('SELECT collection_version,classifier_version,reader_kind,is_owner,vendor_ip_evidence,signature_evidence,classification_evidence,signature_status,signature_agent FROM page_observations WHERE id=CAST(? AS INTEGER)').bind(acknowledged[0].storage.observationId).first();
    assert.equal(row.collection_version,COLLECTION_VERSION);assert.equal(row.classifier_version,CLASSIFIER_VERSION);assert.equal(row.is_owner,1);assert.equal(row.reader_kind,'search-crawler');
    const e=JSON.parse(row.vendor_ip_evidence);assert.deepEqual(acknowledged[0].receipt.vendorNetwork,vendorIpReceipt(e));assert.equal(validNetworkReceipt(acknowledged[0].receipt.vendorNetwork),true);
    const reconstructed=projectStoredReceipt({collectionVersion:row.collection_version,classifierVersion:row.classifier_version,readerKind:row.reader_kind,
      signatureStatus:row.signature_status,signatureAgent:row.signature_agent,signatureEvidence:row.signature_evidence,
      classificationEvidence:row.classification_evidence,vendorIpEvidence:row.vendor_ip_evidence},acknowledged[0].receipt.version);
    assert.deepEqual(reconstructed,acknowledged[0].receipt);
    collector.push({relay,outcome:e.checks[0].outcome,reason:e.checks[0].reason,cache:e.checks[0].cache,ownerExcluded:true});
  }
  assert.deepEqual(collector.map(r=>r.outcome),['listed','not-assessed','unavailable']);
  assert.deepEqual(collector.map(r=>r.cache?.access??null),['fetched','cooldown',null]);
  const receipt={checkedAt:new Date().toISOString(),baselineCommit:baseline,policies:node.policies.length,accessScenarios:node.access.length,pairedEvidenceRecords:all(node).length,nodeNativeEqual:true,priorMembershipAndTimingEqual:true,
    nativeRecognizedRecords:91,nativeNegativeRecords:negatives.length,historicalProfilesNotBackfilled:true,maxFanout:{checks:16,accepted:4,budgetSkipped:12,bytes,limit:4096},
    collectorControls:collector,currentReceiptReconciliationPassed:true,rawPublisherAndAddressCanariesAbsent:true,
    localReadCost:{historicalRows:512,validatorBefore:oldCost.meta.rows_read,validatorAfter:newCost.meta.rows_read,
      fullReportBefore:beforeMeta.rows_read,fullReportAfter:afterMeta.rows_read,commonFullReportEqual:true,
      newProfileRows:512,newProfileFullReport:currentMeta.rows_read,writes:newCost.meta.rows_written},
    productionRequests:0,productionSqlStatements:0,humanLabels:0,
    sourceHashBase:'packages/blog/scripts/',sourceSha256:Object.fromEntries(['../../analytics/src/vendor-ip.ts','../../analytics/src/vendor-ip-cache-evidence.ts','../../analytics/src/vendor-network-summary.ts','../../analytics/src/vendor-ip-receipt.ts','../../analytics/test/fixtures/vendor-cache-evidence.mjs','../test/fixtures/vendor-cache-evidence-worker.js','./check-vendor-cache-evidence.mjs'].map(p=>[p,hash(readFileSync(new URL(p,import.meta.url)))])),
    limits:'Synthetic local publisher/edge contexts and stored-field coherence. Not historical header recovery, native-provider agreement, measured production cost or reader identity/accuracy. Public cache-cause aggregates and production acceptance remain separate.'};
  writeFileSync(privateOutput,JSON.stringify({before,node,native,states,negatives,report,oldCost,newCost,collector},null,2)+'\n',{flag:'wx',mode:0o600});
  writeFileSync(output,JSON.stringify(receipt,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify(receipt));
}finally{await mf.dispose();}

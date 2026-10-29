import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { vendorIpReceipt } from '../../analytics/.test-dist/vendor-ip-receipt.js';
import { COLLECTION_VERSION } from '../../analytics/.test-dist/versions.js';
import { queryStats } from '../../analytics/.test-dist/stats.js';
import { vendorNetworkStateSql } from '../../analytics/.test-dist/vendor-network-summary.js';
import { reconcileReceiptStorage } from '../drafts/research/analytics-retrospective/reconcile-receipt-storage.mjs';
import { compareReceiptCopies } from '../drafts/research/analytics-retrospective/compare-receipt-captures.mjs';
import { validNetworkReceipt } from '../drafts/research/analytics-retrospective/network-receipt-fields.mjs';

const [output,privateOutput]=process.argv.slice(2);assert.ok(output&&privateOutput);
const baseline='697c8a7';
const controls=[
  {name:'no-declaration',ua:'Mozilla/5.0'},
  {name:'unconfigured',ua:'Meta-ExternalAds'},
  {name:'listed',ua:'Googlebot',outcome:'listed'},
  {name:'cooldown',ua:'Googlebot',outcome:'not-assessed',reason:'refresh-cooldown'},
  {name:'not-listed',ua:'OAI-SearchBot',outcome:'not-listed',address:'8.8.8.8'},
  {name:'timeout',ua:'GPTBot',outcome:'unavailable',reason:'fetch-timeout'},
  {name:'http-error',ua:'PerplexityBot',outcome:'unavailable',reason:'http-status'},
  {name:'relay',ua:'DuckDuckBot',outcome:'unavailable',reason:'address-unavailable'},
  {name:'wrong-media',ua:'Bingbot',outcome:'unavailable',reason:'media-type'},
  {name:'invalid-feed',ua:'Applebot',outcome:'unavailable',reason:'invalid-feed'},
  {name:'shared-ahrefs',ua:'AhrefsBot AhrefsSiteAudit',outcome:'listed'},
  {name:'owner',ua:'ChatGPT-User',outcome:'listed'},
  {name:'referral',ua:'Google-Agent',outcome:'listed'},
  {name:'mixed-budget',ua:'AhrefsBot AhrefsSiteAudit Googlebot OAI-AdsBot GPTBot OAI-SearchBot PerplexityBot DuckDuckBot Applebot Bingbot'},
];
const req=createRequire(resolve('package.json'));
const {Miniflare}=await import(pathToFileURL(req.resolve('miniflare',{paths:[dirname(req.resolve('wrangler/package.json'))]})));
async function runtime(prior){
  const contents=`
    import {observePageResponse} from './packages/analytics/src/index.ts';
    let mode,logs=[],calls=[];
    console.log=(event,fields)=>logs.push({event,...fields});
    console.warn=(event,fields)=>logs.push({event,...fields});
    globalThis.fetch=(url,init)=>{
      calls.push(String(url));
      for(const key of ['CF-Connecting-IP','Cookie','Authorization','User-Agent','Referer'])if(init.headers.has(key))throw Error('Reader data forwarded');
      if(mode==='timeout')return new Promise((_,reject)=>init.signal.addEventListener('abort',()=>reject(Error('fixture timeout'))));
      if(mode==='http-error')return Promise.resolve(new Response(null,{status:503}));
      const body=mode==='invalid-feed'?'{}':JSON.stringify({creationTime:'2026-10-29T00:00:00Z',prefixes:[{ipv4Prefix:'66.249.66.0/24'}]});
      return Promise.resolve(new Response(body,{headers:{'Content-Type':mode==='wrong-media'?'text/plain':'application/json','Cache-Control':'no-store'}}));
    };
    export default{async fetch(request,env,ctx){
      mode=request.headers.get('X-Fixture-Mode');logs=[];calls=[];
      const copy=new Request(request);Object.defineProperty(copy,'cf',{value:{asn:64512}});
      const pending=[];
      observePageResponse(copy,new Response('Fixture',{headers:{'Content-Type':'text/html'}}),'html',
        {...env,...mode==='owner'?{OWNER_IPS:copy.headers.get('CF-Connecting-IP')}:{}},
        {waitUntil(p){pending.push(p);ctx.waitUntil(p);}});
      await Promise.all(pending);return Response.json({logs,calls});
    }};`;
  const plugins=prior?[{name:'recorded-baseline',setup(plugin){plugin.onLoad({filter:/[/\\]analytics[/\\]src[/\\].*\.ts$/},args=>({contents:execFileSync('git',['show',baseline+':'+args.path.slice(resolve('.').length+1)],{encoding:'utf8'}),loader:'ts',resolveDir:dirname(args.path)}));}}]:[];
  const bundle=await build({stdin:{contents,resolveDir:process.cwd()},plugins,bundle:true,write:false,format:'esm',platform:'browser',logLevel:'silent'});
  return new Miniflare({modules:true,script:bundle.outputFiles[0].text,compatibilityDate:'2026-03-06',cf:{},d1Databases:{DB:prior?'network-before':'network-after'},bindings:{ANALYTICS_HASH_KEY:'local-fixture-only'}});
}
const before=await runtime(true),after=await runtime(false);
const normalized=value=>Array.isArray(value)?value.map(normalized):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).filter(([key])=>!['checkedAt','fetchedAt','validatedAt','freshUntil'].includes(key)).map(([key,v])=>[key,normalized(v)])):value;
const captures=[],accepted=[];let maximumReceiptBytes=0;
try{
  const oldDb=await before.getD1Database('DB'),db=await after.getD1Database('DB');
  const schema=readFileSync('packages/analytics/schema.sql','utf8').replace(/^\s*--.*$/gm,'');
  for(const database of [oldDb,db])await database.batch(schema.split(';').map(s=>s.trim()).filter(Boolean).map(s=>database.prepare(s)));
  const candidates=[],records=[],live=[];
  for(const [index,control] of controls.entries()){
    const headers={'User-Agent':control.ua,'CF-Connecting-IP':control.address??'66.249.66.1','X-Fixture-Mode':control.name,
      Cookie:'private-cookie',Authorization:'private-credential',...control.name==='relay'?{'CF-Worker':'private-relay.example'}:{},
      ...control.name==='referral'?{Referer:'https://traffic2cash.xyz/'}:{}};
    const pair=[];
    for(const [runtime,database] of [[before,oldDb],[after,db]]){
      const value=await(await runtime.dispatchFetch('https://publication.example/privacy?private-query=private-value',{headers})).json();
      const stored=value.logs.find(log=>log.event==='analytics.observation_stored');assert.ok(stored,control.name);
      const row=await database.prepare('SELECT CAST(id AS TEXT) privateReference,collection_version,classifier_version,reader_kind,signature_status,signature_agent,classification_evidence,signature_evidence,vendor_ip_evidence,request_evidence,is_owner,referrer_host FROM page_observations WHERE id=CAST(? AS INTEGER)').bind(stored.storage.observationId).first();
      assert.equal(row.privateReference,stored.storage.observationId);assert.equal(row.request_evidence,null);
      pair.push({value,stored,row});
    }
    const [old,current]=pair,n=JSON.parse(current.row.vendor_ip_evidence);
    assert.equal(old.stored.receipt.version,'2026-10-28.2');assert.equal(old.stored.receipt.vendorNetwork,undefined);
    assert.equal(current.stored.receipt.version,'2026-10-29.1');assert.equal(current.row.collection_version,COLLECTION_VERSION);
    assert.deepEqual(current.stored.receipt.vendorNetwork,vendorIpReceipt(n));assert.equal(validNetworkReceipt(current.stored.receipt.vendorNetwork),true);
    assert.deepEqual(normalized(n),normalized(JSON.parse(old.row.vendor_ip_evidence)));
    const base=structuredClone(current.stored.receipt);base.version='2026-10-28.2';delete base.vendorNetwork;
    assert.deepEqual(base,old.stored.receipt);
    if(control.outcome){assert.equal(n.checks[0].outcome,control.outcome,control.name);assert.equal(n.checks[0].reason,control.reason??null);}
    if(control.name==='shared-ahrefs'){assert.equal(n.configuredDeclarationCount,2);assert.equal(n.checks.length,1);}
    if(control.name==='mixed-budget'){assert.equal(current.row.reader_kind,'unresolved');assert.ok(n.checks.slice(4).every(check=>check.reason==='request-budget'));assert.ok(current.value.calls.length<=4);}
    const encoded=JSON.stringify(current.stored.receipt);maximumReceiptBytes=Math.max(maximumReceiptBytes,Buffer.byteLength(encoded));
    for(const secret of ['private-cookie','private-credential','private-query','private-value','66.249.66.1','8.8.8.8','private-relay'])assert.equal(encoded.includes(secret),false);
    const row=current.row;
    candidates.push({privateReference:row.privateReference,collectionVersion:row.collection_version,classifierVersion:row.classifier_version,readerKind:row.reader_kind,signatureStatus:row.signature_status,signatureAgent:row.signature_agent,classificationEvidence:row.classification_evidence,signatureEvidence:row.signature_evidence,vendorIpEvidence:row.vendor_ip_evidence});
    const timestamp=Date.now();
    records.push({timestamp:new Date(timestamp).toISOString(),$metadata:{id:'fixture-record-'+index,type:'cf-worker',requestId:'fixture-request-'+index},$workers:{truncated:false},source:{message:'analytics.observation_stored',...current.stored}});
    live.push({logs:[{message:['analytics.observation_stored',current.stored],timestamp}]});
    accepted.push({name:control.name,checks:n.checks.map(check=>({source:check.source,outcome:check.outcome,reason:check.reason})),storedKind:row.reader_kind,storedReceiptMatches:true,baseReceiptUnchanged:true,networkComparisonExcludesClockFields:true});
    captures.push({name:control.name,before:old,after:current});
  }
  const reconciled=reconcileReceiptStorage(candidates,records);assert.equal(reconciled.identicalProjectionPairs,controls.length);
  const copies=compareReceiptCopies(live,records);assert.equal(copies.identicalPairs,controls.length);
  const states=await db.prepare(`SELECT (${vendorNetworkStateSql()}) state,COUNT(*) views FROM page_observations GROUP BY state`).all();assert.deepEqual(states.results,[{state:'recognized',views:controls.length}]);
  const oldReport=await queryStats(oldDb,{range:'7d',traffic:'all'},new Date()),report=await queryStats(db,{range:'7d',traffic:'all'},new Date());
  assert.deepEqual(report.vendorNetwork,oldReport.vendorNetwork);assert.deepEqual(report.byKind,oldReport.byKind);assert.deepEqual(report.totals,oldReport.totals);
  const exactSql=readFileSync('packages/blog/drafts/research/analytics-retrospective/documented-feed-readback.sql','utf8');
  const exact=await db.prepare(exactSql).bind(candidates[0].privateReference,candidates[1].privateReference).all();assert.equal(exact.results.length,2);assert.equal(exact.meta.rows_written,0);
  const plan=await db.prepare('EXPLAIN QUERY PLAN '+exactSql).bind(candidates[0].privateReference,candidates[1].privateReference).all();assert.ok(plan.results.some(row=>row.detail.includes('INTEGER PRIMARY KEY')));
  const receipt={checkedAt:new Date().toISOString(),baseline,collectionVersion:COLLECTION_VERSION,receiptVersion:'2026-10-29.1',method:'Before/after actual local collector/workerd/D1; intercepted synthetic feeds and supplied edge context. Receipt/storage equality is not independent vendor or native truth.',controls:accepted,collectorPairs:controls.length,exactReceiptStoragePairs:reconciled.identicalProjectionPairs,modeledLiveRetainedPairs:copies.identicalPairs,maximumReceiptBytes,storedNetworkRecognized:controls.length,publicReportTotalsUnchanged:true,publicNetworkSummaryUnchanged:true,publicKindCountsUnchanged:true,reportIncluded:report.totals.views,exactReferenceSql:{sha256:createHash('sha256').update(exactSql).digest('hex'),rowsRead:exact.meta.rows_read,rowsWritten:exact.meta.rows_written,primaryKeyPlan:true},externalRequests:0,productionRequests:0,newHumanLabels:0,limits:['Four clock fields are excluded only from before/after network equivalence, never exact receipt/storage comparison.','Constructed live/retained metadata tests reconciler behavior; it is not an actual provider export.','No signed-vendor proof chain, native bot verdict or human detection accuracy is measured.']};
  writeFileSync(privateOutput,JSON.stringify({captures,candidates,records,live},null,2)+'\n',{flag:'wx',mode:0o600});
  writeFileSync(output,JSON.stringify(receipt,null,2)+'\n',{flag:'wx',mode:0o600});
  console.log(JSON.stringify({collectorPairs:controls.length,receiptStoragePairs:reconciled.identicalProjectionPairs,maximumReceiptBytes,externalRequests:0}));
}finally{await before.dispose();await after.dispose();}

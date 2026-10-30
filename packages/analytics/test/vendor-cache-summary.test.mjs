import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {queryStats} from '../.test-dist/stats.js';
import {verifyVendorIp,createVendorIpCache} from '../.test-dist/vendor-ip.js';
import {decodeVendorCacheRows} from '../.test-dist/vendor-cache-report.js';
import {consistentVendorCacheSummary} from '../.test-dist/vendor-cache-report-contract.js';
import {vendorCacheSummaryCases,expectedVendorCacheSummary} from './fixtures/vendor-cache-summary.mjs';
import {observePageResponse} from '../.test-dist/index.js';
import {COLLECTION_VERSION} from '../.test-dist/versions.js';
function fixture(){const sqlite=new DatabaseSync(':memory:');sqlite.exec(readFileSync(new URL('../schema.sql',import.meta.url),'utf8'));const db={prepare(sql){return{bind(...values){return{execute(){return{results:sqlite.prepare(sql).all(...values)};},async run(){const results=sqlite.prepare(sql).all(...values);return{success:true,results,meta:{changes:1}};}};}};},async batch(s){return s.map(x=>x.execute());}};return{sqlite,db};}
const query={range:'7d',traffic:'all',path:'/fixture'},now=new Date('2026-10-30T10:00:00Z');
test('all labelled cache conditions and history reconcile without source duplication or invented assessments',async()=>{
 const {sqlite,db}=fixture();const cases=await vendorCacheSummaryCases(verifyVendorIp,createVendorIpCache);let id=0;
 const add=(item,extra={})=>sqlite.prepare("INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,observed_at,vendor_ip_evidence,referrer_host) VALUES(?,?,'browser','desktop',?,'browser','fixture',?,?,?)").run(extra.path??'/fixture',String(++id).padStart(32,'0'),extra.owner??0,extra.at??'2026-10-30 09:00:00',item.e===null?null:JSON.stringify(item.e),extra.referrer??null);
 for(const row of cases)add(row);add(cases[0],{owner:1});add(cases[0],{referrer:'traffic2cash.xyz'});add(cases[0],{path:'/outside'});add(cases[0],{at:'2026-10-31 00:00:00'});
 const r=await queryStats(db,query,now);assert.equal(r.totals.views,cases.length);assert.deepEqual(r.vendorCache,expectedVendorCacheSummary(cases));assert.equal(consistentVendorCacheSummary(r.vendorCache,r.totals.views),true);
 for(const row of cases){sqlite.prepare('DELETE FROM page_observations').run();add(row);const one=await queryStats(db,query,now);assert.deepEqual(one.vendorCache,expectedVendorCacheSummary([row]),row.name);}
 const empty=await queryStats(db,{...query,path:'/missing'},now);assert.deepEqual(empty.vendorCache,expectedVendorCacheSummary([]));sqlite.close();
});

test('actual current collector metadata remains recognized across compatible storage versions',async()=>{
 const {sqlite,db}=fixture();const req=new Request('https://fixture.invalid/fixture',{headers:{'User-Agent':'Mozilla/5.0 Chrome/141.0.0.0 Safari/537.36',Accept:'text/html','Accept-Language':'en','Sec-Fetch-Mode':'navigate','Sec-Fetch-Dest':'document','Sec-Fetch-Site':'none','Sec-Fetch-User':'?1'}});Object.defineProperty(req,'cf',{value:{asn:64512}});
 const work=[],log=console.log;console.log=()=>{};try{observePageResponse(req,new Response('fixture',{headers:{'Content-Type':'text/html'}}),'html',{DB:db,ANALYTICS_HASH_KEY:'fixture-only'},{waitUntil:p=>work.push(p)});await Promise.all(work);}finally{console.log=log;}
 assert.equal(sqlite.prepare('SELECT collection_version FROM page_observations').get().collection_version,COLLECTION_VERSION);
 const r=await queryStats(db,query,new Date());assert.equal(r.totals.views,1);assert.equal(r.fetchMetadata.records.recognizedViews,1);assert.equal(r.fetchMetadata.activation.trueClaimViews,1);
 for(const version of ['2026-10-29.6','2026-10-30.1','2026-10-29.5','future-collection']){sqlite.prepare('UPDATE page_observations SET collection_version=?').run(version);const s=await queryStats(db,query,new Date());assert.equal(s.fetchMetadata.records.recognizedViews,['2026-10-29.6','2026-10-30.1'].includes(version)?1:0,version);}
 sqlite.close();
});

test('cache masks and summary reject missing groups, contradictory claims and incomplete old responses',()=>{
 const base={state:'recognized',applicable:1,access:1,policy:1,blockers:0,views:1};
 assert.equal(decodeVendorCacheRows([base],1).records.policyKnownViews,1);
 for(const patch of [{access:null},{access:64},{policy:0},{blockers:1},{policy:2},{applicable:0},{access:32},{access:4,policy:2,blockers:1},{access:1,policy:5},{access:33,policy:1},{access:5,policy:2,blockers:1},{access:31},{views:0},{views:'1'},{state:'not-recorded'},{extra:'private-canary'}])assert.throws(()=>decodeVendorCacheRows([{...base,...patch}],1),JSON.stringify(patch));
 assert.throws(()=>decodeVendorCacheRows([],1));assert.throws(()=>decodeVendorCacheRows([base,base],2));assert.throws(()=>decodeVendorCacheRows([base],2));
 const valid=decodeVendorCacheRows([base],1);
 for(const mutate of [s=>{delete s.byAccess;},s=>{s.records.policyUnknownViews=1;},s=>{s.records.recognizedViews=0;},s=>{s.byAccess.cooldown=2;},s=>{s.byPolicy.blockedViews=1;},s=>{s.byBlocker.noCache=1;},s=>{s.records.notRecordedViews=undefined;},s=>{s.byAccess.privateName=0;}]){const s=structuredClone(valid);mutate(s);assert.equal(consistentVendorCacheSummary(s,1),false);}
});

test('overlap conservation stays exact when safe marginals have an unsafe intermediate sum',()=>{
 const n=Number.MAX_SAFE_INTEGER,s=decodeVendorCacheRows([{state:'recognized',applicable:1,access:1,policy:1,blockers:0,views:1}],1);
 s.records.recognizedViews=n;s.records.withAccessViews=n;s.records.policyKnownViews=n;s.records.policyUnknownViews=n-1;s.records.partialPolicyViews=n-1;
 s.byAccess.fetched=n;s.byAccess.failed=n-1;s.byPolicy.positiveViews=n;
 assert.equal(consistentVendorCacheSummary(s,n),true);
 s.records.partialPolicyViews--;assert.equal(consistentVendorCacheSummary(s,n),false);
});

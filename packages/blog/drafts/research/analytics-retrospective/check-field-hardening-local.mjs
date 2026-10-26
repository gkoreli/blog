import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
const req=createRequire(resolve('package.json'));const {Miniflare}=await import(pathToFileURL(req.resolve('miniflare',{paths:[dirname(req.resolve('wrangler/package.json'))]})));
const {observePageResponse}=await import(pathToFileURL(resolve('packages/analytics/.test-dist/index.js')));
const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("fixture")}}',compatibilityDate:'2026-03-06',d1Databases:{DB:'hardening-fixture'}});
try{
 const db=await mf.getD1Database('DB');
 const old=readFileSync('packages/analytics/schema.sql','utf8').split('\n').filter(line=>!line.trim().startsWith('collection_version ')&&!line.trim().startsWith('classifier_version ')).join('\n');
 await db.batch(old.split(';').map(s=>s.trim()).filter(Boolean).map(s=>db.prepare(s)));
 await db.prepare("INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,observed_at) VALUES('/legacy',?,'browser','desktop',0,'2026-09-09 00:00:00')").bind('0'.repeat(32)).run();
 const migration=readFileSync('packages/analytics/migrations/0010_observation_versions.sql','utf8');await db.batch(migration.split(';').map(s=>s.trim()).filter(Boolean).map(s=>db.prepare(s)));
 const legacy=await db.prepare("SELECT collection_version,classifier_version FROM page_observations WHERE path='/legacy'").first();assert.equal(legacy.collection_version,null);assert.equal(legacy.classifier_version,null);
 for(const [index,asn] of [64512,-1].entries()){
  const request=new Request(`https://gkoreli.com/fixture-${index}`,{headers:{'Referer':'https://gkoreli.com/','User-Agent':'fixture/1.0'}});Object.defineProperty(request,'cf',{value:{asn}});
  const work=[];observePageResponse(request,new Response('<html></html>',{headers:{'Content-Type':'text/html'}}),'html',{DB:db,ANALYTICS_HASH_KEY:'local-fixture'}, {waitUntil:p=>work.push(p)},{publicPagePaths:async()=>new Set(['/'])});await Promise.all(work);
 }
 const rows=(await db.prepare("SELECT path,asn,asn_source,referrer_state,internal_referrer_path,collection_version,classifier_version FROM page_observations WHERE path LIKE '/fixture-%' ORDER BY path").all()).results;
 assert.equal(rows.length,2);assert.equal(rows[0].asn,64512);assert.equal(rows[1].asn,null);assert.equal(rows[1].asn_source,null);
 for(const row of rows){assert.equal(row.referrer_state,'internal');assert.equal(row.internal_referrer_path,null);assert.equal(row.collection_version,'2026-10-26.2');assert.equal(row.classifier_version,'2026-10-26.2');}
 writeFileSync('/tmp/gk-hardening-local.json',JSON.stringify({checkedAt:new Date().toISOString(),runtime:'Miniflare/workerd local D1',migration:'0010_observation_versions.sql',legacyVersionsUnchanged:true,ingestionRows:rows,productionCalls:0},null,2));console.log('Native local migration and actual ingestion pass.');
}finally{await mf.dispose();}

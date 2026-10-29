import assert from 'node:assert/strict';
import {readFileSync,writeFileSync}from'node:fs';
import{createHash}from'node:crypto';
import{createRequire}from'node:module';
import{resolve,dirname}from'node:path';
import{pathToFileURL}from'node:url';
const[output]=process.argv.slice(2);assert.ok(output);
const require=createRequire(resolve('package.json'));
const{Miniflare}=await import(pathToFileURL(require.resolve('miniflare',{paths:[dirname(require.resolve('wrangler/package.json'))]})));
const mf=new Miniflare({modules:true,script:'export default{fetch(){return new Response("Offline SQL check")}}',compatibilityDate:'2026-03-06',cf:{},d1Databases:{DB:'frozen-signed-storage'}});
try{
 const db=await mf.getD1Database('DB'),schema=readFileSync('packages/analytics/schema.sql','utf8').replace(/^\s*--.*$/gm,'');
 await db.batch(schema.split(';').map(s=>s.trim()).filter(Boolean).map(s=>db.prepare(s)));
 const refs=Array.from({length:52},(_,i)=>(9007199254740992n+BigInt(i)).toString());
 await db.batch(refs.map((ref,i)=>db.prepare("INSERT INTO page_observations(id,path,daily_client_id,traffic_class,device_type,is_owner,collection_version,signature_status) VALUES(CAST(? AS INTEGER),'/fixture','00000000000000000000000000000000','ai','desktop',?,?,?)").bind(ref,i===0?1:0,i===0?'contradictory-fixture':'2026-10-28.10',i===0?'unverified':'verified')));
 const sql=readFileSync('packages/blog/drafts/research/analytics-retrospective/frozen-signed-storage.sql','utf8');assert.equal((sql.match(/\?/g)??[]).length,52);
 const r=await db.prepare(sql).bind(...refs).all();assert.deepEqual(r.results.map(row=>row.privateReference),refs);
 assert.equal(r.results[0].ownerFlag,1);assert.equal(r.results[0].signatureStatus,'unverified');assert.equal(r.results[0].collectionVersion,'contradictory-fixture');
 assert.ok(r.results.every(row=>row.signatureEvidence===null&&row.classificationEvidence===null&&row.vendorIpEvidence===null));
 assert.equal(r.meta.rows_read,104);assert.equal(r.meta.rows_written,0);
 const plan=await db.prepare('EXPLAIN QUERY PLAN '+sql).bind(...refs).all();assert.ok(plan.results.some(row=>row.detail.includes('INTEGER PRIMARY KEY')));
 const control=await db.prepare('SELECT 1 AS query_access_control').all();assert.deepEqual(control.results,[{query_access_control:1}]);assert.equal(control.meta.rows_read,0);assert.equal(control.meta.rows_written,0);
 const result={checkedAt:new Date().toISOString(),sqlSha256:createHash('sha256').update(sql).digest('hex'),rows:r.results.length,reads:r.meta.rows_read,writes:r.meta.rows_written,primaryKeyPlan:true,unsafeNeighborTextReferencesDistinct:true,ownerAndContradictoryFactsRetained:true,control:{sql:'SELECT 1 AS query_access_control',reads:0,writes:0},productionStatements:0};
 writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify(result));
}finally{await mf.dispose();}

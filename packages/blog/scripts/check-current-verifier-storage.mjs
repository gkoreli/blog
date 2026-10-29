import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {dirname,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [output]=process.argv.slice(2);assert.ok(output);
const req=createRequire(resolve('package.json'));
const {Miniflare}=await import(pathToFileURL(req.resolve('miniflare',{paths:[dirname(req.resolve('wrangler/package.json'))]})));
const mf=new Miniflare({modules:true,script:'export default{fetch(){return new Response("Exact reference SQL fixture")}}',compatibilityDate:'2026-03-06',cf:{},d1Databases:{DB:'current-verifier-storage'}});
try{
 const db=await mf.getD1Database('DB'),schema=readFileSync('packages/analytics/schema.sql','utf8').replace(/^\s*--.*$/gm,'');
 await db.batch(schema.split(';').map(s=>s.trim()).filter(Boolean).map(s=>db.prepare(s)));
 const refs=['9007199254740992','9007199254740993','9007199254740994','9007199254740995'];
 for(const [i,ref]of refs.entries())await db.prepare("INSERT INTO page_observations(id,path,daily_client_id,traffic_class,device_type,is_owner,collection_version,signature_status) VALUES(CAST(? AS INTEGER),'/fixture','00000000000000000000000000000000','ai','desktop',?,?,?)")
  .bind(ref,i===3?1:0,i===2?'contradictory-fixture':'2026-10-29.2',i===1?'unverified':'verified').run();
 const sql=readFileSync('packages/blog/drafts/research/analytics-retrospective/current-verifier-storage.sql','utf8');assert.equal((sql.match(/\?/g)??[]).length,4);
 const result=await db.prepare(sql).bind(...refs).all();assert.deepEqual(result.results.map(row=>row.privateReference),refs);
 assert.equal(result.results[1].signatureStatus,'unverified');assert.equal(result.results[2].collectionVersion,'contradictory-fixture');assert.equal(result.results[3].ownerFlag,1);
 assert.ok(result.results.every(row=>row.signatureEvidence===null&&row.classificationEvidence===null&&row.vendorIpEvidence===null));
 assert.equal(result.meta.rows_written,0);
 const plan=await db.prepare('EXPLAIN QUERY PLAN '+sql).bind(...refs).all();assert.ok(plan.results.some(row=>row.detail.includes('INTEGER PRIMARY KEY')));
 const receipt={checkedAt:new Date().toISOString(),sqlSha256:createHash('sha256').update(sql).digest('hex'),nativeRows:4,reads:result.meta.rows_read,writes:result.meta.rows_written,primaryKeyPlan:true,unsafeNeighborTextIdsDistinct:true,contradictoryAndMissingFieldsRetained:true,ownerIncluded:true,productionStatements:0};
 writeFileSync(output,JSON.stringify(receipt,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify(receipt));
}finally{await mf.dispose();}

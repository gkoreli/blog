import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const [output,singleSqlPath]=process.argv.slice(2);assert.ok(output);
const require=createRequire(resolve('package.json'));
const {Miniflare}=await import(pathToFileURL(require.resolve('miniflare',{paths:[dirname(require.resolve('wrangler/package.json'))]})));
const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("SQL acceptance")}}',compatibilityDate:'2026-03-06',cf:{},d1Databases:{DB:'current-signed-fixture'}});
try {
  const db=await mf.getD1Database('DB'),schema=readFileSync('packages/analytics/schema.sql','utf8').replace(/^\s*--.*$/gm,'');
  await db.batch(schema.split(';').map(s=>s.trim()).filter(Boolean).map(s=>db.prepare(s)));
  const ids=['9007199254740992','9007199254740993'];
  for(const [i,id] of ids.entries())await db.prepare(`INSERT INTO page_observations(id,path,daily_client_id,traffic_class,device_type,is_owner,collection_version,signature_status)
    VALUES(CAST(? AS INTEGER),'/fixture','00000000000000000000000000000000','ai','desktop',0,?,?)`).bind(id,i===0?'2026-10-28.2':'contradictory-fixture',i===0?'verified':'unverified').run();
  const sql=readFileSync(singleSqlPath??'packages/blog/drafts/research/analytics-retrospective/current-signed-storage.sql','utf8');
  const responses=singleSqlPath?await Promise.all(ids.map(id=>db.prepare(sql).bind(id).all())):[await db.prepare(sql).bind(...ids).all()];
  const rows=responses.flatMap(r=>r.results);assert.equal(rows.length,2);assert.deepEqual(rows.map(row=>row.privateReference),ids);
  assert.equal(rows[1].signatureStatus,'unverified');assert.equal(rows[1].collectionVersion,'contradictory-fixture');
  const reads=responses.reduce((n,r)=>n+r.meta.rows_read,0),writes=responses.reduce((n,r)=>n+r.meta.rows_written,0);
  assert.equal(reads,singleSqlPath?2:4);assert.equal(writes,0);
  if(singleSqlPath)for(const response of responses){assert.equal(response.results.length,1);assert.equal(response.meta.rows_read,1);}
  const plan=await db.prepare('EXPLAIN QUERY PLAN '+sql).bind(...(singleSqlPath?[ids[0]]:ids)).all();assert.ok(plan.results.some(row=>String(row.detail).includes('INTEGER PRIMARY KEY')));
  writeFileSync(output,JSON.stringify({checkedAt:new Date().toISOString(),rows:2,statements:responses.length,rowsRead:reads,rowsReadPerStatement:responses.map(r=>r.meta.rows_read),rowsWritten:writes,exactUnsafeIntegerTextReferencesPreserved:true,contradictoryStatusAndVersionRetained:true,plan:'INTEGER PRIMARY KEY',productionStatements:0},null,2)+'\n',{mode:0o600,flag:'wx'});
  console.log(JSON.stringify({nativeRows:2,statements:responses.length,rowsRead:reads,rowsWritten:writes}));
}finally{await mf.dispose();}

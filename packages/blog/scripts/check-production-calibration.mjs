import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { COLLECTION_VERSION } from '../../analytics/.test-dist/versions.js';

const output=process.argv[2];if(!output)throw Error('Provide a new aggregate receipt path');
const req=createRequire(resolve('package.json'));
const {Miniflare}=await import(pathToFileURL(req.resolve('miniflare',{paths:[dirname(req.resolve('wrangler/package.json'))]})));
const conditions=['normal','block-script','block-beacon','http-client'];
const trials=conditions.map(condition=>({id:randomUUID(),condition,operator:condition==='http-client'?'controlled-curl':'agent-browser'}));
const issuedAt=Date.now()-1000,expiresAt=Date.now()+600000,token='e'.repeat(64);
const compiled=await build({entryPoints:['packages/blog/src/worker/index.ts'],bundle:true,write:false,format:'esm',platform:'browser',external:['cloudflare:workers'],logLevel:'silent'});
assert.equal(compiled.outputFiles.length,1);
const mf=new Miniflare({modules:true,script:compiled.outputFiles[0].text,compatibilityDate:'2026-03-06',cf:{},d1Databases:{DB:'production-calibration'},bindings:{ANALYTICS_HASH_KEY:'local-only',OWNER_MARK_GRANT:JSON.stringify({token,issuedAt,expiresAt}),ANALYTICS_CALIBRATION:JSON.stringify({issuedAt,expiresAt,trials})}});
const origin='https://publication.example';
const call=(path,init={})=>mf.dispatchFetch(origin+path,{...init,headers:{'User-Agent':'NativeFixture/1.0','CF-Connecting-IP':'192.0.2.1',...init.headers}});
try{
 const db=await mf.getD1Database('DB');const old=readFileSync('packages/analytics/schema.sql','utf8').split('-- Explicitly activated owner-excluded experiment counters')[0].replace(/^\s*--.*$/gm,'');
 await db.batch(old.split(';').map(s=>s.trim()).filter(Boolean).map(s=>db.prepare(s)));
 await db.prepare("INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,observed_at) VALUES('/historical','00000000000000000000000000000000','browser','desktop',1,'browser','fixture',datetime('now'))").run();
 const migration=readFileSync('packages/analytics/migrations/0016_calibration_trials.sql','utf8').replace(/^\s*--.*$/gm,'');await db.batch(migration.split(';').map(s=>s.trim()).filter(Boolean).map(s=>db.prepare(s)));
 assert.equal((await db.prepare("SELECT COUNT(*) AS n FROM page_observations WHERE path='/historical'").first()).n,1);
 assert.equal((await call('/analytics-check/'+trials[0].id)).status,403);
 assert.equal((await call('/api/owner',{method:'POST',headers:{Authorization:'Bearer '+token}})).status,200);
 assert.equal((await call('/api/analytics-calibration/'+trials[0].id+'/ready')).status,200);assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM analytics_calibration_trials').first()).n,0);
 const results=[];
 for(const trial of trials){
  const page=await call('/analytics-check/'+trial.id);assert.equal(page.status,200);assert.ok((await page.text()).includes('Planned operator label'));const csp=page.headers.get('Content-Security-Policy');
  if(trial.condition==='block-script')assert.ok(csp.includes("script-src 'none'"));if(trial.condition==='block-beacon')assert.ok(csp.includes('/stage/ ')&&!csp.includes('/beacon'));
  const api='/api/analytics-calibration/'+trial.id;
  if(!['block-script','http-client'].includes(trial.condition)){
   const js=await call(api+'/client.js');assert.equal(js.status,200);new Function(await js.text());
   for(const action of ['/stage/script','/stage/attempt','/stage/queued',...(trial.condition==='normal'?['/beacon']:[])])assert.equal((await call(api+action,{method:'POST',headers:{Origin:origin},body:'1'})).status,200);
  }
  let receipt;
  for(let attempt=0;attempt<5;attempt++){
   receipt=await(await call(api+'/receipt')).json();if(receipt.observations.length)break;await new Promise(r=>setTimeout(r,25));
  }
  assert.equal(receipt.counters.page_responses,1);assert.equal(receipt.observations.length,1);assert.equal(receipt.observations[0].observations,1);assert.equal(receipt.observations[0].ownerExcluded,1);
  assert.equal(receipt.counters.beacon,trial.condition==='normal'?1:0);
  assert.equal((await call(api+'/beacon',{method:'POST',headers:{Origin:'https://other.example'},body:'1'})).status,403);
  const html=await call(api+'/receipt',{headers:{Accept:'text/html'}});assert.ok((await html.text()).includes('<h1>Trial receipt</h1>'));
  results.push({condition:trial.condition,counters:receipt.counters,observations:receipt.observations});
 }
 await db.prepare('DELETE FROM owner_clients').run();
 const acceptanceSql=readFileSync('packages/blog/drafts/research/edge-vs-rum/production-stage-acceptance.sql','utf8');
 const accepted=(await db.prepare(acceptanceSql).bind(JSON.stringify(trials.map(t=>t.id)),'2000-01-01 00:00:00','2100-01-01 00:00:00').all()).results;
 const queryPlan=(await db.prepare('EXPLAIN QUERY PLAN '+acceptanceSql).bind(JSON.stringify(trials.map(t=>t.id)),'2000-01-01 00:00:00','2100-01-01 00:00:00').all()).results;
 assert.ok(queryPlan.some(row=>typeof row.detail==='string'&&row.detail.includes('idx_page_observations_public_path_time')));
 assert.equal(accepted.length,4);assert.ok(accepted.every(r=>r.storedObservations===1&&r.ownerExcludedObservations===1&&r.minCollectionVersion===COLLECTION_VERSION&&r.maxCollectionVersion===COLLECTION_VERSION));
 const publicReport=await(await call('/api/stats?range=7d&traffic=all')).json();assert.equal(publicReport.totals.views,0);
 const stored=await db.prepare("SELECT COUNT(*) AS n, SUM(is_owner) AS ownerRows FROM page_observations WHERE path LIKE '/analytics-check/%'").first();assert.equal(stored.n,4);assert.equal(stored.ownerRows,4);
 await db.prepare("UPDATE analytics_calibration_trials SET expires_at=datetime('now','-1 second')").run();
 const source=readFileSync('packages/analytics/src/calibration.ts','utf8');const deletion=[...source.matchAll(/db\.prepare\('([^']+)'\)/g)].map(m=>m[1]).find(s=>s.startsWith('DELETE FROM analytics_calibration_trials'));
 assert.ok(deletion);assert.equal((await db.prepare(deletion).bind(new Date().toISOString().replace('T',' ').slice(0,19)).run()).meta.changes,4);
 const files=['packages/analytics/src/calibration.ts','packages/analytics/src/index.ts','packages/analytics/src/owner.ts','packages/analytics/src/versions.ts','packages/analytics/migrations/0016_calibration_trials.sql','packages/blog/src/worker/index.ts','packages/blog/drafts/research/edge-vs-rum/production-stage-acceptance.sql'];
 const receipt={checkedAt:new Date().toISOString(),runtime:process.version,environment:'Bundled actual blog Worker executed in local workerd with native D1 and crypto; HTTP/stage inputs supplied by Node harness',limits:['These are synthetic native-Worker HTTP/stage fixtures, not browser CSP enforcement or actual curl/human operation','Operator labels are planned only; independent execution evidence is required','No production calls, native Cloudflare beacon ingestion or physical-device proof'],trials:results,queryPlan,checks:{migrationPreservesHistory:true,unmarkedDenied:true,ownerMarkAccepted:true,actualWorkerRouting:true,actualCollectorPersistence:true,permanentOwnerExclusionAfterMarksRemoved:true,closedStageCounters:true,cspHeaders:true,clientScriptParses:true,nonJsReceipt:true,crossOriginDenied:true,nativeExpirySql:true,narrowProductionSql:true},bundleSha256:createHash('sha256').update(compiled.outputFiles[0].contents).digest('hex'),sourceSha256:Object.fromEntries(files.map(f=>[f,createHash('sha256').update(readFileSync(f)).digest('hex')])),productionCalls:0};
 writeFileSync(output,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({trials:results.length,checks:receipt.checks,productionCalls:0}));
}finally{await mf.dispose()}

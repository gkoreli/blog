import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash, randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { observePageResponse } from '../../../../analytics/.test-dist/index.js';
import { handleCalibration } from '../../../../analytics/.test-dist/calibration.js';
import { schemaObjects } from '../../../../analytics/scripts/fresh-schema.mjs';
import { createDetectionControlPlan, detectionControlReadbackQuery, detectionControlReadbackSql, reconcileDetectionControls, DETECTION_CONTROL_PROFILE } from './detection-live-control.mjs';

const output=process.argv[2];assert.ok(output,'Fresh private output path required');
const req=createRequire(new URL('../../../../../package.json',import.meta.url));
const {Miniflare}=await import(pathToFileURL(req.resolve('miniflare',{paths:[dirname(req.resolve('wrangler/package.json'))]})));
const mf=new Miniflare({modules:true,script:'export default{fetch(){return new Response("local detection acceptance query fixtures")}}',compatibilityDate:'2026-03-06',cf:{},d1Databases:{DB:'detection-control-native'}});
const db=await mf.getD1Database('DB'),sqlite=new DatabaseSync(':memory:');
sqlite.exec(readFileSync(new URL('../../../../analytics/schema.sql',import.meta.url),'utf8'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const sqlStamp=ms=>new Date(ms).toISOString().slice(0,19).replace('T',' ');
const now=Date.now(),plan=createDetectionControlPlan({origin:'https://fixture.example',workerVersion:randomUUID(),marker:'native-fixture-'+randomUUID(),trialIds:Array.from({length:6},()=>randomUUID()),start:sqlStamp(now-30000),cutoff:sqlStamp(now+720000),sourceSha256:'a'.repeat(64),sourceCommit:'b'.repeat(40)});
const events=[],responses=[];const negative=[];const priorLog=console.log,priorFetch=globalThis.fetch;
try {
  for(const definition of schemaObjects(sqlite))await db.prepare(definition.sql).run();
  // A high synthetic rowid catches accidental Number conversion. Unrelated
  // rows force the duplicate count to use its owner/path/time covering index.
  await db.prepare("INSERT INTO page_observations(id,path,daily_client_id,traffic_class,device_type,is_owner,observed_at)VALUES(CAST('9007199254740992' AS INTEGER),'/unrelated',?,'browser','desktop',0,?)").bind('0'.repeat(32),plan.start).run();
  for(let i=0;i<512;i+=64)await db.batch(Array.from({length:64},(_,j)=>db.prepare("INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,observed_at)VALUES(?,?,'browser','desktop',?,?)").bind('/unrelated-'+(i+j),'0'.repeat(32),(i+j)%2,plan.start)));
  globalThis.fetch=async()=>{throw new Error('Unexpected external fetch in private native preflight');};
  for(const [i,trial]of plan.trials.entries()) {
    const ray=(i+1).toString(16).padStart(16,'0'),headers={...trial.headers,'CF-Ray':ray+'-SJC','CF-Connecting-IP':'192.0.2.1'};
    const request=new Request(trial.url,{method:'GET',headers});Object.defineProperty(request,'cf',{value:{asn:64512,verifiedBotCategory:''}});
    const logs=[],pending=[];console.log=(...message)=>logs.push({message});
    const startedAt=new Date().toISOString();observePageResponse(request,new Response('native fixture',{headers:{'Content-Type':'text/html'}}),'html',{DB:db,ANALYTICS_HASH_KEY:'local-only-synthetic-key'},{waitUntil:p=>pending.push(p)},{verifiedOwnerExclusion:true});await Promise.all(pending);console.log=priorLog;
    const completedAt=new Date().toISOString();
    await db.prepare('INSERT INTO analytics_calibration_trials(id,condition,operator,expires_at,page_responses)VALUES(?,?,?,?,1)').bind(trial.id,'http-client','controlled-curl',sqlStamp(now+86400000)).run();
    events.push({scriptName:'gkoreli-com',scriptVersion:{id:plan.workerVersion},truncated:false,outcome:'ok',exceptions:[],event:{request:{url:trial.url,method:'GET',headers,cf:{asn:64512}},response:{status:200}},logs});
    responses.push({label:trial.label,method:'GET',url:trial.url,headers:trial.headers,attempts:1,startedAt,completedAt,status:200,ray:ray+'-SJC',bodySha256:hash('native fixture')});
  }
  const refs=events.map((event,i)=>({label:plan.trials[i].label,observationId:event.logs.find(log=>log.message[0]==='analytics.observation_stored').message[1].storage.observationId}));
  assert.ok(refs.every(item=>BigInt(item.observationId)>9007199254740992n));
  const query=detectionControlReadbackQuery(plan,refs),literal=detectionControlReadbackSql(plan,refs);
  const bound=await db.prepare(query.sql).bind(...query.values).all(),concrete=await db.prepare(literal).all();assert.deepEqual(bound.results,concrete.results);assert.equal(bound.results.length,6);assert.equal(bound.meta.rows_written,0);assert.ok(bound.meta.rows_read<=100,'Native cost exceeds reviewed acceptance threshold');
  const explain=(await db.prepare('EXPLAIN QUERY PLAN '+query.sql).bind(...query.values).all()).results;assert.ok(explain.some(row=>String(row.detail).includes('idx_page_observations_public_path_time')));
  assert.equal(explain.some(row=>/SCAN duplicates\b/i.test(String(row.detail))),false);
  const accepted=reconcileDetectionControls(plan,events,bound.results,responses);assert.equal(accepted.exactChains,6);
  function reject(label,change){const input={plan:structuredClone(plan),events:structuredClone(events),rows:structuredClone(bound.results),responses:structuredClone(responses)};change(input);assert.throws(()=>reconcileDetectionControls(input.plan,input.events,input.rows,input.responses),undefined,label);negative.push(label);}
  const store=event=>event.logs.find(log=>log.message[0]==='analytics.observation_stored').message[1];
  reject('missing-invocation',x=>x.events.pop());reject('duplicate-invocation',x=>x.events[1]=structuredClone(x.events[0]));
  reject('wrong-worker',x=>x.events[0].scriptVersion.id=randomUUID());reject('changed-source-profile',x=>x.plan.classifierVersion='future');
  reject('changed-native-header',x=>x.events[0].event.request.headers['Sec-Fetch-Mode']='cors');reject('changed-manifest-header',x=>x.responses[0].headers['User-Agent']='other');
  reject('changed-marker',x=>x.events[0].event.request.headers['X-Gk-Analytics-Check']='different-marker');reject('changed-ray',x=>x.responses[0].ray='f'.repeat(16));
  reject('missing-attempt',x=>x.events[0].logs=x.events[0].logs.filter(log=>log.message[0]!=='analytics.observation_attempt'));
  reject('duplicate-operation',x=>{const id=store(x.events[0]).operationId;for(const log of x.events[1].logs)log.message[1].operationId=id;});
  reject('swapped-operation-link',x=>{store(x.events[0]).operationId=store(x.events[1]).operationId;});
  reject('swapped-storage-ids',x=>{const first=store(x.events[0]).storage.observationId;store(x.events[0]).storage.observationId=store(x.events[1]).storage.observationId;store(x.events[1]).storage.observationId=first;});
  reject('numeric-storage-id',x=>store(x.events[0]).storage.observationId=Number(store(x.events[0]).storage.observationId));
  reject('missing-readback-row',x=>x.rows.pop());reject('owner-zero',x=>x.rows[0].isOwner=0);reject('optional-capture',x=>x.rows[0].optionalCaptureAbsent=0);
  reject('wrong-classifier',x=>x.rows[0].classifierVersion='future');reject('wrong-schema',x=>{const c=JSON.parse(x.rows[0].classificationEvidence);c.version='future';x.rows[0].classificationEvidence=JSON.stringify(c);});
  reject('unknown-product-profile',x=>{const c=JSON.parse(x.rows[5].classificationEvidence);c.declarations.productProfile='future';x.rows[5].classificationEvidence=JSON.stringify(c);});
  reject('truncated-product-bits',x=>{const c=JSON.parse(x.rows[5].classificationEvidence);c.declarations.matchedProductBits='1';x.rows[5].classificationEvidence=JSON.stringify(c);x.rows[5].classificationBytes=Buffer.byteLength(x.rows[5].classificationEvidence);});
  reject('balanced-page-responses-two-zero',x=>{x.rows[0].pageResponses=2;x.rows[1].pageResponses=0;});
  reject('balanced-observation-counts-two-zero',x=>{x.rows[0].trialObservationCount=2;x.rows[1].trialObservationCount=0;});
  reject('changed-acknowledgement-projection',x=>store(x.events[0]).receipt.native.categoryStatus='known');
  reject('unexpected-signature-header',x=>x.events[0].event.request.headers.Signature='synthetic');
  reject('duplicate-requested-row',x=>x.rows[1]=structuredClone(x.rows[0]));
  reject('execution-after-cutoff',x=>x.responses[0].completedAt=new Date(Date.parse(plan.cutoff.replace(' ','T')+'Z')+1).toISOString());
  const redacted=structuredClone(events);redacted[0].event.request.url=plan.trials[0].url.replace(plan.trials[0].id,'REDACTED');assert.equal(reconcileDetectionControls(plan,redacted,bound.results,responses).exactChains,6);
  const missingRefs=structuredClone(refs);missingRefs[0].observationId='9223372036854775807';const missing=await db.prepare(detectionControlReadbackSql(plan,missingRefs)).all();assert.equal(missing.results.length,6);assert.equal(missing.results[0].observationId,null);assert.equal(missing.results[0].requestedObservationId,'9223372036854775807');assert.throws(()=>reconcileDetectionControls(plan,events,missing.results,responses));negative.push('native-missing-PK-retains-requested-row');
  await db.prepare("INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,observed_at)VALUES(?,?,'browser','desktop',0,?)").bind(new URL(plan.trials[0].url).pathname,'0'.repeat(32),sqlStamp(now)).run();
  const duplicated=await db.prepare(literal).all();assert.equal(duplicated.results[0].trialObservationCount,2);assert.throws(()=>reconcileDetectionControls(plan,events,duplicated.results,responses));negative.push('native-extra-unacknowledged-owner-zero-row');
  const expired=await handleCalibration(new Request(plan.trials[0].url),{DB:db,ANALYTICS_HASH_KEY:'fixture',ANALYTICS_CALIBRATION:JSON.stringify({issuedAt:now-60000,expiresAt:now-1,trials:plan.trials.map(t=>({id:t.id,condition:'http-client',operator:'controlled-curl'}))})},new Date(now));assert.equal(expired.response.status,404);negative.push('expired-config-route-closed');
  for(const invalid of [[...refs.slice(0,5)],refs.map(item=>({...item,observationId:'1'})),refs.map((item,i)=>({...item,observationId:i===0?1:item.observationId})),refs.map((item,i)=>({...item,observationId:i===0?'9223372036854775808':item.observationId}))])assert.throws(()=>detectionControlReadbackSql(plan,invalid));
  const helperPath=new URL('./detection-live-control.mjs',import.meta.url);
  const receipt={accepted:true,profile:DETECTION_CONTROL_PROFILE,controls:6,closedProjectionChains:6,helperSha256:hash(readFileSync(helperPath)),
    sql:{templateSha256:hash(query.sql),parameterizedMatchesLiteral:true,rowsReturned:bound.results.length,rowsRead:bound.meta.rows_read,rowsWritten:bound.meta.rows_written,explainUsesPathTimeIndex:true,plan:explain},
    negativeCases:negative.length,negativeLabels:negative,allProducts:accepted.controls.find(row=>row.label==='all-products'),
    libraryModules:readdirSync(new URL('../../../../analytics/.test-dist/',import.meta.url)).filter(name=>name.endsWith('.js')).sort().map(filename=>({name:filename.slice(0,-3),sha256:hash(readFileSync(new URL(`../../../../analytics/.test-dist/${filename}`,import.meta.url)))})),
    productionCalls:0,settingsChanges:0,externalFetches:0,
    scope:'Current compiled collector and projection execute in Node; actual local workerd D1 executes schema, lookup, index plan and counters. Tail/HTTP manifests and counters are synthetic fixtures, not wire/provider/operator proof. The separate composed-Worker preflight and production settings/activation/cleanup receipts remain required.',
    result:accepted};
  writeFileSync(output,JSON.stringify(receipt,null,2)+'\n',{flag:'wx',mode:0o600});priorLog(JSON.stringify({accepted:true,controls:6,negativeCases:negative.length,rowsRead:bound.meta.rows_read,output}));
}finally{console.log=priorLog;globalThis.fetch=priorFetch;sqlite.close();await mf.dispose();}

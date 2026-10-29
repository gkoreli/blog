import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {nativeDatabase} from './evidence-delta.mjs';
import {ACTIVE_REFERRAL_POLICY} from '../../analytics/.test-dist/referral-policy.generated.js';
import {PLAN,WINDOW,TEXT_FIELDS,EXPORT_FIELDS,PREFLIGHT_SQL,EXPORT_SQL,prepare,validatePreflight,validateExport,analyze,sourceOf,channelOf} from './audience-audit.mjs';
const output=process.argv[2];assert.ok(output);
const fixture=(id,overrides={})=>({...Object.fromEntries(TEXT_FIELDS.map(f=>[f,null])),id:String(id),path:'/a',observed_at:'2026-10-10 12:00:00',daily_client_id:BigInt(id).toString(16).padStart(32,'0'),referrer_state:'absent',is_owner:0,owner_client:0,...overrides});
const cases=[fixture(1),fixture(2,{daily_client_id:'1'.padStart(32,'0')}),fixture(3,{referrer_state:'external',referrer_host:'private-canary.example'}),fixture(4,{referrer_state:'external',referrer_host:'private-canary.example'}),fixture(5,{referrer_state:'external',referrer_host:'www.google.com'}),fixture(6,{path:'/b',referrer_state:'external',referrer_host:'kagi.com'}),fixture(7,{referrer_state:'internal',referrer_host:null}),fixture(8,{referrer_state:'absent'}),fixture(9,{referrer_state:null}),fixture(10,{is_owner:1,referrer_host:'traffic2cash.xyz'}),fixture(11,{owner_client:1}),fixture(12,{referrer_host:'traffic2cash.xyz'}),fixture(13,{observed_at:'2026-10-25 99:00:00',referrer_state:'weird'})];
const source=await nativeDatabase();
try{
 const{db}=source;await db.prepare('CREATE INDEX idx_page_observations_observed_at ON page_observations(observed_at)').run();
 async function insert(rows){
  const keys=['id',...TEXT_FIELDS,'is_owner','reader_kind'];for(let i=0;i<rows.length;i+=128)await db.batch(rows.slice(i,i+128).map(r=>db.prepare(`INSERT INTO page_observations(${keys.join(',')})VALUES(${keys.map(()=>'?').join(',')})`).bind(r.id,...TEXT_FIELDS.map(f=>r[f]),r.is_owner,'browser')));
  const owners=rows.filter(r=>r.owner_client===1);if(owners.length)await db.batch(owners.map(r=>db.prepare("INSERT INTO owner_clients(daily_client_id,utc_date)VALUES(?,'fixture')").bind(r.daily_client_id)));
 }
 validateExport([],validatePreflight(await db.prepare(PREFLIGHT_SQL).bind(WINDOW.start,WINDOW.end).first()));
 await insert(cases);await insert([fixture(100,{observed_at:'2026-09-30 23:59:59'}),fixture(101,{observed_at:WINDOW.end})]);
 const pre=validatePreflight(await db.prepare(PREFLIGHT_SQL).bind(WINDOW.start,WINDOW.end).first()),rows=validateExport((await db.prepare(EXPORT_SQL).bind(WINDOW.start,WINDOW.end,pre.upperId).all()).results,pre);assert.equal(rows.length,13);
 assert.deepEqual((await db.prepare(prepare('export',pre.upperId)).all()).results,rows);assert.deepEqual(await db.prepare(prepare('preflight')).first(),pre);
 const posts=[{slug:'a',title:'A',date:'2026-10-01',section:'engineering'},{slug:'b',title:'B',date:'2026-10-01',section:'engineering'}];
 const result=analyze(rows,posts,{sensitivityHost:'private-canary.example'});
 assert.equal(analyze(rows,posts).totals.dominant,0);
 assert.equal(analyze(rows,posts,{sensitivityHost:'google.com'}).totals.dominant,1);
 assert.throws(()=>analyze(rows,posts,{sensitivityHost:'www.google.com'}));
 const displayChanged=analyze(rows,posts,{sensitivityHost:'private-canary.example',referralPolicy:{...ACTIVE_REFERRAL_POLICY,publicHosts:[...ACTIVE_REFERRAL_POLICY.publicHosts,'private-canary.example']}});
 assert.equal(displayChanged.totals.dominant,result.totals.dominant);
 assert.equal(displayChanged.totals.withoutDominant,result.totals.withoutDominant);
 assert.equal(displayChanged.totals.namedExternal,result.totals.namedExternal+2);
 assert.equal(result.includedRows,10);assert.deepEqual(result.exclusions,{'owner-excluded':2,'referral-excluded':1});assert.equal(result.totals.dominant,2);assert.equal(result.totals.withoutDominant,8);assert.equal(result.totals.namedExternal,2);assert.equal(result.totals.internal,1);assert.equal(result.invalidTimes,1);assert.equal(result.weekly.reduce((n,r)=>n+r.views,0)+result.invalidTimes,result.includedRows);assert.equal(result.totals.repeatedSameDayClientPageRequests,1);
 assert.equal(sourceOf(fixture(1,{referrer_state:'internal'})).bucket,'internal');assert.equal(channelOf('gemini.google.com'),'AI referral');assert.equal(channelOf('notgoogle.com'),'Other external');
 const mutations=[r=>r.pop(),r=>r[1].id=r[0].id,r=>r[0].id=1,r=>r[0].daily_client_id='invalid',r=>r[0].path+='changed',r=>r[0].owner_client=true,r=>r[0].extra='canary',r=>r[0].observed_at=WINDOW.end];
 for(const mutate of mutations){const copy=structuredClone(rows);mutate(copy);assert.throws(()=>validateExport(copy,pre))}
 for(const mutate of [v=>v.rows=PLAN.maximumRows+1,v=>v.sourceBytes=PLAN.maximumSourceBytes+1,v=>v.maximumRowSourceBytes=PLAN.maximumRowSourceBytes+1,v=>v.rows=true]){const copy=structuredClone(pre);mutate(copy);assert.throws(()=>validatePreflight(copy))}
 await db.prepare('DELETE FROM page_observations').run();await db.prepare('DELETE FROM owner_clients').run();
 const scale=Array.from({length:PLAN.maximumRows},(_,i)=>fixture(i+1,{path:'/a',observed_at:'2026-10-'+String(i%28+1).padStart(2,'0')+' 12:00:00'}));await insert(scale);
 const outside=Array.from({length:28672},(_,i)=>fixture(10000+i,{observed_at:'2026-09-01 00:00:00'}));await insert(outside);
 const preResult=await db.prepare(PREFLIGHT_SQL).bind(WINDOW.start,WINDOW.end).all();validatePreflight(preResult.results[0]);const read=await db.prepare(EXPORT_SQL).bind(WINDOW.start,WINDOW.end,preResult.results[0].upperId).all();validateExport(read.results,preResult.results[0]);
 const total=preResult.meta.rows_read+read.meta.rows_read;assert.ok(preResult.meta.rows_read<=PLAN.readReviewThresholdPerStatement&&read.meta.rows_read<=PLAN.readReviewThresholdPerStatement);assert.equal(preResult.meta.rows_written+read.meta.rows_written,0);
 const queryPlan=(await db.prepare('EXPLAIN QUERY PLAN '+EXPORT_SQL).bind(WINDOW.start,WINDOW.end,preResult.results[0].upperId).all()).results.map(r=>r.detail);assert.ok(queryPlan.some(s=>s.includes('idx_page_observations_observed_at')));
 await insert([fixture(40000)]);const sentinel=await db.prepare(PREFLIGHT_SQL).bind(WINDOW.start,WINDOW.end).first();assert.equal(sentinel.rows,PLAN.maximumRows+1);assert.throws(()=>validatePreflight(sentinel));
 const hash=b=>createHash('sha256').update(b).digest('hex');const receipt={checkedAt:new Date().toISOString(),plan:PLAN,window:WINDOW,cases:13,transportNegativeControls:12,calendarBoundaries:true,ownerAndReferralPrecedence:true,internalNullHostNotDirect:true,explicitSensitivityIndependentOfDisplayApproval:true,repetitionIsNotHumanIdentity:true,invalidTimeExplicit:true,concreteMatchesParameterized:true,scale:{tableRows:32768,selectedRows:4096,preflightReads:preResult.meta.rows_read,exportReads:read.meta.rows_read,totalReads:total,writes:0},queryPlan,sqlBytes:{preflight:Buffer.byteLength(prepare('preflight')),export:Buffer.byteLength(prepare('export','9223372036854775807'))},sourceHashes:Object.fromEntries(['audience-audit.mjs','check-audience-audit.mjs'].map(f=>[f,hash(readFileSync(new URL(f,import.meta.url)))])),policySha256:result.policySha256,productionCalls:0,humanLabels:0};writeFileSync(output,JSON.stringify(receipt,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify({cases:13,scale:receipt.scale}));
}finally{await source.mf.dispose()}

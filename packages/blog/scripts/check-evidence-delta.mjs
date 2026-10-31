import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {PLAN,EXPORT_FIELDS,TEXT_FIELDS,PREFLIGHT_SQL,EXPORT_SQL,prepare,validatePreflight,validateExport,nativeDatabase,loadRows,analyze} from './evidence-delta.mjs';
import {parsingCases,current} from '../../analytics/test/fixtures/fetch-metadata-summary.mjs';
import {summaryCases} from '../../analytics/test/fixtures/signature-summary.mjs';
import {verificationEvidence} from '../../analytics/.test-dist/signature-evidence.js';
const output=process.argv[2];assert.ok(output);
const fixture=(id,overrides={})=>{const row={...current(),id:String(id),owner_client:0,asn:64512,accepts_html:1,has_accept_language:1,representation:'html',...overrides};return Object.fromEntries(EXPORT_FIELDS.map(f=>[f,row[f]??null]))};
const absent=verificationEvidence(new Request('https://fixture.example/privacy'),{status:'absent'},false,[]);
const cases=parsingCases().map(([label,row])=>({label,...row}));
cases.push(...[
 {label:'owner-original',is_owner:1},{label:'owner-linked',owner_client:1},{label:'referral-abuse',referrer_host:'traffic2cash.xyz'},
 {label:'unknown-source',observation_source:'private-canary-source'},
 {label:'backdated',observed_at:'2026-10-29 15:00:00'}, {label:'future-time',observed_at:'2030-01-01 00:00:00'}, {label:'invalid-time',observed_at:'not-a-time'}, {label:'utf8-byte-count',reader_reason:'private-canary-π-学'},
 ...['fetch-metadata-invalid','fetch-metadata-policy-limit','fetch-metadata-unassessed'].map(reader_reason=>({label:reader_reason,reader_kind:'unresolved',reader_reason})),
 ...summaryCases.map(c=>({label:'signature-'+c.name,signature_status:c.status,signature_evidence:c.e===null?null:JSON.stringify(c.e)})),
]);
const synthetic=cases.map((item,i)=>{const{label,...facts}=item;return fixture(i+1,{signature_evidence:JSON.stringify(absent),...facts,path:'/private-canary-path'})});
const initial=await nativeDatabase();
try{
 const {db}=initial;assert.deepEqual((await db.prepare(PREFLIGHT_SQL).bind('0').first()),{rows:0,upperId:null,sourceBytes:0,maximumRowSourceBytes:0});
 validateExport([],validatePreflight(await db.prepare(PREFLIGHT_SQL).bind('0').first(),'0'),'0');
 await loadRows(db,synthetic);
 const pre=validatePreflight(await db.prepare(PREFLIGHT_SQL).bind('0').first(),'0'),exported=validateExport((await db.prepare(EXPORT_SQL).bind('0',pre.upperId).all()).results,pre,'0');
 assert.deepEqual(exported,synthetic);assert.deepEqual((await db.prepare(prepare('export','0',pre.upperId)).all()).results,exported);
 assert.deepEqual(await db.prepare(prepare('preflight','0')).first(),pre);
 const direct=await analyze(db,exported,'0',pre.upperId);
 for(const field of ['classification_evidence','vendor_ip_evidence','classifier_version']){
  const changed=structuredClone(exported);changed[0][field]='private-canary-mismatched-field';
  await assert.rejects(analyze(db,changed,'0',pre.upperId),error=>error.message==='Local assignment fields differ from supplied rowset');
 }
 const frozen=await nativeDatabase();try{
  await loadRows(frozen.db,exported);const replay=await analyze(frozen.db,exported,'0',pre.upperId);
  const{localMeters:one,...a}=direct,{localMeters:two,...b}=replay;assert.deepEqual(a,b);
 }finally{await frozen.mf.dispose()}
 const sum=(rows,predicate)=>rows.filter(predicate).reduce((n,r)=>n+r.views,0);
 assert.equal(direct.summary.inclusion['owner-excluded'],2);assert.equal(direct.summary.inclusion['referral-excluded'],1);
 for(const [reason,count]of [['fetch-metadata-invalid',2],['fetch-metadata-policy-limit',2],['fetch-metadata-unassessed',1]])assert.equal(sum(direct.context,r=>r.unresolved_reason===reason),count);
 assert.ok(direct.context.some(r=>r.activation_state==='not-retained'));
 assert.equal(direct.observationSources.raw.unrecognized,1);
 assert.ok(direct.metadata.raw.records.recognizedViews>0&&direct.metadata.raw.records.notRecordedViews>0&&direct.metadata.raw.records.unrecognizedViews>0&&direct.metadata.raw.records.inconsistentViews>0);
 assert.equal(JSON.stringify({...direct,assessments:undefined}).includes('private-canary'),false);
 const invalidExports=[rows=>rows.pop(),rows=>rows.reverse(),rows=>rows[1].id=rows[0].id,rows=>rows[0].id=Number(rows[0].id),rows=>rows[0].path+='changed',rows=>rows[0].owner_client=true,rows=>rows[0].extra='private-canary',rows=>rows[0].signature_evidence={},rows=>rows[0].asn=1.5];
 for(const mutate of invalidExports){const copy=structuredClone(exported);mutate(copy);assert.throws(()=>validateExport(copy,pre,'0'))}
 for(const mutate of [v=>v.rows=PLAN.maximumRows+1,v=>v.sourceBytes=PLAN.maximumSourceBytes+1,v=>v.maximumRowSourceBytes=PLAN.maximumRowSourceBytes+1,v=>v.rows=true,v=>v.upperId='1 OR 1=1']){const v=structuredClone(pre);mutate(v);assert.throws(()=>validatePreflight(v,'0'))}
 for(const args of [['export','2','1'],['preflight','9007199254740993 OR 1=1'],['export','0','9223372036854775808']])assert.throws(()=>prepare(...args));
 await db.prepare('DELETE FROM page_observations').run();await db.prepare('DELETE FROM owner_clients').run();
 await loadRows(db,[fixture('9007199254740992'),fixture('9007199254740993')]);
 const large=validatePreflight(await db.prepare(PREFLIGHT_SQL).bind('9007199254740992').first(),'9007199254740992');assert.equal(large.upperId,'9007199254740993');assert.equal(large.rows,1);
 validateExport((await db.prepare(EXPORT_SQL).bind('9007199254740992',large.upperId).all()).results,large,'9007199254740992');
 await db.prepare('DELETE FROM page_observations').run();await loadRows(db,[fixture('9223372036854775807')]);
 const largest=validatePreflight(await db.prepare(PREFLIGHT_SQL).bind('9223372036854775806').first(),'9223372036854775806');assert.equal(largest.upperId,'9223372036854775807');validateExport((await db.prepare(EXPORT_SQL).bind('9223372036854775806',largest.upperId).all()).results,largest,'9223372036854775806');
 await db.prepare('DELETE FROM page_observations').run();
 const scale=Array.from({length:PLAN.maximumRows},(_,i)=>fixture(i+1,{signature_evidence:JSON.stringify(absent),is_owner:Number(i%17===0),referrer_host:i%13===0?'traffic2cash.xyz':null,owner_client:Number(i%29===0)}));
 await loadRows(db,scale);const preResult=await db.prepare(PREFLIGHT_SQL).bind('0').all();validatePreflight(preResult.results[0],'0');const read=await db.prepare(EXPORT_SQL).bind('0',preResult.results[0].upperId).all();validateExport(read.results,preResult.results[0],'0');
 const assessed=await analyze(db,read.results,'0',preResult.results[0].upperId);assert.equal(assessed.census.totals.rows,PLAN.maximumRows);
 const nativeOldAssessmentReads=preResult.meta.rows_read+assessed.localMeters.slice(0,3).reduce((n,r)=>n+r.rowsRead,0),nativeCaptureReads=preResult.meta.rows_read+read.meta.rows_read;
 assert.ok(preResult.meta.rows_read<=PLAN.readReviewThresholdPerStatement&&read.meta.rows_read<=PLAN.readReviewThresholdPerStatement);assert.equal(preResult.meta.rows_written+read.meta.rows_written,0);
 const queryPlan=(await db.prepare('EXPLAIN QUERY PLAN '+EXPORT_SQL).bind('0',String(PLAN.maximumRows)).all()).results.map(r=>r.detail);assert.ok(queryPlan.some(v=>v.includes('SEARCH page_observations USING INTEGER PRIMARY KEY')));
 await loadRows(db,[fixture(PLAN.maximumRows+1)]);const sentinel=await db.prepare(PREFLIGHT_SQL).bind('0').first();assert.equal(sentinel.rows,PLAN.maximumRows+1);assert.throws(()=>validatePreflight(sentinel,'0'));
 const h=v=>createHash('sha256').update(v).digest('hex');const receipt={checkedAt:new Date().toISOString(),plan:PLAN,fixtureCases:synthetic.length,parsingCases:parsingCases().length,transportNegativeControls:invalidExports.length+5+3,exactLargeIdControl:true,maximumInt64Control:true,utf8ByteControl:true,concreteMatchesParameterized:true,allSelectedRowsReconciled:true,directAndFrozenAnalysisEqual:true,sourceAndOwnerReferralPrecedence:true,closedPublicValues:true,newReasonsRetained:true,nullScalarNotHeaderAbsence:true,encodingSummaryUsesPublicProjector:true,scale:{rows:PLAN.maximumRows,preflightReads:preResult.meta.rows_read,exportReads:read.meta.rows_read,productionStyleCaptureReads:nativeCaptureReads,localAssessmentReads:assessed.localMeters.reduce((n,r)=>n+r.rowsRead,0),nativeRepeatedAssessmentComparisonReads:nativeOldAssessmentReads,comparisonScope:'Same fixed synthetic relation and preflight; three remote-style aggregate calculations versus one exported rowset with offline calculations. Not a measured production saving.',queryWrites:0,sourceBytes:preResult.results[0].sourceBytes},queryPlan,sqlBytes:{preflight:Buffer.byteLength(prepare('preflight','9007199254740992')),export:Buffer.byteLength(prepare('export','9007199254740992','9007199254742016'))},sourceHashes:Object.fromEntries(['evidence-delta.mjs','check-evidence-delta.mjs','check-post-census-delta.mjs','check-retained-client-methods.mjs','check-retained-cohort-context.mjs','check-retained-delta-reasons.mjs'].map(f=>[f,h(readFileSync(new URL(f,import.meta.url)))])),productionCalls:0,humanLabels:0};
 writeFileSync(output,JSON.stringify(receipt,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify({fixtureCases:synthetic.length,scale:receipt.scale}));
}finally{await initial.mf.dispose()}

import assert from 'node:assert/strict';
import { readFileSync,writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { resolve,dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { build } from 'esbuild';
import { signatureLocalStateSql,signatureBasisSql } from '../../analytics/.test-dist/signature-basis.js';
import { signatureCoverageRecordedSql } from '../../analytics/.test-dist/signature-coverage-report.js';
import { nativeBooleanStateSql,vendorSignatureStateSql } from '../../analytics/.test-dist/signature-summary.js';
import { verifierProfileSql,isReportedVerifierProfile } from '../../analytics/.test-dist/verifier-profile.js';
import { signatureSelectionRecordedSql } from '../../analytics/.test-dist/signature-selection.js';
import { referralAssessmentCtes,referralRulesJson } from '../../analytics/.test-dist/referral-sql.js';
import { ACTIVE_REFERRAL_POLICY } from '../../analytics/.test-dist/referral-policy.generated.js';
import { queryStats } from '../../analytics/.test-dist/stats.js';
import { summaryCases } from '../../analytics/test/fixtures/signature-summary.mjs';

export const CUTOFF='2026-10-28 05:22:00';
export const BASELINE='8b35baa';
export const PLAN={maxRows:40000,maxDetailedRows:4096,maxReferralLabels:16384,combinedPostExecutionReadThreshold:400000,thresholdIsServerEnforced:false,preflightStatements:1,censusStatements:1};
const labels=`CASE WHEN signature_evidence IS NOT NULL AND referrer_host IS NOT NULL AND length(rtrim(referrer_host,'.'))<=253 THEN 1+length(rtrim(referrer_host,'.'))-length(replace(rtrim(referrer_host,'.'),'.','')) ELSE 0 END`;
export const PREFLIGHT_SQL=`SELECT COUNT(*) AS rows,CAST(MAX(id) AS TEXT) AS upperId,COALESCE(SUM(signature_evidence IS NOT NULL),0) AS detailedRows,COALESCE(SUM(${labels}),0) AS referralLabels FROM page_observations;`;
const scope=`CASE WHEN NOT COALESCE((length(observed_at)=19 AND datetime(observed_at,'+0 seconds')=observed_at),0) THEN 'unrecognized-time'
 WHEN observed_at<'2026-10-27 21:49:00' THEN 'before-census31' WHEN observed_at<'2026-10-28 04:40:00' THEN 'census31-to52'
 WHEN observed_at<'${CUTOFF}' THEN 'census52-to-cutoff' ELSE 'at-or-after-cutoff' END`;
export const CLAIMS=[
 ['localVerifiedViews',`json_extract(signature_evidence,'$.source')='local-webbotauth' AND json_extract(signature_evidence,'$.localStatus')='verified'`,`local_state='verified'`],
 ['coverageRecordedViews',`json_type(signature_evidence,'$.coverage')='object'`,`local_state='verified' AND coverage_valid=1`],
 ['userAgentBoundViews',`json_extract(signature_evidence,'$.coverage.covered.userAgent')=1`,`local_state='verified' AND coverage_valid=1 AND json_type(signature_evidence,'$.coverage.covered.userAgent')='true'`],
 ['nativeVerifiedBotViews',`json_extract(signature_evidence,'$.native.verifiedBot')=1`,`native_state='available' AND json_type(signature_evidence,'$.native.verifiedBot')='true'`],
 ['nativeSignedAgentViews',`json_extract(signature_evidence,'$.native.signedAgent')=1`,`native_state='available' AND json_type(signature_evidence,'$.native.signedAgent')='true'`],
 ['vendorMatchingOriginViews',`json_extract(signature_evidence,'$.source')='local-webbotauth' AND json_extract(signature_evidence,'$.vendor.status')='matching-origin'`,`vendor_state='matching-origin'`],
 ['selectionRecordedViews',signatureSelectionRecordedSql(),`local_state='verified' AND coverage_valid=1 AND (${signatureSelectionRecordedSql()})`],
 ['methodBoundViews',`json_extract(signature_evidence,'$.coverage.covered.method')=1`,`local_state='verified' AND coverage_valid=1 AND json_type(signature_evidence,'$.coverage.covered.method')='true'`],
 ['resourceBoundViews',`json_extract(signature_evidence,'$.coverage.covered.path')=1 OR json_extract(signature_evidence,'$.coverage.covered.targetUri')=1`,`local_state='verified' AND coverage_valid=1 AND (json_type(signature_evidence,'$.coverage.covered.path')='true' OR json_type(signature_evidence,'$.coverage.covered.targetUri')='true')`],
 ['authorityOnlyViews',`json_extract(signature_evidence,'$.coverage.covered.authority')=1 AND COALESCE(json_extract(signature_evidence,'$.coverage.covered.targetUri'),0)=0 AND COALESCE(json_extract(signature_evidence,'$.coverage.covered.path'),0)=0 AND COALESCE(json_extract(signature_evidence,'$.coverage.covered.method'),0)=0 AND COALESCE(json_extract(signature_evidence,'$.coverage.covered.query'),0)=0`,`local_state='verified' AND coverage_valid=1 AND json_type(signature_evidence,'$.coverage.covered.authority')='true' AND json_type(signature_evidence,'$.coverage.covered.targetUri')='false' AND json_type(signature_evidence,'$.coverage.covered.path')='false' AND json_type(signature_evidence,'$.coverage.covered.method')='false' AND json_type(signature_evidence,'$.coverage.covered.query')='false'`],
 ['nativeAvailableViews',`json_type(signature_evidence,'$.native.verifiedBot') IN ('true','false') OR json_type(signature_evidence,'$.native.signedAgent') IN ('true','false')`,`native_state='available'`],
 ['vendorDocumentedViews',`json_extract(signature_evidence,'$.source')='local-webbotauth' AND json_extract(signature_evidence,'$.vendor.documentedDeclarationCount')>0`,`vendor_state NOT IN ('not-recorded','unrecognized','test-injected') AND json_extract(signature_evidence,'$.vendor.documentedDeclarationCount')>0`],
];
const mask=column=>CLAIMS.map((c,i)=>`CASE WHEN (${c[column]}) THEN ${2**i} ELSE 0 END`).join('+');
export const CENSUS_SQL=`WITH RECURSIVE
 bounded AS NOT MATERIALIZED (SELECT * FROM page_observations WHERE id<=CAST(? AS INTEGER)),
 inventory AS MATERIALIZED (SELECT ${scope} AS time_scope,
  CASE WHEN signature_evidence IS NOT NULL THEN 'detailed-record' WHEN signature_status='verified' THEN 'verified-outcome-only' WHEN signature_status='unverified' THEN 'unverified-outcome-only' ELSE 'no-detail-or-status' END AS evidence_state,COUNT(*) AS views FROM bounded GROUP BY time_scope,evidence_state),
 detailed AS MATERIALIZED (SELECT signature_evidence,signature_status,collection_version,referrer_host,is_owner,observed_at,
  EXISTS(SELECT 1 FROM owner_clients WHERE owner_clients.daily_client_id=bounded.daily_client_id) AS client_owner FROM bounded WHERE signature_evidence IS NOT NULL),
 ${referralAssessmentCtes(`SELECT DISTINCT referrer_host AS original,lower(rtrim(referrer_host,'.')) AS normalized FROM detailed WHERE referrer_host IS NOT NULL AND length(rtrim(referrer_host,'.'))<=253`)},
 facts AS MATERIALIZED (SELECT signature_evidence,signature_status,${scope} AS time_scope,
  CASE WHEN is_owner=1 OR client_owner=1 THEN 'owner-excluded' WHEN COALESCE(referrer_host IN (SELECT original FROM abusive_hosts),0)=1 THEN 'referral-excluded' ELSE 'included' END AS inclusion,
  ${signatureLocalStateSql()} AS local_state,${signatureCoverageRecordedSql()} AS coverage_valid,${nativeBooleanStateSql()} AS native_state,
  ${verifierProfileSql()} AS profile,CASE WHEN collection_version IS NULL THEN 'not-recorded' WHEN collection_version='2026-10-28.9' THEN 'current' ELSE 'other-recorded' END AS collection_state FROM detailed),
 checked AS MATERIALIZED (SELECT *,${vendorSignatureStateSql()} AS vendor_state FROM facts),
 projected AS MATERIALIZED (SELECT time_scope,inclusion,local_state,
  CASE WHEN local_state<>'verified' THEN 'not-applicable' WHEN coverage_valid=1 THEN 'recognized' WHEN COALESCE(json_type(signature_evidence,'$.coverage'),'null')='null' THEN 'not-recorded' ELSE 'unrecognized' END AS coverage_state,
  native_state,vendor_state,profile,collection_state,${mask(1)} AS old_claims,${mask(2)} AS new_claims FROM checked),
 groups AS (SELECT time_scope,inclusion,local_state,coverage_state,native_state,vendor_state,profile,collection_state,old_claims,new_claims,COUNT(*) AS views FROM projected GROUP BY time_scope,inclusion,local_state,coverage_state,native_state,vendor_state,profile,collection_state,old_claims,new_claims ORDER BY time_scope,inclusion,local_state,coverage_state,native_state,vendor_state,profile,collection_state,old_claims,new_claims LIMIT 1001)
 SELECT 'inventory' AS section,json_group_array(json_object('time_scope',time_scope,'evidence_state',evidence_state,'views',views)) AS payload FROM inventory
 UNION ALL SELECT 'detailed' AS section,json_group_array(json_object('time_scope',time_scope,'inclusion',inclusion,'local_state',local_state,'coverage_state',coverage_state,'native_state',native_state,'vendor_state',vendor_state,'profile',profile,'collection_state',collection_state,'old_claims',old_claims,'new_claims',new_claims,'views',views)) AS payload FROM groups`;
const scopes=['before-census31','census31-to52','census52-to-cutoff','at-or-after-cutoff','unrecognized-time'];
const safe=n=>Number.isSafeInteger(n)&&n>=0;
const exactKeys=(row,keys)=>assert.deepEqual(Object.keys(row).sort(),keys.slice().sort());
export function validatePreflight(row){
 exactKeys(row,['rows','upperId','detailedRows','referralLabels']);
 assert.ok(row&&safe(row.rows)&&safe(row.detailedRows)&&safe(row.referralLabels)&&row.detailedRows<=row.rows);
 if(row.rows===0)assert.equal(row.upperId,null);else assert.ok(typeof row.upperId==='string'&&/^[1-9][0-9]{0,18}$/.test(row.upperId)&&BigInt(row.upperId)<=9223372036854775807n);
 assert.ok(row.rows<=PLAN.maxRows&&row.detailedRows<=PLAN.maxDetailedRows&&row.referralLabels<=PLAN.maxReferralLabels,'Preflight exceeds reviewed population bounds');return row;
}
export function validateCensus(rows){
 assert.ok(Array.isArray(rows)&&rows.length===2);const map=new Map(rows.map(r=>{exactKeys(r,['section','payload']);return [r.section,JSON.parse(r.payload)];}));assert.equal(map.size,2);
 const inventory=map.get('inventory'),detailed=map.get('detailed');assert.ok(Array.isArray(inventory)&&Array.isArray(detailed)&&detailed.length<1001);
 const seen=new Set();
 for(const r of inventory){exactKeys(r,['time_scope','evidence_state','views']);assert.ok(scopes.includes(r.time_scope)&&['detailed-record','verified-outcome-only','unverified-outcome-only','no-detail-or-status'].includes(r.evidence_state)&&safe(r.views)&&r.views>0);const k=JSON.stringify([r.time_scope,r.evidence_state]);assert.ok(!seen.has(k));seen.add(k);}
 seen.clear();
 for(const r of detailed){exactKeys(r,['time_scope','inclusion','local_state','coverage_state','native_state','vendor_state','profile','collection_state','old_claims','new_claims','views']);assert.ok(scopes.includes(r.time_scope)&&['included','owner-excluded','referral-excluded'].includes(r.inclusion));assert.ok(['verified','unverified','absent','test-injected','unrecognized'].includes(r.local_state)&&['recognized','not-recorded','unrecognized','not-applicable'].includes(r.coverage_state));assert.ok(['available','unavailable','not-recorded','unrecognized'].includes(r.native_state)&&['not-recorded','unrecognized','no-declaration','not-configured','not-verified','matching-origin','different-origin','conflicting-origins','test-injected'].includes(r.vendor_state));assert.ok(isReportedVerifierProfile(r.profile)&&['current','other-recorded','not-recorded'].includes(r.collection_state));assert.ok(safe(r.old_claims)&&r.old_claims<2**CLAIMS.length&&safe(r.new_claims)&&r.new_claims<2**CLAIMS.length&&safe(r.views)&&r.views>0);const bit=name=>Boolean(r.new_claims&(2**CLAIMS.findIndex(([key])=>key===name)));assert.equal(bit('localVerifiedViews'),r.local_state==='verified');assert.equal(bit('coverageRecordedViews'),r.local_state==='verified'&&r.coverage_state==='recognized');assert.equal(bit('nativeAvailableViews'),r.native_state==='available');assert.equal(bit('vendorMatchingOriginViews'),r.vendor_state==='matching-origin');assert.equal(bit('vendorDocumentedViews'),['matching-origin','different-origin','not-verified','conflicting-origins'].includes(r.vendor_state));for(const key of ['userAgentBoundViews','methodBoundViews','resourceBoundViews','authorityOnlyViews','selectionRecordedViews'])assert.ok(!bit(key)||bit('coverageRecordedViews'));for(const key of ['nativeVerifiedBotViews','nativeSignedAgentViews'])assert.ok(!bit(key)||bit('nativeAvailableViews'));const {views,...dimensions}=r,k=JSON.stringify(dimensions);assert.ok(!seen.has(k));seen.add(k);}
 for(const scope of scopes)assert.equal(detailed.filter(r=>r.time_scope===scope).reduce((n,r)=>n+r.views,0),inventory.filter(r=>r.time_scope===scope&&r.evidence_state==='detailed-record').reduce((n,r)=>n+r.views,0));
 return {inventory,detailed};
}
export function claimTotals(rows,which){return Object.fromEntries(CLAIMS.map(([name],i)=>[name,rows.reduce((n,r)=>n+((r[which]&(2**i))?r.views:0),0)]));}
export function prepareCommand(upperId){assert.ok(typeof upperId==='string'&&/^[1-9][0-9]{0,18}$/.test(upperId)&&BigInt(upperId)<=9223372036854775807n);const values=[upperId,referralRulesJson(ACTIVE_REFERRAL_POLICY)];let i=0;const sql=CENSUS_SQL.replace(/\?/g,()=>"'"+values[i++].replaceAll("'","''")+"'");assert.equal(i,values.length);return sql+';\n';}

async function main(){
 const [output,prefix]=process.argv.slice(2);assert.ok(output&&prefix);
 const req=createRequire(resolve('package.json'));const {Miniflare}=await import(pathToFileURL(req.resolve('miniflare',{paths:[dirname(req.resolve('wrangler/package.json'))]})));
 const mf=new Miniflare({modules:true,script:'export default{fetch(){return new Response("census controls")}}',compatibilityDate:'2026-03-06',d1Databases:{DB:'signature-applicability'}});
 try{
  const db=await mf.getD1Database('DB');const schema=readFileSync('packages/analytics/schema.sql','utf8').replace(/^\s*--.*$/gm,'');await db.batch(schema.split(';').map(s=>s.trim()).filter(Boolean).map(s=>db.prepare(s)));
  const empty=await db.prepare(PREFLIGHT_SQL).first();validatePreflight(empty);assert.equal(empty.rows,0);assert.deepEqual(validateCensus((await db.prepare(CENSUS_SQL).bind('1',referralRulesJson(ACTIVE_REFERRAL_POLICY)).all()).results),{inventory:[],detailed:[]});
  const insert=(id,c,options={})=>db.prepare(`INSERT INTO page_observations(id,path,daily_client_id,traffic_class,device_type,reader_kind,reader_reason,observed_at,signature_status,signature_evidence,is_owner,referrer_host,collection_version) VALUES(CAST(? AS INTEGER),'/privacy',?,'ai','desktop','ai-search','fixture',?,?,?,?,?,'2026-10-28.9')`).bind(String(id),String(id).padStart(32,'0'),options.at??'2026-10-28 04:00:00',c.status,c.e===null?null:JSON.stringify(c.e),options.owner??0,options.referrer??null);
  const execute=async upper=>{const result=await db.prepare(CENSUS_SQL).bind(upper,referralRulesJson(ACTIVE_REFERRAL_POLICY)).all();return {...validateCensus(result.results),meta:result.meta};};
  await db.batch(summaryCases.map((c,i)=>insert(i+1,c)));
  const bundle=await build({stdin:{contents:execFileSync('git',['show',`${BASELINE}:packages/analytics/src/stats.ts`],{encoding:'utf8'}),loader:'ts',resolveDir:resolve('packages/analytics/src')},bundle:true,write:false,format:'esm',platform:'node',logLevel:'silent',plugins:[{name:'pinned-baseline',setup(b){b.onLoad({filter:/[/\\]analytics[/\\]src[/\\].*\.ts$/},a=>({contents:execFileSync('git',['show',`${BASELINE}:`+a.path.slice(resolve('.').length+1)],{encoding:'utf8'}),loader:'ts',resolveDir:dirname(a.path)}));}}]});
  const oldStats=(await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].contents).toString('base64'))).queryStats;
  const small=await execute(String(summaryCases.length)),q={range:'7d',traffic:'all'},now=new Date('2026-10-28T05:22:00Z');
  const before=await oldStats(db,q,now),after=await queryStats(db,q,now);
  for(const [key]of CLAIMS){assert.equal(claimTotals(small.detailed,'old_claims')[key],before.verification[key],key);assert.equal(claimTotals(small.detailed,'new_claims')[key],after.verification[key],key);}
  await db.batch([insert(100,summaryCases[0],{owner:1,referrer:'traffic2cash.xyz'}),insert(101,summaryCases[0],{referrer:'traffic2cash.xyz'}),insert(102,summaryCases[0],{at:CUTOFF}),insert(103,summaryCases[0],{at:'2026-02-30 00:00:00'}),insert(104,summaryCases[0],{at:'2026-10-27 21:48:59'}),insert(105,summaryCases[0],{at:'2026-10-28 04:40:00'})]);
  await db.prepare("INSERT INTO owner_clients(daily_client_id,utc_date) VALUES(?,'2026-10-28')").bind(String(100).padStart(32,'0')).run();
  const edges=await execute('105');assert.ok(edges.detailed.some(r=>r.inclusion==='owner-excluded'));assert.ok(edges.detailed.some(r=>r.time_scope==='unrecognized-time'));assert.ok(edges.detailed.some(r=>r.time_scope==='at-or-after-cutoff'));
  for(const bad of [{...empty,rows:40001},{...empty,rows:1,upperId:'1',detailedRows:1,referralLabels:16385},{...empty,private:'canary'}])assert.throws(()=>validatePreflight(bad));
  const validRows=(await db.prepare(CENSUS_SQL).bind('105',referralRulesJson(ACTIVE_REFERRAL_POLICY)).all()).results;
  for(const change of [v=>{v.inventory[0].views++;},v=>{v.detailed[0].profile='private-canary';},v=>{v.detailed[0].new_claims=4096;},v=>{v.detailed[0].new_claims^=1;},v=>{v.detailed[0].private='canary';},v=>{v.detailed.push(v.detailed[0]);}]){const v=validateCensus(validRows);change(v);assert.throws(()=>validateCensus([{section:'inventory',payload:JSON.stringify(v.inventory)},{section:'detailed',payload:JSON.stringify(v.detailed)}]));}
  for(const bad of ['0','9007199254740993 OR 1=1','9223372036854775808'])assert.throws(()=>prepareCommand(bad));
  await db.prepare('DELETE FROM page_observations').run();await db.batch([insert('9007199254740992',summaryCases[0]),insert('9007199254740993',summaryCases[0])]);
  const unsafe=await db.prepare(PREFLIGHT_SQL).first();validatePreflight(unsafe);assert.equal(unsafe.upperId,'9007199254740993');assert.equal((await execute('9007199254740992')).detailed.reduce((n,r)=>n+r.views,0),1);assert.equal((await execute(unsafe.upperId)).detailed.reduce((n,r)=>n+r.views,0),2);
  const concrete=await db.prepare(prepareCommand(unsafe.upperId)).all();assert.deepEqual(validateCensus(concrete.results).detailed,(await execute(unsafe.upperId)).detailed);
  await db.prepare('DELETE FROM page_observations').run();await db.prepare('DELETE FROM owner_clients').run();
  for(let i=0;i<40000;i+=64)await db.batch(Array.from({length:Math.min(64,40000-i)},(_,j)=>insert(i+j+1,i+j<4096?summaryCases[0]:{e:null,status:null},{referrer:i+j<4096?`n${i+j}.fixture.example`:null})));
  const pre=await db.prepare(PREFLIGHT_SQL).all();validatePreflight(pre.results[0]);const scaled=await execute(pre.results[0].upperId);
  const scale={rows:pre.results[0].rows,detailedRows:pre.results[0].detailedRows,referralLabels:pre.results[0].referralLabels,preflightReads:pre.meta.rows_read,censusReads:scaled.meta.rows_read,combinedReads:pre.meta.rows_read+scaled.meta.rows_read,rowsWritten:pre.meta.rows_written+scaled.meta.rows_written};assert.ok(scale.combinedReads<PLAN.combinedPostExecutionReadThreshold);
  // The label-work bound also covers deep, short-label hosts, not only ordinary domains.
  await db.prepare("UPDATE page_observations SET referrer_host=NULL WHERE id<=4096").run();
  await db.batch(Array.from({length:128},(_,i)=>db.prepare('UPDATE page_observations SET referrer_host=? WHERE id=?').bind(Array(125).fill('a').concat('x'+i.toString(36)).join('.'),i+1)));
  const deepPre=await db.prepare(PREFLIGHT_SQL).all();validatePreflight(deepPre.results[0]);const deep=await execute(deepPre.results[0].upperId);const deepScale={referralLabels:deepPre.results[0].referralLabels,preflightReads:deepPre.meta.rows_read,censusReads:deep.meta.rows_read,combinedReads:deepPre.meta.rows_read+deep.meta.rows_read};assert.ok(deepScale.combinedReads<PLAN.combinedPostExecutionReadThreshold);
  const result={checkedAt:new Date().toISOString(),cutoff:CUTOFF,baselineCommit:BASELINE,plan:PLAN,nativeControls:summaryCases.length,emptyAndMalformedAggregateControls:true,oldAndNewClaimBitsMatchFullNativeReports:true,ownerReferralAndDateEdges:true,unsafeIntegerUpperBoundPreserved:true,privateSqlInjectionInputsRejected:true,scale,deepScale,claims:CLAIMS.map(([name],i)=>({name,bit:2**i})),sqlTemplateSha256:createHash('sha256').update(CENSUS_SQL).digest('hex'),preflightSha256:createHash('sha256').update(PREFLIGHT_SQL+'\n').digest('hex'),productionCalls:0};
  writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});writeFileSync(prefix+'-preflight.sql',PREFLIGHT_SQL+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify({scale,deepScale,productionCalls:0}));
 }finally{await mf.dispose();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();

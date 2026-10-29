import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {dirname,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {PREFLIGHT_SQL as OLD_PREFLIGHT,DELTA_SQL,BASELINE_EVENT_CUTOFF,validatePreflight as oldPreflight,validateDelta} from './check-retained-delta.mjs';
import {METHOD_SQL as OLD_METHODS,CONTEXT_SQL as OLD_CONTEXT,PLAN as COHORT_PLAN,validate as validateCohort} from './check-retained-cohort-context.mjs';
import {directoryPublicationBasisSql} from '../../analytics/.test-dist/directory-publication.js';
import {DIRECTORY_PUBLICATION_STATUSES} from '../../analytics/.test-dist/directory-publication-contract.js';
import {COLLECTION_VERSION,CLASSIFIER_VERSION} from '../../analytics/.test-dist/versions.js';
import {analyzeTraffic} from '../../analytics/.test-dist/classify.js';
import {classificationEvidence,retainedDeclaredCategories} from '../../analytics/.test-dist/classification-evidence.js';
import {verificationEvidence} from '../../analytics/.test-dist/signature-evidence.js';
import {referralRulesJson} from '../../analytics/.test-dist/referral-sql.js';
import {ACTIVE_REFERRAL_POLICY} from '../../analytics/.test-dist/referral-policy.generated.js';
import {summaryCases} from '../../analytics/test/fixtures/signature-summary.mjs';

export const PLAN={maximumRows:2048,maximumDetailedRows:2048,maximumReferralLabels:8192,maximumGroups:2048,
 maximumStatements:4,attemptsPerStatement:1,postExecutionReadReviewThreshold:500000,databaseEnforcedReadCap:false};
export const EVENT_CUTOFF='2026-10-29 05:57:57';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const core=['inclusion','time_scope','stored_kind','collection_state','classifier_state','evidence_state','local_state','basis','profile','native_state','vendor_state','network_state','binding_mask','native_mask','network_mask'];
const extra=['collection_stamp','classifier_stamp','directory_state'];
const fields=[...core,...extra];
// D1 documents at most 32 arguments per SQL function; local workerd accepts more.
assert.ok((core.length+1)*2<=32&&extra.length*2<=32);
const collectionStamps=['2026-10-29.1','2026-10-29.2','2026-10-29.3','2026-10-29.4','2026-10-29.5'];
const classifierStamps=['2026-10-29.1','2026-10-29.2'];
const list=values=>values.map(v=>"'"+v+"'").join(',');
function once(value,before,after){assert.equal(value.split(before).length,2,'Upstream query shape changed');return value.replace(before,after)}
function bound(sql){return once(sql,'id<=CAST(? AS INTEGER))',`id<=CAST(? AS INTEGER) ORDER BY id LIMIT ${PLAN.maximumRows+1})`)}
function groups(sql){return once(sql,`LIMIT ${COHORT_PLAN.maximumGroups+1}`,`LIMIT ${PLAN.maximumGroups+1}`)}
export const PREFLIGHT_SQL=once(OLD_PREFLIGHT,'LIMIT 8193',`LIMIT ${PLAN.maximumRows+1}`);
let delta=bound(once(DELTA_SQL,BASELINE_EVENT_CUTOFF,EVENT_CUTOFF));
delta=once(delta,'facts AS MATERIALIZED (SELECT signature_evidence,vendor_ip_evidence,','facts AS MATERIALIZED (SELECT collection_version,classifier_version,signature_status,signature_evidence,vendor_ip_evidence,');
delta=once(delta,'projected AS MATERIALIZED (SELECT inclusion,',`projected AS MATERIALIZED (SELECT
 CASE WHEN collection_version IN (${list(collectionStamps)}) THEN collection_version WHEN collection_version IS NULL THEN 'not-recorded' ELSE 'other-recorded' END AS collection_stamp,
 CASE WHEN classifier_version IN (${list(classifierStamps)}) THEN classifier_version WHEN classifier_version IS NULL THEN 'not-recorded' ELSE 'other-recorded' END AS classifier_stamp,
 ${directoryPublicationBasisSql()} AS directory_state,inclusion,`);
const start=delta.indexOf(' groups AS (');assert.ok(start>1000);
export const CENSUS_SQL=delta.slice(0,start)+` groups AS (SELECT ${fields.join(',')},COUNT(*) AS views FROM projected GROUP BY ${fields.join(',')} ORDER BY ${fields.join(',')} LIMIT ${PLAN.maximumGroups+1})
 SELECT 'totals' AS section,json_object('rows',COUNT(*),'detailedRows',COALESCE(SUM(signature_evidence IS NOT NULL),0),
 'firstObservedAt',MIN(CASE WHEN length(observed_at)=19 AND datetime(observed_at,'+0 seconds')=observed_at THEN observed_at END),
 'lastObservedAt',MAX(CASE WHEN length(observed_at)=19 AND datetime(observed_at,'+0 seconds')=observed_at THEN observed_at END)) AS payload FROM bounded
 UNION ALL SELECT 'groups',json_group_array(json_patch(json_object(${core.map(f=>`'${f}',${f}`).join(',')},'views',views),json_object(${extra.map(f=>`'${f}',${f}`).join(',')}))) FROM groups`;
export const METHODS_SQL=groups(bound(OLD_METHODS));
export const CONTEXT_SQL=groups(bound(OLD_CONTEXT));
export function validatePreflight(row,lower){oldPreflight(row,lower);assert.ok(row.rows<=PLAN.maximumRows&&row.detailedRows<=PLAN.maximumDetailedRows&&row.referralLabels<=PLAN.maximumReferralLabels);return row}
const adapterLimits={maximumGroups:PLAN.maximumGroups,maximumIdSpan:PLAN.maximumRows}; // Aggregate row cap; this slice permits sparse ID ranges.
export function validate(kind,rows){
 if(kind==='methods'||kind==='context')return validateCohort(kind,rows,adapterLimits);
 assert.equal(kind,'census');assert.ok(Array.isArray(rows)&&rows.length===2);
 const value=new Map(rows.map(r=>[r.section,JSON.parse(r.payload)]));assert.equal(value.size,2);
 const totals=value.get('totals'),raw=value.get('groups');assert.ok(Array.isArray(raw)&&raw.length<=PLAN.maximumGroups);
 const reduced=new Map(),seen=new Set();
 for(const row of raw){
  assert.deepEqual(Object.keys(row).sort(),[...fields,'views'].sort());
  assert.ok([...collectionStamps,'not-recorded','other-recorded'].includes(row.collection_stamp));
  assert.ok([...classifierStamps,'not-recorded','other-recorded'].includes(row.classifier_stamp));
  assert.ok([...DIRECTORY_PUBLICATION_STATUSES,'not-recorded','unrecognized-record'].includes(row.directory_state));
  const key=JSON.stringify(fields.map(f=>row[f]));assert.ok(!seen.has(key));seen.add(key);
  const coreKey=JSON.stringify(core.map(f=>row[f])),prior=reduced.get(coreKey);
  if(prior)prior.views+=row.views;else reduced.set(coreKey,{...Object.fromEntries(core.map(f=>[f,row[f]])),views:row.views});
 }
 validateDelta([{section:'totals',payload:JSON.stringify(totals)},{section:'groups',payload:JSON.stringify([...reduced.values()])}],PLAN);
 assert.ok(totals.detailedRows<=PLAN.maximumDetailedRows);return{totals,groups:raw};
}
function id(value){assert.ok(typeof value==='string'&&/^(0|[1-9][0-9]{0,18})$/.test(value)&&BigInt(value)<=9223372036854775807n);return value}
function trimSqlIndent(sql){
 const outside=sql.replace(/'(?:''|[^'])*'/gs,'');
 assert.ok(!/["`]/.test(outside)&&!outside.includes('--')&&!outside.includes('/*'),'Review formatting for changed SQL quoting/comment grammar');
 return sql.replace(/'(?:''|[^'])*'|\n[ \t]+/gs,token=>token.startsWith("'")?token:'\n');
}
export function prepare(kind,lower,upper=lower){
 id(lower);id(upper);assert.ok(BigInt(upper)>=BigInt(lower));
 const sql={preflight:PREFLIGHT_SQL,census:CENSUS_SQL,methods:METHODS_SQL,context:CONTEXT_SQL}[kind];assert.ok(sql);
 const values=kind==='preflight'?[lower]:[lower,upper,referralRulesJson(ACTIVE_REFERRAL_POLICY)];let i=0;
 const concrete=trimSqlIndent(sql).replace(/\?/g,()=>"'"+values[i++].replaceAll("'","''")+"'")+';\n';assert.equal(i,values.length);assert.ok(Buffer.byteLength(concrete)<100000);return concrete;
}
export function summarize(value){
 const result={rows:value.totals.rows,inclusion:{},included:{},all:{}};
 for(const row of value.groups){
  result.inclusion[row.inclusion]=(result.inclusion[row.inclusion]??0)+row.views;
  for(const field of fields.filter(f=>f!=='inclusion')){
   const all=result.all[field]??={};all[row[field]]=(all[row[field]]??0)+row.views;
   if(row.inclusion==='included'){const included=result.included[field]??={};included[row[field]]=(included[row[field]]??0)+row.views}
  }
 }return result;
}
async function main(){
 const[output]=process.argv.slice(2);assert.ok(output);const req=createRequire(resolve('package.json'));
 const{Miniflare}=await import(pathToFileURL(req.resolve('miniflare',{paths:[dirname(req.resolve('wrangler/package.json'))]})));
 const mf=new Miniflare({modules:true,script:'export default{fetch(){return new Response("delta fixture")}}',compatibilityDate:'2026-03-06',cf:{},d1Databases:{DB:'post-census-delta'}});
 try{
  const db=await mf.getD1Database('DB'),schema=readFileSync('packages/analytics/schema.sql','utf8').replace(/^\s*--.*$/gm,'');
  await db.batch(schema.split(';').map(s=>s.trim()).filter(Boolean).map(s=>db.prepare(s)));
  const cases=[
   {ua:'ShapBot/0.1.0'}, {ua:'Shap-User/0.1.0',encoding:'old'},
   {ua:'ShapBot/0.1.0 Shap-User/0.1.0',kind:'unresolved',reason:'multiple-client-declarations'},
   {ua:'ShapBot/0.1.0',encoding:'future'}, {ua:'ShapBot/0.1.0',inner:'unreviewed'},
   {ua:'ExaSearchBot/1.0',profile:'2026-10-29.1',encoding:'old',collection:'2026-10-29.3'},
   {ua:'Mozilla/5.0 Chrome/152.0.0.0',kind:'browser'},
   {ua:'Mozilla/5.0 Chrome/152.0.0.0',kind:'unresolved',reason:'request-context-conflict',referrer:'private-referrer.example',site:'same-origin',state:'external'},
   {ua:'ExaSearchBot/1.0',failure:'signature-invalid'},
   {ua:'ShapBot/0.1.0',owner:1,referrer:'traffic2cash.xyz'}, {ua:'Shap-User/0.1.0',referrer:'traffic2cash.xyz'},
   {ua:'ShapBot/0.1.0',at:'2026-10-28 01:00:00'}, {ua:'ShapBot/0.1.0',at:'2030-01-01 00:00:00'},
   {ua:'ShapBot/0.1.0',at:'not-a-time'}, {ua:'ShapBot/0.1.0',noClass:true},
   {ua:'ExaSearchBot/1.0',signature:summaryCases.find(c=>c.name==='current-valid')},
  ];
  const insert=(n,item={ua:'ShapBot/0.1.0'})=>{
   const a=analyzeTraffic(item.ua),profile=item.profile??CLASSIFIER_VERSION;
   const facts={...a,userAgent:item.ua,observationSource:'edge',asn:64512,secFetchMode:'navigate',secFetchDest:'document',secFetchSite:item.site??'none',secFetchUser:null,acceptsHtml:1,hasAcceptLanguage:1,signature:{status:'absent'}};
   const c=classificationEvidence(facts,a.declarations);c.classifierProfile=item.inner??profile;
   if(item.encoding==='old'){const categories=retainedDeclaredCategories(c);assert.ok(categories);c.version='2026-10-27.2';c.declaredCategories=categories;delete c.declaredCategoryBits}if(item.encoding==='future')c.version='future';
   const sig=item.signature??{status:item.failure?'unverified':null,e:verificationEvidence(new Request('https://fixture.example/'),item.failure?{status:'unverified',reason:item.failure}:{status:'absent'},false,a.declarations.candidates)};
   return db.prepare("INSERT INTO page_observations(id,path,daily_client_id,traffic_class,device_type,agent_name,reader_kind,reader_reason,is_owner,referrer_host,referrer_state,sec_fetch_site,sec_fetch_mode,sec_fetch_dest,accepts_html,has_accept_language,collection_version,classifier_version,classification_evidence,signature_status,signature_evidence,observed_at,observation_source) VALUES(CAST(? AS INTEGER),'/privacy',?,'ai','desktop',?,?,?,?,?,?,?,'navigate','document',1,1,?,?,?,?,?,?,'edge')")
    .bind(String(n),BigInt(n)<0n?'00000000000000000000000000000000':BigInt(n).toString(16).padStart(32,'0'),a.agentName,item.kind??'ai-search',item.reason??'fixture',item.owner??0,item.referrer??null,item.state??(item.referrer?'external':'absent'),item.site??'none',item.collection??COLLECTION_VERSION,item.noClass?null:profile,item.noClass?null:JSON.stringify(c),sig.status,JSON.stringify(sig.e),item.at??'2026-10-29 16:00:00');
  };
  const run=async(kind,lower='0',upper='10000')=>{const sql=kind==='census'?CENSUS_SQL:kind==='methods'?METHODS_SQL:CONTEXT_SQL;const result=await db.prepare(sql).bind(lower,upper,referralRulesJson(ACTIVE_REFERRAL_POLICY)).all();return{data:validate(kind,result.results),meta:result.meta}};
  assert.equal((await run('census')).data.totals.rows,0);assert.deepEqual((await run('methods')).data,[]);assert.deepEqual((await run('context')).data,[]);
  await db.batch([insert('-1'),insert('0'),...cases.map((c,i)=>insert(i+1,c))]);
  const small=await run('census'),methods=await run('methods'),context=await run('context');assert.equal(small.data.totals.rows,16);
  const sum=(rows,test)=>rows.filter(test).reduce((n,r)=>n+r.views,0);
  assert.equal(small.data.totals.firstObservedAt,'2026-10-28 01:00:00');assert.equal(small.data.totals.lastObservedAt,'2030-01-01 00:00:00');
  assert.equal(sum(small.data.groups,r=>r.time_scope==='before-baseline-event-cutoff'),1);assert.equal(sum(small.data.groups,r=>r.time_scope==='unrecognized-time'),1);
  assert.equal(sum(small.data.groups,r=>r.inclusion==='owner-excluded'),1);assert.equal(sum(small.data.groups,r=>r.inclusion==='referral-excluded'),1);
  assert.equal(trimSqlIndent("SELECT\n   'a\n   b'' c',1"),"SELECT\n'a\n   b'' c',1");assert.throws(()=>trimSqlIndent('SELECT /* review */ 1'));
  assert.equal(sum(methods.data,r=>r.declaration==='ShapBot'&&r.classifier_state==='current'),5);
  assert.equal(sum(methods.data,r=>r.declaration==='Shap-User'&&r.classifier_state==='current'),2);
  assert.equal(sum(methods.data,r=>r.classifier_state==='unrecognized'),1);assert.equal(sum(methods.data,r=>r.classifier_state==='conflicting'),1);
  assert.equal(sum(methods.data,r=>r.classifier_state==='other-recorded'&&r.declaration==='ExaSearchBot'),1);
  assert.equal(sum(context.data,r=>r.context_support==='matches-retained-context'),1);
  for(const kind of ['census','methods','context'])assert.deepEqual(validate(kind,(await db.prepare(prepare(kind,'0','10000')).all()).results),(await run(kind)).data);
  const broken=JSON.parse(JSON.stringify(methods.data));broken.push({...broken[0]});assert.throws(()=>validate('methods',broken));
  const dup=JSON.parse(JSON.stringify(small.data));dup.groups.push({...dup.groups[0]});assert.throws(()=>validate('census',[{section:'totals',payload:JSON.stringify(dup.totals)},{section:'groups',payload:JSON.stringify(dup.groups)}]));
  assert.ok(!JSON.stringify([small.data,methods.data,context.data]).includes('private-referrer'));
  await db.prepare('DELETE FROM page_observations').run();await db.batch([insert('9007199254740992'),insert('9007199254740993')]);
  const big=await db.prepare(PREFLIGHT_SQL).bind('9007199254740992').first();validatePreflight(big,'9007199254740992');assert.equal(big.upperId,'9007199254740993');
  assert.equal((await run('census','9007199254740992','9007199254740993')).data.totals.rows,1);
  assert.throws(()=>prepare('census','1 OR 1=1','2'));
  await db.prepare('DELETE FROM page_observations').run();
  for(let start=0;start<PLAN.maximumRows;start+=128)await db.batch(Array.from({length:128},(_,i)=>insert(start+i+1,cases[(start+i)%cases.length])));
  const pre=await db.prepare(PREFLIGHT_SQL).bind('0').all();validatePreflight(pre.results[0],'0');
  const scaled={};for(const kind of ['census','methods','context'])scaled[kind]=await run(kind,'0',pre.results[0].upperId);
  const totalReads=pre.meta.rows_read+Object.values(scaled).reduce((n,r)=>n+r.meta.rows_read,0);assert.ok(totalReads<PLAN.postExecutionReadReviewThreshold);
  assert.equal(scaled.census.data.totals.rows,PLAN.maximumRows);assert.equal(sum(scaled.methods.data,()=>true),PLAN.maximumRows);
  const queryPlan=(await db.prepare('EXPLAIN QUERY PLAN '+PREFLIGHT_SQL).bind('0').all()).results.map(r=>r.detail);assert.ok(queryPlan.some(s=>s.includes('SEARCH page_observations USING INTEGER PRIMARY KEY')));
  await insert(PLAN.maximumRows+1).run();const sentinel=await db.prepare(PREFLIGHT_SQL).bind('0').first();assert.equal(sentinel.rows,PLAN.maximumRows+1);assert.throws(()=>validatePreflight(sentinel,'0'));
  const receipt={checkedAt:new Date().toISOString(),sourceBaseline:'e405f55',plan:PLAN,fixtureCases:cases.length,checks:{compactAndLegacyDeclarations:true,unrecognizedAndConflictingProfiles:true,coherentOlderDeclarations:true,contextSupport:true,ownerAndReferralPrecedence:true,backdatedFutureAndInvalidEventTimes:true,negativeAndZeroIdsExcludedFromPositiveDelta:true,exactLargeIds:true,concreteMatchesParameterized:true,duplicateAndPrivateValuesRejected:true,sentinelRejected:true},scale:{rows:PLAN.maximumRows,preflightReads:pre.meta.rows_read,censusReads:scaled.census.meta.rows_read,methodReads:scaled.methods.meta.rows_read,contextReads:scaled.context.meta.rows_read,totalReads,writes:0},queryPlan,sqlHashes:Object.fromEntries(Object.entries({preflight:PREFLIGHT_SQL,census:CENSUS_SQL,methods:METHODS_SQL,context:CONTEXT_SQL}).map(([k,v])=>[k,hash(v)])),scriptSha256:hash(readFileSync(new URL(import.meta.url))),productionCalls:0};
  writeFileSync(output,JSON.stringify(receipt,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify({fixtureCases:cases.length,scale:receipt.scale}));
 }finally{await mf.dispose()}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();

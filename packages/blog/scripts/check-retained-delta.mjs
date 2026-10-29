import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { READER_KINDS } from '../../analytics/.test-dist/contracts.js';
import { COLLECTION_VERSION, CLASSIFIER_VERSION } from '../../analytics/.test-dist/versions.js';
import { SIGNATURE_BASES, signatureBasisSql, signatureLocalStateSql } from '../../analytics/.test-dist/signature-basis.js';
import { signatureCoverageRecordedSql } from '../../analytics/.test-dist/signature-coverage-report.js';
import { verifierProfileSql, isReportedVerifierProfile } from '../../analytics/.test-dist/verifier-profile.js';
import { nativeBooleanStateSql, vendorSignatureStateSql } from '../../analytics/.test-dist/signature-summary.js';
import { vendorNetworkStateSql } from '../../analytics/.test-dist/vendor-network-summary.js';
import { referralAssessmentCtes, referralRulesJson } from '../../analytics/.test-dist/referral-sql.js';
import { ACTIVE_REFERRAL_POLICY } from '../../analytics/.test-dist/referral-policy.generated.js';
import { queryStats } from '../../analytics/.test-dist/stats.js';
import { summaryCases } from '../../analytics/test/fixtures/signature-summary.mjs';
import { networkSummaryCases } from '../../analytics/test/fixtures/vendor-network-summary.mjs';

export const PLAN = { maximumRows: 8192, maximumDetailedRows: 4096, maximumReferralLabels: 32768,
  maximumGroups: 2048, postExecutionReadReviewThreshold: 300000, databaseEnforcedReadCap: false };
export const BASELINE_EVENT_CUTOFF = '2026-10-28 05:22:00';
const validTime = `COALESCE(length(observed_at)=19 AND datetime(observed_at,'+0 seconds')=observed_at,0)`;
const labels = `CASE WHEN referrer_host IS NOT NULL AND length(rtrim(referrer_host,'.'))<=253
 THEN 1+length(rtrim(referrer_host,'.'))-length(replace(rtrim(referrer_host,'.'),'.','')) ELSE 0 END`;
export const PREFLIGHT_SQL = `SELECT COUNT(*) AS rows,CAST(MAX(id) AS TEXT) AS upperId,
 COALESCE(SUM(signature_evidence IS NOT NULL),0) AS detailedRows,COALESCE(SUM(${labels}),0) AS referralLabels
 FROM (SELECT id,signature_evidence,referrer_host FROM page_observations WHERE id>CAST(? AS INTEGER) ORDER BY id LIMIT ${PLAN.maximumRows+1})`;
const list = values => values.map(v => `'${v}'`).join(',');
const profileState = (column, current) => `CASE WHEN ${column} IS NULL THEN 'not-recorded' WHEN ${column}='${current}' THEN 'current' ELSE 'other-recorded' END`;
const fields = ['inclusion','time_scope','stored_kind','collection_state','classifier_state','evidence_state','local_state','basis','profile','native_state','vendor_state','network_state','binding_mask','native_mask','network_mask'];
export const DELTA_SQL = `WITH RECURSIVE
 bounded AS MATERIALIZED (SELECT * FROM page_observations WHERE id>CAST(? AS INTEGER) AND id<=CAST(? AS INTEGER)),
 ${referralAssessmentCtes(`SELECT DISTINCT referrer_host AS original,lower(rtrim(referrer_host,'.')) AS normalized FROM bounded WHERE referrer_host IS NOT NULL AND length(rtrim(referrer_host,'.'))<=253`)},
 facts AS MATERIALIZED (SELECT signature_evidence,vendor_ip_evidence,
 CASE WHEN is_owner=1 OR EXISTS(SELECT 1 FROM owner_clients WHERE owner_clients.daily_client_id=bounded.daily_client_id) THEN 'owner-excluded'
 WHEN COALESCE(referrer_host IN (SELECT original FROM abusive_hosts),0)=1 THEN 'referral-excluded' ELSE 'included' END AS inclusion,
 CASE WHEN NOT (${validTime}) THEN 'unrecognized-time' WHEN observed_at<'${BASELINE_EVENT_CUTOFF}' THEN 'before-baseline-event-cutoff' ELSE 'at-or-after-baseline-event-cutoff' END AS time_scope,
 CASE WHEN reader_kind IS NULL THEN 'not-recorded' WHEN reader_kind IN (${list(READER_KINDS)}) THEN reader_kind ELSE 'unrecognized' END AS stored_kind,
 ${profileState('collection_version',COLLECTION_VERSION)} AS collection_state,${profileState('classifier_version',CLASSIFIER_VERSION)} AS classifier_state,
 CASE WHEN signature_evidence IS NOT NULL THEN 'detailed-record' WHEN signature_status='verified' THEN 'verified-outcome-only' WHEN signature_status='unverified' THEN 'unverified-outcome-only' ELSE 'no-detail-or-status' END AS evidence_state,
 ${signatureLocalStateSql()} AS local_state,${signatureBasisSql()} AS basis,${verifierProfileSql()} AS profile,
 ${signatureCoverageRecordedSql()} AS coverage_valid,${nativeBooleanStateSql()} AS native_state,${vendorNetworkStateSql()} AS network_state FROM bounded),
 projected AS MATERIALIZED (SELECT inclusion,time_scope,stored_kind,collection_state,classifier_state,evidence_state,local_state,basis,profile,native_state,
 ${vendorSignatureStateSql()} AS vendor_state,network_state,
 CASE WHEN local_state='verified' AND coverage_valid=1 THEN
  CASE WHEN json_type(signature_evidence,'$.coverage.covered.userAgent')='true' THEN 1 ELSE 0 END
  +CASE WHEN json_type(signature_evidence,'$.coverage.covered.method')='true' THEN 2 ELSE 0 END
  +CASE WHEN json_type(signature_evidence,'$.coverage.covered.path')='true' OR json_type(signature_evidence,'$.coverage.covered.targetUri')='true' THEN 4 ELSE 0 END
  +CASE WHEN json_type(signature_evidence,'$.coverage.covered.authority')='true' AND json_type(signature_evidence,'$.coverage.covered.targetUri')='false' AND json_type(signature_evidence,'$.coverage.covered.path')='false' AND json_type(signature_evidence,'$.coverage.covered.method')='false' AND json_type(signature_evidence,'$.coverage.covered.query')='false' THEN 8 ELSE 0 END
 ELSE 0 END AS binding_mask,
 CASE WHEN native_state='available' THEN CASE WHEN json_type(signature_evidence,'$.native.verifiedBot')='true' THEN 1 ELSE 0 END
 +CASE WHEN json_type(signature_evidence,'$.native.signedAgent')='true' THEN 2 ELSE 0 END ELSE 0 END AS native_mask,
 CASE WHEN network_state='recognized' THEN ${['listed','notListed','unavailable','notAssessed'].map((key,i)=>`CASE WHEN json_type(vendor_ip_evidence,'$.summary.${key}')='true' THEN ${2**i} ELSE 0 END`).join('+')} ELSE 0 END AS network_mask FROM facts),
 groups AS (SELECT ${fields.join(',')},COUNT(*) AS views FROM projected GROUP BY ${fields.join(',')} ORDER BY ${fields.join(',')} LIMIT ${PLAN.maximumGroups+1})
 SELECT 'totals' AS section,json_object('rows',COUNT(*),'detailedRows',COALESCE(SUM(signature_evidence IS NOT NULL),0),
 'firstObservedAt',MIN(CASE WHEN ${validTime} THEN observed_at END),'lastObservedAt',MAX(CASE WHEN ${validTime} THEN observed_at END)) AS payload FROM bounded
 UNION ALL SELECT 'groups',json_group_array(json_object(${fields.map(f=>`'${f}',${f}`).join(',')},'views',views)) FROM groups`;

function id(value) { assert.ok(typeof value==='string' && /^(0|[1-9][0-9]{0,18})$/.test(value) && BigInt(value)<=9223372036854775807n,'Invalid exact ID bound'); return value; }
const integer = value => Number.isSafeInteger(value) && value>=0;
const keys = (value,expected) => { assert.ok(typeof value==='object' && value!==null && !Array.isArray(value));assert.deepEqual(Object.keys(value).sort(),expected.slice().sort()); };
export function validatePreflight(row,lower) {
 id(lower);keys(row,['rows','upperId','detailedRows','referralLabels']);
 assert.ok([row.rows,row.detailedRows,row.referralLabels].every(integer) && row.detailedRows<=row.rows);
 if(row.rows===0)assert.equal(row.upperId,null);else assert.ok(BigInt(id(row.upperId))>BigInt(lower));
 assert.ok(row.rows<=PLAN.maximumRows && row.detailedRows<=PLAN.maximumDetailedRows && row.referralLabels<=PLAN.maximumReferralLabels,'Preflight exceeds reviewed work bounds');return row;
}
export function validateDelta(rows) {
 assert.ok(Array.isArray(rows) && rows.length===2);const sections=new Map();
 for(const row of rows){keys(row,['section','payload']);assert.ok(typeof row.payload==='string' && !sections.has(row.section));sections.set(row.section,JSON.parse(row.payload));}
 const totals=sections.get('totals'),groups=sections.get('groups');keys(totals,['rows','detailedRows','firstObservedAt','lastObservedAt']);
 assert.ok(integer(totals.rows) && totals.rows<=PLAN.maximumRows && integer(totals.detailedRows) && totals.detailedRows<=totals.rows);
 for(const t of [totals.firstObservedAt,totals.lastObservedAt])assert.ok(t===null || typeof t==='string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(t) && new Date(t.replace(' ','T')+'Z').toISOString().slice(0,19).replace('T',' ')===t);
 assert.ok((totals.firstObservedAt===null)===(totals.lastObservedAt===null));if(totals.firstObservedAt!==null)assert.ok(totals.firstObservedAt<=totals.lastObservedAt);
 assert.ok(Array.isArray(groups) && groups.length<=PLAN.maximumGroups);const seen=new Set();
 const enums={inclusion:['included','owner-excluded','referral-excluded'],time_scope:['before-baseline-event-cutoff','at-or-after-baseline-event-cutoff','unrecognized-time'],stored_kind:[...READER_KINDS,'not-recorded','unrecognized'],collection_state:['current','other-recorded','not-recorded'],classifier_state:['current','other-recorded','not-recorded'],evidence_state:['detailed-record','verified-outcome-only','unverified-outcome-only','no-detail-or-status'],local_state:['verified','unverified','absent','test-injected','unrecognized','outcome-only','not-recorded'],basis:SIGNATURE_BASES,native_state:['available','unavailable','not-recorded','unrecognized'],vendor_state:['not-recorded','unrecognized','no-declaration','not-configured','not-verified','matching-origin','different-origin','conflicting-origins','test-injected'],network_state:['recognized','unrecognized','not-recorded']};
 for(const row of groups){keys(row,[...fields,'views']);for(const [field,values]of Object.entries(enums))assert.ok(values.includes(row[field]),field);assert.ok(isReportedVerifierProfile(row.profile));
  assert.ok(integer(row.views) && row.views>0);for(const field of ['binding_mask','native_mask','network_mask'])assert.ok(integer(row[field]) && row[field]<(field==='native_mask'?4:16));
  assert.ok(row.binding_mask===0 || row.local_state==='verified' && ['verified-ua-covered','verified-ua-uncovered'].includes(row.basis));
  assert.ok(row.native_mask===0 || row.native_state==='available');assert.ok(row.network_mask===0 || row.network_state==='recognized');
  assert.equal(row.local_state==='verified',['verified-ua-covered','verified-ua-uncovered','verified-coverage-unknown'].includes(row.basis));
  assert.equal(row.basis==='verified-ua-covered',Boolean(row.binding_mask&1));
  assert.ok(!(row.binding_mask&8) || !(row.binding_mask&6));
  assert.equal(row.evidence_state==='detailed-record',['verified','unverified','absent','test-injected','unrecognized'].includes(row.local_state));
  if(row.evidence_state!=='detailed-record'){
   assert.equal(row.local_state,row.evidence_state==='verified-outcome-only'?'outcome-only':'not-recorded');
   assert.equal(row.profile,'not-recorded');assert.equal(row.native_state,'not-recorded');
  }
  const key=JSON.stringify(fields.map(field=>row[field]));assert.ok(!seen.has(key));seen.add(key);
 }
 assert.equal(groups.reduce((n,r)=>n+r.views,0),totals.rows);assert.equal(groups.filter(r=>r.evidence_state==='detailed-record').reduce((n,r)=>n+r.views,0),totals.detailedRows);
 assert.equal(groups.some(r=>r.time_scope!=='unrecognized-time'),totals.firstObservedAt!==null);
 return {totals,groups};
}
function concrete(sql,values) { let n=0;const result=sql.replace(/\?/g,()=>"'"+values[n++].replaceAll("'","''")+"'");assert.equal(n,values.length);return result+';\n'; }
export function preparePreflight(lower) { return concrete(PREFLIGHT_SQL,[id(lower)]); }
export function prepareDelta(lower,upper) { assert.ok(BigInt(id(upper))>=BigInt(id(lower)));return concrete(DELTA_SQL,[lower,upper,referralRulesJson(ACTIVE_REFERRAL_POLICY)]); }
export const totalWhere = (groups,predicate) => groups.filter(predicate).reduce((n,r)=>n+r.views,0);

async function main() {
 const output=process.argv[2];assert.ok(output,'Provide a new receipt path');
 const req=createRequire(resolve('package.json'));const {Miniflare}=await import(pathToFileURL(req.resolve('miniflare',{paths:[dirname(req.resolve('wrangler/package.json'))]})));
 const mf=new Miniflare({modules:true,script:'export default{fetch(){return new Response("delta fixture")}}',compatibilityDate:'2026-03-06',cf:{},d1Databases:{DB:'retained-delta'}});
 try{
  const db=await mf.getD1Database('DB');const schema=readFileSync('packages/analytics/schema.sql','utf8').replace(/^\s*--.*$/gm,'');await db.batch(schema.split(';').map(s=>s.trim()).filter(Boolean).map(s=>db.prepare(s)));
  const run=async(lower,upper)=>{const result=await db.prepare(DELTA_SQL).bind(lower,upper,referralRulesJson(ACTIVE_REFERRAL_POLICY)).all();return {...validateDelta(result.results),meta:result.meta};};
  assert.equal((await run('0','0')).totals.rows,0);validatePreflight(await db.prepare(PREFLIGHT_SQL).bind('0').first(),'0');
  const insert=(n,sig={e:null,status:null},network=null,options={})=>db.prepare(`INSERT INTO page_observations(id,path,daily_client_id,traffic_class,device_type,reader_kind,reader_reason,is_owner,referrer_host,observed_at,signature_status,signature_evidence,vendor_ip_evidence,collection_version,classifier_version) VALUES(CAST(? AS INTEGER),'/privacy',?,'bot','desktop',?,'fixture',?,?,?,?,?,?,?,?)`).bind(String(n),BigInt(n).toString(16).padStart(32,'0'),options.kind??'seo-crawler',options.owner??0,options.referrer??null,options.at??'2026-10-29 00:00:00',sig.status,sig.e===null?null:JSON.stringify(sig.e),network===null?null:JSON.stringify(network),options.collection??COLLECTION_VERSION,CLASSIFIER_VERSION);
  await db.batch(summaryCases.map((c,i)=>insert(i+1,c)));await db.batch(networkSummaryCases.map((c,i)=>insert(100+i,undefined,c.e)));
  const small=await run('0','1000'),included=small.groups.filter(r=>r.inclusion==='included');
  assert.equal(totalWhere(small.groups,r=>r.collection_state==='current'),small.totals.rows);
  const report=await queryStats(db,{range:'all',traffic:'all'},new Date('2026-10-29T01:00:00Z'));
  assert.equal(report.totals.views,small.totals.rows);
  const comparisons={localVerifiedViews:totalWhere(included,r=>r.local_state==='verified'),userAgentBoundViews:totalWhere(included,r=>Boolean(r.binding_mask&1)),methodBoundViews:totalWhere(included,r=>Boolean(r.binding_mask&2)),resourceBoundViews:totalWhere(included,r=>Boolean(r.binding_mask&4)),authorityOnlyViews:totalWhere(included,r=>Boolean(r.binding_mask&8)),nativeAvailableViews:totalWhere(included,r=>r.native_state==='available'),nativeVerifiedBotViews:totalWhere(included,r=>Boolean(r.native_mask&1)),nativeSignedAgentViews:totalWhere(included,r=>Boolean(r.native_mask&2)),vendorMatchingOriginViews:totalWhere(included,r=>r.vendor_state==='matching-origin')};
  for(const [key,value]of Object.entries(comparisons))assert.equal(value,report.verification[key],key);
  assert.equal(totalWhere(included,r=>r.network_state==='recognized'),report.vendorNetwork.recognizedViews);
  for(const [i,key]of ['listedViews','notListedViews','unavailableViews','notAssessedViews'].entries())assert.equal(totalWhere(included,r=>Boolean(r.network_mask&(2**i))),report.vendorNetwork[key]);
  await db.batch([insert(200,undefined,null,{owner:1,referrer:'traffic2cash.xyz'}),insert(201,undefined,null,{referrer:'traffic2cash.xyz'}),insert(202,undefined,null,{at:'2026-02-30 00:00:00',kind:'private-canary',collection:'private-canary'}),insert(203,undefined,null,{at:'2026-10-28 05:21:59',collection:'2026-10-28.9'}),insert(204,undefined,null,{at:BASELINE_EVENT_CUTOFF})]);
  await db.prepare("INSERT INTO owner_clients(daily_client_id,utc_date) VALUES(?,'2026-10-29')").bind(BigInt(204).toString(16).padStart(32,'0')).run();
  const edges=await run('199','204');assert.equal(edges.totals.rows,5);assert.equal(totalWhere(edges.groups,r=>r.inclusion==='owner-excluded'),2);assert.equal(totalWhere(edges.groups,r=>r.inclusion==='referral-excluded'),1);assert.equal(totalWhere(edges.groups,r=>r.time_scope==='unrecognized-time'),1);assert.equal(totalWhere(edges.groups,r=>r.time_scope==='before-baseline-event-cutoff'),1);assert.equal(totalWhere(edges.groups,r=>r.collection_state==='other-recorded'),2);assert.equal(JSON.stringify(edges).includes('private-canary'),false);
  const raw=(await db.prepare(DELTA_SQL).bind('199','204',referralRulesJson(ACTIVE_REFERRAL_POLICY)).all()).results;
  for(const change of [r=>r[0].views++,r=>r.push(r[0]),r=>r[0].profile='private-canary',r=>r[0].native_mask=8,r=>r[0].unexpected='private-canary']){const copy=structuredClone(edges.groups);change(copy);assert.throws(()=>validateDelta([{section:'totals',payload:JSON.stringify(edges.totals)},{section:'groups',payload:JSON.stringify(copy)}]));}
  assert.throws(()=>validateDelta([raw[0],raw[0]]));
  for(const bad of ['-1','1 OR 1=1','9223372036854775808'])assert.throws(()=>preparePreflight(bad));assert.throws(()=>prepareDelta('2','1'));
  for(const bad of [{rows:8193,upperId:'9000',detailedRows:0,referralLabels:0},{rows:1,upperId:'1',detailedRows:0,referralLabels:32769}])assert.throws(()=>validatePreflight(bad,'0'));
  await db.prepare('DELETE FROM page_observations').run();await db.prepare('DELETE FROM owner_clients').run();
  await db.batch([insert('9007199254740992'),insert('9007199254740993')]);const precise=await db.prepare(PREFLIGHT_SQL).bind('9007199254740992').first();validatePreflight(precise,'9007199254740992');assert.equal(precise.upperId,'9007199254740993');assert.equal((await run('9007199254740992','9007199254740993')).totals.rows,1);assert.deepEqual(validateDelta((await db.prepare(prepareDelta('9007199254740992','9007199254740993')).all()).results).groups,(await run('9007199254740992','9007199254740993')).groups);
  await db.prepare('DELETE FROM page_observations').run();
  for(let i=0;i<PLAN.maximumRows;i+=64)await db.batch(Array.from({length:64},(_,j)=>insert(i+j+1,i+j<PLAN.maximumDetailedRows?summaryCases[0]:undefined,i+j<PLAN.maximumDetailedRows?networkSummaryCases[1].e:null,{referrer:i+j<256?Array(125).fill('a').concat('n'+(i+j).toString(36)).join('.'):null})));
  const pre=await db.prepare(PREFLIGHT_SQL).bind('0').all();validatePreflight(pre.results[0],'0');const scale=await run('0',pre.results[0].upperId);assert.equal(scale.totals.rows,8192);assert.equal(scale.totals.detailedRows,4096);
  const reads=pre.meta.rows_read+scale.meta.rows_read;assert.ok(reads<PLAN.postExecutionReadReviewThreshold);assert.equal(pre.meta.rows_written+scale.meta.rows_written,0);
  const queryPlan=(await db.prepare('EXPLAIN QUERY PLAN '+PREFLIGHT_SQL).bind('0').all()).results.map(row=>row.detail);
  assert.ok(queryPlan.some(detail=>detail.includes('SEARCH page_observations USING INTEGER PRIMARY KEY')));
  await db.batch([insert(8193),insert(8194)]);const saturated=await db.prepare(PREFLIGHT_SQL).bind('0').first();assert.equal(saturated.rows,8193);assert.equal(saturated.upperId,'8193');assert.throws(()=>validatePreflight(saturated,'0'));
  const result={checkedAt:new Date().toISOString(),runtime:process.version,plan:PLAN,storedProfiles:{collection:COLLECTION_VERSION,classifier:CLASSIFIER_VERSION},signatureControls:summaryCases.length,networkControls:networkSummaryCases.length,fullCurrentReportComparisons:comparisons,checks:{emptySelection:true,inclusionPrecedence:true,eventTimeVersusIdScope:true,currentCollectionNotHardcodedToPriorVersion:true,exactAdjacentIdsAboveSafeInteger:true,concreteMatchesParameterized:true,malformedOrDuplicateAggregatesRejected:true,privateValuesClosed:true,boundedPreflightStopsAtSentinel:true,preflightPrimaryKeyRangePlan:queryPlan},scale:{rows:8192,detailedRows:4096,referralLabels:pre.results[0].referralLabels,preflightReads:pre.meta.rows_read,deltaReads:scale.meta.rows_read,combinedReads:reads,rowsWritten:0},sqlSha256:createHash('sha256').update(DELTA_SQL).digest('hex'),preflightSha256:createHash('sha256').update(PREFLIGHT_SQL).digest('hex'),sqlBytes:Buffer.byteLength(DELTA_SQL),productionCalls:0};
  writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify(result));
 }finally{await mf.dispose();}
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href)await main();

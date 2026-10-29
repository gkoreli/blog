import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { CLASSIFIER_VERSION } from '../../analytics/.test-dist/versions.js';
import { READER_KINDS } from '../../analytics/.test-dist/contracts.js';
import { signatureLocalStateSql } from '../../analytics/.test-dist/signature-basis.js';
import { referralAssessmentCtes, referralRulesJson } from '../../analytics/.test-dist/referral-sql.js';
import { ACTIVE_REFERRAL_POLICY } from '../../analytics/.test-dist/referral-policy.generated.js';
import { summaryCases } from '../../analytics/test/fixtures/signature-summary.mjs';

export const UNRESOLVED_REASONS = ['multiple-client-declarations','unrecognized-browser-claim','request-context-conflict','fetch-metadata-unrecognized','fetch-metadata-absent','fetch-metadata-support-unknown','network-evidence-missing'];
export const OUTCOMES = ['invalid','unsupported','unavailable','policy-rejected','not-applicable','indeterminate'];
const list = values => values.map(v=>`'${v}'`).join(',');
export const REASON_SQL = `WITH RECURSIVE
 range AS MATERIALIZED (SELECT reader_kind,reader_reason,classifier_version,signature_status,signature_evidence,referrer_host,referrer_state,sec_fetch_site,is_owner,daily_client_id FROM page_observations WHERE id>CAST(? AS INTEGER) AND id<=CAST(? AS INTEGER)),
 selected AS MATERIALIZED (SELECT *,${signatureLocalStateSql()} AS local_state FROM range WHERE reader_kind='unresolved' OR (${signatureLocalStateSql()})='unverified'),
 ${referralAssessmentCtes(`SELECT DISTINCT referrer_host AS original,lower(rtrim(referrer_host,'.')) AS normalized FROM selected WHERE referrer_host IS NOT NULL AND length(rtrim(referrer_host,'.'))<=253`)},
 projected AS (SELECT
 CASE WHEN is_owner=1 OR EXISTS(SELECT 1 FROM owner_clients WHERE owner_clients.daily_client_id=selected.daily_client_id) THEN 'owner-excluded' WHEN COALESCE(referrer_host IN (SELECT original FROM abusive_hosts),0)=1 THEN 'referral-excluded' ELSE 'included' END AS inclusion,
 CASE WHEN reader_kind IS NULL THEN 'not-recorded' WHEN reader_kind IN (${list(READER_KINDS)}) THEN reader_kind ELSE 'unrecognized' END AS stored_kind,
 local_state,
 CASE WHEN reader_kind IS NOT 'unresolved' THEN 'not-applicable' WHEN classifier_version IS NOT '${CLASSIFIER_VERSION}' THEN 'profile-not-current' WHEN reader_reason IS NULL THEN 'not-recorded' WHEN reader_reason IN (${list(UNRESOLVED_REASONS)}) THEN reader_reason ELSE 'unrecognized' END AS unresolved_reason,
 CASE WHEN reader_kind='unresolved' AND classifier_version='${CLASSIFIER_VERSION}' AND reader_reason='request-context-conflict' THEN CASE
 WHEN referrer_state IS NULL OR referrer_state='unusable' OR sec_fetch_site IS NULL OR sec_fetch_site NOT IN ('same-origin','same-site','cross-site','none') THEN 'retained-context-unavailable'
 WHEN referrer_state='external' AND sec_fetch_site='same-origin' THEN 'matches-retained-context' ELSE 'contradicts-retained-context' END ELSE 'inputs-not-assessed' END AS context_support,
 CASE WHEN local_state<>'unverified' THEN 'not-applicable' WHEN json_type(signature_evidence,'$.localOutcome') IS NULL THEN 'not-recorded' WHEN json_type(signature_evidence,'$.localOutcome')='text' AND json_extract(signature_evidence,'$.localOutcome') IN (${list(OUTCOMES)}) THEN json_extract(signature_evidence,'$.localOutcome') ELSE 'unrecognized' END AS failure_outcome FROM selected)
 SELECT inclusion,stored_kind,local_state,unresolved_reason,context_support,failure_outcome,COUNT(*) AS views FROM projected
 GROUP BY inclusion,stored_kind,local_state,unresolved_reason,context_support,failure_outcome ORDER BY inclusion,stored_kind,local_state,unresolved_reason,context_support,failure_outcome LIMIT 257`;
export function prepareReasons(lower,upper) {
 for(const value of [lower,upper])assert.ok(typeof value==='string' && /^(0|[1-9][0-9]{0,18})$/.test(value) && BigInt(value)<=9223372036854775807n);
 assert.ok(BigInt(upper)>=BigInt(lower));const values=[lower,upper,referralRulesJson(ACTIVE_REFERRAL_POLICY)];let i=0;
 const sql=REASON_SQL.replace(/\?/g,()=>"'"+values[i++].replaceAll("'","''")+"'");assert.equal(i,3);return sql+';\n';
}
export function validateReasons(rows) {
 assert.ok(Array.isArray(rows) && rows.length<=256);const seen=new Set();
 const allowed={inclusion:['included','owner-excluded','referral-excluded'],stored_kind:[...READER_KINDS,'not-recorded','unrecognized'],local_state:['verified','unverified','absent','test-injected','unrecognized','outcome-only','not-recorded'],unresolved_reason:[...UNRESOLVED_REASONS,'not-applicable','profile-not-current','not-recorded','unrecognized'],context_support:['matches-retained-context','contradicts-retained-context','retained-context-unavailable','inputs-not-assessed'],failure_outcome:[...OUTCOMES,'not-recorded','unrecognized']};
 for(const row of rows){assert.deepEqual(Object.keys(row).sort(),[...Object.keys(allowed),'views'].sort());for(const [key,values]of Object.entries(allowed))assert.ok(values.includes(row[key]));assert.ok(Number.isSafeInteger(row.views)&&row.views>0);
  assert.ok(row.stored_kind==='unresolved'||row.local_state==='unverified');assert.ok(row.context_support==='inputs-not-assessed'||row.stored_kind==='unresolved'&&row.unresolved_reason==='request-context-conflict');
  assert.ok(row.local_state==='unverified'||row.failure_outcome==='not-applicable');
  const key=JSON.stringify(Object.keys(allowed).map(field=>row[field]));assert.ok(!seen.has(key));seen.add(key);
 }
 return rows;
}
async function main() {
 const output=process.argv[2];assert.ok(output);const req=createRequire(resolve('package.json'));const {Miniflare}=await import(pathToFileURL(req.resolve('miniflare',{paths:[dirname(req.resolve('wrangler/package.json'))]})));
 const mf=new Miniflare({modules:true,script:'export default{fetch(){return new Response("reason fixture")}}',compatibilityDate:'2026-03-06',cf:{},d1Databases:{DB:'delta-reasons'}});
 try{
  const db=await mf.getD1Database('DB');const schema=readFileSync('packages/analytics/schema.sql','utf8').replace(/^\s*--.*$/gm,'');await db.batch(schema.split(';').map(s=>s.trim()).filter(Boolean).map(s=>db.prepare(s)));
  const absent=summaryCases.find(c=>c.name==='unsigned-with-native-true'),invalid=summaryCases.find(c=>c.name==='invalid-with-native-true');
  const insert=(n,{kind='unresolved',reason='request-context-conflict',site='same-origin',state='external',owner=0,referrer=null,profile=CLASSIFIER_VERSION,sig=absent}={})=>db.prepare(`INSERT INTO page_observations(id,path,daily_client_id,traffic_class,device_type,reader_kind,reader_reason,classifier_version,sec_fetch_site,referrer_state,is_owner,referrer_host,signature_status,signature_evidence) VALUES(?,'/privacy',?,'bot','desktop',?,?,?,?,?,?,?,?,?)`).bind(n,n.toString(16).padStart(32,'0'),kind,reason,profile,site,state,owner,referrer,sig.status,JSON.stringify(sig.e));
  const run=async()=>{const r=await db.prepare(REASON_SQL).bind('0','10000',referralRulesJson(ACTIVE_REFERRAL_POLICY)).all();return {rows:validateReasons(r.results),meta:r.meta};};
  assert.deepEqual((await run()).rows,[]);
  await db.batch([insert(1),insert(2,{site:'cross-site'}),insert(3,{reason:'private-canary'}),insert(4,{profile:'private-canary'}),insert(5,{owner:1,referrer:'traffic2cash.xyz'}),insert(6,{referrer:'traffic2cash.xyz'}),insert(7,{kind:'http-client',sig:invalid}),insert(8,{kind:'browser'}),insert(9,{site:null})]);
  const small=await run();assert.equal(small.rows.reduce((n,r)=>n+r.views,0),8);assert.equal(small.rows.filter(r=>r.context_support==='contradicts-retained-context').reduce((n,r)=>n+r.views,0),1);assert.equal(small.rows.filter(r=>r.context_support==='retained-context-unavailable').reduce((n,r)=>n+r.views,0),1);assert.equal(small.rows.filter(r=>r.inclusion==='owner-excluded').reduce((n,r)=>n+r.views,0),1);assert.ok(small.rows.some(r=>r.failure_outcome==='invalid'));assert.equal(JSON.stringify(small.rows).includes('private-canary'),false);
  assert.deepEqual(validateReasons((await db.prepare(prepareReasons('0','10000')).all()).results),small.rows);
  for(const mutation of [r=>r.push(r[0]),r=>r.push(Object.fromEntries(Object.entries(r[0]).reverse())),r=>r[0].views=0,r=>r[0].unresolved_reason='private-canary',r=>r[0].context_support='authenticated',r=>r[0].extra='private-canary']){const copy=structuredClone(small.rows);mutation(copy);assert.throws(()=>validateReasons(copy));}
  assert.throws(()=>prepareReasons('1 OR 1=1','2'));assert.throws(()=>prepareReasons('3','2'));
  await db.prepare('DELETE FROM page_observations').run();
  for(let n=1;n<=8192;n+=64)await db.batch(Array.from({length:64},(_,i)=>insert(n+i)));
  const scale=await run();assert.equal(scale.rows.reduce((n,r)=>n+r.views,0),8192);assert.equal(scale.meta.rows_written,0);
  const actualScope=await db.prepare(REASON_SQL).bind('0','712',referralRulesJson(ACTIVE_REFERRAL_POLICY)).all();
  assert.equal(validateReasons(actualScope.results).reduce((n,r)=>n+r.views,0),712);assert.ok(actualScope.meta.rows_read<20000);assert.equal(actualScope.meta.rows_written,0);
  const receipt={checkedAt:new Date().toISOString(),runtime:process.version,fixtureRows:9,selectedFixtureRows:8,checks:{empty:true,currentVersusOtherProfile:true,sourceContextMatchedContradictoryAndUnavailable:true,ownerReferralPrecedence:true,closedUnknowns:true,concreteMatchesParameterized:true,malformedAndDuplicateRejected:true},scale:{selectedRows:8192,reads:scale.meta.rows_read,writes:0,within20000ReadBudget:scale.meta.rows_read<20000},actualCohortSizeFixture:{selectedRows:712,reads:actualScope.meta.rows_read,writes:0,within20000ReadBudget:true},sqlTemplateSha256:createHash('sha256').update(REASON_SQL).digest('hex'),productionCalls:0};
  writeFileSync(output,JSON.stringify(receipt,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify(receipt));
 }finally{await mf.dispose();}
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href)await main();

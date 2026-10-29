import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { CLIENT_METHOD_SQL, validateClientMethods } from './check-retained-client-methods.mjs';
import { REASON_SQL, validateReasons } from './check-retained-delta-reasons.mjs';
import { CLASSIFIER_VERSION } from '../../analytics/.test-dist/versions.js';
import { analyzeTraffic } from '../../analytics/.test-dist/classify.js';
import { verificationEvidence } from '../../analytics/.test-dist/signature-evidence.js';
import { ACTIVE_REFERRAL_POLICY } from '../../analytics/.test-dist/referral-policy.generated.js';
import { referralRulesJson } from '../../analytics/.test-dist/referral-sql.js';

export const PLAN = { maximumIdSpan: 114, maximumGroups: 114, readReviewThreshold: 20000,
  databaseEnforcedReadCap: false, maximumStatements: 3, attemptsPerStatement: 1 };
const methodFields = ['inclusion','declaration','legacy_agreement','stored_kind','method_mask','local_state','vendor_state','network_state','network_mask','failure_reason','reason_set_state','closed_reasons'];
const reasonFields = ['inclusion','stored_kind','local_state','unresolved_reason','context_support','failure_outcome'];
const contextFields = ['classifier_state','mode_state','family_state','navigation_state','activation_state'];
const profileStates = ['current','other-recorded','conflicting','unrecognized','not-recorded'];
const profile = "json_extract(classification_evidence,'$.classifierProfile')";
const profileValid = `json_extract(classification_evidence,'$.version') IN ('2026-10-27.2','2026-10-29.1') AND json_type(classification_evidence,'$.classifierProfile')='text' AND length(${profile}) BETWEEN 1 AND 32`;
const profileState = `CASE WHEN classification_evidence IS NULL THEN 'not-recorded'
 WHEN NOT COALESCE((${profileValid}),0) OR classifier_version IS NULL THEN 'unrecognized'
 WHEN ${profile} IS NOT classifier_version THEN 'conflicting'
 WHEN classifier_version='${CLASSIFIER_VERSION}' THEN 'current' ELSE 'other-recorded' END`;
function replaceOnce(value, before, after) { assert.equal(value.split(before).length, 2, 'Upstream diagnostic shape changed'); return value.replace(before, after); }
function replaceTail(sql, oldFields, newFields, limit) {
  const separator = sql.includes('FROM projected\n GROUP BY') ? '\n ' : ' ';
  const before = `SELECT ${oldFields.join(',')},COUNT(*) AS views FROM projected${separator}GROUP BY ${oldFields.join(',')} ORDER BY ${oldFields.join(',')} LIMIT ${limit}`;
  const after = `SELECT ${newFields.join(',')},COUNT(*) AS views FROM projected\n GROUP BY ${newFields.join(',')} ORDER BY ${newFields.join(',')} LIMIT ${PLAN.maximumGroups + 1}`;
  return replaceOnce(sql, before, after);
}

// Schema coherence is separate from currentness. A coherent unreviewed profile
// permits literal stored declarations, never an assertion of historical parser
// correctness, reviewed code, cryptographic identity or current feed membership.
let methods = replaceOnce(CLIENT_METHOD_SQL, 'SELECT agent_name,classification_evidence,reader_kind,', 'SELECT classifier_version,agent_name,classification_evidence,reader_kind,');
methods = replaceOnce(methods, `AND json_extract(classification_evidence,'$.classifierProfile')='${CLASSIFIER_VERSION}'`,
  `AND json_type(classification_evidence,'$.classifierProfile')='text' AND length(${profile}) BETWEEN 1 AND 32 AND classifier_version IS NOT NULL AND ${profile} IS classifier_version`);
methods = replaceOnce(methods, 'facts AS MATERIALIZED (SELECT *,', `facts AS MATERIALIZED (SELECT *,${profileState} AS classifier_state,`);
methods = replaceOnce(methods, 'projected AS MATERIALIZED (SELECT inclusion,declaration,', 'projected AS MATERIALIZED (SELECT classifier_state,inclusion,declaration,');
export const METHOD_SQL = replaceTail(methods, methodFields, ['classifier_state',...methodFields], 713);

let reasons = replaceOnce(REASON_SQL, 'SELECT reader_kind,reader_reason,classifier_version,', 'SELECT classification_evidence,sec_fetch_mode,sec_fetch_dest,sec_fetch_user,accepts_html,has_accept_language,reader_kind,reader_reason,classifier_version,');
reasons = replaceOnce(reasons, `WHEN classifier_version IS NOT '${CLASSIFIER_VERSION}' THEN 'profile-not-current' `, '');
reasons = replaceOnce(reasons, `AND classifier_version='${CLASSIFIER_VERSION}' AND reader_reason='request-context-conflict'`, `AND (${profileState})='current' AND reader_reason='request-context-conflict'`);
reasons = replaceOnce(reasons, 'projected AS (SELECT', `projected AS (SELECT ${profileState} AS classifier_state,
 CASE WHEN sec_fetch_mode IS NULL THEN 'missing' WHEN sec_fetch_mode IN ('navigate','cors','no-cors','same-origin','websocket') THEN 'recognized' ELSE 'unrecognized' END AS mode_state,
 CASE WHEN classification_evidence IS NULL THEN 'not-recorded' WHEN json_extract(classification_evidence,'$.declarations.browserFamily') IN ('chromium','firefox','webkit','unrecognized') THEN json_extract(classification_evidence,'$.declarations.browserFamily') ELSE 'malformed' END AS family_state,
 CASE WHEN sec_fetch_mode IS NULL OR sec_fetch_dest IS NULL OR accepts_html IS NULL OR has_accept_language IS NULL THEN 'incomplete'
 WHEN sec_fetch_mode='navigate' AND sec_fetch_dest='document' AND accepts_html=1 AND has_accept_language=1 THEN 'matches-retained-shape' ELSE 'does-not-match' END AS navigation_state,
 CASE WHEN sec_fetch_user IS NULL THEN 'absent' WHEN sec_fetch_user=1 THEN 'true-claim' ELSE 'other-claim' END AS activation_state,`);
export const CONTEXT_SQL = replaceTail(reasons, reasonFields, [...contextFields,...reasonFields], 257);

export function prepare(kind, lower, upper) {
  for (const value of [lower,upper]) assert.ok(typeof value==='string' && /^(0|[1-9][0-9]{0,18})$/.test(value) && BigInt(value)<=9223372036854775807n);
  assert.ok(BigInt(upper)>=BigInt(lower) && BigInt(upper)-BigInt(lower)<=BigInt(PLAN.maximumIdSpan));
  const values=[lower,upper,referralRulesJson(ACTIVE_REFERRAL_POLICY)];let n=0;
  const sql=kind==='methods'?METHOD_SQL:kind==='context'?CONTEXT_SQL:null;assert.ok(sql);
  const result=sql.replace(/\?/g,()=>`'${values[n++].replaceAll("'","''")}'`)+';\n';assert.equal(n,3);assert.ok(Buffer.byteLength(result)<=100000);return result;
}
export function validate(kind, rows) {
  const base=kind==='methods'?methodFields:reasonFields, added=kind==='methods'?['classifier_state']:contextFields;
  assert.ok(kind==='methods'||kind==='context');assert.ok(Array.isArray(rows)&&rows.length<=PLAN.maximumGroups);
  const seen=new Set(),reduced=new Map();
  const enums={classifier_state:profileStates,mode_state:['missing','recognized','unrecognized'],family_state:['chromium','firefox','webkit','unrecognized','not-recorded','malformed'],navigation_state:['incomplete','matches-retained-shape','does-not-match'],activation_state:['absent','true-claim','other-claim']};
  for(const row of rows) {
    assert.deepEqual(Object.keys(row).sort(),[...added,...base,'views'].sort());
    for(const field of added) assert.ok(enums[field].includes(row[field]),field);
    assert.ok(Number.isSafeInteger(row.views)&&row.views>0);
    const key=JSON.stringify([...added,...base].map(field=>row[field]));assert.ok(!seen.has(key));seen.add(key);
    const baseKey=JSON.stringify(base.map(field=>row[field])),old=reduced.get(baseKey);
    if(old) old.views+=row.views;else reduced.set(baseKey,{...Object.fromEntries(base.map(field=>[field,row[field]])),views:row.views});
    if(kind==='methods'&&['conflicting','unrecognized'].includes(row.classifier_state))assert.equal(row.declaration,'unrecognized');
    if(kind==='context'&&row.classifier_state!=='current')assert.equal(row.context_support,'inputs-not-assessed');
  }
  const projected=[...reduced.values()];if(kind==='methods')validateClientMethods(projected);else validateReasons(projected);
  assert.ok(rows.reduce((n,row)=>n+row.views,0)<=PLAN.maximumIdSpan);return rows;
}

async function main() {
  const output=process.argv[2];assert.ok(output);const req=createRequire(resolve('package.json'));
  const{Miniflare}=await import(pathToFileURL(req.resolve('miniflare',{paths:[dirname(req.resolve('wrangler/package.json'))]})));
  const mf=new Miniflare({modules:true,script:'export default{fetch(){return new Response("cohort context fixture")}}',compatibilityDate:'2026-03-06',cf:{},d1Databases:{DB:'cohort-context'}});
  try {
    const db=await mf.getD1Database('DB');await db.batch(readFileSync('packages/analytics/schema.sql','utf8').replace(/^\s*--.*$/gm,'').split(';').map(v=>v.trim()).filter(Boolean).map(v=>db.prepare(v)));
    const control=await db.prepare('SELECT 1 AS access_check').all();assert.deepEqual(control.results,[{access_check:1}]);
    const cases=[
      {ua:'ExaSearchBot/1.0'}, {ua:'ExaSearchBot/1.0',profile:'2026-10-27.5'},
      {ua:'ExaSearchBot/1.0',profile:'private-canary'}, {ua:'ExaSearchBot/1.0',inner:'private-canary'},
      {ua:'ExaSearchBot/1.0',inner:null}, {ua:'ExaSearchBot/1.0',candidates:['ExaSearchBot','ExaSearchBot']},
      {ua:'private-canary',reason:'unrecognized-browser-claim'}, {ua:'private-canary',reason:'unrecognized-browser-claim',profile:'2026-10-27.5'},
      {ua:'Chrome/151',reason:'fetch-metadata-absent'}, {ua:'Chrome/151',reason:'request-context-conflict',site:'same-origin',referrerState:'external'},
      {ua:'Chrome/151',reason:'request-context-conflict',site:'cross-site',referrerState:'external'},
      {ua:'ExaSearchBot/1.0',failure:'signature-invalid'},
      {ua:'private-canary',reason:'unrecognized-browser-claim',owner:1,referrer:'traffic2cash.xyz'},
      {ua:'private-canary',reason:'unrecognized-browser-claim',referrer:'traffic2cash.xyz'},
      {ua:'Chrome/151',reason:'private-canary'}, {ua:'Chrome/151',reason:'fetch-metadata-unrecognized',mode:'private-canary'},
    ];
    const insert=(id,item)=>{
      const a=analyzeTraffic(item.ua),profile=item.profile??CLASSIFIER_VERSION;
      const c={version:'2026-10-27.2',classifierProfile:Object.hasOwn(item,'inner')?item.inner:profile,declarations:{...a.declarations,...(item.candidates?{candidates:item.candidates}:{})}};
      const signature=verificationEvidence(new Request('https://fixture.example/privacy'),item.failure?{status:'unverified',reason:item.failure}:{status:'absent'},false,a.declarations.candidates);
      return db.prepare(`INSERT INTO page_observations(id,path,daily_client_id,traffic_class,device_type,agent_name,reader_kind,reader_reason,is_owner,referrer_host,referrer_state,sec_fetch_site,sec_fetch_mode,sec_fetch_dest,accepts_html,has_accept_language,classifier_version,classification_evidence,signature_status,signature_evidence) VALUES(CAST(? AS INTEGER),'/privacy',?,'ai','desktop',?,?,?,?,?,?,?,?,'document',1,1,?,?,?,?)`)
        .bind(String(id),BigInt(id).toString(16).padStart(32,'0'),a.agentName,item.reason?'unresolved':'ai-search',item.reason??a.agentName??'fixture',item.owner??0,item.referrer??null,item.referrerState??'absent',item.site??null,item.mode??null,profile,JSON.stringify(c),item.failure?'unverified':null,JSON.stringify(signature));
    };
    const run=async(kind,lower='0',upper='114')=>{const r=await db.prepare(kind==='methods'?METHOD_SQL:CONTEXT_SQL).bind(lower,upper,referralRulesJson(ACTIVE_REFERRAL_POLICY)).all();return{rows:validate(kind,r.results),meta:r.meta};};
    assert.deepEqual((await run('methods')).rows,[]);assert.deepEqual((await run('context')).rows,[]);
    await db.batch(cases.map((item,i)=>insert(i+1,item)));const method=await run('methods'),context=await run('context');
    const sum=(rows,test)=>rows.filter(test).reduce((n,row)=>n+row.views,0);
    assert.equal(sum(method.rows,()=>true),16);assert.equal(sum(method.rows,row=>row.classifier_state==='other-recorded'&&row.declaration==='ExaSearchBot'),2);
    assert.equal(sum(method.rows,row=>row.classifier_state==='conflicting'),1);assert.equal(sum(context.rows,row=>row.unresolved_reason==='unrecognized-browser-claim'&&row.classifier_state==='other-recorded'),1);
    assert.equal(sum(context.rows,row=>row.context_support==='contradicts-retained-context'),1);assert.equal(sum(context.rows,row=>row.inclusion==='owner-excluded'),1);
    assert.equal(sum(context.rows,row=>row.inclusion==='referral-excluded'),1);assert.ok(!JSON.stringify([method,context]).includes('private-canary'));
    const legacy=validateClientMethods((await db.prepare(CLIENT_METHOD_SQL).bind('0','114',referralRulesJson(ACTIVE_REFERRAL_POLICY)).all()).results);
    assert.equal(sum(legacy,row=>row.declaration==='unrecognized'),6);
    for(const kind of ['methods','context']) {
      const rows=kind==='methods'?method.rows:context.rows;
      assert.deepEqual(validate(kind,(await db.prepare(prepare(kind,'0','114')).all()).results),rows);
      for(const change of [r=>r.push(Object.fromEntries(Object.entries(r[0]).reverse())),r=>r[0].views=115,r=>r[0].classifier_state='private-canary']) {const copy=structuredClone(rows);change(copy);assert.throws(()=>validate(kind,copy));}
    }
    await db.prepare('DELETE FROM page_observations').run();await insert('9007199254740993',cases[1]).run();
    assert.equal(sum((await run('methods','9007199254740992','9007199254740993')).rows,()=>true),1);
    assert.throws(()=>prepare('methods','0','115'));assert.throws(()=>prepare('context','1 OR 1=1','2'));
    await db.prepare('DELETE FROM page_observations').run();await db.batch(Array.from({length:114},(_,i)=>insert(i+1,cases[i%cases.length])));
    const scaledMethods=await run('methods'),scaledContext=await run('context');const reads=scaledMethods.meta.rows_read+scaledContext.meta.rows_read;
    assert.ok(reads<PLAN.readReviewThreshold);assert.equal(scaledMethods.meta.rows_written+scaledContext.meta.rows_written,0);
    const h=x=>createHash('sha256').update(x).digest('hex');const receipt={checkedAt:new Date().toISOString(),plan:PLAN,fixtureCases:16,checks:{coherentHistoricalDeclarationsRetained:true,unreviewedProfileNotAuthenticated:true,conflictingProfilesSeparated:true,storedHistoricalReasonRetained:true,currentContextSupportScoped:true,exactLargeIds:true,privateValuesClosed:true,duplicateReorderedGroupsRejected:true,concreteMatchesParameterized:true},scale:{rows:114,methodReads:scaledMethods.meta.rows_read,contextReads:scaledContext.meta.rows_read,totalReads:reads,writes:0},control:{reads:control.meta.rows_read,writes:control.meta.rows_written},sourceHashes:{methods:h(CLIENT_METHOD_SQL),reasons:h(REASON_SQL)},templates:{methods:h(METHOD_SQL),context:h(CONTEXT_SQL)},concreteBytes:{methods:Buffer.byteLength(prepare('methods','0','114')),context:Buffer.byteLength(prepare('context','0','114'))},productionCalls:0};
    writeFileSync(output,JSON.stringify(receipt,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify(receipt));
  }finally{await mf.dispose();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();

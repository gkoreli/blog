import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { KNOWN_AGENT_NAMES, analyzeTraffic } from '../../analytics/.test-dist/classify.js';
import { CLASSIFIER_VERSION } from '../../analytics/.test-dist/versions.js';
import { READER_KINDS } from '../../analytics/.test-dist/contracts.js';
import { FAILURE_OUTCOMES, verificationEvidence } from '../../analytics/.test-dist/signature-evidence.js';
import { VENDOR_IP_SOURCES } from '../../analytics/.test-dist/vendor-ip-sources.js';
import { VENDOR_SIGNATURE_METHODS } from '../../analytics/.test-dist/vendor-signatures.js';
import { signatureLocalStateSql } from '../../analytics/.test-dist/signature-basis.js';
import { signatureCoverageRecordedSql } from '../../analytics/.test-dist/signature-coverage-report.js';
import { vendorSignatureStateSql } from '../../analytics/.test-dist/signature-summary.js';
import { vendorNetworkStateSql } from '../../analytics/.test-dist/vendor-network-summary.js';
import { referralAssessmentCtes, referralRulesJson } from '../../analytics/.test-dist/referral-sql.js';
import { ACTIVE_REFERRAL_POLICY } from '../../analytics/.test-dist/referral-policy.generated.js';
import { networkEvidence } from '../../analytics/test/fixtures/vendor-network-summary.mjs';

export const PLAN = { maximumIdSpan: 712, maximumGroups: 712, maximumReasonEntries: 64,
  postExecutionReadReviewThreshold: 60000, databaseEnforcedReadCap: false, statements: 1, agentAttempts: 1 };
const names = [...KNOWN_AGENT_NAMES].sort();
const reasons = Object.keys(FAILURE_OUTCOMES).sort();
const list = values => values.map(value => "'" + value.replaceAll("'", "''") + "'").join(',');
const ipNames = new Set(VENDOR_IP_SOURCES.flatMap(source => source.declarations));
const signingNames = new Set(VENDOR_SIGNATURE_METHODS.flatMap(method => method.declarations));
export const methodMask = name => (ipNames.has(name) ? 1 : 0) + (signingNames.has(name) ? 2 : 0);
const d = key => `json_extract(classification_evidence,'$.declarations.${key}')`;
const dt = key => `json_type(classification_evidence,'$.declarations.${key}')`;
const declarationValid = `COALESCE(json_extract(classification_evidence,'$.version') IN ('2026-10-27.2','2026-10-29.1','2026-10-29.2')
 AND json_extract(classification_evidence,'$.classifierProfile')='${CLASSIFIER_VERSION}'
 AND ${dt('candidates')}='array' AND json_array_length(classification_evidence,'$.declarations.candidates')<=${names.length}
 AND NOT EXISTS(SELECT 1 FROM json_each(classification_evidence,'$.declarations.candidates') AS candidate WHERE candidate.type<>'text' OR candidate.value NOT IN (${list(names)}))
 AND json_array_length(classification_evidence,'$.declarations.candidates')=(SELECT COUNT(DISTINCT value) FROM json_each(classification_evidence,'$.declarations.candidates'))
 AND ((${d('status')}='none' AND json_array_length(classification_evidence,'$.declarations.candidates')=0)
 OR (${d('status')}='single' AND json_array_length(classification_evidence,'$.declarations.candidates')=1)
 OR (${d('status')}='multiple' AND json_array_length(classification_evidence,'$.declarations.candidates')>1)),0)`;
const fields = ['inclusion','declaration','legacy_agreement','stored_kind','method_mask','local_state','vendor_state','network_state','network_mask','failure_reason','reason_set_state','closed_reasons'];
export const CLIENT_METHOD_SQL = `WITH RECURSIVE
 bounded AS MATERIALIZED (SELECT agent_name,classification_evidence,reader_kind,signature_status,signature_evidence,vendor_ip_evidence,referrer_host,is_owner,daily_client_id FROM page_observations WHERE id>CAST(? AS INTEGER) AND id<=CAST(? AS INTEGER)),
 ${referralAssessmentCtes(`SELECT DISTINCT referrer_host AS original,lower(rtrim(referrer_host,'.')) AS normalized FROM bounded WHERE referrer_host IS NOT NULL AND length(rtrim(referrer_host,'.'))<=253`)},
 facts AS MATERIALIZED (SELECT *,
 CASE WHEN is_owner=1 OR EXISTS(SELECT 1 FROM owner_clients WHERE owner_clients.daily_client_id=bounded.daily_client_id) THEN 'owner-excluded' WHEN COALESCE(referrer_host IN (SELECT original FROM abusive_hosts),0)=1 THEN 'referral-excluded' ELSE 'included' END AS inclusion,
 CASE WHEN classification_evidence IS NULL THEN 'not-recorded' WHEN NOT (${declarationValid}) THEN 'unrecognized' WHEN ${d('status')}='none' THEN 'none' WHEN ${d('status')}='multiple' THEN 'multiple' ELSE ${d('candidates[0]')} END AS declaration,
 CASE WHEN reader_kind IN (${list(READER_KINDS)}) THEN reader_kind WHEN reader_kind IS NULL THEN 'not-recorded' ELSE 'unrecognized' END AS stored_kind,
 ${signatureLocalStateSql()} AS local_state,${signatureCoverageRecordedSql()} AS coverage_valid,${vendorNetworkStateSql()} AS network_state FROM bounded),
 projected AS MATERIALIZED (SELECT inclusion,declaration,
 CASE WHEN declaration IN (${list(names)}) THEN CASE WHEN agent_name=declaration THEN 'matches-single' ELSE 'contradicts-single' END
 WHEN declaration IN ('none','multiple') THEN CASE WHEN agent_name IS NULL THEN 'matches-unselected' ELSE 'contradicts-unselected' END ELSE 'not-assessed' END AS legacy_agreement,
 stored_kind,CASE WHEN declaration IN (${list(names)}) THEN CASE WHEN declaration IN (${list([...ipNames])}) THEN 1 ELSE 0 END + CASE WHEN declaration IN (${list([...signingNames])}) THEN 2 ELSE 0 END ELSE 0 END AS method_mask,
 local_state,${vendorSignatureStateSql()} AS vendor_state,network_state,
 CASE WHEN network_state='recognized' THEN ${['listed','notListed','unavailable','notAssessed'].map((key,i) => `CASE WHEN json_type(vendor_ip_evidence,'$.summary.${key}')='true' THEN ${2**i} ELSE 0 END`).join('+')} ELSE 0 END AS network_mask,
 CASE WHEN local_state<>'unverified' THEN 'not-applicable' WHEN json_type(signature_evidence,'$.localReason') IS NULL THEN 'not-recorded'
 WHEN json_type(signature_evidence,'$.localReason')='text' AND json_extract(signature_evidence,'$.localReason') IN (${list(reasons)}) THEN json_extract(signature_evidence,'$.localReason') ELSE 'unrecognized' END AS failure_reason,
 CASE WHEN local_state<>'unverified' THEN 'not-applicable' WHEN json_type(signature_evidence,'$.localReasons') IS NULL THEN 'not-recorded'
 WHEN json_type(signature_evidence,'$.localReasons')<>'array' OR json_array_length(signature_evidence,'$.localReasons') NOT BETWEEN 1 AND ${PLAN.maximumReasonEntries}
 OR EXISTS(SELECT 1 FROM json_each(signature_evidence,'$.localReasons') AS reason WHERE reason.type<>'text' OR reason.value NOT IN (${list(reasons)}))
 OR NOT EXISTS(SELECT 1 FROM json_each(signature_evidence,'$.localReasons') AS reason WHERE reason.type='text' AND reason.value=json_extract(signature_evidence,'$.localReason'))
 OR json_array_length(signature_evidence,'$.localReasons')<>(SELECT COUNT(DISTINCT value) FROM json_each(signature_evidence,'$.localReasons')) THEN 'unrecognized' ELSE 'recognized' END AS reason_set_state,
 CASE WHEN local_state='unverified' AND json_type(signature_evidence,'$.localReasons')='array' AND json_array_length(signature_evidence,'$.localReasons') BETWEEN 1 AND ${PLAN.maximumReasonEntries}
 THEN (SELECT json_group_array(value) FROM (SELECT DISTINCT value FROM json_each(signature_evidence,'$.localReasons') WHERE type='text' AND value IN (${list(reasons)}) ORDER BY value)) ELSE '[]' END AS closed_reasons FROM facts)
 SELECT ${fields.join(',')},COUNT(*) AS views FROM projected GROUP BY ${fields.join(',')} ORDER BY ${fields.join(',')} LIMIT ${PLAN.maximumGroups+1}`;

export function prepareClientMethods(lower, upper) {
  for (const value of [lower, upper]) assert.ok(typeof value === 'string' && /^(0|[1-9][0-9]{0,18})$/.test(value) && BigInt(value) <= 9223372036854775807n);
  assert.ok(BigInt(upper) >= BigInt(lower) && BigInt(upper) - BigInt(lower) <= BigInt(PLAN.maximumIdSpan));
  const values = [lower, upper, referralRulesJson(ACTIVE_REFERRAL_POLICY)]; let index = 0;
  const sql = CLIENT_METHOD_SQL.replace(/\?/g, () => "'" + values[index++].replaceAll("'", "''") + "'");
  assert.equal(index, values.length); return sql + ';\n';
}

export function validateClientMethods(rows, limits = PLAN) {
  assert.ok(Array.isArray(rows) && rows.length <= limits.maximumGroups);
  const allowed = { inclusion: ['included','owner-excluded','referral-excluded'], declaration: [...names,'none','multiple','not-recorded','unrecognized'],
    legacy_agreement: ['matches-single','contradicts-single','matches-unselected','contradicts-unselected','not-assessed'], stored_kind: [...READER_KINDS,'not-recorded','unrecognized'],
    local_state: ['verified','unverified','absent','test-injected','unrecognized','outcome-only','not-recorded'],
    vendor_state: ['not-recorded','unrecognized','no-declaration','not-configured','not-verified','matching-origin','different-origin','conflicting-origins','test-injected'],
    network_state: ['recognized','unrecognized','not-recorded'], failure_reason: [...reasons,'not-applicable','not-recorded','unrecognized'], reason_set_state: ['recognized','not-applicable','not-recorded','unrecognized'] };
  const seen = new Set(); let total = 0;
  for (const row of rows) {
    assert.deepEqual(Object.keys(row).sort(), [...fields,'views'].sort());
    for (const [key, values] of Object.entries(allowed)) assert.ok(values.includes(row[key]), key);
    assert.equal(row.method_mask, methodMask(row.declaration));
    assert.ok(Number.isInteger(row.network_mask) && row.network_mask >= 0 && row.network_mask < 16);
    assert.ok(row.network_state === 'recognized' || row.network_mask === 0);
    assert.ok(typeof row.closed_reasons === 'string'); const closed = JSON.parse(row.closed_reasons);
    assert.ok(Array.isArray(closed) && closed.length <= reasons.length && closed.every(reason => reasons.includes(reason)));
    assert.deepEqual(closed, [...new Set(closed)].sort());
    if (row.local_state !== 'unverified') { assert.equal(row.failure_reason,'not-applicable'); assert.equal(row.reason_set_state,'not-applicable'); assert.deepEqual(closed,[]); }
    if (row.reason_set_state === 'recognized') assert.ok(reasons.includes(row.failure_reason) && closed.includes(row.failure_reason));
    assert.ok(Number.isSafeInteger(row.views) && row.views > 0); total += row.views;
    const key = JSON.stringify(fields.map(field => row[field])); assert.ok(!seen.has(key)); seen.add(key);
  }
  assert.ok(total <= limits.maximumIdSpan); return rows;
}

async function main() {
  const output = process.argv[2]; assert.ok(output);
  const req = createRequire(resolve('package.json'));
  const { Miniflare } = await import(pathToFileURL(req.resolve('miniflare', {paths:[dirname(req.resolve('wrangler/package.json'))]})));
  const mf = new Miniflare({modules:true,script:'export default{fetch(){return new Response("client method fixtures")}}',compatibilityDate:'2026-03-06',cf:{},d1Databases:{DB:'retained-client-methods'}});
  try {
    const db = await mf.getD1Database('DB');
    const schema = readFileSync('packages/analytics/schema.sql','utf8').replace(/^\s*--.*$/gm,'');
    await db.batch(schema.split(';').map(value => value.trim()).filter(Boolean).map(value => db.prepare(value)));
    const run = async (lower='0',upper='712') => { const result=await db.prepare(CLIENT_METHOD_SQL).bind(lower,upper,referralRulesJson(ACTIVE_REFERRAL_POLICY)).all(); return {rows:validateClientMethods(result.results),meta:result.meta}; };
    assert.deepEqual((await run()).rows,[]);
    const request = new Request('https://publication.example/privacy');
    const cases = [
      {ua:'ExaSearchBot/1.0'}, {ua:'ExaUser/1.0',failure:'directory-unavailable'},
      {ua:'AhrefsBot/7.0',outcome:'listed'}, {ua:'GPTBot/1.0',outcome:'not-assessed'},
      {ua:'ClaudeBot/1.0'}, {ua:'ExaSearchBot/1.0 Google-Agent/1.0'}, {ua:'private-canary'},
      {ua:'ExaSearchBot/1.0',owner:1,referrer:'traffic2cash.xyz'}, {ua:'ExaSearchBot/1.0',referrer:'traffic2cash.xyz'},
      {ua:'ExaUser/1.0',failure:'key-not-found',reasons:['key-not-found','directory-unavailable']},
      {ua:'ExaUser/1.0',failure:'private-canary'}, {ua:'ExaUser/1.0',override:{declarations:{status:'single',candidates:['private-canary']}}},
      {ua:'ExaUser/1.0',override:{declarations:{status:'single',candidates:['ExaUser','ExaUser']}}},
      {ua:'ExaUser/1.0',override:{classifierProfile:'private-canary'}}, {ua:'ExaUser/1.0',legacy:'AhrefsBot'},
    ];
    const insert = (id, item) => {
      const analysis = analyzeTraffic(item.ua);
      const result = item.failure ? {status:'unverified',reason:item.failure,reasons:item.reasons} : {status:'absent'};
      const signature = verificationEvidence(request,result,false,analysis.declarations.candidates);
      const source = VENDOR_IP_SOURCES.find(source => source.declarations.some(name => analysis.declarations.candidates.includes(name)));
      const network = networkEvidence(source ? item.outcome ?? 'listed' : null,{source:source?.id});
      const classification = {version:'2026-10-27.2',classifierProfile:CLASSIFIER_VERSION,declarations:analysis.declarations,...item.override};
      return db.prepare(`INSERT INTO page_observations(id,path,daily_client_id,traffic_class,device_type,is_owner,referrer_host,agent_name,reader_kind,classification_evidence,signature_status,signature_evidence,vendor_ip_evidence) VALUES(CAST(? AS INTEGER),'/privacy',?,'ai','desktop',?,?,?,'ai-search',?,?,?,?)`)
        .bind(String(id),String(id).padStart(32,'0'),item.owner??0,item.referrer??null,item.legacy??analysis.agentName,JSON.stringify(classification),result.status==='unverified'?'unverified':null,JSON.stringify(signature),JSON.stringify(network));
    };
    await db.batch(cases.map((item,index) => insert(index+1,item)));
    const small=await run(); assert.equal(small.rows.reduce((n,row)=>n+row.views,0),cases.length);
    const sum = predicate => small.rows.filter(predicate).reduce((n,row)=>n+row.views,0);
    assert.equal(sum(row=>row.declaration==='unrecognized'),3); assert.equal(sum(row=>row.declaration==='multiple'),1);
    assert.equal(sum(row=>row.legacy_agreement==='contradicts-single'),1);
    assert.equal(sum(row=>row.inclusion==='owner-excluded'),1); assert.equal(sum(row=>row.inclusion==='referral-excluded'),1);
    assert.equal(sum(row=>row.failure_reason==='directory-unavailable'),1); assert.equal(sum(row=>row.failure_reason==='unrecognized'),1);
    assert.ok(small.rows.some(row=>row.closed_reasons==='["directory-unavailable","key-not-found"]'));
    assert.equal(JSON.stringify(small.rows).includes('private-canary'),false);
    assert.deepEqual(validateClientMethods((await db.prepare(prepareClientMethods('0','712')).all()).results),small.rows);
    for (const mutate of [rows=>rows.push(Object.fromEntries(Object.entries(rows[0]).reverse())),rows=>rows[0].declaration='private-canary',rows=>rows[0].method_mask=4,rows=>rows[0].closed_reasons='["private-canary"]',rows=>rows[0].views=713,rows=>rows[0].extra=true]) {
      const rows=structuredClone(small.rows); mutate(rows); assert.throws(()=>validateClientMethods(rows));
    }
    for (const pair of [['0','713'],['1 OR 1=1','2'],['3','2'],['0','9223372036854775808']]) assert.throws(()=>prepareClientMethods(...pair));
    await db.prepare('DELETE FROM page_observations').run();
    const lower='9007199254740992', upper='9007199254740993'; await insert(upper,cases[0]).run();
    assert.equal((await run(lower,upper)).rows.reduce((n,row)=>n+row.views,0),1);
    await db.prepare('DELETE FROM page_observations').run();
    for (let start=1; start<=712; start+=32) await db.batch(Array.from({length:Math.min(32,713-start)},(_,index)=>insert(start+index,cases[(start+index)%cases.length])));
    const scale=await run(); assert.equal(scale.rows.reduce((n,row)=>n+row.views,0),712); assert.equal(scale.meta.rows_written,0);
    assert.ok(scale.meta.rows_read<PLAN.postExecutionReadReviewThreshold);
    const receipt={checkedAt:new Date().toISOString(),fixtureRows:cases.length,checks:{empty:true,closedCandidates:true,duplicateCandidateRejected:true,otherProfileRejected:true,legacyDisagreement:true,ownerReferralPrecedence:true,closedReasonSets:true,unknownCanariesAbsent:true,reorderedDuplicateRejected:true,concreteParameterizedEquality:true,exactIdsAboveSafeInteger:true,scopeSpanGuard:true},scale:{rows:712,reads:scale.meta.rows_read,writes:scale.meta.rows_written},plan:PLAN,sqlTemplateSha256:createHash('sha256').update(CLIENT_METHOD_SQL).digest('hex'),productionCalls:0};
    writeFileSync(output,JSON.stringify(receipt,null,2)+'\n',{flag:'wx',mode:0o600}); console.log(JSON.stringify(receipt));
  } finally { await mf.dispose(); }
}
if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) await main();

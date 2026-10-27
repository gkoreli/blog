import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { READER_KINDS } from '../../analytics/.test-dist/contracts.js';
import { CLASSIFIER_VERSION, COLLECTION_VERSION } from '../../analytics/.test-dist/versions.js';
import { ACTIVE_REFERRAL_POLICY } from '../../analytics/.test-dist/referral-policy.generated.js';
import { referralAssessmentCtes, referralRulesJson } from '../../analytics/.test-dist/referral-sql.js';
import { reportedKindSql } from '../../analytics/.test-dist/reporting-kind.js';
import { SIGNATURE_BASES, signatureBasisSql } from '../../analytics/.test-dist/signature-basis.js';
import { isNativeCategoryBasis, nativeCategoryBasisSql } from '../../analytics/.test-dist/native-bot-evidence.js';
import { PUBLIC_SIGNERS } from '../../analytics/.test-dist/signers.js';
import { unreportedKindFixtures, INSERT_UNREPORTED_FIXTURE, unreportedFixtureValues } from '../../analytics/test/fixtures/unreported-kinds.mjs';

const cutoff = '2026-10-27 21:49:00';
const previous = JSON.parse(readFileSync('packages/blog/drafts/research/analytics-retrospective/full-interval.json', 'utf8')).plan;
const kinds = READER_KINDS.map(kind => `'${kind}'`).join(',');
const canonical = `length(observed_at) = 19 AND datetime(observed_at, '+0 seconds') = observed_at`;
const signers = `CASE signature_agent ${PUBLIC_SIGNERS.map(({ origin, name }) =>
  `WHEN '${origin.replaceAll("'", "''")}' THEN '${name.replaceAll("'", "''")}'`).join(' ')} ELSE 'Other' END`;
const columns = ['time_scope', 'audit_interval', 'inclusion', 'owner_source', 'referral_excluded',
  'kind_state', 'reported_kind', 'reason_state', 'collection_profile', 'classifier_profile',
  'signature_basis', 'stored_signer', 'native_category', 'native_booleans', 'declaration_agreement'];
const sql = `WITH RECURSIVE
  boundaries(cutoff, prior_start, prior_end) AS (VALUES (?,?,?)),
  selected AS MATERIALIZED (
    SELECT observed_at, reader_kind, reader_reason, referrer_host, signature_status, signature_agent,
      signature_evidence, classification_evidence, collection_version, classifier_version, is_owner,
      EXISTS(SELECT 1 FROM owner_clients WHERE owner_clients.daily_client_id = page_observations.daily_client_id) AS client_owner,
      CASE WHEN ${canonical} THEN 1 ELSE 0 END AS canonical_time
    FROM page_observations
  ),
  ${referralAssessmentCtes(`SELECT DISTINCT referrer_host AS original, lower(rtrim(referrer_host, '.')) AS normalized
    FROM selected WHERE referrer_host IS NOT NULL AND length(rtrim(referrer_host, '.')) <= 253`)},
  assessed AS MATERIALIZED (
    SELECT selected.*, COALESCE(referrer_host IN (SELECT original FROM abusive_hosts), 0) AS referral_excluded
    FROM selected
  ),
  projected AS MATERIALIZED (
    SELECT
      CASE WHEN canonical_time = 0 THEN 'unrecognized-time'
        WHEN observed_at < cutoff THEN 'before-cutoff' ELSE 'at-or-after-cutoff' END AS time_scope,
      CASE WHEN canonical_time = 0 OR observed_at >= cutoff THEN 'outside-dated-census'
        WHEN observed_at < prior_start THEN 'earlier-than-prior-audit'
        WHEN observed_at < prior_end THEN 'prior-audit-interval' ELSE 'since-prior-audit' END AS audit_interval,
      CASE WHEN is_owner = 1 OR client_owner = 1 THEN 'owner-excluded'
        WHEN referral_excluded = 1 THEN 'referral-excluded' ELSE 'included' END AS inclusion,
      CASE WHEN is_owner = 1 AND client_owner = 1 THEN 'row-and-client'
        WHEN is_owner = 1 THEN 'row' WHEN client_owner = 1 THEN 'client' ELSE 'neither' END AS owner_source,
      referral_excluded,
      CASE WHEN reader_kind IS NULL THEN 'missing' WHEN reader_kind IN (${kinds}) THEN 'known' ELSE 'unrecognized' END AS kind_state,
      ${reportedKindSql()} AS reported_kind,
      CASE WHEN reader_reason IS NULL THEN 'missing' WHEN reader_reason = '' THEN 'empty' ELSE 'present' END AS reason_state,
      CASE WHEN collection_version IS NULL THEN 'not-recorded' WHEN collection_version = '${COLLECTION_VERSION}'
        THEN 'current' ELSE 'other-recorded' END AS collection_profile,
      CASE WHEN classifier_version IS NULL THEN 'not-recorded' WHEN classifier_version = '${CLASSIFIER_VERSION}'
        THEN 'current' ELSE 'other-recorded' END AS classifier_profile,
      ${signatureBasisSql()} AS signature_basis,
      CASE WHEN signature_status = 'verified' THEN ${signers} ELSE 'none' END AS stored_signer,
      ${nativeCategoryBasisSql()} AS native_category,
      CASE WHEN signature_evidence IS NULL THEN 'not-recorded'
        WHEN json_type(signature_evidence, '$.native.verifiedBot') IN ('true','false')
          AND json_type(signature_evidence, '$.native.signedAgent') IN ('true','false') THEN 'both-boolean'
        WHEN json_type(signature_evidence, '$.native.verifiedBot') IN ('true','false')
          OR json_type(signature_evidence, '$.native.signedAgent') IN ('true','false') THEN 'one-boolean'
        WHEN COALESCE(json_type(signature_evidence, '$.native.verifiedBot'), 'null') = 'null'
          AND COALESCE(json_type(signature_evidence, '$.native.signedAgent'), 'null') = 'null' THEN 'unavailable'
        ELSE 'unrecognized-types' END AS native_booleans,
      CASE WHEN classification_evidence IS NULL THEN 'not-recorded'
        WHEN json_extract(classification_evidence, '$.version') = '2026-10-27.2'
          AND json_extract(classification_evidence, '$.categoryAgreement') IN
            ('no-match','single-match','multiple-same-category','multiple-categories')
          THEN json_extract(classification_evidence, '$.categoryAgreement') ELSE 'unrecognized' END AS declaration_agreement,
      CASE WHEN canonical_time = 1 THEN substr(observed_at,1,10) ELSE NULL END AS observed_day
    FROM assessed CROSS JOIN boundaries
  ),
  sections(name) AS (VALUES ('overall'),('groups'))
  SELECT name, CASE name
    WHEN 'overall' THEN (SELECT json_array(json_object('rows',COUNT(*),
      'beforeCutoff',COALESCE(SUM(time_scope = 'before-cutoff'),0),
      'atOrAfterCutoff',COALESCE(SUM(time_scope = 'at-or-after-cutoff'),0),
      'unrecognizedTime',COALESCE(SUM(time_scope = 'unrecognized-time'),0),
      'firstCanonicalDay',MIN(observed_day),'lastCanonicalDay',MAX(observed_day))) FROM projected)
    WHEN 'groups' THEN (SELECT COALESCE(json_group_array(json(row_json)),json('[]')) FROM (
      SELECT json_object(${columns.map(column => `'${column}',${column}`).join(',')},'views',COUNT(*)) AS row_json
      FROM projected GROUP BY ${columns.join(',')} ORDER BY ${columns.join(',')}
    )) END AS payload FROM sections`;
const values = [cutoff, previous.startInclusive, previous.endExclusive, referralRulesJson(ACTIVE_REFERRAL_POLICY)];

// Separate cheap method-boundary supplement; no repeated referral assessment.
export const sourceCensusStatement = {
  sql: `WITH boundaries(cutoff,prior_start,prior_end) AS (VALUES(?,?,?))
    SELECT CASE WHEN observation_source IN ('beacon','edge') THEN observation_source ELSE 'unrecognized' END AS source,
      CASE WHEN NOT COALESCE(${canonical},0) THEN 'unrecognized-time'
        WHEN observed_at < cutoff THEN 'before-cutoff' ELSE 'at-or-after-cutoff' END AS time_scope,
      CASE WHEN NOT COALESCE(${canonical},0) OR observed_at >= cutoff THEN 'outside-dated-census'
        WHEN observed_at < prior_start THEN 'earlier-than-prior-audit'
        WHEN observed_at < prior_end THEN 'prior-audit-interval' ELSE 'since-prior-audit' END AS audit_interval,
      COUNT(*) AS views
    FROM page_observations CROSS JOIN boundaries GROUP BY source,time_scope,audit_interval
    ORDER BY source,time_scope,audit_interval`,
  values: [cutoff,previous.startInclusive,previous.endExclusive],
};
export function decodeSourceCensus(result) {
  const keys=new Set();
  for(const row of result.results) {
    assert.deepEqual(Object.keys(row).sort(),['source','time_scope','audit_interval','views'].sort());
    assert.ok(['beacon','edge','unrecognized'].includes(row.source));
    assert.ok(['before-cutoff','at-or-after-cutoff','unrecognized-time'].includes(row.time_scope));
    assert.ok(['earlier-than-prior-audit','prior-audit-interval','since-prior-audit','outside-dated-census'].includes(row.audit_interval));
    assert.equal(row.audit_interval==='outside-dated-census',row.time_scope!=='before-cutoff');
    assert.ok(Number.isSafeInteger(row.views)&&row.views>0);
    const key=JSON.stringify([row.source,row.time_scope,row.audit_interval]);assert.ok(!keys.has(key));keys.add(key);
  }
  return result.results;
}

export const fallbackDeclarationStatement = {
  sql: `SELECT COUNT(*) AS rows,
      COALESCE(SUM(agent_name IS NULL),0) AS missing_name,
      COALESCE(SUM(agent_name = ''),0) AS empty_name,
      COALESCE(SUM(agent_name IS NOT NULL AND agent_name <> ''),0) AS present_name,
      COALESCE(SUM(classification_evidence IS NOT NULL),0) AS classification_record_present,
      COALESCE(SUM(request_evidence IS NOT NULL),0) AS request_record_present
    FROM page_observations WHERE reader_kind='signed-agent' AND signature_status='verified'
      AND ${canonical} AND observed_at < ? AND signature_agent = ?`,
  values: [cutoff, PUBLIC_SIGNERS.find(row=>row.name==='Exa').origin],
};
export function decodeFallbackDeclaration(result) {
  assert.equal(result.results.length,1);const row=result.results[0];
  assert.deepEqual(Object.keys(row).sort(),['rows','missing_name','empty_name','present_name','classification_record_present','request_record_present'].sort());
  for(const value of Object.values(row)) assert.ok(Number.isSafeInteger(value)&&value>=0&&value<=row.rows);
  assert.equal(row.rows,row.missing_name+row.empty_name+row.present_name);return row;
}

export function decodeCensus(result) {
  assert.equal(result.results.length, 2);
  const sections = Object.fromEntries(result.results.map(row => [row.name, JSON.parse(row.payload)]));
  assert.deepEqual(Object.keys(sections).sort(), ['groups', 'overall']);
  assert.equal(sections.overall.length, 1);
  const total = sections.overall[0];
  assert.deepEqual(Object.keys(total).sort(), ['rows','beforeCutoff','atOrAfterCutoff','unrecognizedTime','firstCanonicalDay','lastCanonicalDay'].sort());
  for (const key of ['firstCanonicalDay','lastCanonicalDay']) {
    const day=total[key];
    assert.ok(day===null || (typeof day==='string' && /^\d{4}-\d{2}-\d{2}$/.test(day)
      && new Date(day+'T00:00:00Z').toISOString().slice(0,10)===day));
  }
  for (const key of ['rows', 'beforeCutoff', 'atOrAfterCutoff', 'unrecognizedTime']) assert.ok(Number.isSafeInteger(total[key]) && total[key] >= 0);
  assert.equal(total.rows, total.beforeCutoff + total.atOrAfterCutoff + total.unrecognizedTime);
  const sets = { time_scope: ['before-cutoff','at-or-after-cutoff','unrecognized-time'],
    audit_interval: ['outside-dated-census','earlier-than-prior-audit','prior-audit-interval','since-prior-audit'],
    inclusion: ['included','owner-excluded','referral-excluded'], owner_source: ['row-and-client','row','client','neither'],
    referral_excluded: [0,1], kind_state: ['missing','known','unrecognized'], reported_kind: READER_KINDS,
    reason_state: ['missing','empty','present'], collection_profile: ['not-recorded','current','other-recorded'],
    classifier_profile: ['not-recorded','current','other-recorded'], signature_basis: SIGNATURE_BASES,
    stored_signer: ['none','Other',...PUBLIC_SIGNERS.map(row => row.name)],
    native_booleans: ['not-recorded','both-boolean','one-boolean','unavailable','unrecognized-types'],
    declaration_agreement: ['not-recorded','unrecognized','no-match','single-match','multiple-same-category','multiple-categories'] };
  const keys = new Set();
  for (const row of sections.groups) {
    assert.deepEqual(Object.keys(row).sort(), [...columns, 'views'].sort());
    for (const [key, allowed] of Object.entries(sets)) assert.ok(allowed.includes(row[key]), `Invalid ${key}`);
    assert.ok(isNativeCategoryBasis(row.native_category));
    assert.ok(Number.isSafeInteger(row.views) && row.views > 0);
    assert.equal(row.audit_interval==='outside-dated-census', row.time_scope!=='before-cutoff');
    assert.equal(row.inclusion, row.owner_source!=='neither' ? 'owner-excluded' : row.referral_excluded ? 'referral-excluded' : 'included');
    if (row.kind_state!=='known') assert.equal(row.reported_kind,'unresolved');
    const key = JSON.stringify(columns.map(column => row[column])); assert.ok(!keys.has(key)); keys.add(key);
  }
  assert.equal(sections.groups.reduce((sum,row) => sum + row.views,0), total.rows);
  for (const [scope, field] of [['before-cutoff','beforeCutoff'],['at-or-after-cutoff','atOrAfterCutoff'],['unrecognized-time','unrecognizedTime']]) {
    assert.equal(sections.groups.filter(row=>row.time_scope===scope).reduce((sum,row)=>sum+row.views,0),total[field]);
  }
  return sections;
}

async function main() {
const [output, privatePlan] = process.argv.slice(2);
assert.ok(output && privatePlan && ![output, privatePlan].some(existsSync));
const req = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(req.resolve('miniflare', {paths:[dirname(req.resolve('wrangler/package.json'))]})));
const mf = new Miniflare({modules:true, script:'export default {fetch(){return new Response("fixture only")}}', compatibilityDate:'2026-03-06', d1Databases:{DB:'completeness-fixtures',SCALE:'completeness-scale'}});
try {
  const db=await mf.getD1Database('DB'), scale=await mf.getD1Database('SCALE');
  const schema=readFileSync('packages/analytics/schema.sql','utf8').replace(/^\s*--.*$/gm,'');
  for (const database of [db,scale]) await database.batch(schema.split(';').map(s=>s.trim()).filter(Boolean).map(s=>database.prepare(s)));
  const rows=unreportedKindFixtures();
  const extra=[
    {at:'2026-09-08 01:00:00',kind:'browser',reason:null},
    {at:previous.endExclusive,kind:'browser',reason:'fixture'},
    {at:cutoff,kind:'browser',reason:'fixture'},
    {at:'private-time@example.invalid',kind:'browser',reason:''},
    {at:'2026-02-30 00:00:00',kind:'browser',reason:'fixture'},
    {at:'2026-10-27 01:00:00',kind:null,reason:null,owner:0,referrer:'sub.traffic2cash.xyz',marked:true},
    {at:'2026-10-27 01:00:00',kind:'private-kind',reason:null,owner:1,referrer:'TRAFFIC2CASH.XYZ.',marked:true},
    {at:'2026-10-27 01:00:00',kind:'browser',reason:'fixture',referrer:'traffic2cash.xyz.example.invalid'},
  ];
  for (const [i,row] of extra.entries()) rows.push({path:'/fixture',client:(100+i).toString(16).padStart(32,'0'),traffic:'browser',owner:0,referrer:null,agent:null,...row});
  for (const row of rows) {
    await db.prepare(INSERT_UNREPORTED_FIXTURE).bind(...unreportedFixtureValues(row)).run();
    if(row.marked) await db.prepare('INSERT INTO owner_clients(daily_client_id,utc_date) VALUES(?,?)').bind(row.client,'2026-10-27').run();
  }
  // Stored JSON field-shape controls, not real vendor/native verification.
  const category = {version:'2026-10-27.1',status:'known',value:'Search Engine Crawler'};
  const fixtureEvidence = {version:'2026-10-27.4',source:'local-webbotauth',localStatus:'verified',
    coverage:{version:'2026-10-27.1',covered:{userAgent:false}},native:{verifiedBot:false,signedAgent:null,category}};
  const updates = [
    ['verified','https://crawler.exa.ai',fixtureEvidence,{version:'2026-10-27.2',categoryAgreement:'single-match'},COLLECTION_VERSION,CLASSIFIER_VERSION],
    [null,null,{...fixtureEvidence,localStatus:'absent',coverage:null,native:{verifiedBot:null,signedAgent:null,category:{...category,status:'unavailable',value:null}}},
      {version:'2026-10-27.2',categoryAgreement:'multiple-categories'},'earlier-fixture','earlier-fixture'],
    ['verified','https://private-signer.example.invalid',{...fixtureEvidence,source:'test-injected',native:{verifiedBot:true,signedAgent:false,category:{...category,status:'empty',value:null}}},
      {version:'private-profile',categoryAgreement:'private-agreement'},null,null],
    ['verified','https://crawler.exa.ai',null,null,null,null],
    [null,null,{...fixtureEvidence,version:'private-profile',native:{verifiedBot:'true',signedAgent:null,category:{version:'private-profile',status:'known',value:'private-category'}}},
      {version:'2026-10-27.2',categoryAgreement:'no-match'},'private-profile','private-profile'],
  ];
  for (const [i,update] of updates.entries()) await db.prepare(`UPDATE page_observations SET signature_status=?,signature_agent=?,
    signature_evidence=?,classification_evidence=?,collection_version=?,classifier_version=? WHERE id=?`)
    .bind(update[0],update[1],update[2]===null?null:JSON.stringify(update[2]),update[3]===null?null:JSON.stringify(update[3]),update[4],update[5],i+1).run();
  await db.prepare("UPDATE page_observations SET observation_source='beacon',source_event_id=42 WHERE id=16").run();
  const beforeRows=(await db.prepare('SELECT * FROM page_observations ORDER BY id').all()).results;
  const result=await db.prepare(sql).bind(...values).all(), data=decodeCensus(result);
  const sum=predicate=>data.groups.filter(predicate).reduce((n,row)=>n+row.views,0);
  assert.equal(data.overall[0].rows,23); assert.equal(data.overall[0].unrecognizedTime,2); assert.equal(data.overall[0].atOrAfterCutoff,2);
  assert.equal(sum(row=>row.audit_interval==='earlier-than-prior-audit'),1);
  assert.equal(sum(row=>row.audit_interval==='prior-audit-interval'),1);
  assert.equal(sum(row=>row.audit_interval==='since-prior-audit'),17);
  assert.equal(sum(row=>row.inclusion==='owner-excluded'),3);
  assert.equal(sum(row=>row.inclusion==='referral-excluded'),1);
  assert.equal(sum(row=>row.owner_source==='row-and-client'),1);
  assert.equal(sum(row=>row.owner_source==='client' && row.referral_excluded===1),1);
  assert.equal(sum(row=>row.kind_state==='unrecognized'),3);
  assert.equal(sum(row=>row.reason_state==='empty'),1);
  assert.equal(sum(row=>row.kind_state!=='known' && row.reported_kind!=='unresolved'),0);
  for (const basis of ['verified-ua-uncovered','unsigned','test-injected','verified-outcome-only','unrecognized-record']) assert.equal(sum(row=>row.signature_basis===basis),1);
  for (const state of ['one-boolean','both-boolean','unavailable','unrecognized-types']) assert.equal(sum(row=>row.native_booleans===state),1);
  for (const state of ['single-match','multiple-categories','unrecognized','no-match']) assert.equal(sum(row=>row.declaration_agreement===state),1);
  assert.equal(sum(row=>row.stored_signer==='Exa'),2);assert.equal(sum(row=>row.stored_signer==='Other'),1);
  assert.equal(sum(row=>row.native_category==='Search Engine Crawler'),1);assert.equal(sum(row=>row.native_category==='unrecognized'),1);
  assert.equal(JSON.stringify(data).includes('private-'),false);
  assert.deepEqual((await db.prepare('SELECT * FROM page_observations ORDER BY id').all()).results,beforeRows);
  const sourceResult=await db.prepare(sourceCensusStatement.sql).bind(...sourceCensusStatement.values).all();
  const sourceRows=decodeSourceCensus(sourceResult);
  assert.equal(sourceRows.reduce((n,row)=>n+row.views,0),23);
  assert.equal(sourceRows.filter(row=>row.source==='beacon').reduce((n,row)=>n+row.views,0),1);
  assert.equal(sourceRows.find(row=>row.source==='beacon').audit_interval,'earlier-than-prior-audit');
  const fallbackResult=await db.prepare(fallbackDeclarationStatement.sql).bind(...fallbackDeclarationStatement.values).all();
  assert.deepEqual(decodeFallbackDeclaration(fallbackResult),{rows:1,missing_name:1,empty_name:0,present_name:0,classification_record_present:0,request_record_present:0});
  for(const mutate of [
    sections=>{sections.overall[0].unexpected='private-value';},
    sections=>{sections.groups.push(sections.groups[0]);},
    sections=>{sections.groups[0].views=0;},
    sections=>{sections.groups[0].reported_kind='private-kind';},
    sections=>{sections.overall[0].rows++;},
    sections=>{sections.groups[0].inclusion='owner-excluded';sections.groups[0].owner_source='neither';},
  ]) {
    const changed=structuredClone(data);mutate(changed);
    assert.throws(()=>decodeCensus({results:Object.entries(changed).map(([name,payload])=>({name,payload:JSON.stringify(payload)}))}));
  }
  // A native empty result must preserve zero totals rather than omit the census.
  const empty=decodeCensus(await scale.prepare(sql).bind(...values).all());assert.equal(empty.overall[0].rows,0);
  await scale.prepare(`WITH RECURSIVE n(i) AS (VALUES(1) UNION ALL SELECT i+1 FROM n WHERE i<20000)
    INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,observed_at,referrer_host)
    SELECT '/fixture',printf('%032x',i),'browser','desktop',i%101=0,
      CASE WHEN i%7=0 THEN NULL WHEN i%9=0 THEN 'private-kind' ELSE 'browser' END,
      CASE WHEN i%6=0 THEN NULL ELSE 'fixture' END,'2026-10-27 01:00:00',
      CASE WHEN i%10=0 THEN 'traffic2cash.xyz' ELSE 'ref-'||(i%1000)||'.example.invalid' END FROM n`).run();
  const scaledResult=await scale.prepare(sql).bind(...values).all(), scaled=decodeCensus(scaledResult);assert.equal(scaled.overall[0].rows,20000);
  const scaledSourceResult=await scale.prepare(sourceCensusStatement.sql).bind(...sourceCensusStatement.values).all();
  assert.equal(decodeSourceCensus(scaledSourceResult).reduce((n,row)=>n+row.views,0),20000);
  // Separate enriched target fixture; preceding scale costs stay frozen above.
  await scale.prepare(`UPDATE page_observations SET reader_kind='signed-agent',signature_status='verified',signature_agent=?,
    traffic_class='ai',agent_name=CASE WHEN id%3=0 THEN NULL WHEN id%3=1 THEN '' ELSE 'ExaUser' END,
    request_evidence=CASE WHEN id%40=0 THEN '{}' ELSE NULL END,
    classification_evidence=CASE WHEN id%60=0 THEN '{}' ELSE NULL END WHERE id%20=0`)
    .bind(fallbackDeclarationStatement.values[1]).run();
  const scaledFallbackResult=await scale.prepare(fallbackDeclarationStatement.sql).bind(...fallbackDeclarationStatement.values).all();
  assert.deepEqual(decodeFallbackDeclaration(scaledFallbackResult),{rows:1000,missing_name:333,empty_name:333,present_name:334,classification_record_present:333,request_record_present:500});
  const plan={cutoffExclusive:cutoff,priorAudit:previous,policy:{version:ACTIVE_REFERRAL_POLICY.version,sha256:ACTIVE_REFERRAL_POLICY.sha256},sql,values,
    plannedReadCeiling:500000,readCeilingIsDatabaseEnforced:false,productionStatementCount:1,
    method:'One read-only census of every retained page_observations row at query execution; closed grouping, no raw identity/referrer/reason strings. All date buckets and exclusion overlaps reconcile.',
    sqlSha256:createHash('sha256').update(sql).digest('hex'),combinedPlannedReadCeiling:500000,
    sourceSupplement:{...sourceCensusStatement,optional:true,requiresSeparateProductionPlan:true,plannedReadCeiling:100000},
    fallbackSupplement:{...fallbackDeclarationStatement,optional:true,requiresSeparateProductionPlan:true}};
  writeFileSync(privatePlan,JSON.stringify(plan,null,2)+'\n',{flag:'wx',mode:0o600});
  const evidence={checkedAt:new Date().toISOString(),cutoffExclusive:cutoff,policy:plan.policy,querySha256:plan.sqlSha256,
    fixture:{rows:23,unrecognizedTime:2,atOrAfterCutoff:2,ownerExcluded:3,referralExcluded:1,rowsRead:result.meta.rows_read,rowsWritten:result.meta.rows_written},
    scale:{rows:20000,syntheticDistinctReferrers:901,rowsRead:scaledResult.meta.rows_read,rowsWritten:scaledResult.meta.rows_written,groups:scaled.groups.length},
    sourceSupplement:{fixtureRows:23,beaconRows:1,fixtureReads:sourceResult.meta.rows_read,scaleRows:20000,scaleReads:scaledSourceResult.meta.rows_read,rowsWritten:scaledSourceResult.meta.rows_written},
    fallbackSupplement:{fixtureRows:1,fixtureReads:fallbackResult.meta.rows_read,scaleTableRows:20000,scaleMatchedRows:1000,scaleReads:scaledFallbackResult.meta.rows_read,rowsWritten:scaledFallbackResult.meta.rows_written},
    checks:{allRowsPartition:true,ownerMarkAndRowFlags:true,ownerReferralOverlap:true,suffixNormalizationAndLookalikes:true,priorAndCurrentCutoffEdges:true,unrecognizedTimesRetained:true,missingUnknownKindsAndEmptyReasons:true,signatureAndNativeFieldShapes:true,independentDeclaredAgreement:true,reviewedSignerDisplay:true,originalRowsUnchanged:true,rawCanariesWithheld:true,emptyCensus:true,malformedDecoderInputsReject:true,sourceBoundaries:true},
    plannedProductionReadCeiling:500000,limits:['Native synthetic cost is not production metering.','Read ceiling is an operator threshold checked after execution, not a D1-enforced scan cap.','No production calls in this helper. Evidence presence and stored outcomes are not fresh cryptographic verification or human labels.']};
  writeFileSync(output,JSON.stringify(evidence,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(evidence));
} finally {await mf.dispose();}
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();

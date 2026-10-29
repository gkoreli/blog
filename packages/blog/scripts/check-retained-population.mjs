import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { DELTA_SQL, validateDelta, BASELINE_EVENT_CUTOFF } from './check-retained-delta.mjs';
import { ACTIVE_REFERRAL_POLICY } from '../../analytics/.test-dist/referral-policy.generated.js';
import { referralRulesJson } from '../../analytics/.test-dist/referral-sql.js';
import { PUBLIC_SIGNERS } from '../../analytics/.test-dist/signers.js';
import { summaryCases } from '../../analytics/test/fixtures/signature-summary.mjs';
import { networkSummaryCases } from '../../analytics/test/fixtures/vendor-network-summary.mjs';
import { queryStats } from '../../analytics/.test-dist/stats.js';

export const PLAN = { maximumRows: 65536, maximumDetailedRows: 4096, maximumReferralLabels: 131072,
  maximumGroups: 1024, postExecutionReadReviewThreshold: 1500000, databaseEnforcedReadCap: false };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const validTime = "COALESCE(length(observed_at)=19 AND datetime(observed_at,'+0 seconds')=observed_at,0)";
const labels = "CASE WHEN referrer_host IS NOT NULL AND length(rtrim(referrer_host,'.'))<=253 THEN 1+length(rtrim(referrer_host,'.'))-length(replace(rtrim(referrer_host,'.'),'.','')) ELSE 0 END";
export const PREFLIGHT_SQL = `SELECT COUNT(*) AS rows,CAST(MIN(id) AS TEXT) AS lowerId,CAST(MAX(id) AS TEXT) AS upperId,
 COALESCE(SUM(signature_evidence IS NOT NULL),0) AS detailedRows,COALESCE(SUM(${labels}),0) AS referralLabels
 FROM (SELECT id,signature_evidence,referrer_host FROM page_observations ORDER BY id LIMIT ${PLAN.maximumRows + 1})`;
const core = ['inclusion','time_scope','stored_kind','collection_state','classifier_state','evidence_state','local_state','basis','profile','native_state','vendor_state','network_state','binding_mask','native_mask','network_mask'];
const extra = ['id_scope','source','reason_state','declaration_agreement','legacy_signer','legacy_name_state','exclusion_overlap'];
const fields = [...core, ...extra];
function replaceOnce(text, old, next) { assert.equal(text.split(old).length, 2, 'Upstream census shape changed'); return text.replace(old, next); }
// Guarded adaptation reuses the exact production projectors in the delta helper.
// It changes selection and adds closed dimensions; existing projectors stay intact.
assert.ok(DELTA_SQL.indexOf(' groups AS (') > 0);
let prefix = DELTA_SQL.slice(0, DELTA_SQL.indexOf(' groups AS ('));
assert.ok(prefix.length > 1000);
prefix = replaceOnce(prefix, 'SELECT * FROM page_observations WHERE id>CAST(? AS INTEGER) AND id<=CAST(? AS INTEGER)',
  `SELECT * FROM page_observations WHERE id<=CAST(? AS INTEGER) ORDER BY id LIMIT ${PLAN.maximumRows + 1}`);
prefix = replaceOnce(prefix, 'facts AS MATERIALIZED (SELECT signature_evidence,vendor_ip_evidence,',
  'facts AS MATERIALIZED (SELECT id,observation_source,classification_evidence,reader_kind,reader_reason,agent_name,signature_agent,signature_status,is_owner,daily_client_id,referrer_host,signature_evidence,vendor_ip_evidence,');
const signers = `CASE signature_agent ${PUBLIC_SIGNERS.map(row => `WHEN '${row.origin}' THEN '${row.name}'`).join(' ')} ELSE 'Other' END`;
prefix = replaceOnce(prefix, 'projected AS MATERIALIZED (SELECT inclusion,', `projected AS MATERIALIZED (SELECT
 CASE WHEN id<=CAST(? AS INTEGER) THEN 'at-or-below-previous-bound' ELSE 'above-previous-bound' END AS id_scope,
 CASE WHEN observation_source IN ('edge','beacon') THEN observation_source ELSE 'unrecognized' END AS source,
 CASE WHEN reader_reason IS NULL THEN 'missing' WHEN reader_reason='' THEN 'empty' ELSE 'present' END AS reason_state,
 CASE WHEN classification_evidence IS NULL THEN 'not-recorded'
 WHEN json_extract(classification_evidence,'$.version') IN ('2026-10-27.2','2026-10-29.1') AND json_extract(classification_evidence,'$.categoryAgreement') IN ('no-match','single-match','multiple-same-category','multiple-categories')
 THEN json_extract(classification_evidence,'$.categoryAgreement') ELSE 'unrecognized' END AS declaration_agreement,
 CASE WHEN reader_kind='signed-agent' AND signature_status='verified' THEN ${signers} ELSE 'none' END AS legacy_signer,
 CASE WHEN reader_kind='signed-agent' AND signature_status='verified' THEN CASE WHEN agent_name IS NULL THEN 'missing' ELSE 'present' END ELSE 'not-applicable' END AS legacy_name_state,
 CASE WHEN inclusion='owner-excluded' THEN COALESCE(referrer_host IN (SELECT original FROM abusive_hosts),0) ELSE 0 END AS exclusion_overlap,
 inclusion,`);
function objectSql(columns) { return `json_object(${columns.map(name => `'${name}',${name}`).join(',')})`; }
const rowJson = `json_patch(${objectSql(fields.slice(0, 15))},${objectSql([...fields.slice(15), 'views'])})`;
export const CENSUS_SQL = `${prefix}
 groups AS (SELECT ${fields.join(',')},COUNT(*) AS views FROM projected GROUP BY ${fields.join(',')} ORDER BY ${fields.join(',')} LIMIT ${PLAN.maximumGroups + 1})
 SELECT 'totals' AS section,json_object('rows',COUNT(*),'detailedRows',COALESCE(SUM(signature_evidence IS NOT NULL),0),
 'firstObservedAt',MIN(CASE WHEN ${validTime} THEN observed_at END),'lastObservedAt',MAX(CASE WHEN ${validTime} THEN observed_at END)) AS payload FROM bounded
 UNION ALL SELECT 'groups',json_group_array(json(${rowJson})) FROM groups`;
assert.ok(Buffer.byteLength(CENSUS_SQL) < 97000);
function id(value) { assert.ok(typeof value === 'string' && /^(0|-?[1-9][0-9]{0,18})$/.test(value)); assert.ok(BigInt(value) >= -9223372036854775808n && BigInt(value) <= 9223372036854775807n); return value; }
function concrete(sql, values) { let count = 0; const value = sql.replace(/\?/g, () => `'${values[count++].replaceAll("'", "''")}'`); assert.equal(count, values.length); return value + ';\n'; }
export function prepareCensus(upper, previous) { return concrete(CENSUS_SQL, [id(upper), referralRulesJson(ACTIVE_REFERRAL_POLICY), id(previous)]); }
export function validatePreflight(row) {
  assert.deepEqual(Object.keys(row).sort(), ['rows','lowerId','upperId','detailedRows','referralLabels'].sort());
  for (const key of ['rows','detailedRows','referralLabels']) assert.ok(Number.isSafeInteger(row[key]) && row[key] >= 0);
  assert.ok(row.rows <= PLAN.maximumRows && row.detailedRows <= Math.min(row.rows, PLAN.maximumDetailedRows) && row.referralLabels <= PLAN.maximumReferralLabels);
  if (row.rows === 0) { assert.equal(row.lowerId, null); assert.equal(row.upperId, null); }
  else assert.ok(BigInt(id(row.lowerId)) <= BigInt(id(row.upperId)));
  return row;
}
export function validateCensus(rows) {
  assert.ok(Array.isArray(rows) && rows.length === 2);
  const totalsRow = rows.find(row => row.section === 'totals'), groupRow = rows.find(row => row.section === 'groups');
  assert.ok(totalsRow && groupRow); assert.equal(rows.filter(row => row.section === 'groups').length, 1);
  for (const row of rows) assert.deepEqual(Object.keys(row).sort(), ['payload','section']);
  const totals = JSON.parse(totalsRow.payload), groups = JSON.parse(groupRow.payload), seen = new Set(), reduced = new Map();
  assert.ok(Array.isArray(groups) && groups.length <= PLAN.maximumGroups);
  const enums = { id_scope: ['at-or-below-previous-bound','above-previous-bound'], source: ['edge','beacon','unrecognized'],
    reason_state: ['missing','empty','present'], declaration_agreement: ['not-recorded','unrecognized','no-match','single-match','multiple-same-category','multiple-categories'],
    legacy_signer: ['none','Other',...PUBLIC_SIGNERS.map(row => row.name)], legacy_name_state: ['not-applicable','missing','present'] };
  for (const row of groups) {
    assert.deepEqual(Object.keys(row).sort(), [...fields,'views'].sort());
    for (const [field, allowed] of Object.entries(enums)) assert.ok(allowed.includes(row[field]), field);
    assert.ok(row.exclusion_overlap === 0 || row.exclusion_overlap === 1 && row.inclusion === 'owner-excluded');
    assert.equal(row.legacy_signer === 'none', row.legacy_name_state === 'not-applicable');
    const key = JSON.stringify(fields.map(field => row[field])); assert.ok(!seen.has(key)); seen.add(key);
    const base = Object.fromEntries(core.map(field => [field, row[field]])), baseKey = JSON.stringify(core.map(field => row[field]));
    const prior = reduced.get(baseKey); if (prior) prior.views += row.views; else reduced.set(baseKey, {...base, views:row.views});
    assert.ok(Number.isSafeInteger(row.views) && row.views > 0);
  }
  validateDelta([{section:'totals',payload:JSON.stringify(totals)}, {section:'groups',payload:JSON.stringify([...reduced.values()])}], PLAN);
  assert.ok(totals.detailedRows <= PLAN.maximumDetailedRows);
  return {totals,groups};
}
export function summarize(value) {
  const partitions = {};
  for (const row of value.groups) {
    for (const scope of ['all', row.id_scope]) {
      const output = partitions[scope] ??= { rows:0, inclusion:{}, included:{}, allEvidence:{} };
      output.rows += row.views; output.inclusion[row.inclusion] = (output.inclusion[row.inclusion] ?? 0) + row.views;
      for (const field of ['stored_kind','basis','local_state','profile','native_state','network_state','reason_state','declaration_agreement','source','collection_state','classifier_state','legacy_signer','legacy_name_state','exclusion_overlap','binding_mask','native_mask','network_mask']) {
        const raw = output.allEvidence[field] ??= {}; raw[row[field]] = (raw[row[field]] ?? 0) + row.views;
        if (row.inclusion === 'included') { const included = output.included[field] ??= {}; included[row[field]] = (included[row[field]] ?? 0) + row.views; }
      }
    }
  }
  return {totals:value.totals,partitions};
}

async function main() {
  const output = process.argv[2]; assert.ok(output);
  const require = createRequire(resolve('package.json'));
  const {Miniflare} = await import(pathToFileURL(require.resolve('miniflare',{paths:[dirname(require.resolve('wrangler/package.json'))]})));
  const mf = new Miniflare({modules:true,script:'export default{fetch(){return new Response("population fixture")}}',compatibilityDate:'2026-03-06',cf:{},d1Databases:{DB:'population-fixture'}});
  try {
    const db = await mf.getD1Database('DB');
    await db.batch(readFileSync('packages/analytics/schema.sql','utf8').replace(/^\s*--.*$/gm,'').split(';').map(s=>s.trim()).filter(Boolean).map(s=>db.prepare(s)));
    const run = async (upper, previous) => { const result=await db.prepare(CENSUS_SQL).bind(upper,referralRulesJson(ACTIVE_REFERRAL_POLICY),previous).all();return {...validateCensus(result.results),meta:result.meta}; };
    const insert = (n, signature={e:null,status:null}, network=null, options={}) => db.prepare(`INSERT INTO page_observations(id,path,daily_client_id,traffic_class,device_type,reader_kind,reader_reason,is_owner,referrer_host,observed_at,signature_status,signature_evidence,vendor_ip_evidence,collection_version,classifier_version,observation_source,classification_evidence,signature_agent,agent_name) VALUES(CAST(? AS INTEGER),'/privacy',?,'bot','desktop',?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(String(n),BigInt(n<0?-n:n).toString(16).padStart(32,'0'),options.kind??'seo-crawler',Object.hasOwn(options,'reason')?options.reason:'fixture',options.owner??0,options.referrer??null,options.at??'2026-10-29 00:00:00',signature.status,signature.e===null?null:JSON.stringify(signature.e),network===null?null:JSON.stringify(network),'2026-10-29.3','2026-10-29.1',options.source??'edge',options.classification?JSON.stringify(options.classification):null,options.signer??null,options.name??null);
    assert.equal((await run('0','0')).totals.rows,0);
    await db.batch(summaryCases.map((row,i)=>insert(i+1,row)));
    await db.batch(networkSummaryCases.map((row,i)=>insert(100+i,undefined,row.e)));
    const fixture = await run('200','50'), report=await queryStats(db,{range:'all',traffic:'all'},new Date('2026-10-29T01:00:00Z'));
    assert.equal(fixture.totals.rows,report.totals.views);
    const included=fixture.groups.filter(row=>row.inclusion==='included'), sum=predicate=>included.filter(predicate).reduce((n,row)=>n+row.views,0);
    assert.equal(sum(row=>row.local_state==='verified'),report.verification.localVerifiedViews);
    assert.equal(sum(row=>row.basis==='verified-ua-covered'),report.verification.userAgentBoundViews);
    assert.equal(sum(row=>row.network_state==='recognized'),report.vendorNetwork.recognizedViews);
    await db.batch([insert(-1,undefined,null,{source:'beacon',kind:'private-canary',reason:null}),insert(0,undefined,null,{owner:1,referrer:'traffic2cash.xyz'}),insert(201,undefined,null,{referrer:'traffic2cash.xyz'}),insert(202,undefined,null,{at:'2026-02-30 00:00:00',reason:''}),insert(203,{e:null,status:'verified'},null,{kind:'signed-agent',signer:'https://crawler.exa.ai'})]);
    await db.prepare("INSERT INTO owner_clients(daily_client_id,utc_date) VALUES(?,'2026-10-29')").bind(BigInt(202).toString(16).padStart(32,'0')).run();
    const edges=await run('203','200'); assert.equal(edges.totals.rows,fixture.totals.rows+5);
    assert.equal(edges.groups.filter(row=>row.id_scope==='above-previous-bound').reduce((n,row)=>n+row.views,0),3);
    assert.equal(edges.groups.filter(row=>row.source==='beacon').reduce((n,row)=>n+row.views,0),1);
    assert.equal(edges.groups.filter(row=>row.exclusion_overlap===1).reduce((n,row)=>n+row.views,0),1);
    assert.equal(edges.groups.filter(row=>row.inclusion==='owner-excluded').reduce((n,row)=>n+row.views,0),2);
    assert.equal(JSON.stringify(edges).includes('private-canary'),false);
    const raw=(await db.prepare(CENSUS_SQL).bind('203',referralRulesJson(ACTIVE_REFERRAL_POLICY),'200').all()).results;
    for (const alter of [rows=>rows.push({...rows[0],...Object.fromEntries(Object.entries(rows[0]).reverse())}),rows=>rows[0].source='private-canary',rows=>rows[0].views++]) {
      const groups=structuredClone(edges.groups);alter(groups);assert.throws(()=>validateCensus([raw[0],{section:'groups',payload:JSON.stringify(groups)}]));
    }
    await db.prepare('DELETE FROM page_observations').run();
    await db.prepare('DELETE FROM owner_clients').run();
    await db.batch([insert('9007199254740992'),insert('9007199254740993')]);
    const exact=await db.prepare(PREFLIGHT_SQL).first();validatePreflight(exact);assert.equal(exact.upperId,'9007199254740993');
    const precise=await run(exact.upperId,'9007199254740992');assert.equal(precise.groups.filter(row=>row.id_scope==='above-previous-bound').reduce((n,row)=>n+row.views,0),1);
    assert.deepEqual(validateCensus((await db.prepare(prepareCensus(exact.upperId,'9007199254740992')).all()).results).groups,precise.groups);
    await db.prepare('DELETE FROM page_observations').run();
    for(let start=0;start<PLAN.maximumRows;start+=128) await db.batch(Array.from({length:128},(_,offset)=>{
      const i=start+offset;return insert(i+1,i<PLAN.maximumDetailedRows?summaryCases[0]:undefined,null,{referrer:i<1024?[...Array(123).fill('a'),'n'+i.toString(36)].join('.'):null});
    }));
    const pre=await db.prepare(PREFLIGHT_SQL).all();validatePreflight(pre.results[0]);
    const scale=await run(pre.results[0].upperId,'32768');assert.equal(scale.totals.rows,PLAN.maximumRows);
    const reads=pre.meta.rows_read+scale.meta.rows_read;assert.ok(reads<=PLAN.postExecutionReadReviewThreshold);
    assert.equal(pre.meta.rows_written+scale.meta.rows_written,0);
    await insert(65537).run();const sentinel=await db.prepare(PREFLIGHT_SQL).first();assert.equal(sentinel.rows,65537);assert.throws(()=>validatePreflight(sentinel));
    const receipt={checkedAt:new Date().toISOString(),plan:PLAN,runtime:process.version,signatureCases:summaryCases.length,networkCases:networkSummaryCases.length,
      checks:{negativeAndZeroIdsIncluded:true,exactAdjacentLargeIds:true,concreteMatchesParameterized:true,ownerReferralOverlap:true,legacyBeaconSource:true,unknownKindAndMissingReasonVisible:true,duplicateReorderedGroupsRejected:true,privateValuesClosed:true,sentinelStopsExecution:true},
      scale:{rows:scale.totals.rows,detailedRows:scale.totals.detailedRows,referralLabels:pre.results[0].referralLabels,preflightReads:pre.meta.rows_read,censusReads:scale.meta.rows_read,combinedReads:reads,writes:0},
      sqlBytes:Buffer.byteLength(CENSUS_SQL),sqlSha256:hash(CENSUS_SQL),preflightSha256:hash(PREFLIGHT_SQL),baselineEventCutoff:BASELINE_EVENT_CUTOFF,productionCalls:0};
    writeFileSync(output,JSON.stringify(receipt,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify(receipt));
  } finally { await mf.dispose(); }
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) await main();

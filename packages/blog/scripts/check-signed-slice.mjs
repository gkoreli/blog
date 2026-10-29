import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { signatureLocalStateSql } from '../../analytics/.test-dist/signature-basis.js';
import { isReportedVerifierProfile } from '../../analytics/.test-dist/verifier-profile.js';

export const PLAN = { maximumIdSpan:114, maximumRows:114, readReviewThreshold:500,
  maximumStatements:2, attemptsPerStatement:1, databaseEnforcedReadCap:false };
const columns = {
  privateReference:'CAST(id AS TEXT)', observedAt:'observed_at', collectionVersion:'collection_version',
  classifierVersion:'classifier_version', path:'path', representation:'representation', observationSource:'observation_source',
  readerKind:'reader_kind', agentName:'agent_name', signatureStatus:'signature_status', signatureAgent:'signature_agent',
  signatureEvidence:'signature_evidence', classificationEvidence:'classification_evidence', vendorIpEvidence:'vendor_ip_evidence',
  ownerFlag:'is_owner', referrerHost:'referrer_host', optionalCaptureAbsent:'request_evidence IS NULL',
};
const entries=Object.entries(columns), jsonFields=['signatureEvidence','classificationEvidence','vendorIpEvidence'];
const object=values=>`json_object(${values.map(([key,value])=>`'${key}',${value}`).join(',')})`;
// json_set preserves explicit nulls; Merge Patch would remove those keys.
const payload=`json_set(${object(entries.slice(0,12))},${entries.slice(12).map(([key,value])=>`'$.${key}',${value}`).join(',')})`;
export const SLICE_SQL = `SELECT CAST(id AS TEXT) AS privateReference,signature_status AS signatureStatus,
 ${signatureLocalStateSql()} AS localState,
 CASE WHEN signature_status='verified' OR json_extract(signature_evidence,'$.localStatus')='verified'
 THEN ${payload} ELSE NULL END AS proofProjection
 FROM page_observations WHERE id>CAST(? AS INTEGER) AND id<=CAST(? AS INTEGER) ORDER BY id LIMIT ${PLAN.maximumRows+1}`;
function id(value) { assert.ok(typeof value==='string'&&/^(0|[1-9][0-9]{0,18})$/.test(value)&&BigInt(value)<=9223372036854775807n);return value; }
export function prepareSlice(lower,upper) {
  assert.ok(BigInt(id(upper))>=BigInt(id(lower))&&BigInt(upper)-BigInt(lower)<=BigInt(PLAN.maximumIdSpan));
  let n=0;const values=[lower,upper],sql=SLICE_SQL.replace(/\?/g,()=>`'${values[n++]}'`)+';\n';assert.equal(n,2);return sql;
}
export function normalizeProjection(row) {
  assert.ok(row&&typeof row==='object'&&!Array.isArray(row));
  assert.deepEqual(Object.keys(row).sort(),Object.keys(columns).sort());id(row.privateReference);
  const result={...row};
  for(const key of jsonFields) {assert.ok(row[key]===null||typeof row[key]==='string');result[key]=row[key]===null?null:JSON.parse(row[key]);}
  return result;
}
export function validateSlice(rows,lower,upper) {
  prepareSlice(lower,upper);assert.ok(Array.isArray(rows)&&rows.length<=PLAN.maximumRows);const seen=new Set();
  for(const row of rows) {
    assert.deepEqual(Object.keys(row).sort(),['privateReference','signatureStatus','localState','proofProjection'].sort());
    assert.ok(BigInt(id(row.privateReference))>BigInt(lower)&&BigInt(row.privateReference)<=BigInt(upper));
    assert.ok(!seen.has(row.privateReference));seen.add(row.privateReference);
    assert.ok([null,'verified','unverified'].includes(row.signatureStatus));
    assert.ok(['verified','unverified','absent','test-injected','unrecognized','outcome-only','not-recorded'].includes(row.localState));
    assert.ok(row.proofProjection===null||typeof row.proofProjection==='string');
    if(row.proofProjection!==null) {const projected=normalizeProjection(JSON.parse(row.proofProjection));assert.equal(projected.privateReference,row.privateReference);assert.equal(projected.signatureStatus,row.signatureStatus);}
    if(row.signatureStatus==='verified'||row.localState==='verified')assert.notEqual(row.proofProjection,null);
  }
  return rows;
}

/** Compare complete stored projections before attributing an archive membership.
 * References/inputs stay private. Deduplicating by a count or native log ID is
 * insufficient. Changed/missing entries remain visible and cannot close a gate.
 */
export function reconcile(rows,known) {
  const current=new Map(rows.map(row=>[row.privateReference,row])),seen=new Map(),sources={},changed=[],missing=[];
  for(const item of known) {
    assert.ok(typeof item.source==='string');const p=normalizeProjection(item.projection),key=p.privateReference;
    const previous=seen.get(key);if(previous)assert.ok(isDeepStrictEqual(previous,p),'Conflicting archived projections');else seen.set(key,p);
    const target=current.get(key);
    if(!target||target.proofProjection===null){missing.push({reference:key,source:item.source});continue;}
    const actual=normalizeProjection(JSON.parse(target.proofProjection));
    const differences=Object.keys(columns).filter(field=>!isDeepStrictEqual(actual[field],p[field]));
    if(differences.length){changed.push({reference:key,source:item.source,fields:differences});continue;}
    (sources[item.source]??=new Set()).add(key);
  }
  const matched=new Set(Object.values(sources).flatMap(set=>[...set]));
  const selected=rows.filter(row=>row.proofProjection!==null),uncovered=selected.filter(row=>!matched.has(row.privateReference));
  const profiles={};for(const row of selected){const p=normalizeProjection(JSON.parse(row.proofProjection));const raw=p.signatureEvidence?.verifierProfile;const profile=isReportedVerifierProfile(raw)?raw:'unrecognized-record';profiles[profile]=(profiles[profile]??0)+1;}
  return {summary:{rows:rows.length,selectedProjections:selected.length,distinctArchivedReferences:seen.size,
    matchedDistinct:matched.size,matchingBySource:Object.fromEntries(Object.entries(sources).map(([key,set])=>[key,set.size])),
    overlappingSourceMemberships:Object.values(sources).reduce((n,set)=>n+set.size,0)-matched.size,
    missingArchiveEntries:missing.length,changedArchiveEntries:changed.length,uncoveredProjections:uncovered.length,
    profiles,managedAgreementMeasured:false,newHumanLabels:0},private:{missing,changed,uncovered}};
}

async function main() {
  const[knownPath,output]=process.argv.slice(2);assert.ok(output);const input=JSON.parse(readFileSync(knownPath));assert.equal(input.known.length,6);
  const req=createRequire(resolve('package.json'));const{Miniflare}=await import(pathToFileURL(req.resolve('miniflare',{paths:[dirname(req.resolve('wrangler/package.json'))]})));
  const mf=new Miniflare({modules:true,script:'export default{fetch(){return new Response("signed slice fixture")}}',compatibilityDate:'2026-03-06',cf:{},d1Databases:{DB:'signed-slice'}});
  try {
    const db=await mf.getD1Database('DB');await db.batch(readFileSync('packages/analytics/schema.sql','utf8').replace(/^\s*--.*$/gm,'').split(';').map(s=>s.trim()).filter(Boolean).map(s=>db.prepare(s)));
    const insert=projection=>db.prepare(`INSERT INTO page_observations(id,path,daily_client_id,traffic_class,device_type,observed_at,collection_version,classifier_version,representation,observation_source,reader_kind,agent_name,signature_status,signature_agent,signature_evidence,classification_evidence,vendor_ip_evidence,is_owner,referrer_host) VALUES(CAST(? AS INTEGER),?,?,'ai','desktop',?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(projection.privateReference,projection.path,BigInt(projection.privateReference).toString(16).padStart(32,'0'),projection.observedAt,projection.collectionVersion,projection.classifierVersion,projection.representation,projection.observationSource,projection.readerKind,projection.agentName,projection.signatureStatus,projection.signatureAgent,projection.signatureEvidence,projection.classificationEvidence,projection.vendorIpEvidence,projection.ownerFlag,projection.referrerHost);
    const lower='9007199254740992',upper=(BigInt(lower)+114n).toString();
    const base=input.known.map((item,i)=>({...item,projection:{...item.projection,privateReference:(BigInt(lower)+BigInt(i+1)).toString()}}));
    const extra={...base[0].projection,privateReference:(BigInt(lower)+7n).toString()};
    await db.batch([...base.map(item=>insert(item.projection)),insert(extra)]);
    const run=async()=>{const result=await db.prepare(SLICE_SQL).bind(lower,upper).all();return{rows:validateSlice(result.results,lower,upper),meta:result.meta};};
    const small=await run(),ledger=reconcile(small.rows,base);assert.equal(ledger.summary.matchedDistinct,6);assert.equal(ledger.summary.uncoveredProjections,1);
    assert.equal(reconcile(small.rows,[...base,base[0]]).summary.matchedDistinct,6);assert.equal(reconcile(small.rows,[...base,{...base[0],source:'overlap'}]).summary.overlappingSourceMemberships,1);
    const changed=structuredClone(base);changed[0].projection.path='/private-canary';assert.equal(reconcile(small.rows,changed).summary.changedArchiveEntries,1);
    const missing=structuredClone(base);missing[0].projection.privateReference=upper;assert.equal(reconcile(small.rows,missing).summary.missingArchiveEntries,1);
    const conflict=[...base,structuredClone(base[0])];conflict.at(-1).projection.ownerFlag=1;assert.throws(()=>reconcile(small.rows,conflict));
    for(const mutate of [rows=>rows.push(rows[0]),rows=>rows[0].privateReference=Number(rows[0].privateReference),rows=>rows[0].proofProjection=null]){const copy=structuredClone(small.rows);mutate(copy);assert.throws(()=>validateSlice(copy,lower,upper));}
    assert.deepEqual(validateSlice((await db.prepare(prepareSlice(lower,upper)).all()).results,lower,upper),small.rows);
    const contradictory={...extra,privateReference:(BigInt(lower)+8n).toString(),signatureStatus:'unverified',ownerFlag:1};
    const outcomeOnly={...extra,privateReference:(BigInt(lower)+9n).toString(),signatureEvidence:null};
    const absent={...extra,privateReference:(BigInt(lower)+10n).toString(),signatureStatus:null,signatureAgent:null,signatureEvidence:null};
    await db.batch([insert(contradictory),insert(outcomeOnly),insert(absent)]);const edge=await run();
    assert.equal(edge.rows.find(row=>row.privateReference===contradictory.privateReference).localState,'unrecognized');
    assert.notEqual(edge.rows.find(row=>row.privateReference===contradictory.privateReference).proofProjection,null);
    assert.equal(edge.rows.find(row=>row.privateReference===outcomeOnly.privateReference).localState,'outcome-only');
    assert.equal(edge.rows.find(row=>row.privateReference===absent.privateReference).proofProjection,null);
    for(let i=11;i<=114;i++)await insert({...absent,privateReference:(BigInt(lower)+BigInt(i)).toString()}).run();
    const scale=await run();assert.equal(scale.rows.length,114);assert.ok(scale.meta.rows_read<PLAN.readReviewThreshold);assert.equal(scale.meta.rows_written,0);
    const control=await db.prepare('SELECT 1 AS access_check').all();assert.deepEqual(control.results,[{access_check:1}]);
    const queryPlan=(await db.prepare('EXPLAIN QUERY PLAN '+SLICE_SQL).bind(lower,upper).all()).results.map(row=>row.detail);assert.ok(queryPlan.some(x=>x.includes('SEARCH page_observations USING INTEGER PRIMARY KEY')));
    assert.throws(()=>prepareSlice('0','115'));const h=x=>createHash('sha256').update(x).digest('hex');
    const receipt={checkedAt:new Date().toISOString(),plan:PLAN,fixtureKnown:6,checks:{exactLargeIds:true,concreteMatchesParameterized:true,allRowsSelected:true,contradictoryOwnerRecordPreserved:true,outcomeOnlyPreserved:true,duplicateAndOverlappingArchivesSeparated:true,conflictingArchiveCopiesRejected:true,changedOrMissingProjectionNotAccepted:true,unsafeNumericReferenceRejected:true},scale:{rows:114,reads:scale.meta.rows_read,writes:0},constant:{reads:control.meta.rows_read,writes:control.meta.rows_written},queryPlan,templateSha256:h(SLICE_SQL),inputSha256:h(readFileSync(knownPath)),productionCalls:0};
    writeFileSync(output,JSON.stringify(receipt,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify(receipt));
  }finally{await mf.dispose();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();

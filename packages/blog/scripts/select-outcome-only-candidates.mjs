import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { prepareAge } from './check-outcome-only-age.mjs';

export const PLAN = { maximumCandidates: 201, maximumStatements: 2, attemptsPerStatement: 1,
  postExecutionReadReviewThreshold: 200000, databaseEnforcedReadCap: false };
const fields = { privateReference:'CAST(id AS TEXT)', observedAt:'observed_at', path:'path',
  representation:'representation', observationSource:'observation_source', readerKind:'reader_kind',
  agentName:'agent_name', signatureStatus:'signature_status', signatureAgent:'signature_agent',
  collectionVersion:'collection_version', classifierVersion:'classifier_version', ownerFlag:'is_owner',
  referrerHost:'referrer_host', signatureEvidenceAbsent:'signature_evidence IS NULL',
  requestEvidenceAbsent:'request_evidence IS NULL' };
export const CANDIDATE_SQL = `SELECT ${Object.entries(fields).map(([name,sql])=>sql+' AS '+name).join(',')}
 FROM page_observations WHERE id<=CAST(? AS INTEGER) AND observed_at>=? AND observed_at<=?
 AND length(observed_at)=19 AND datetime(observed_at,'+0 seconds')=observed_at
 AND signature_status='verified' AND signature_evidence IS NULL ORDER BY id LIMIT ${PLAN.maximumCandidates+1}`;
const id=value=>{assert.ok(typeof value==='string'&&/^(0|-?[1-9][0-9]{0,18})$/.test(value));const n=BigInt(value);assert.ok(n>=-9223372036854775808n&&n<=9223372036854775807n);return n;};
export function prepareCandidates(upper,cutoff,auditAt) {
  prepareAge(upper,cutoff,auditAt); let n=0;const values=[upper,cutoff,auditAt];
  const sql=CANDIDATE_SQL.replace(/\?/g,()=>`'${values[n++]}'`);assert.equal(n,3);return sql+';\n';
}
export function validateCandidates(rows,upper,cutoff,auditAt) {
  prepareCandidates(upper,cutoff,auditAt);assert.ok(Array.isArray(rows)&&rows.length<=PLAN.maximumCandidates);let previous=null;
  for(const row of rows) {
    assert.deepEqual(Object.keys(row).sort(),Object.keys(fields).sort());const reference=id(row.privateReference);
    assert.ok(reference<=BigInt(upper)&&(previous===null||reference>previous));previous=reference;
    assert.ok(typeof row.observedAt==='string'&&row.observedAt>=cutoff&&row.observedAt<=auditAt);
    assert.equal(new Date(row.observedAt.replace(' ','T')+'Z').toISOString().slice(0,19).replace('T',' '),row.observedAt);
    assert.equal(row.signatureStatus,'verified');assert.equal(row.signatureEvidenceAbsent,1);
    for(const name of ['ownerFlag','requestEvidenceAbsent'])assert.ok(row[name]===0||row[name]===1);
    for(const name of ['path','representation','observationSource','readerKind','agentName','signatureAgent','collectionVersion','classifierVersion','referrerHost'])assert.ok(row[name]===null||typeof row[name]==='string');
  }
  return rows;
}
async function main() {
  const output=process.argv[2];assert.ok(output);const req=createRequire(resolve('package.json'));
  const{Miniflare}=await import(pathToFileURL(req.resolve('miniflare',{paths:[dirname(req.resolve('wrangler/package.json'))]})));
  const mf=new Miniflare({modules:true,script:'export default{fetch(){return new Response("candidate fixture")}}',compatibilityDate:'2026-03-06',cf:{},d1Databases:{DB:'outcome-candidates'}});
  try {
    const db=await mf.getD1Database('DB');await db.batch(readFileSync('packages/analytics/schema.sql','utf8').replace(/^\s*--.*$/gm,'').split(';').map(s=>s.trim()).filter(Boolean).map(s=>db.prepare(s)));
    const cutoff='2026-10-22 06:55:00',at='2026-10-29 06:55:00';
    const insert=async(n,time=at,status='verified',evidence=null,owner=0)=>db.prepare("INSERT INTO page_observations(id,path,daily_client_id,traffic_class,device_type,is_owner,observed_at,signature_status,signature_evidence)VALUES(CAST(? AS INTEGER),'/fixture','0123456789abcdef0123456789abcdef','bot','desktop',?,?,?,?)").bind(String(n),owner,time,status,evidence).run();
    const run=async upper=>{const r=await db.prepare(CANDIDATE_SQL).bind(upper,cutoff,at).all();return{rows:validateCandidates(r.results,upper,cutoff,at),meta:r.meta};};
    assert.equal((await run('1')).rows.length,0);
    await insert(-1,cutoff);await insert(0,at,'verified',null,1);await insert(1,'2026-10-22 06:54:59');await insert(2,'2026-10-29 06:55:01');await insert(3,at,'unverified');await insert(4,at,'verified','{}');await insert(5,'2026-02-30 00:00:00');
    const small=await run('5');assert.deepEqual(small.rows.map(r=>r.privateReference),['-1','0']);assert.equal(small.rows[1].ownerFlag,1);
    assert.deepEqual((await db.prepare(prepareCandidates('5',cutoff,at)).all()).results,small.rows);
    for(const mutate of [rows=>rows.push(rows[0]),rows=>rows[0].privateReference=-1,rows=>rows[0].signatureEvidenceAbsent=0,rows=>rows[0].observedAt='2026-02-30 00:00:00']){const rows=structuredClone(small.rows);mutate(rows);assert.throws(()=>validateCandidates(rows,'5',cutoff,at));}
    await db.prepare('DELETE FROM page_observations').run();await insert('9007199254740992');await insert('9007199254740993');assert.equal((await run('9007199254740992')).rows.length,1);assert.equal((await run('9007199254740993')).rows.length,2);
    await db.prepare('DELETE FROM page_observations').run();
    await db.prepare("WITH RECURSIVE n(x)AS(SELECT 1 UNION ALL SELECT x+1 FROM n WHERE x<65536) INSERT INTO page_observations(id,path,daily_client_id,traffic_class,device_type,is_owner,observed_at,signature_status)SELECT x,'/fixture','0123456789abcdef0123456789abcdef','bot','desktop',0,CASE WHEN x<=201 THEN '2026-10-22 06:55:00' ELSE '2026-10-21 00:00:00' END,'verified'FROM n").run();
    const scale=await run('65536');assert.equal(scale.rows.length,201);assert.equal(scale.meta.rows_written,0);assert.ok(scale.meta.rows_read<PLAN.postExecutionReadReviewThreshold);
    await insert('65537');await assert.rejects(()=>run('65537'));
    const control=await db.prepare('SELECT 1 AS access_check').all();assert.deepEqual(control.results,[{access_check:1}]);assert.equal(control.meta.rows_read,0);
    const queryPlan=(await db.prepare('EXPLAIN QUERY PLAN '+CANDIDATE_SQL).bind('65536',cutoff,at).all()).results.map(r=>r.detail);
    const result={checkedAt:new Date().toISOString(),plan:PLAN,sqlSha256:createHash('sha256').update(CANDIDATE_SQL).digest('hex'),scale:{rows:65536,candidates:201,reads:scale.meta.rows_read,writes:0},queryPlan,
      checks:{empty:true,negativeAndZeroIds:true,ownerRecordPreserved:true,exactDateBoundaries:true,nonClaimsExcluded:true,concreteMatchesParameterized:true,duplicateAndUnsafeIdsRejected:true,contradictoryEvidenceRejected:true,impossibleTimeRejected:true,adjacentLargeIds:true,overLimitRejected:true,constantAccessControl:true},productionCalls:0};
    writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify(result));
  }finally{await mf.dispose();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();

import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const PLAN = { maximumRows: 65536, maximumStatements: 2, attemptsPerStatement: 1,
  postExecutionReadReviewThreshold: 200000, databaseEnforcedReadCap: false };
const valid = "length(observed_at)=19 AND datetime(observed_at,'+0 seconds')=observed_at";
export const AGE_SQL = `WITH params AS (SELECT CAST(? AS INTEGER) AS upper_id,? AS cutoff,? AS audit_at),
 bounded AS MATERIALIZED (SELECT observed_at,signature_status,signature_evidence FROM page_observations
 WHERE id<=(SELECT upper_id FROM params) ORDER BY id LIMIT ${PLAN.maximumRows + 1}),
 facts AS (SELECT observed_at,signature_status='verified' AND signature_evidence IS NULL AS claim,
 COALESCE(${valid},0) AS valid FROM bounded)
 SELECT COUNT(*) AS boundedRows,
 COALESCE(SUM(CASE WHEN claim THEN 1 ELSE 0 END),0) AS outcomeOnly,
 COALESCE(SUM(CASE WHEN claim AND valid AND observed_at<cutoff THEN 1 ELSE 0 END),0) AS olderThanDocumentedMaximum,
 COALESCE(SUM(CASE WHEN claim AND valid AND observed_at>=cutoff AND observed_at<=audit_at THEN 1 ELSE 0 END),0) AS withinMaximumAge,
 COALESCE(SUM(CASE WHEN claim AND valid AND observed_at>audit_at THEN 1 ELSE 0 END),0) AS futureRecordedTime,
 COALESCE(SUM(CASE WHEN claim AND NOT valid THEN 1 ELSE 0 END),0) AS unrecognizedTime,
 MIN(CASE WHEN claim AND valid THEN observed_at END) AS firstRecordedTime,
 MAX(CASE WHEN claim AND valid THEN observed_at END) AS lastRecordedTime FROM facts CROSS JOIN params`;
const keys = ['boundedRows','outcomeOnly','olderThanDocumentedMaximum','withinMaximumAge','futureRecordedTime','unrecognizedTime','firstRecordedTime','lastRecordedTime'];
export function validateAge(row) {
  assert.deepEqual(Object.keys(row).sort(), [...keys].sort());
  for (const name of keys.slice(0,6)) assert.ok(Number.isSafeInteger(row[name]) && row[name] >= 0);
  assert.ok(row.boundedRows <= PLAN.maximumRows && row.outcomeOnly <= row.boundedRows);
  assert.equal(row.outcomeOnly, row.olderThanDocumentedMaximum + row.withinMaximumAge + row.futureRecordedTime + row.unrecognizedTime);
  for (const name of keys.slice(6)) assert.ok(row[name] === null || typeof row[name] === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(row[name]));
  assert.equal(row.firstRecordedTime === null, row.lastRecordedTime === null);
  if (row.firstRecordedTime !== null) assert.ok(row.firstRecordedTime <= row.lastRecordedTime);
  return row;
}
export function prepareAge(upper, cutoff, auditAt) {
  assert.ok(typeof upper === 'string' && /^[1-9][0-9]{0,18}$/.test(upper) && BigInt(upper) <= 9223372036854775807n);
  for (const value of [cutoff,auditAt]) assert.ok(typeof value === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)
    && new Date(value.replace(' ','T')+'Z').toISOString().slice(0,19).replace('T',' ') === value);
  assert.equal(Date.parse(auditAt.replace(' ','T')+'Z') - Date.parse(cutoff.replace(' ','T')+'Z'), 7 * 86400000);
  let i=0; const values=[upper,cutoff,auditAt];
  const sql=AGE_SQL.replace(/\?/g,()=>`'${values[i++]}'`); assert.equal(i,3); return sql+';\n';
}
async function main() {
  const output=process.argv[2];assert.ok(output);
  const req=createRequire(resolve('package.json'));
  const{Miniflare}=await import(pathToFileURL(req.resolve('miniflare',{paths:[dirname(req.resolve('wrangler/package.json'))]})));
  const mf=new Miniflare({modules:true,script:'export default{fetch(){return new Response("age fixture")}}',compatibilityDate:'2026-03-06',cf:{},d1Databases:{DB:'outcome-age'}});
  try {
    const db=await mf.getD1Database('DB'); await db.batch(readFileSync('packages/analytics/schema.sql','utf8').replace(/^\s*--.*$/gm,'').split(';').map(s=>s.trim()).filter(Boolean).map(s=>db.prepare(s)));
    const control=await db.prepare('SELECT 1 AS access_check').all();assert.deepEqual(control.results,[{access_check:1}]);assert.equal(control.meta.rows_read,0);assert.equal(control.meta.rows_written,0);
    const cutoff='2026-10-22 06:55:00',at='2026-10-29 06:55:00';
    const run=async upper=>{const r=await db.prepare(AGE_SQL).bind(upper,cutoff,at).all();return{row:validateAge(r.results[0]),meta:r.meta};};
    assert.equal((await run('1')).row.outcomeOnly,0);
    const times=['2026-10-22 06:54:59',cutoff,at,'2026-10-29 06:55:01','2026-02-30 00:00:00',''];
    for (let i=0;i<times.length;i++)await db.prepare("INSERT INTO page_observations(id,path,daily_client_id,traffic_class,device_type,is_owner,observed_at,signature_status)VALUES(?,'/fixture','0123456789abcdef0123456789abcdef','bot','desktop',0,?,'verified')").bind(i+1,times[i]).run();
    for (const [id,status,evidence] of [[7,'unverified',null],[8,null,null],[9,'verified','{}']])await db.prepare("INSERT INTO page_observations(id,path,daily_client_id,traffic_class,device_type,is_owner,observed_at,signature_status,signature_evidence)VALUES(?,'/fixture','0123456789abcdef0123456789abcdef','bot','desktop',0,?,?,?)").bind(id,at,status,evidence).run();
    const small=await run('9');assert.equal(small.row.outcomeOnly,6);assert.equal(small.row.olderThanDocumentedMaximum,1);assert.equal(small.row.withinMaximumAge,2);assert.equal(small.row.futureRecordedTime,1);assert.equal(small.row.unrecognizedTime,2);
    assert.deepEqual((await db.prepare(prepareAge('9',cutoff,at)).all()).results[0],small.row);
    for (const change of [row=>row.outcomeOnly++,row=>row.boundedRows=65537,row=>row.extra='private']){const row={...small.row};change(row);assert.throws(()=>validateAge(row));}
    assert.throws(()=>prepareAge('9007199254740992 OR 1=1',cutoff,at));assert.throws(()=>prepareAge('1','2026-02-30 06:55:00',at));
    await db.prepare('DELETE FROM page_observations').run();
    await db.prepare("WITH RECURSIVE n(x)AS(SELECT 1 UNION ALL SELECT x+1 FROM n WHERE x<65536) INSERT INTO page_observations(id,path,daily_client_id,traffic_class,device_type,is_owner,observed_at,signature_status) SELECT x,'/fixture','0123456789abcdef0123456789abcdef','bot','desktop',0,'2026-10-21 00:00:00','verified'FROM n").run();
    const scale=await run('65536');assert.equal(scale.row.outcomeOnly,65536);assert.equal(scale.row.olderThanDocumentedMaximum,65536);assert.ok(scale.meta.rows_read<PLAN.postExecutionReadReviewThreshold);assert.equal(scale.meta.rows_written,0);
    await db.prepare("INSERT INTO page_observations(id,path,daily_client_id,traffic_class,device_type,is_owner,observed_at)VALUES(65537,'/fixture','0123456789abcdef0123456789abcdef','bot','desktop',0,?)").bind(at).run();await assert.rejects(()=>run('65537'));
    const result={checkedAt:new Date().toISOString(),plan:PLAN,sqlSha256:createHash('sha256').update(AGE_SQL).digest('hex'),scale:{rows:65536,reads:scale.meta.rows_read,writes:0},
      checks:{constantAccessControl:true,empty:true,dateBoundaries:true,impossibleDates:true,missingTime:true,nonClaimRowsExcluded:true,concreteEqualsParameterized:true,unreconciledOutputRejected:true,sentinelStopsAcceptance:true,injectionRejected:true},productionCalls:0};
    writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify(result));
  }finally{await mf.dispose();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();

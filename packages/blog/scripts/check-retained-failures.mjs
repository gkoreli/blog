import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {dirname,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

// Private diagnostic only. No daily identifiers, address values or raw headers.
export const PLAN={maximumScopeRows:2048,maximumSelectedRows:2,maximumStatements:1,
 attemptsPerStatement:1,postExecutionReadReviewThreshold:10000,databaseEnforcedReadCap:false};
const columns={privateReference:'CAST(id AS TEXT)',observedAt:'observed_at',path:'path',
 collectionVersion:'collection_version',classifierVersion:'classifier_version',
 observationSource:'observation_source',representation:'representation',readerKind:'reader_kind',readerReason:'reader_reason',
 agentName:'agent_name',signatureStatus:'signature_status',signatureAgent:'signature_agent',
 signatureEvidence:'signature_evidence',classificationEvidence:'classification_evidence',vendorIpEvidence:'vendor_ip_evidence',
 ownerFlag:'is_owner',referrerHost:'referrer_host',referrerState:'referrer_state',internalReferrerPath:'internal_referrer_path',
 secFetchMode:'sec_fetch_mode',secFetchDest:'sec_fetch_dest',secFetchSite:'sec_fetch_site',
 optionalCaptureAbsent:'request_evidence IS NULL'};
const keys=Object.keys(columns),jsonKeys=['signatureEvidence','classificationEvidence','vendorIpEvidence'];
export const FAILURE_SQL=`WITH bounded AS MATERIALIZED (
 SELECT * FROM page_observations WHERE id>CAST(? AS INTEGER) AND id<=CAST(? AS INTEGER)
 ORDER BY id LIMIT ${PLAN.maximumScopeRows+1}), selected AS MATERIALIZED (
 SELECT * FROM bounded WHERE signature_status='unverified' OR json_extract(signature_evidence,'$.localStatus')='unverified')
 SELECT ${Object.entries(columns).map(([k,v])=>`${v} AS ${k}`).join(',')},
 (SELECT COUNT(*) FROM bounded) AS scopeRows,(SELECT COUNT(*) FROM selected) AS selectedRows
 FROM selected ORDER BY id LIMIT ${PLAN.maximumSelectedRows+1}`;
function id(value){assert.ok(typeof value==='string'&&/^(0|[1-9][0-9]{0,18})$/.test(value)&&BigInt(value)<=9223372036854775807n);return value}
export function prepare(lower,upper){assert.ok(BigInt(id(upper))>=BigInt(id(lower)));let n=0;const bounds=[lower,upper];
 const sql=FAILURE_SQL.replace(/\?/g,()=>`'${bounds[n++]}'`)+';\n';assert.equal(n,2);assert.ok(Buffer.byteLength(sql)<100000);return sql}
export function validate(rows,lower,upper,expectedScopeRows){
 prepare(lower,upper);assert.ok(Number.isSafeInteger(expectedScopeRows)&&expectedScopeRows>0&&expectedScopeRows<=PLAN.maximumScopeRows);
 assert.ok(Array.isArray(rows)&&rows.length>0&&rows.length<=PLAN.maximumSelectedRows);const seen=new Set();
 for(const row of rows){assert.deepEqual(Object.keys(row).sort(),[...keys,'scopeRows','selectedRows'].sort());
  assert.equal(row.scopeRows,expectedScopeRows);assert.equal(row.selectedRows,rows.length);
  assert.ok(BigInt(id(row.privateReference))>BigInt(lower)&&BigInt(row.privateReference)<=BigInt(upper));
  assert.ok(!seen.has(row.privateReference));seen.add(row.privateReference);
  assert.ok([null,'verified','unverified'].includes(row.signatureStatus));
  for(const key of jsonKeys){assert.ok(row[key]===null||typeof row[key]==='string');if(row[key]!==null)JSON.parse(row[key]);}
  const e=row.signatureEvidence===null?null:JSON.parse(row.signatureEvidence);
  assert.ok(row.signatureStatus==='unverified'||e?.localStatus==='unverified');
  assert.ok([0,1].includes(row.ownerFlag)&&[0,1].includes(row.optionalCaptureAbsent));
  assert.ok(['edge','beacon'].includes(row.observationSource));
 }
 return rows;
}
async function main(){const[output]=process.argv.slice(2);assert.ok(output);
 const req=createRequire(resolve('package.json'));
 const{Miniflare}=await import(pathToFileURL(req.resolve('miniflare',{paths:[dirname(req.resolve('wrangler/package.json'))]})));
 const mf=new Miniflare({modules:true,script:'export default{fetch(){return new Response("failure fixture")}}',compatibilityDate:'2026-03-06',cf:{},d1Databases:{DB:'retained-failures'}});
 try{const db=await mf.getD1Database('DB');await db.batch(readFileSync('packages/analytics/schema.sql','utf8').replace(/^\s*--.*$/gm,'').split(';').map(s=>s.trim()).filter(Boolean).map(s=>db.prepare(s)));
  const lower='9007199254740992',upper=(BigInt(lower)+383n).toString();
  const insert=(offset,status=null,localStatus='absent',owner=0)=>db.prepare(`INSERT INTO page_observations(id,path,daily_client_id,traffic_class,device_type,is_owner,signature_status,signature_evidence,observed_at)
   VALUES(CAST(? AS INTEGER),'/fixture','00000000000000000000000000000000','browser','desktop',?,?,?,'2026-10-29 16:00:00')`)
   .bind((BigInt(lower)+BigInt(offset)).toString(),owner,status,JSON.stringify({localStatus,reason:localStatus==='unverified'?'signature-invalid':'signature-absent'}));
  await db.batch(Array.from({length:383},(_,i)=>insert(i+1,i<2?'unverified':null,i<2?'unverified':'absent',i===1?1:0)));
  await db.batch([insert(0,'unverified','unverified'),insert(384,'unverified','unverified')]);
  const result=await db.prepare(FAILURE_SQL).bind(lower,upper).all(),rows=validate(result.results,lower,upper,383);
  assert.equal(rows.length,2);assert.equal(rows[1].ownerFlag,1);
  assert.equal(rows[0].privateReference,'9007199254740993');assert.equal(rows[0].signatureAgent,null);
  assert.deepEqual(validate((await db.prepare(prepare(lower,upper)).all()).results,lower,upper,383),rows);
  const plan=(await db.prepare('EXPLAIN QUERY PLAN '+FAILURE_SQL).bind(lower,upper).all()).results.map(r=>r.detail);
  assert.ok(plan.some(s=>s.includes('SEARCH page_observations USING INTEGER PRIMARY KEY')));
  for(const mutate of [r=>r.push(r[0]),r=>r[0].privateReference=Number(r[0].privateReference),r=>r[0].selectedRows=3,r=>r[0].scopeRows=2049,r=>r[0].privateReference=lower]){
   const altered=structuredClone(rows);mutate(altered);assert.throws(()=>validate(altered,lower,upper,383));}
  assert.throws(()=>validate([],lower,upper,383));assert.throws(()=>prepare('1 OR 1=1',upper));
  await db.prepare("UPDATE page_observations SET signature_status='verified' WHERE id=CAST(? AS INTEGER)").bind(rows[0].privateReference).run();
  const contradiction=validate((await db.prepare(FAILURE_SQL).bind(lower,upper).all()).results,lower,upper,383);
  assert.equal(contradiction[0].signatureStatus,'verified'); // Preserve conflicting stored claims.
  await db.prepare("UPDATE page_observations SET signature_status='unverified' WHERE id=CAST(? AS INTEGER)").bind((BigInt(lower)+3n).toString()).run();
  const excessive=(await db.prepare(FAILURE_SQL).bind(lower,upper).all()).results;assert.throws(()=>validate(excessive,lower,upper,383));
  await db.prepare('DELETE FROM page_observations').run();
  for(let start=0;start<2049;start+=128)await db.batch(Array.from({length:Math.min(128,2049-start)},(_,i)=>insert(start+i+1,start+i<2?'unverified':null,start+i<2?'unverified':'absent')));
  const sentinel=(await db.prepare(FAILURE_SQL).bind(lower,(BigInt(lower)+2049n).toString()).all()).results;
  assert.equal(sentinel[0].scopeRows,2049);assert.throws(()=>validate(sentinel,lower,(BigInt(lower)+2049n).toString(),2048));
  assert.ok(result.meta.rows_read<PLAN.postExecutionReadReviewThreshold);assert.equal(result.meta.rows_written,0);
  const h=v=>createHash('sha256').update(v).digest('hex');
  const receipt={checkedAt:new Date().toISOString(),plan:PLAN,fixtureRows:383,selected:2,reads:result.meta.rows_read,writes:0,
   checks:{exactLargeIds:true,concreteMatchesParameterized:true,rangeBoundaries:true,nullsPreserved:true,ownerPreserved:true,contradictoryClaimsPreserved:true,emptyOrTruncatedOrDuplicateOrUnsafeResultsRejected:true,indexedPrimaryKeyRange:true},queryPlan:plan,templateSha256:h(FAILURE_SQL),sourceSha256:h(readFileSync(new URL(import.meta.url))),productionCalls:0};
  writeFileSync(output,JSON.stringify(receipt,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify({fixtureRows:383,selected:2,reads:receipt.reads,writes:0}));
 }finally{await mf.dispose()}}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();

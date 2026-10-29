import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {dirname,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {FAILURE_SQL} from './check-retained-failures.mjs';
import {analyzeTraffic} from '../../analytics/.test-dist/classify.js';
import {classificationEvidence} from '../../analytics/.test-dist/classification-evidence.js';
import {verificationEvidence} from '../../analytics/.test-dist/signature-evidence.js';
import {COLLECTION_VERSION,CLASSIFIER_VERSION} from '../../analytics/.test-dist/versions.js';

export const PLAN={maximumScopeRows:2048,maximumSelectedRows:128,maximumStatements:1,
 attemptsPerStatement:1,postExecutionReadReviewThreshold:10000,databaseEnforcedReadCap:false,
 maximumRetainedExportRecords:1024,maximumRetainedExportBytes:8388608};
const keys=['privateReference','observedAt','path','collectionVersion','classifierVersion','observationSource','representation','readerKind','readerReason',
 'agentName','signatureStatus','signatureAgent','signatureEvidence','classificationEvidence','vendorIpEvidence','ownerFlag','referrerHost','referrerState',
 'internalReferrerPath','secFetchMode','secFetchDest','secFetchSite','optionalCaptureAbsent','trafficClass','secFetchUser','acceptsHtml','hasAcceptLanguage','asn','asnSource','scopeRows','selectedRows'];
function once(sql,before,after){assert.equal(sql.split(before).length,2,'Upstream diagnostic query changed');return sql.replace(before,after)}
let sql=once(FAILURE_SQL,"signature_status='unverified' OR json_extract(signature_evidence,'$.localStatus')='unverified'","reader_kind='unresolved'");
sql=once(sql,'request_evidence IS NULL AS optionalCaptureAbsent',`request_evidence IS NULL AS optionalCaptureAbsent,
 traffic_class AS trafficClass,sec_fetch_user AS secFetchUser,accepts_html AS acceptsHtml,has_accept_language AS hasAcceptLanguage,asn,asn_source AS asnSource`);
export const UNRESOLVED_SQL=once(sql,'LIMIT 3',`LIMIT ${PLAN.maximumSelectedRows+1}`);
function id(v){assert.ok(typeof v==='string'&&/^(0|[1-9][0-9]{0,18})$/.test(v)&&BigInt(v)<=9223372036854775807n);return v}
export function prepare(lower,upper){assert.ok(BigInt(id(upper))>=BigInt(id(lower)));const bounds=[lower,upper];let n=0;
 const text=UNRESOLVED_SQL.replace(/\?/g,()=>`'${bounds[n++]}'`)+';\n';assert.equal(n,2);assert.ok(Buffer.byteLength(text)<100000);return text}
export function validate(rows,lower,upper,expectedScopeRows,expectedSelectedRows){
 prepare(lower,upper);assert.ok(Number.isSafeInteger(expectedScopeRows)&&expectedScopeRows>0&&expectedScopeRows<=PLAN.maximumScopeRows);
 assert.ok(Number.isSafeInteger(expectedSelectedRows)&&expectedSelectedRows>0&&expectedSelectedRows<=PLAN.maximumSelectedRows);
 assert.ok(Array.isArray(rows)&&rows.length===expectedSelectedRows);const seen=new Set();
 for(const row of rows){assert.deepEqual(Object.keys(row).sort(),keys.toSorted());
  assert.equal(row.scopeRows,expectedScopeRows);assert.equal(row.selectedRows,expectedSelectedRows);assert.equal(row.readerKind,'unresolved');
  assert.ok(BigInt(id(row.privateReference))>BigInt(lower)&&BigInt(row.privateReference)<=BigInt(upper));assert.ok(!seen.has(row.privateReference));seen.add(row.privateReference);
  for(const k of ['signatureEvidence','classificationEvidence','vendorIpEvidence']){assert.ok(row[k]===null||typeof row[k]==='string');if(row[k]!==null)JSON.parse(row[k]);}
  for(const k of ['ownerFlag','optionalCaptureAbsent'])assert.ok([0,1].includes(row[k]));
  for(const k of ['secFetchUser','acceptsHtml','hasAcceptLanguage'])assert.ok([null,0,1].includes(row[k]));
  assert.ok(['edge','beacon'].includes(row.observationSource));assert.ok(['browser','bot','ai'].includes(row.trafficClass));
 }
 return rows;
}
async function main(){const[output]=process.argv.slice(2);assert.ok(output);
 const req=createRequire(resolve('package.json'));const{Miniflare}=await import(pathToFileURL(req.resolve('miniflare',{paths:[dirname(req.resolve('wrangler/package.json'))]})));
 const mf=new Miniflare({modules:true,script:'export default{fetch(){return new Response("unresolved selection")}}',compatibilityDate:'2026-03-06',cf:{},d1Databases:{DB:'unresolved-metadata'}});
 try{const db=await mf.getD1Database('DB');await db.batch(readFileSync('packages/analytics/schema.sql','utf8').replace(/^\s*--.*$/gm,'').split(';').map(s=>s.trim()).filter(Boolean).map(s=>db.prepare(s)));
  const lower='9007199254740992',upper=(BigInt(lower)+383n).toString(),a=analyzeTraffic('Mozilla/5.0 Firefox/140.0');
  const facts={...a,userAgent:'Mozilla/5.0 Firefox/140.0',observationSource:'edge',asn:64512,secFetchMode:null,secFetchDest:null,secFetchSite:null,secFetchUser:null,acceptsHtml:1,hasAcceptLanguage:1,signature:{status:'absent'}};
  const c=classificationEvidence(facts,a.declarations),e=verificationEvidence(new Request('https://fixture.example/'),{status:'absent'},false,a.declarations.candidates);
  const insert=(offset,kind='browser',reason='fixture',owner=0)=>db.prepare(`INSERT INTO page_observations(id,path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,signature_evidence,classification_evidence,collection_version,classifier_version,observed_at,asn,accepts_html,has_accept_language)
   VALUES(CAST(? AS INTEGER),'/fixture','00000000000000000000000000000000','browser','desktop',?,?,?,?,?,?,?,'2026-10-29 16:00:00',64512,1,1)`)
   .bind((BigInt(lower)+BigInt(offset)).toString(),owner,kind,reason,JSON.stringify(e),JSON.stringify(c),COLLECTION_VERSION,CLASSIFIER_VERSION);
  const reasons=Array(91).fill('fetch-metadata-absent').concat(Array(9).fill('unrecognized-browser-claim'),'fetch-metadata-support-unknown');
  await db.batch(Array.from({length:383},(_,i)=>insert(i+1,i<101?'unresolved':'browser',reasons[i]??'fixture',i===0?1:0)));
  await db.batch([insert(0,'unresolved'),insert(384,'unresolved')]);
  const result=await db.prepare(UNRESOLVED_SQL).bind(lower,upper).all(),rows=validate(result.results,lower,upper,383,101);
  assert.equal(rows[0].privateReference,'9007199254740993');assert.equal(rows[0].ownerFlag,1);assert.equal(rows[0].secFetchMode,null);
  assert.deepEqual(validate((await db.prepare(prepare(lower,upper)).all()).results,lower,upper,383,101),rows);
  const queryPlan=(await db.prepare('EXPLAIN QUERY PLAN '+UNRESOLVED_SQL).bind(lower,upper).all()).results.map(r=>r.detail);assert.ok(queryPlan.some(s=>s.includes('SEARCH page_observations USING INTEGER PRIMARY KEY')));
  for(const mutate of [r=>r.pop(),r=>r.push(r[0]),r=>r[0].privateReference=Number(r[0].privateReference),r=>r[0].scopeRows=2049,r=>r[0].selectedRows=129,r=>r[0].readerKind='browser']){
   const changed=structuredClone(rows);mutate(changed);assert.throws(()=>validate(changed,lower,upper,383,101));}
  assert.throws(()=>prepare('0 OR 1=1',upper));
  await db.prepare("UPDATE page_observations SET reader_reason='unreviewed-future-reason' WHERE id=CAST(? AS INTEGER)").bind(rows[0].privateReference).run();
  const future=validate((await db.prepare(UNRESOLVED_SQL).bind(lower,upper).all()).results,lower,upper,383,101);assert.equal(future[0].readerReason,'unreviewed-future-reason');
  await db.prepare("UPDATE page_observations SET reader_kind='unresolved' WHERE id>CAST(? AS INTEGER) AND id<=CAST(? AS INTEGER)").bind(lower,(BigInt(lower)+129n).toString()).run();
  const excessive=(await db.prepare(UNRESOLVED_SQL).bind(lower,upper).all()).results;assert.equal(excessive.length,129);assert.throws(()=>validate(excessive,lower,upper,383,128));
  await db.prepare('DELETE FROM page_observations').run();
  for(let start=0;start<2049;start+=128)await db.batch(Array.from({length:Math.min(128,2049-start)},(_,i)=>insert(start+i+1,start+i<101?'unresolved':'browser')));
  const max=(BigInt(lower)+2049n).toString(),sentinel=(await db.prepare(UNRESOLVED_SQL).bind(lower,max).all()).results;
  assert.equal(sentinel[0].scopeRows,2049);assert.throws(()=>validate(sentinel,lower,max,2048,101));
  assert.equal(result.meta.rows_written,0);assert.ok(result.meta.rows_read<PLAN.postExecutionReadReviewThreshold);
  const hash=v=>createHash('sha256').update(v).digest('hex');const receipt={checkedAt:new Date().toISOString(),sourceBaseline:'7ad2405',plan:PLAN,fixtureRows:383,selected:101,
   reads:result.meta.rows_read,writes:0,queryPlan,templateSha256:hash(UNRESOLVED_SQL),scriptSha256:hash(readFileSync(new URL(import.meta.url))),
   checks:{exactLargeIds:true,concreteMatchesParameterized:true,boundariesAndNulls:true,ownerAndFutureReasonPreserved:true,duplicateOrIncompleteOrUnsafeSelectionRejected:true,selectedAndScopeSentinelsRejected:true},productionQueries:0};
  writeFileSync(output,JSON.stringify(receipt,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify({fixtureRows:383,selected:101,reads:receipt.reads,writes:0}));
 }finally{await mf.dispose()}}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();

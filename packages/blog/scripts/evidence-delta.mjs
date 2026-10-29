import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {dirname,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {CENSUS_SQL as BASE_CENSUS, METHODS_SQL, CONTEXT_SQL, EVENT_CUTOFF as OLD_CUTOFF, validate as validateAggregate, summarize} from './check-post-census-delta.mjs';
import {referralRulesJson} from '../../analytics/.test-dist/referral-sql.js';
import {ACTIVE_REFERRAL_POLICY} from '../../analytics/.test-dist/referral-policy.generated.js';
import {fetchMetadataReportCtes,fetchMetadataReportProjectionSql,decodeFetchMetadataRows} from '../../analytics/.test-dist/fetch-metadata-report.js';

export const PLAN={maximumRows:1024,maximumRowSourceBytes:16384,maximumSourceBytes:2000000,maximumProductionStatements:2,attemptsPerStatement:1,readReviewThresholdPerStatement:10000,databaseEnforcedReadCap:false};
export const EVENT_CUTOFF='2026-10-29 16:47:57';
export const TEXT_FIELDS=['path','observed_at','traffic_class','device_type','agent_name','reader_kind','reader_reason','observation_source','collection_version','classifier_version','representation','signature_status','signature_agent','signature_evidence','classification_evidence','vendor_ip_evidence','client_form_evidence','referrer_host','referrer_state','internal_referrer_path','sec_fetch_mode','sec_fetch_dest','sec_fetch_site','asn_source'];
const flags=['is_owner','owner_client','sec_fetch_user','accepts_html','has_accept_language'];
export const EXPORT_FIELDS=['id',...TEXT_FIELDS,...flags,'asn'];
const textBytes=TEXT_FIELDS.map(f=>`COALESCE(length(CAST(${f} AS BLOB)),0)`).join('+');
export const PREFLIGHT_SQL=`SELECT COUNT(*) AS rows,CAST(MAX(id) AS TEXT) AS upperId,COALESCE(SUM(source_bytes),0) AS sourceBytes,COALESCE(MAX(source_bytes),0) AS maximumRowSourceBytes FROM (SELECT id,(${textBytes}) AS source_bytes FROM page_observations WHERE id>CAST(? AS INTEGER) ORDER BY id LIMIT ${PLAN.maximumRows+1})`;
export const EXPORT_SQL=`SELECT CAST(id AS TEXT) AS id,${TEXT_FIELDS.join(',')},is_owner,EXISTS(SELECT 1 FROM owner_clients WHERE owner_clients.daily_client_id=page_observations.daily_client_id) AS owner_client,sec_fetch_user,accepts_html,has_accept_language,asn FROM page_observations WHERE id>CAST(? AS INTEGER) AND id<=CAST(? AS INTEGER) ORDER BY page_observations.id LIMIT ${PLAN.maximumRows+1}`;
export function exactId(value){assert.ok(typeof value==='string'&&/^(0|[1-9][0-9]{0,18})$/.test(value)&&BigInt(value)<=9223372036854775807n,'Invalid exact ID');return value}
const integer=v=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0;
const keys=(v,expected)=>{assert.ok(v!==null&&typeof v==='object'&&!Array.isArray(v));assert.deepEqual(Object.keys(v).sort(),expected.slice().sort())};
export function validatePreflight(row,lower){
 exactId(lower);keys(row,['rows','upperId','sourceBytes','maximumRowSourceBytes']);
 for(const k of ['rows','sourceBytes','maximumRowSourceBytes'])assert.ok(integer(row[k]));
 assert.ok(row.rows<=PLAN.maximumRows&&row.sourceBytes<=PLAN.maximumSourceBytes&&row.maximumRowSourceBytes<=PLAN.maximumRowSourceBytes,'Preflight exceeds reviewed work bounds');
 if(row.rows===0){assert.equal(row.upperId,null);assert.equal(row.sourceBytes,0);assert.equal(row.maximumRowSourceBytes,0)}
 else{assert.ok(BigInt(exactId(row.upperId))>BigInt(lower));assert.ok(row.maximumRowSourceBytes<=row.sourceBytes)}
 return row;
}
export function prepare(kind,lower,upper=lower){
 exactId(lower);exactId(upper);assert.ok(BigInt(upper)>=BigInt(lower));let i=0;const values=kind==='preflight'?[lower]:[lower,upper];const template=kind==='preflight'?PREFLIGHT_SQL:kind==='export'?EXPORT_SQL:null;assert.ok(template);
 const sql=template.replace(/\?/g,()=>`'${values[i++]}'`)+';\n';assert.equal(i,values.length);assert.ok(Buffer.byteLength(sql)<100000);return sql;
}
export function validateExport(rows,preflight,lower){
 validatePreflight(preflight,lower);assert.ok(Array.isArray(rows)&&rows.length===preflight.rows&&rows.length<=PLAN.maximumRows);
 let previous=BigInt(lower),bytes=0,maximum=0;
 for(const row of rows){
  keys(row,EXPORT_FIELDS);const n=BigInt(exactId(row.id));assert.ok(n>previous&&n<=BigInt(preflight.upperId));previous=n;
  for(const field of TEXT_FIELDS)assert.ok(row[field]===null||typeof row[field]==='string','Unexpected transport type for '+field);
  assert.equal(typeof row.path,'string');assert.equal(typeof row.observed_at,'string');
  for(const field of flags)assert.ok(row[field]===null||row[field]===0||row[field]===1);
  assert.ok(row.is_owner!==null&&row.owner_client!==null);assert.ok(row.asn===null||Number.isSafeInteger(row.asn));
  const size=TEXT_FIELDS.reduce((n,f)=>n+(row[f]===null?0:Buffer.byteLength(row[f])),0);bytes+=size;maximum=Math.max(maximum,size);
 }
 if(rows.length)assert.equal(rows.at(-1).id,preflight.upperId);
 assert.equal(bytes,preflight.sourceBytes,'Selected text bytes changed or export is incomplete');assert.equal(maximum,preflight.maximumRowSourceBytes);return rows;
}
export async function nativeDatabase(){
 const req=createRequire(resolve('package.json'));const{Miniflare}=await import(pathToFileURL(req.resolve('miniflare',{paths:[dirname(req.resolve('wrangler/package.json'))]})));
 const mf=new Miniflare({modules:true,script:'export default{fetch(){return new Response("private evidence analysis")}}',compatibilityDate:'2026-03-06',cf:{},d1Databases:{DB:'evidence-delta'}});
 const db=await mf.getD1Database('DB');
 // An analysis relation preserves selected scalar values. Production schema
 // constraints and per-day client grouping are not reconstructed here.
 const schema=`CREATE TABLE page_observations(id INTEGER PRIMARY KEY,daily_client_id TEXT,${TEXT_FIELDS.map(f=>f+' TEXT').join(',')},is_owner INTEGER,sec_fetch_user INTEGER,accepts_html INTEGER,has_accept_language INTEGER,asn INTEGER);CREATE TABLE owner_clients(daily_client_id TEXT PRIMARY KEY,utc_date TEXT);`;
 for(const sql of schema.split(';').filter(Boolean))await db.prepare(sql).run();
 return{db,mf,schema};
}
export async function loadRows(db,rows){
 const fields=['id','daily_client_id',...TEXT_FIELDS,...flags.filter(f=>f!=='owner_client'),'asn'];
 for(let i=0;i<rows.length;i+=64){
  await db.batch(rows.slice(i,i+64).map(row=>{const daily=BigInt(row.id).toString(16).padStart(32,'0');return db.prepare(`INSERT INTO page_observations(${fields.join(',')})VALUES(${fields.map(()=>'?').join(',')})`).bind(row.id,daily,...TEXT_FIELDS.map(f=>row[f]),...flags.filter(f=>f!=='owner_client').map(f=>row[f]),row.asn)}));
  const owners=rows.slice(i,i+64).filter(row=>row.owner_client===1);if(owners.length)await db.batch(owners.map(row=>db.prepare("INSERT INTO owner_clients(daily_client_id,utc_date)VALUES(?,'synthetic-owner-link')").bind(BigInt(row.id).toString(16).padStart(32,'0'))));
 }
}
function once(sql,before,after){assert.equal(sql.split(before).length,2,'Upstream diagnostic changed');return sql.replace(before,after)}
const CENSUS_SQL=once(BASE_CENSUS,OLD_CUTOFF,EVENT_CUTOFF);
const facts=once(CENSUS_SQL.slice(0,CENSUS_SQL.indexOf(' groups AS (')),'facts AS MATERIALIZED (SELECT collection_version,','facts AS MATERIALIZED (SELECT CAST(id AS TEXT) AS private_reference,collection_version,');
const ROW_SQL=once(facts,'projected AS MATERIALIZED (SELECT\n CASE','projected AS MATERIALIZED (SELECT private_reference,\n CASE').replace(/,\s*$/,'')+' SELECT * FROM projected ORDER BY CAST(private_reference AS INTEGER)';
const prefix=CENSUS_SQL.slice(0,CENSUS_SQL.indexOf('facts AS MATERIALIZED'));
const included=`is_owner=0 AND NOT EXISTS(SELECT 1 FROM owner_clients WHERE owner_clients.daily_client_id=bounded.daily_client_id) AND NOT COALESCE(referrer_host IN (SELECT original FROM abusive_hosts),0)`;
function metadataSql(selection){return prefix+`included AS MATERIALIZED (SELECT * FROM bounded${selection==='included'?' WHERE '+included:''}),${fetchMetadataReportCtes()} SELECT COUNT(*) AS rows,(${fetchMetadataReportProjectionSql()}) AS payload FROM included`}
const knownSources=new Set(['edge','beacon']);
export async function analyze(db,rows,lower,upper){
 exactId(lower);exactId(upper);const parameters=[lower,upper,referralRulesJson(ACTIVE_REFERRAL_POLICY)];
 const meters=[];const run=async sql=>{const result=await db.prepare(sql).bind(...parameters).all();meters.push({rowsRead:result.meta.rows_read,rowsWritten:result.meta.rows_written});return result};
 const census=validateAggregate('census',(await run(CENSUS_SQL)).results);assert.equal(census.totals.rows,rows.length);
 const methods=validateAggregate('methods',(await run(METHODS_SQL)).results),context=validateAggregate('context',(await run(CONTEXT_SQL)).results);
 assert.equal(methods.reduce((n,r)=>n+r.views,0),rows.length);
 const assessments=(await run(ROW_SQL)).results;assert.equal(assessments.length,rows.length);
 const grouped=new Map();for(const [i,row]of assessments.entries()){
  assert.equal(row.private_reference,rows[i].id);const{private_reference,...facts}=row;const key=JSON.stringify(facts),old=grouped.get(key);if(old)old.views++;else grouped.set(key,{...facts,views:1});
 }
 const canonical=v=>JSON.stringify(Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))));
 assert.deepEqual([...grouped.values()].map(canonical).sort(),census.groups.map(canonical).sort(),'Per-row assessments disagree with grouped population');
 const summary=summarize(census),selected=assessments.filter(r=>r.inclusion==='included');
 assert.equal(selected.length,summary.inclusion.included??0);
 const metadata={};for(const scope of ['raw','included']){
  const result=await run(metadataSql(scope));assert.equal(result.results.length,1);const raw=result.results[0];assert.equal(raw.rows,scope==='raw'?rows.length:selected.length);metadata[scope]=decodeFetchMetadataRows(JSON.parse(raw.payload),raw.rows);
 }
 const sourceCounts=selectedRows=>{const out={};for(const row of selectedRows){const source=rows.find(input=>input.id===row.private_reference).observation_source;const key=source===null?'not-recorded':knownSources.has(source)?source:'unrecognized';out[key]=(out[key]??0)+1}return out};
 return{census,methods,context,summary,metadata,observationSources:{raw:sourceCounts(assessments),included:sourceCounts(selected)},assessments,localMeters:meters};
}

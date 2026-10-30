import assert from 'node:assert/strict';
import {createReferralAssessor,normalizeReportedHost} from '../../analytics/.test-dist/referral-policy.js';
import {ACTIVE_REFERRAL_POLICY} from '../../analytics/.test-dist/referral-policy.generated.js';
import {exactId} from './evidence-delta.mjs';
export const WINDOW={start:'2026-10-01 00:00:00',end:'2026-10-29 00:00:00'};
const DAY=86400000;
export function validateWindow(window){
 assert.ok(window!==null&&typeof window==='object'&&!Array.isArray(window));assert.deepEqual(Object.keys(window).sort(),['end','start']);
 for(const value of [window.start,window.end]){assert.ok(typeof value==='string'&&/^\d{4}-\d{2}-\d{2} 00:00:00$/.test(value));const at=new Date(value.replace(' ','T')+'Z');assert.ok(Number.isFinite(at.getTime())&&at.toISOString().slice(0,19).replace('T',' ')===value)}
 const span=Date.parse(window.end.replace(' ','T')+'Z')-Date.parse(window.start.replace(' ','T')+'Z');assert.ok(span>=DAY&&span<=28*DAY&&span%DAY===0);return window;
}
export const PLAN={maximumRows:4096,maximumSourceBytes:1500000,maximumRowSourceBytes:8192,maximumStatements:2,agentAttempts:1,readReviewThresholdPerStatement:100000,databaseEnforcedReadCap:false};
export const TEXT_FIELDS=['path','observed_at','daily_client_id','referrer_host','referrer_state','internal_referrer_path','collection_version','classifier_version','observation_source','representation','reader_reason'];
const bytes=TEXT_FIELDS.map(f=>`COALESCE(length(CAST(${f} AS BLOB)),0)`).join('+');
const where="reader_kind='browser' AND observed_at>=? AND observed_at<?";
export const PREFLIGHT_SQL=`SELECT COUNT(*) AS rows,CAST(MAX(id) AS TEXT) AS upperId,COALESCE(SUM(source_bytes),0) AS sourceBytes,COALESCE(MAX(source_bytes),0) AS maximumRowSourceBytes FROM (SELECT id,(${bytes}) AS source_bytes FROM page_observations WHERE ${where} LIMIT ${PLAN.maximumRows+1})`;
export const EXPORT_SQL=`SELECT CAST(id AS TEXT) AS id,${TEXT_FIELDS.join(',')},is_owner,EXISTS(SELECT 1 FROM owner_clients WHERE owner_clients.daily_client_id=page_observations.daily_client_id) AS owner_client FROM page_observations WHERE ${where} AND id<=CAST(? AS INTEGER) ORDER BY observed_at,page_observations.id LIMIT ${PLAN.maximumRows+1}`;
export const EXPORT_FIELDS=['id',...TEXT_FIELDS,'is_owner','owner_client'];
export function prepare(kind,upper='0',window=WINDOW){
 validateWindow(window);exactId(upper);const values=kind==='preflight'?[window.start,window.end]:[window.start,window.end,upper];const template=kind==='preflight'?PREFLIGHT_SQL:kind==='export'?EXPORT_SQL:null;assert.ok(template);let i=0;
 const sql=template.replace(/\?/g,()=>`'${values[i++]}'`)+';\n';assert.equal(i,values.length);assert.ok(Buffer.byteLength(sql)<100000);return sql;
}
const integer=n=>typeof n==='number'&&Number.isSafeInteger(n)&&n>=0;
export function validatePreflight(v){
 assert.deepEqual(Object.keys(v).sort(),['rows','upperId','sourceBytes','maximumRowSourceBytes'].sort());for(const key of ['rows','sourceBytes','maximumRowSourceBytes'])assert.ok(integer(v[key]));assert.ok(v.rows<=PLAN.maximumRows&&v.sourceBytes<=PLAN.maximumSourceBytes&&v.maximumRowSourceBytes<=PLAN.maximumRowSourceBytes);
 if(v.rows===0){assert.equal(v.upperId,null);assert.equal(v.sourceBytes,0);assert.equal(v.maximumRowSourceBytes,0)}else assert.ok(BigInt(exactId(v.upperId))>0n);return v;
}
export function validateExport(rows,pre,window=WINDOW){
 validateWindow(window);validatePreflight(pre);assert.ok(Array.isArray(rows)&&rows.length===pre.rows);let bytes=0,maximum=0,maxId=0n;const seen=new Set();
 for(const r of rows){assert.deepEqual(Object.keys(r).sort(),EXPORT_FIELDS.slice().sort());const id=BigInt(exactId(r.id));assert.ok(id>0n&&id<=BigInt(pre.upperId)&&!seen.has(r.id));seen.add(r.id);if(id>maxId)maxId=id;
 for(const field of TEXT_FIELDS)assert.ok(r[field]===null||typeof r[field]==='string');for(const flag of ['is_owner','owner_client'])assert.ok(r[flag]===0||r[flag]===1);
 assert.ok(typeof r.path==='string'&&typeof r.observed_at==='string'&&r.observed_at>=window.start&&r.observed_at<window.end);assert.ok(typeof r.daily_client_id==='string'&&/^[0-9a-f]{32}$/.test(r.daily_client_id));
 const size=TEXT_FIELDS.reduce((n,k)=>n+(r[k]===null?0:Buffer.byteLength(r[k])),0);bytes+=size;maximum=Math.max(maximum,size)}
 if(rows.length)assert.equal(String(maxId),pre.upperId);assert.equal(bytes,pre.sourceBytes);assert.equal(maximum,pre.maximumRowSourceBytes);return rows;
}
const normalized=host=>host===null?null:normalizeReportedHost(host).replace(/^www\./,'');
export function sourceOf(row){
 const host=normalized(row.referrer_host),state=row.referrer_state;
 if(state==='internal')return{bucket:'internal',host:null};
 if(state==='absent')return{bucket:host===null?'no-referrer':'inconsistent',host:null};
 if(state==='unusable')return{bucket:'unusable',host:null};
 if(state==='external')return{bucket:host?'external':'inconsistent',host};
 if(state!==null)return{bucket:'unrecognized',host:null};
 if(host==='gkoreli.com')return{bucket:'internal-legacy-host',host:null};
 return{bucket:host?'external-legacy-host':'legacy-unknown',host};
}
export function channelOf(host){
 if(host===null)return null;
 if(['chatgpt.com','chat.openai.com','claude.ai','perplexity.ai','grok.com','copilot.microsoft.com','gemini.google.com'].includes(host))return'AI referral';
 if(['google.com','google.co.uk','google.de','google.ca','google.com.au','bing.com','duckduckgo.com','kagi.com','search.brave.com'].includes(host))return'Search referral';
 if(['t.co','x.com','twitter.com'].includes(host))return'X referral';
 if(host==='github.com'||host==='gist.github.com')return'GitHub referral';
 if(host==='news.ycombinator.com')return'Hacker News referral';
 if(host==='reddit.com'||host.endsWith('.reddit.com'))return'Reddit referral';
 return'Other external';
}
function validDay(at){if(!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(at))return null;const d=new Date(at.replace(' ','T')+'Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,19).replace('T',' ')===at?at.slice(0,10):null}
// Display approval is a privacy decision, not source authenticity or acquisition quality.
// Select the sensitivity cohort explicitly so a later display-policy edit cannot change it.
export function analyze(rows,posts,{sensitivityHost=null,referralPolicy=ACTIVE_REFERRAL_POLICY,window=WINDOW}={}){
 validateWindow(window);const startAt=Date.parse(window.start.replace(' ','T')+'Z');assert.equal(Date.parse(window.end.replace(' ','T')+'Z')-startAt,28*DAY,'Weekly analysis requires exactly 28 complete days');
 for(const row of rows)assert.ok(typeof row.observed_at==='string'&&row.observed_at>=window.start&&row.observed_at<window.end,'Row outside analysis window');
 assert.ok(sensitivityHost===null||(typeof sensitivityHost==='string'&&normalized(sensitivityHost)===sensitivityHost));
 const assess=createReferralAssessor(referralPolicy),postMap=new Map(posts.map(p=>['/'+p.slug,p])),approved=new Set(referralPolicy.publicHosts),included=[],exclusions={'owner-excluded':0,'referral-excluded':0};
 for(const row of rows){if(row.is_owner===1||row.owner_client===1){exclusions['owner-excluded']++;continue}if(assess(row.referrer_host).action==='exclude'){exclusions['referral-excluded']++;continue}included.push({...row,source:sourceOf(row),day:validDay(row.observed_at)})}
 const hosts=new Map();for(const r of included)if(r.source.host&&r.source.bucket.startsWith('external'))hosts.set(r.source.host,(hosts.get(r.source.host)??0)+1);
 const rankedHosts=[...hosts].map(([host,views])=>({host,views,displayApproved:approved.has(host)})).sort((a,b)=>b.views-a.views||a.host.localeCompare(b.host)),dominant=sensitivityHost;
 const count=(obj,key)=>obj[key]=(obj[key]??0)+1;
 function metrics(set){
  const m={views:set.length,withoutDominant:0,dailyClientPageGroups:0,dailyClientPageGroupsWithoutDominant:0,namedExternal:0,namedExternalDays:0,external:0,internal:0,noReferrer:0,unknown:0,dominant:0,sources:{},channels:{},classifiers:{},representations:{}};const clients=new Set(),without=new Set(),days=new Set();
  for(const r of set){const external=r.source.bucket.startsWith('external'),isDominant=dominant!==null&&external&&r.source.host===dominant;const key=JSON.stringify([r.day,r.daily_client_id,r.path]);if(r.day!==null)clients.add(key);if(isDominant)m.dominant++;else{m.withoutDominant++;if(r.day!==null)without.add(key)}
   if(external){m.external++;count(m.sources,r.source.host);count(m.channels,channelOf(r.source.host));if(approved.has(r.source.host)){m.namedExternal++;if(r.day!==null)days.add(r.day)}}else if(r.source.bucket.startsWith('internal'))m.internal++;else if(r.source.bucket==='no-referrer')m.noReferrer++;else m.unknown++;
   count(m.classifiers,r.classifier_version??'not-recorded');count(m.representations,r.representation??'not-recorded');
  }
  m.dailyClientPageGroups=clients.size;m.dailyClientPageGroupsWithoutDominant=without.size;m.namedExternalDays=days.size;m.recognizedTimeViews=set.filter(r=>r.day!==null).length;m.repeatedSameDayClientPageRequests=m.recognizedTimeViews-clients.size;assert.equal(m.external+m.internal+m.noReferrer+m.unknown,m.views);return m;
 }
 const starts=Array.from({length:4},(_,i)=>new Date(startAt+i*7*DAY).toISOString().slice(0,10)),endDay=window.end.slice(0,10);const weekly=starts.map((start,i)=>{const end=i===3?endDay:starts[i+1],selected=included.filter(r=>r.day!==null&&r.day>=start&&r.day<end);return{start,end,...metrics(selected),articles:metrics(selected.filter(r=>postMap.has(r.path)))}});
 const articles=[...postMap].map(([path,p])=>({path,title:p.title,date:p.date,section:p.section,...metrics(included.filter(r=>r.path===path)),weekly:starts.map((start,i)=>{const end=i===3?endDay:starts[i+1];return{start,...metrics(included.filter(r=>r.path===path&&r.day!==null&&r.day>=start&&r.day<end))}})})).filter(a=>a.views>0).sort((a,b)=>b.views-a.views||a.path.localeCompare(b.path));
 const unmatched={};for(const row of included)if(!postMap.has(row.path))count(unmatched,row.path);
 return{window:{...window},selectedStoredKind:'browser',rawRows:rows.length,includedRows:included.length,exclusions,totals:metrics(included),weekly,articles,nonArticlePaths:unmatched,rankedHosts,sensitivityHost:dominant,sourceStates:included.reduce((out,r)=>(count(out,r.source.bucket),out),{}),invalidTimes:included.filter(r=>r.day===null).length,policySha256:referralPolicy.sha256,limitations:['Stored browser-rule matches, not identified humans; rules changed during this window.','Setting the explicitly selected source aside is a sensitivity calculation, not an accepted exclusion or a corrected human count.','namedExternal counts public-display approvals, not authenticated sources or editorial quality.','Client-days group stored per-day pseudonyms and paths; they are not distinct people or cross-day retention.','A reported source supports acquisition inference without authenticating the referral or exposing a search query.']};
}

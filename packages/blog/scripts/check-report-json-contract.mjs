import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {resolve,dirname,relative} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {queryStats} from '../../analytics/.test-dist/stats.js';
import {boundedJsonObjectSql} from '../../analytics/.test-dist/sql-json.js';
import {summaryCases} from '../../analytics/test/fixtures/signature-summary.mjs';

const[output,privateOutput]=process.argv.slice(2);assert.ok(privateOutput);
const baseline='b408fcf',sourceRoot=resolve('packages/analytics/src');
const previous=path=>execFileSync('git',['show',`${baseline}:${path}`],{encoding:'utf8'});
const old=await build({stdin:{contents:previous('packages/analytics/src/stats.ts'),loader:'ts',resolveDir:sourceRoot},bundle:true,write:false,format:'esm',platform:'node',logLevel:'silent',plugins:[{name:'pinned-baseline',setup(builder){
 builder.onLoad({filter:/[/\\]analytics[/\\]src[/\\].*\.ts$/},args=>({contents:previous('packages/analytics/src/'+relative(sourceRoot,args.path).replaceAll('\\','/')),loader:'ts',resolveDir:dirname(args.path)}));
}}]});
const oldStats=(await import('data:text/javascript;base64,'+Buffer.from(old.outputFiles[0].contents).toString('base64'))).queryStats;
const req=createRequire(resolve('package.json'));const{Miniflare}=await import(pathToFileURL(req.resolve('miniflare',{paths:[dirname(req.resolve('wrangler/package.json'))]})));
const mf=new Miniflare({modules:true,script:'export default{fetch(){return new Response("report JSON contract")}}',compatibilityDate:'2026-03-06',cf:{},d1Databases:{DB:'report-json-contract'}});
const hash=v=>createHash('sha256').update(v).digest('hex'),now=new Date('2026-10-29T17:00:00Z');
const insertSql=`INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,reader_kind,reader_reason,observed_at,signature_status,signature_agent,signature_evidence,is_owner,referrer_host,representation)
 VALUES(?,?,?,?,?,'fixture',?,?,?,?,?,?,'html')`;
try{
 const db=await mf.getD1Database('DB'),schema=readFileSync('packages/analytics/schema.sql','utf8');
 await db.batch(schema.replace(/^\s*--.*$/gm,'').split(';').map(s=>s.trim()).filter(Boolean).map(s=>db.prepare(s)));
 const functionBoundary=[];
 const coalesce=n=>'SELECT coalesce('+[...Array(n-1).fill('NULL'),'1'].join(',')+') AS value';
 for(const argumentsCount of [32,88,127]){
  assert.equal((await db.prepare(coalesce(argumentsCount)).first()).value,1);
  functionBoundary.push({arguments:argumentsCount,accepted:true});
 }
 await assert.rejects(db.prepare(coalesce(128)).all(),/too many arguments on function coalesce/);
 functionBoundary.push({arguments:128,accepted:false});
 let last=null,pending=null;
 const tap={prepare(sql){return{bind(...values){pending={sql,values};return db.prepare(sql).bind(...values)}}},async batch(statements){
  assert.equal(statements.length,1);const results=await db.batch(statements);last={...pending,rows:results[0].results,meta:results[0].meta};return results;
 }};
 const trials=[],measurements=[];
 async function compare(label,query,fixtureRows){
  const before=await oldStats(tap,query,now),oldCapture=last,after=await queryStats(tap,query,now),newCapture=last;
  assert.deepEqual(after,before,label);assert.deepEqual(newCapture.rows,oldCapture.rows,label+' raw rows');assert.deepEqual(newCapture.values,oldCapture.values);
  assert.equal(newCapture.meta.rows_written,0);assert.equal(oldCapture.meta.rows_written,0);assert.equal(newCapture.meta.rows_read,oldCapture.meta.rows_read,label+' read cost');
  const raw=JSON.parse(newCapture.rows.find(r=>r.section==='verification').payload)[0];assert.equal(Object.keys(raw).length,44);
  if(after.totals.views===0)assert.ok(Object.values(raw).every(v=>v===null),label+' explicit nulls');
  assert.ok(Buffer.byteLength(newCapture.sql)<100000);assert.ok(newCapture.values.length<=100);
  trials.push({label,query,fixtureRows,baselineSql:oldCapture.sql,candidateSql:newCapture.sql,values:newCapture.values,expectedRows:newCapture.rows});
  measurements.push({label,fixtureRows,included:after.totals.views,baselineReads:oldCapture.meta.rows_read,candidateReads:newCapture.meta.rows_read,writes:0,
   rawAndDecodedOutputEqual:true,verificationFields:44,explicitNullFields:Object.values(raw).filter(v=>v===null).length,
   baselineSqlBytes:Buffer.byteLength(oldCapture.sql),candidateSqlBytes:Buffer.byteLength(newCapture.sql),boundParameters:newCapture.values.length});
 }
 await compare('empty-seven-day',{range:'7d',traffic:'all',path:'/privacy'},0);
 await compare('empty-all-time',{range:'all',traffic:'all'},0);
 const inserts=[];
 for(let i=0;i<512;i++){
  const c=summaryCases[i%summaryCases.length],kind=['browser','ai-search','search-crawler','other-bot','unresolved','ai-assistant',null][i%7];
  const values=[i%11===0?'/other-fixture':'/privacy',String(i+1).padStart(32,'0'),kind==='browser'?'browser':'ai',i%3===0?'mobile':'desktop',kind,
   i%19===0?'2026-10-01 04:00:00':'2026-10-29 04:00:00',c.status,c.status==='verified'?'https://crawler.exa.ai':null,c.e===null?null:JSON.stringify(c.e),
   Number(i%17===0),i%13===0?'traffic2cash.xyz':null];inserts.push(values);
 }
 for(let i=0;i<inserts.length;i+=64)await db.batch(inserts.slice(i,i+64).map(values=>db.prepare(insertSql).bind(...values)));
 for(const range of ['7d','all'])for(const traffic of ['all','browser','agents','crawlers','automation','unresolved']){
  await compare(range+'-'+traffic,{range,traffic,path:'/privacy'},512);
 }
 for(const range of ['30d','90d'])await compare(range+'-all-paths',{range,traffic:'all'},512);
 await compare('missing-path',{range:'7d',traffic:'all',path:'/missing-fixture'},512);
 const boundaryFields=Object.fromEntries(Array.from({length:47},(_,i)=>['field'+i,i%2===0?'NULL':"json('[1,null]')"]));
 const boundary=JSON.parse((await db.prepare('SELECT '+boundedJsonObjectSql(boundaryFields)+' AS value').first()).value);
 assert.equal(Object.keys(boundary).length,47);for(let i=0;i<47;i++)assert.deepEqual(boundary['field'+i],i%2===0?null:[1,null]);
 const privateBytes=JSON.stringify({baseline,schema,insertSql,inserts,trials},null,2)+'\n';writeFileSync(privateOutput,privateBytes,{flag:'wx',mode:0o600});
 const receipt={checkedAt:new Date().toISOString(),baseline,baselineGraph:'Every baseline analytics module is pinned to its Git source.',fixtureRows:512,summaryFixtureCases:summaryCases.length,
  nativeReportComparisons:measurements.length,measurements,functionBoundary,chunkBoundaryFields:47,nullAndJsonTypesPreserved:true,scriptSha256:hash(readFileSync(new URL(import.meta.url))),
  inputSha256:hash(privateBytes),sourceSha256:Object.fromEntries(['stats.ts','sql-json.ts'].map(name=>[name,hash(readFileSync('packages/analytics/src/'+name))])),
  productionCalls:0,humanLabels:0,limits:['Synthetic stored facts, not new cryptographic proofs or human labels.','Local read equality does not prove production cost or general runtime equivalence.','No claim that the old report currently fails in production.']};
 writeFileSync(output,JSON.stringify(receipt,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify({comparisons:measurements.length,fixtureRows:512,readsEqual:true,rawAndDecodedOutputEqual:true}));
}finally{await mf.dispose()}

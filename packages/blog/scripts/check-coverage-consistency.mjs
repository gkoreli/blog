import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {resolve,dirname,relative,join} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
import {build} from 'esbuild';
import {createHash} from 'node:crypto';
import {queryStats} from '../../analytics/.test-dist/stats.js';
import {verifyWebBotAuth,createWebBotAuthCache} from '../../analytics/.test-dist/webbotauth.js';
import {coverageConsistencyCases} from '../../analytics/test/fixtures/coverage-consistency.mjs';

const [output,gitRepository,producerInputs]=process.argv.slice(2);assert.ok(output&&gitRepository&&producerInputs);
const root=resolve(fileURLToPath(new URL('../../../',import.meta.url))),baseline='c3e4c0ee6d016147272e329197d4c1c85ab2ac34';
const hash=b=>createHash('sha256').update(b).digest('hex');
const save=(name,data)=>writeFileSync(join(output,name),JSON.stringify(data,null,2)+'\n',{flag:'wx',mode:0o600});
const previous=path=>execFileSync('git',['-C',gitRepository,'show',baseline+':'+path],{encoding:'utf8'});
const beforeBundle=await build({stdin:{contents:previous('packages/analytics/src/stats.ts'),loader:'ts',resolveDir:join(root,'packages/analytics/src')},bundle:true,format:'esm',platform:'node',write:false,plugins:[{name:'pinned-report',setup(b){b.onLoad({filter:/[/\\]analytics[/\\]src[/\\].*\.ts$/},args=>({contents:previous(relative(root,args.path)),loader:'ts',resolveDir:dirname(args.path)}));}}]});
const oldStats=(await import('data:text/javascript;base64,'+Buffer.from(beforeBundle.outputFiles[0].contents).toString('base64'))).queryStats;
const require=createRequire(join(root,'packages/blog/package.json'));
const {Miniflare}=await import(pathToFileURL(require.resolve('miniflare',{paths:[dirname(require.resolve('wrangler/package.json'))]})));
const cases=coverageConsistencyCases(),query={range:'7d',traffic:'all'},now=new Date('2026-10-28T05:00:00Z');
const schema=readFileSync(join(root,'packages/analytics/schema.sql'),'utf8');
const insert="INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,reader_kind,reader_reason,observed_at,signature_status,signature_agent,signature_evidence,is_owner,referrer_host) VALUES('/article',?,'ai','desktop','ai-search','fixture',?,'verified','https://crawler.exa.ai',?,?,?)";
const values=(id,row,options={})=>[String(id).padStart(32,'0'),options.at??'2026-10-28 04:00:00',JSON.stringify(row.e),options.owner??0,options.referrer??null];
const sqlite=new DatabaseSync(':memory:');sqlite.exec(schema);
const nodeDb={prepare(sql){return{bind(...values){return{sql,values};}}},async batch(stmts){return stmts.map(s=>({results:sqlite.prepare(s.sql).all(...s.values)}));}};
const native=new Miniflare({modules:true,script:'export default{fetch(){return new Response("local coverage controls")}}',compatibilityDate:'2026-03-06',cf:{},d1Databases:{DB:'coverage-consistency'}});
let validReads;const controls=[];
try{
 const db=await native.getD1Database('DB');await db.batch(schema.replace(/^\s*--.*$/gm,'').split(';').map(s=>s.trim()).filter(Boolean).map(s=>db.prepare(s)));
 let lastMeta;const metered={prepare(sql){return{bind(...v){return db.prepare(sql).bind(...v);}}},async batch(stmts){const r=await db.batch(stmts);lastMeta=r[0].meta;return r;}};
 for(const [i,row] of cases.entries()){
  sqlite.exec('DELETE FROM page_observations');sqlite.prepare(insert).run(...values(i+1,row));await db.prepare('DELETE FROM page_observations').run();await db.prepare(insert).bind(...values(i+1,row)).run();
  const beforeNode=await oldStats(nodeDb,query,now),afterNode=await queryStats(nodeDb,query,now),before=await oldStats(metered,query,now),after=await queryStats(metered,query,now);
  assert.deepEqual(before,beforeNode,row.name+':before');assert.deepEqual(after,afterNode,row.name+':after');assert.equal(before.verification.coverageRecordedViews,Number(row.before),row.name);assert.equal(after.verification.coverageRecordedViews,Number(row.after),row.name);assert.equal(after.verification.localVerifiedViews,1);assert.equal(after.totals.views,1);assert.equal(after.bySigner[0].views,1);assert.equal(after.verification.nativeAvailableViews,1);
  if(row.before===row.after)assert.deepEqual(after,before,row.name+':unchanged');
  else{assert.equal(after.verification.coverageUnrecognizedVerifiedViews,1);assert.equal(after.byKindSignature[0].basis,'verified-coverage-unknown');for(const f of ['userAgentBoundViews','resourceBoundViews','methodBoundViews','authorityOnlyViews','vendorUserAgentBoundViews'])assert.equal(after.verification[f],0,row.name+':'+f);}
  controls.push({id:row.name,before:before.verification,after:after.verification,beforeBasis:before.byKindSignature,afterBasis:after.byKindSignature});
 }
 await db.prepare('DELETE FROM page_observations').run();
 for(let start=0;start<384;start+=64)await db.batch(Array.from({length:64},(_,i)=>db.prepare(insert).bind(...values(start+i+1,cases[(start+i)%3]))));
 const before=await oldStats(metered,query,now),beforeMeta=lastMeta,after=await queryStats(metered,query,now),afterMeta=lastMeta;assert.deepEqual(after,before);validReads={rows:384,beforeReads:beforeMeta.rows_read,afterReads:afterMeta.rows_read,beforeWrites:beforeMeta.rows_written,afterWrites:afterMeta.rows_written,fullReportIdentical:true,scope:'One local native relation; not production cost or CPU/latency benchmark'};
 await db.prepare('DELETE FROM page_observations').run();await db.batch([...cases.map((c,i)=>db.prepare(insert).bind(...values(i+1,c))),db.prepare(insert).bind(...values(100,cases[3],{owner:1})),db.prepare(insert).bind(...values(101,cases[3],{referrer:'traffic2cash.xyz'})),db.prepare(insert).bind(...values(102,cases[3],{at:'2026-10-29 00:00:00'}))]);
 const mixed=await queryStats(metered,query,now);assert.equal(mixed.totals.views,cases.length);assert.equal(mixed.referralPolicy.excludedViews,1);assert.equal(mixed.verification.localVerifiedViews,cases.length);
 const empty=await queryStats(metered,{...query,path:'/missing'},now);assert.equal(empty.totals.views,0);assert.ok(Object.values(empty.verification).every(n=>n===0));save('mixed-report.json',mixed);save('stored-record-controls.json',controls);
}finally{sqlite.close();await native.dispose();}

const producerRows=JSON.parse(readFileSync(producerInputs,'utf8'));
async function producer(row){let fetches=0;const result=await verifyWebBotAuth(new Request(row.url,{headers:row.headers}),{now:new Date(row.now),includeEvidence:true,cache:createWebBotAuthCache(),fetcher:async()=>{fetches++;return Response.json({keys:[row.jwk]},{headers:{'Content-Type':'application/http-message-signatures-directory+json'}});}});assert.equal(result.status,row.expected,row.id);return{id:row.id,result,localMockFetches:fetches};}
const nodeProducers=[];for(const row of producerRows)nodeProducers.push(await producer(row));
const producerBundle=await build({stdin:{contents:`import{verifyWebBotAuth,createWebBotAuthCache}from'${root}/packages/analytics/src/webbotauth.ts';export default{async fetch(request){const rows=await request.json(),out=[];for(const row of rows){let fetches=0;const result=await verifyWebBotAuth(new Request(row.url,{headers:row.headers}),{now:new Date(row.now),includeEvidence:true,cache:createWebBotAuthCache(),fetcher:async()=>{fetches++;return Response.json({keys:[row.jwk]},{headers:{'Content-Type':'application/http-message-signatures-directory+json'}});}});out.push({id:row.id,result,localMockFetches:fetches});}return Response.json(out);}}`,resolveDir:root},bundle:true,format:'esm',platform:'browser',write:false,target:'es2022'});
const producerRuntime=new Miniflare({modules:true,script:producerBundle.outputFiles[0].text,compatibilityDate:'2026-03-06',cf:{}});
try{const r=await producerRuntime.dispatchFetch('https://local.invalid/',{method:'POST',body:JSON.stringify(producerRows)});assert.equal(r.status,200);const actual=await r.json();assert.deepEqual(actual,nodeProducers);save('native-producers.json',actual);}finally{await producerRuntime.dispose();}
save('node-producers.json',nodeProducers);
const collectorOptions={entryPoints:[join(root,'packages/analytics/src/index.ts')],absWorkingDir:root,bundle:true,format:'esm',platform:'browser',target:'es2022',write:false};
const collector=await build(collectorOptions),oldCollector=await build({...collectorOptions,plugins:[{name:'pinned-collector',setup(b){b.onLoad({filter:/[/\\]analytics[/\\]src[/\\].*\.ts$/},args=>({contents:previous(relative(root,args.path)),loader:'ts',resolveDir:dirname(args.path)}));}}]});assert.notDeepEqual(collector.outputFiles[0].contents,oldCollector.outputFiles[0].contents);
// The package entry also exports handleStats, so report changes alter it. Isolate
// the observation export when testing the collection path.
const observationOptions={absWorkingDir:root,stdin:{contents:`export{observePageResponse}from'${root}/packages/analytics/src/index.ts'`,resolveDir:root},bundle:true,format:'esm',platform:'browser',target:'es2022',write:false};
const observation=await build(observationOptions),oldObservation=await build({...observationOptions,plugins:[{name:'pinned-observation',setup(b){b.onLoad({filter:/[/\\]analytics[/\\]src[/\\].*\.ts$/},args=>({contents:previous(relative(root,args.path)),loader:'ts',resolveDir:dirname(args.path)}));}}]});assert.deepEqual(observation.outputFiles[0].contents,oldObservation.outputFiles[0].contents);
const receipt={checkedAt:new Date().toISOString(),baseline,recordCases:cases.length,changedCoverageCases:cases.filter(c=>c.before!==c.after).length,exactNodeNativeFullReportAgreement:true,producerCases:producerRows.length,exactNodeNativeProducerAgreement:true,validReads,ownerExclusion:true,referralExclusion:true,outsideWindowExclusion:true,emptyReportAllZero:true,rawRowsRewritten:false,packageEntryIncludesChangedReport:true,packageEntryBeforeSha256:hash(oldCollector.outputFiles[0].contents),packageEntryAfterSha256:hash(collector.outputFiles[0].contents),observationExportBundleIdentical:true,observationExportBundleSha256:hash(observation.outputFiles[0].contents),productionRequests:0,productionSqlStatements:0,externalFeedRequests:0,newHumanLabels:0};save('checks.json',receipt);console.log(JSON.stringify(receipt));

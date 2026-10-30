import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {dirname,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {queryStats} from '../../analytics/.test-dist/stats.js';
import {verifyVendorIp,createVendorIpCache} from '../../analytics/.test-dist/vendor-ip.js';
import {vendorCacheSummaryCases,expectedVendorCacheSummary} from '../../analytics/test/fixtures/vendor-cache-summary.mjs';
import {decodeVendorCacheRows} from '../../analytics/.test-dist/vendor-cache-report.js';
import {COLLECTION_VERSION} from '../../analytics/.test-dist/versions.js';
const [output,privateOutput]=process.argv.slice(2);assert.ok(output&&privateOutput);
const baseline='7bebbab';
const prior=execFileSync('git',['show',baseline+':packages/analytics/src/stats.ts'],{encoding:'utf8'}).replace("from './fetch-metadata-report.js'","from 'fixture:previous-metadata'");
const metadata=execFileSync('git',['show',baseline+':packages/analytics/src/fetch-metadata-report.ts'],{encoding:'utf8'});
const bundle=await build({entryPoints:['packages/blog/test/fixtures/vendor-cache-summary-worker.js'],bundle:true,platform:'browser',format:'esm',write:false,logLevel:'silent',plugins:[{name:'pinned-report-baseline',setup(build){
 build.onResolve({filter:/^fixture:previous-(stats|metadata)$/},args=>({path:args.path,namespace:'pinned-report'}));
 build.onLoad({filter:/.*/,namespace:'pinned-report'},args=>({contents:args.path.endsWith('stats')?prior:metadata,loader:'ts',resolveDir:resolve('packages/analytics/src')}));
}}]});
const require=createRequire(new URL('../package.json',import.meta.url)),{Miniflare}=await import(pathToFileURL(require.resolve('miniflare',{paths:[dirname(require.resolve('wrangler/package.json'))]})));
const mf=new Miniflare({modules:true,script:bundle.outputFiles[0].text,compatibilityDate:'2026-03-06',cf:{},d1Databases:{DB:'cache-summary'},bindings:{ANALYTICS_HASH_KEY:'fixture-only'}});
const hash=data=>createHash('sha256').update(data).digest('hex');
const totalRead=r=>r.costs.reduce((n,m)=>n+m.rows_read,0);
try{
 const cases=await(await mf.dispatchFetch('https://fixture.invalid/cases')).json(),nodeCases=await vendorCacheSummaryCases(verifyVendorIp,createVendorIpCache);assert.deepEqual(cases,nodeCases);
 const db=await mf.getD1Database('DB'),schema=readFileSync('packages/analytics/schema.sql','utf8').replace(/^\s*--.*$/gm,'');await db.batch(schema.split(';').map(s=>s.trim()).filter(Boolean).map(s=>db.prepare(s)));
 const insert=(id,item,extra={})=>db.prepare("INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,observed_at,vendor_ip_evidence,referrer_host) VALUES(?,?,'browser','desktop',?,'browser','fixture',?,?,?)").bind(extra.path??'/fixture',String(id).padStart(32,'0'),extra.owner??0,extra.at??'2026-10-30 09:00:00',item.e===null?null:JSON.stringify(item.e),extra.referrer??null);
 const request=async (baseline,range='7d')=>(await(await mf.dispatchFetch('https://fixture.invalid/report?range='+range+(baseline?'&baseline=1':''))).json());
 let individual=0;
 for(const [i,item]of cases.entries()){
  await db.prepare('DELETE FROM page_observations').run();await insert(i+1,item).run();
  const after=await request(false);assert.deepEqual(after.report.vendorCache,expectedVendorCacheSummary([item]),item.name);individual++;
 }
 await db.prepare('DELETE FROM page_observations').run();await db.batch(cases.map((item,i)=>insert(i+1,item)));
 await db.batch([insert(1000,cases[0],{owner:1}),insert(1001,cases[0],{referrer:'traffic2cash.xyz'}),insert(1002,cases[0],{path:'/outside'}),insert(1003,cases[0],{at:'2026-10-31 00:00:00'})]);
 const before=await request(true),after=await request(false);assert.equal(after.report.totals.views,cases.length);assert.deepEqual(after.report.vendorCache,expectedVendorCacheSummary(cases));
 const {vendorCache,...common}=after.report;assert.deepEqual(common,before.report);
 assert.deepEqual(after.report,await queryStats(db,{range:'7d',traffic:'all',path:'/fixture'},new Date('2026-10-30T10:00:00Z')));
 const allBefore=await request(true,'all'),allAfter=await request(false,'all'),{vendorCache:allCache,...allCommon}=allAfter.report;assert.deepEqual(allCommon,allBefore.report);assert.deepEqual(allCache,expectedVendorCacheSummary(cases));
 const statements=[];
 for(const range of ['7d','all']){
  let captured;const captureDb={prepare(sql){return{bind(...values){captured={range,sqlBytes:Buffer.byteLength(sql),boundParameters:values.length};return{};}};},async batch(){throw Error('capture-only');}};
  await assert.rejects(()=>queryStats(captureDb,{range,traffic:'all',path:'/fixture'},new Date('2026-10-30T10:00:00Z')),/capture-only/);assert.ok(captured.sqlBytes<=100000&&captured.boundParameters<=100);statements.push(captured);
 }
 const negatives=[];
 const responseRows=await db.prepare('SELECT vendor_ip_evidence FROM page_observations LIMIT 0').all();assert.equal(responseRows.results.length,0);
 const base={state:'recognized',applicable:1,access:1,policy:1,blockers:0,views:1};
 for(const patch of [{access:64},{policy:0},{policy:2},{blockers:1},{applicable:0},{access:32},{access:4,policy:2,blockers:1},{access:1,policy:5},{access:33,policy:1},{access:5,policy:2,blockers:1},{access:31},{state:'not-recorded'},{extra:'private-canary'},{views:'1'},{views:0}]){assert.throws(()=>decodeVendorCacheRows([{...base,...patch}],1));negatives.push(patch);}
 assert.throws(()=>decodeVendorCacheRows([],1));assert.throws(()=>decodeVendorCacheRows([base],2));assert.throws(()=>decodeVendorCacheRows([base,base],2));
 await db.prepare('DELETE FROM page_observations').run();const collected=await(await mf.dispatchFetch('https://fixture.invalid/collect')).json();assert.deepEqual(collected.settlements,['fulfilled']);assert.equal(collected.acknowledged,1);
 // Place the controlled row at the frozen fixture time; raw collection facts stay exact.
 await db.prepare("UPDATE page_observations SET observed_at='2026-10-30 09:00:00'").run();
 const row=await db.prepare('SELECT collection_version,classifier_version,classification_evidence,sec_fetch_user FROM page_observations').first();assert.equal(row.collection_version,COLLECTION_VERSION);
 const regressionBefore=await request(true),regressionAfter=await request(false);
 assert.equal(regressionBefore.report.fetchMetadata.records.unrecognizedViews,1);assert.equal(regressionAfter.report.fetchMetadata.records.recognizedViews,1);assert.equal(regressionAfter.report.fetchMetadata.activation.trueClaimViews,1);
 const {fetchMetadata:oldMetadata,...oldCommon}=regressionBefore.report,{fetchMetadata:newMetadata,vendorCache:cache,...newCommon}=regressionAfter.report;assert.deepEqual(newCommon,oldCommon);
 const compatibility=[];
 for(const version of ['2026-10-29.6','2026-10-30.1','2026-10-29.5','future-collection']){await db.prepare('UPDATE page_observations SET collection_version=?').bind(version).run();const r=await request(false);assert.equal(r.report.fetchMetadata.records.recognizedViews,['2026-10-29.6','2026-10-30.1'].includes(version)?1:0);compatibility.push({version,records:r.report.fetchMetadata.records});}
 const scale=[];
 for(const scenario of ['historical','current-repeated','current-distinct']){
  await db.prepare('DELETE FROM page_observations').run();
  const fixtureCases=scenario==='historical'?cases.filter(c=>c.expected.state==='not-recorded'):cases.filter(c=>c.expected.state==='recognized');
  for(let batch=0;batch<8;batch++)await db.batch(Array.from({length:64},(_,i)=>{
   const id=batch*64+i,item=structuredClone(fixtureCases[id%fixtureCases.length]);
   if(scenario==='current-distinct'){
    const shift=id*1000;item.e.checkedAt=new Date(Date.parse(item.e.checkedAt)+shift).toISOString();
    for(const c of item.e.checks){if(c.cache?.policy)c.cache.policy.assessedAt=new Date(Date.parse(c.cache.policy.assessedAt)+shift).toISOString();if(c.snapshot)for(const key of ['fetchedAt','validatedAt','freshUntil'])c.snapshot[key]=new Date(Date.parse(c.snapshot[key])+shift).toISOString();}
   }
   return insert(id+1,item);
  }));
  const b=await request(true),a=await request(false),{vendorCache:summary,...rest}=a.report;assert.deepEqual(rest,b.report);
  assert.deepEqual(summary,expectedVendorCacheSummary(Array.from({length:512},(_,i)=>fixtureCases[i%fixtureCases.length])));
  scale.push({scenario,rows:512,beforeReads:totalRead(b),afterReads:totalRead(a),delta:totalRead(a)-totalRead(b),writes:a.costs.reduce((n,m)=>n+m.rows_written,0)});
 }
 const empty=await queryStats(db,{range:'7d',traffic:'all',path:'/missing'},new Date('2026-10-30T10:00:00Z'));assert.deepEqual(empty.vendorCache,expectedVendorCacheSummary([]));
 const receipt={checkedAt:new Date().toISOString(),baselineCommit:baseline,labelledRecordCases:cases.length,nativeIndividualReports:individual,nodeNativeCasesEqual:true,nodeNativeReportsEqual:true,independentSetOraclePassed:true,
  mixed:{views:after.report.totals.views,summary:after.report.vendorCache,beforeReads:totalRead(before),afterReads:totalRead(after),commonReportEqual:true},
  allRangeCommonReportEqual:true,sqlSizeAndBindingChecks:statements,decoderNegatives:negatives.length+3,collectorRegression:{actualNativeCollector:true,operator:'automated-fixture',humanLabel:false,collection:row.collection_version,classifier:row.classifier_version,before:oldMetadata.records,after:newMetadata.records,otherCommonReportEqual:true,rawStoredParsingFactsUnchanged:true,compatibility},scale,
  productionCalls:0,productionSqlStatements:0,humanLabels:0,sourceHashBase:'packages/blog/scripts/',sourceSha256:Object.fromEntries(['../../analytics/src/stats.ts','../../analytics/src/vendor-cache-report.ts','../../analytics/src/vendor-cache-report-contract.ts','../../analytics/src/fetch-metadata-report.ts','../../analytics/test/fixtures/vendor-cache-summary.mjs','../test/fixtures/vendor-cache-summary-worker.js','./check-vendor-cache-summary.mjs'].map(p=>[p,hash(readFileSync(new URL(p,import.meta.url)))])),
  limits:'Local synthetic upstream/record consistency controls. Marginal overlap counts are events, not upstream requests, operators, people, native-provider accuracy or measured production cost. Production activation, assets/report/cache and current CLI authorization remain separate.'};
 writeFileSync(privateOutput,JSON.stringify({cases,before,after,row,regressionBefore,regressionAfter,compatibility,scale,negatives,empty},null,2)+'\n',{flag:'wx',mode:0o600});
 writeFileSync(output,JSON.stringify(receipt,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify({cases:cases.length,decoderNegatives:receipt.decoderNegatives,scale,regression:receipt.collectorRegression}));
}finally{await mf.dispose();}

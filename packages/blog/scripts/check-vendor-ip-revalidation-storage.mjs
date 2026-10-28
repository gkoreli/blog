import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {queryStats} from '../../analytics/.test-dist/stats.js';
import {REVALIDATION_READBACK_SQL} from '../../analytics/test/fixtures/vendor-ip-revalidation.mjs';
import {isObservationId} from '../../analytics/.test-dist/observation-storage.js';
const [output,privateOutput]=process.argv.slice(2);assert.ok(output&&privateOutput);
const bundled=await build({stdin:{resolveDir:process.cwd(),loader:'js',contents:`
 import {observePageResponse} from './packages/analytics/src/index.ts';
 import {verifyVendorIp} from './packages/analytics/src/vendor-ip.ts';
 const logs=[],calls=new Map();console.log=(event,fields)=>logs.push({event,...fields});console.warn=(event,fields)=>logs.push({event,...fields});
 globalThis.fetch=async(url,init)=>{const key=String(url);const count=(calls.get(key)??0)+1;calls.set(key,count);if(init.headers.has('CF-Connecting-IP')||init.headers.has('User-Agent'))throw Error('Reader data forwarded');
  if(count===1)return Response.json({prefixes:[{ipv4Prefix:'66.249.66.0/24'}]},{headers:{'Cache-Control':'no-cache',ETag:'"v1"'}});
  return new Response(null,{status:304,headers:{ETag:key.includes('ahrefs')?'"v1"':'"v2"'}});};
 export default {async fetch(request,env,ctx){const name=request.headers.get('X-Fixture-Name');const copy=new Request(request);Object.defineProperty(copy,'cf',{value:{asn:64512}});const start=logs.length;
  if(name!=='ExaSearchBot')await verifyVendorIp(copy,[name],{now:new Date(Date.now()-31000)});
  const pending=[];observePageResponse(copy,new Response('Controlled revalidation',{headers:{'Content-Type':'text/html'}}),'html',env,{waitUntil(p){pending.push(p);ctx.waitUntil(p);}},{publicPagePaths:async()=>new Set(['/privacy'])});await Promise.all(pending);
  return Response.json({logs:logs.slice(start)});}}
 `},bundle:true,write:false,format:'esm',platform:'browser',logLevel:'silent'});
const req=createRequire(resolve('package.json'));const {Miniflare}=await import(pathToFileURL(req.resolve('miniflare',{paths:[dirname(req.resolve('wrangler/package.json'))]})));const mf=new Miniflare({modules:true,script:bundled.outputFiles[0].text,compatibilityDate:'2026-03-06',d1Databases:{DB:'revalidation-storage'},bindings:{ANALYTICS_HASH_KEY:'local-fixture-only'}});
try{const db=await mf.getD1Database('DB');const schema=readFileSync('packages/analytics/schema.sql','utf8').replace(/^\s*--.*$/gm,'');await db.batch(schema.split(';').map(s=>s.trim()).filter(Boolean).map(s=>db.prepare(s)));
 const controls=[],privateRows=[];
 for(const name of ['Googlebot','AhrefsBot','DuckDuckBot','ExaSearchBot']){
  const headers={'User-Agent':name,'X-Fixture-Name':name,'CF-Connecting-IP':'66.249.66.1',...(name==='DuckDuckBot'?{Referer:'https://traffic2cash.xyz/'}:{})};
  const result=await (await mf.dispatchFetch('https://publication.example/privacy',{headers})).json();const stored=result.logs.find(e=>e.event==='analytics.observation_stored');assert.ok(stored,JSON.stringify(result));assert.equal(stored.collectionVersion,'2026-10-28.10');assert.equal(stored.storage.status,'returned');
  const row=await db.prepare('SELECT collection_version, vendor_ip_evidence, reader_kind, referrer_host FROM page_observations WHERE id = ?').bind(stored.storage.observationId).first();const e=JSON.parse(row.vendor_ip_evidence);assert.equal(row.collection_version,'2026-10-28.10');assert.equal(e.profile,'2026-10-28.2');
  const outcome=e.checks[0]?.outcome??'no-configured-method',reason=e.checks[0]?.reason??null;
  assert.equal(outcome,name==='AhrefsBot'?'listed':name==='ExaSearchBot'?'no-configured-method':'unavailable');assert.equal(reason,['Googlebot','DuckDuckBot'].includes(name)?'revalidation-mismatch':null);
  const native=await db.prepare(REVALIDATION_READBACK_SQL).bind(stored.storage.observationId).all();assert.equal(native.meta.rows_read,1);assert.equal(native.meta.rows_written,0);
  assert.ok(isObservationId(stored.storage.observationId));assert.equal((REVALIDATION_READBACK_SQL.match(/\?/g)??[]).length,1);
  const concrete=await db.prepare(REVALIDATION_READBACK_SQL.replace('?',stored.storage.observationId)).all();assert.deepEqual(concrete.results,native.results);assert.equal(concrete.meta.rows_read,1);assert.equal(concrete.meta.rows_written,0);
  controls.push({name,collectionVersion:row.collection_version,ipProfile:e.profile,outcome,reason,exactReferenceRead:native.meta.rows_read,concreteRead:concrete.meta.rows_read,concreteMatchesParameterized:true});privateRows.push({name,row,result,native});
 }
 const report=await queryStats(db,{range:'7d',traffic:'all',path:'/privacy'});assert.equal(report.totals.views,3);assert.equal(report.referralPolicy.excludedViews,1);assert.equal(report.vendorNetwork.recognizedViews,3);assert.equal(report.vendorNetwork.unrecognizedViews,0);assert.equal(report.vendorNetwork.listedViews,1);assert.equal(report.vendorNetwork.unavailableViews,1);assert.equal(report.vendorNetwork.unmappedDeclarationViews,1);
 const result={checkedAt:new Date().toISOString(),controls,report:{included:report.totals.views,referralExcluded:report.referralPolicy.excludedViews,vendorNetwork:report.vendorNetwork},actualNativeCollector:true,syntheticEdgeContext:true,interceptedVendorTransport:true,clockCondition:'Prime shared feed caches with an expired request-start timestamp; actual collector uses its normal current clock.',newExternalRequests:0,productionCalls:0,limits:'No vendor identity or production malformed-304 occurrence is established.'};writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});writeFileSync(privateOutput,JSON.stringify(privateRows,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify(result));
}finally{await mf.dispose();}

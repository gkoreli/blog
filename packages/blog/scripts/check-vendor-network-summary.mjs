import assert from 'node:assert/strict';
import { readFileSync,writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve,dirname } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { queryStats } from '../../analytics/.test-dist/stats.js';
import { networkSummaryCases } from '../../analytics/test/fixtures/vendor-network-summary.mjs';
const [output,mode='compare']=process.argv.slice(2);assert.ok(output);
const baseline='c8e6bec';const bundle=await build({stdin:{contents:execFileSync('git',['show',`${baseline}:packages/analytics/src/stats.ts`],{encoding:'utf8'}),loader:'ts',resolveDir:resolve('packages/analytics/src')},bundle:true,write:false,format:'esm',platform:'node',logLevel:'silent'});
const oldStats=(await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].contents).toString('base64'))).queryStats;
const req=createRequire(resolve('package.json'));const {Miniflare}=await import(pathToFileURL(req.resolve('miniflare',{paths:[dirname(req.resolve('wrangler/package.json'))]})));
const producerBundle=await build({stdin:{contents:`import {verifyVendorIp,createVendorIpCache} from './vendor-ip.js';
 export default {async fetch(){const out=[];for(const relay of [false,true]){const request=new Request('https://publication.example/',{headers:{'CF-Connecting-IP':'66.249.66.1',...(relay?{'CF-Worker':'fixture.example'}:{})}});Object.defineProperty(request,'cf',{value:{asn:64512}});out.push(await verifyVendorIp(request,['AhrefsBot','AhrefsSiteAudit','GPTBot','OAI-SearchBot','DuckDuckBot','Google-Agent','ExaSearchBot'],{now:new Date('2026-10-28T04:00:00Z'),cache:createVendorIpCache(),fetcher:async()=>Response.json({prefixes:[{ipv4Prefix:'66.249.66.0/24'}]})}));}return Response.json(out);}}`,loader:'js',resolveDir:resolve('packages/analytics/src')},bundle:true,write:false,format:'esm',platform:'browser',logLevel:'silent'});
const mf=new Miniflare({modules:true,script:new TextDecoder().decode(producerBundle.outputFiles[0].contents),compatibilityDate:'2026-03-06',d1Databases:{DB:'network-summary'}});
try{
 const db=await mf.getD1Database('DB');const schema=readFileSync('packages/analytics/schema.sql','utf8').replace(/^\s*--.*$/gm,'');await db.batch(schema.split(';').map(s=>s.trim()).filter(Boolean).map(s=>db.prepare(s)));
 const insert=(id,e,options={})=>db.prepare("INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,observed_at,vendor_ip_evidence,referrer_host) VALUES('/privacy',?,'browser','desktop',?,'browser','fixture',?,?,?)").bind(String(id).padStart(32,'0'),options.owner??0,options.at??'2026-10-28 04:00:00',e===null?null:JSON.stringify(e),options.referrer??null);
 const query={range:'7d',traffic:'all',path:'/privacy'},now=new Date('2026-10-28T05:00:00Z');const controls=[];
 for(const c of networkSummaryCases){await db.prepare('DELETE FROM page_observations').run();await insert(1,c.e).run();const before=(await oldStats(db,query,now)).vendorNetwork;let after;
  if(mode==='compare'){after=(await queryStats(db,query,now)).vendorNetwork;assert.equal(after.recognizedViews,Number(c.recognized),c.name);assert.equal(after.unrecognizedViews,Number(c.e!==null&&!c.recognized),c.name);if(!c.recognized)assert.equal(after.listedViews,0,c.name);}
  controls.push({name:c.name,expectedRecognized:c.recognized,before,...(after?{after}:{})});
 }
 await db.prepare('DELETE FROM page_observations').run();await db.batch(networkSummaryCases.map((c,i)=>insert(i+1,c.e)));await db.batch([insert(100,networkSummaryCases[1].e,{owner:1}),insert(101,networkSummaryCases[1].e,{referrer:'traffic2cash.xyz'}),insert(102,networkSummaryCases[1].e,{at:'2026-10-29 04:00:00'})]);
 const before=await oldStats(db,query,now),after=mode==='compare'?await queryStats(db,query,now):null;if(after){assert.equal(after.totals.views,networkSummaryCases.length);assert.equal(after.vendorNetwork.recognizedViews,networkSummaryCases.filter(c=>c.recognized).length);assert.equal(after.referralPolicy.excludedViews,1);const {vendorNetwork:b,...br}=before,{vendorNetwork:a,...ar}=after;assert.deepEqual(ar,br);assert.ok(!JSON.stringify(after).includes('private-canary'));const empty=await queryStats(db,{...query,path:'/missing'},now);assert.ok(Object.values(empty.vendorNetwork).every(n=>n===0));}
 let producerControls=[];if(mode==='compare'){
  writeFileSync(output+'-client-fixture.json',JSON.stringify(after,null,2)+'\n',{flag:'wx',mode:0o600});
  const produced=await (await mf.dispatchFetch('https://fixture.example/produce')).json();assert.equal(produced.length,2);
  for(const [i,e] of produced.entries()){await db.prepare('DELETE FROM page_observations').run();await insert(1,e).run();const r=await queryStats(db,query,now);assert.equal(r.vendorNetwork.recognizedViews,1);assert.equal(e.checks.length,5);assert.equal(r.vendorNetwork.unmappedDeclarationViews,1);assert.equal(r.vendorNetwork.notAssessedViews,i===0?1:0);assert.equal(r.vendorNetwork.addressUnavailableViews,i===1?1:0);producerControls.push({case:i===0?'fanout-budget':'worker-relay',nativeWorkerdProducer:true,syntheticEdgeContext:true,checks:e.checks.length,summary:r.vendorNetwork});}
 }
 let scale=null;if(mode==='compare'){
  await db.prepare('DELETE FROM page_observations').run();for(let group=0;group<8;group++)await db.batch(Array.from({length:64},(_,i)=>insert(group*64+i+1,networkSummaryCases[1+((group*64+i)%2)].e)));
  let beforeCost,afterCost;const tap=callback=>({prepare:s=>db.prepare(s),async batch(s){const r=await db.batch(s);callback(r[0].meta);return r;}});
  const b=await oldStats(tap(m=>beforeCost=m),query,now),a=await queryStats(tap(m=>afterCost=m),query,now);const {recognizedViews,unrecognizedViews,...common}=a.vendorNetwork;assert.deepEqual(common,b.vendorNetwork);const {vendorNetwork:av,...ar}=a,{vendorNetwork:bv,...br}=b;assert.deepEqual(ar,br);scale={rows:512,beforeReads:beforeCost.rows_read,afterReads:afterCost.rows_read,delta:afterCost.rows_read-beforeCost.rows_read,writes:afterCost.rows_written,commonOutputUnchanged:true};
 }
 const result={checkedAt:new Date().toISOString(),baselineCommit:baseline,mode,controls,mixed:{before:before.vendorNetwork,...(after?{after:after.vendorNetwork}:{})},scale,producerControls,productionCalls:0,limits:'Synthetic stored-record consistency controls, not production prevalence or fresh address attribution.'};writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({controls:controls.length,mixed:result.mixed,scale}));
}finally{await mf.dispose();}

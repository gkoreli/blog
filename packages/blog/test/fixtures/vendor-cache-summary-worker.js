import {verifyVendorIp,createVendorIpCache} from '../../../analytics/src/vendor-ip.ts';
import {queryStats} from '../../../analytics/src/stats.ts';
import {queryStats as previousStats} from 'fixture:previous-stats';
import {observePageResponse} from '../../../analytics/src/index.ts';
import {vendorCacheSummaryCases} from '../../../analytics/test/fixtures/vendor-cache-summary.mjs';
const logs=[];
console.log=(event,fields)=>logs.push({event,...fields});console.warn=(event,fields)=>logs.push({event,...fields});
globalThis.fetch=async()=>{throw Error('Unexpected external fixture fetch');};
export default{async fetch(request,env,ctx){
 const url=new URL(request.url);
 if(url.pathname==='/cases')return Response.json(await vendorCacheSummaryCases(verifyVendorIp,createVendorIpCache));
 if(url.pathname==='/collect'){
  const pending=[],req=new Request('https://fixture.invalid/fixture',{headers:{'User-Agent':'Mozilla/5.0 Chrome/141.0.0.0 Safari/537.36',Accept:'text/html','Accept-Language':'en','Sec-Fetch-Mode':'navigate','Sec-Fetch-Dest':'document','Sec-Fetch-Site':'none','Sec-Fetch-User':'?1'}});Object.defineProperty(req,'cf',{value:{asn:64512}});
  observePageResponse(req,new Response('fixture',{headers:{'Content-Type':'text/html'}}),'html',env,{waitUntil(p){pending.push(p);ctx.waitUntil(p);}});
  return Response.json({settlements:(await Promise.allSettled(pending)).map(r=>r.status),acknowledged:logs.filter(l=>l.event==='analytics.observation_stored').length});
 }
 const costs=[],db={prepare:sql=>env.DB.prepare(sql),async batch(statements){const results=await env.DB.batch(statements);costs.push(...results.map(r=>r.meta));return results;}};
 const report=await(url.searchParams.get('baseline')==='1'?previousStats:queryStats)(db,{range:url.searchParams.get('range')==='all'?'all':'7d',traffic:'all',path:'/fixture'},new Date('2026-10-30T10:00:00Z'));
 return Response.json({report,costs});
}};

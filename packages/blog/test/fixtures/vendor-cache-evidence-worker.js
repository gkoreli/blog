import { verifyVendorIp,createVendorIpCache } from '../../../analytics/src/vendor-ip.ts';
import { KNOWN_AGENT_NAMES } from '../../../analytics/src/classify.ts';
import { observePageResponse } from '../../../analytics/src/index.ts';
import { cacheEvidenceCases,cacheAccessCases,cacheEvidenceRequest,cacheEvidenceFeed,CACHE_EVIDENCE_CLOCK } from '../../../analytics/test/fixtures/vendor-cache-evidence.mjs';
const logs=[];
console.log=(event,fields)=>logs.push({event,...fields});
console.warn=(event,fields)=>logs.push({event,...fields});
globalThis.fetch=async(url,options)=>{
  const headers=new Headers(options?.headers);
  if(String(url)!=='https://developers.google.com/static/crawling/ipranges/common-crawlers.json'||headers.has('CF-Connecting-IP')||headers.has('User-Agent'))throw Error('Unexpected fixture transport');
  return cacheEvidenceFeed({'Cache-Control':'no-cache',Date:new Date().toUTCString()});
};
export default {async fetch(request,env,ctx){
  if(new URL(request.url).pathname==='/collect'){
    const pending=[],start=logs.length;
    const r=cacheEvidenceRequest({'User-Agent':'Googlebot/2.1',Accept:'text/html',...(request.headers.has('X-Fixture-Relay')?{'CF-Worker':'fixture.invalid'}:{})});
    observePageResponse(r,new Response('fixture',{headers:{'Content-Type':'text/html'}}),'html',env,{waitUntil(p){pending.push(p);ctx.waitUntil(p);}});
    return Response.json({settlements:(await Promise.allSettled(pending)).map(r=>r.status),logs:logs.slice(start)});
  }
  const policies=await cacheEvidenceCases(verifyVendorIp,createVendorIpCache),access=await cacheAccessCases(verifyVendorIp,createVendorIpCache);
  const fanout=await verifyVendorIp(cacheEvidenceRequest(),KNOWN_AGENT_NAMES,{now:new Date(CACHE_EVIDENCE_CLOCK),cache:createVendorIpCache(),fetcher:async()=>cacheEvidenceFeed({'Cache-Control':'no-store, private, no-cache, max-age=oops',Age:'oops'})});
  for(const check of fanout.checks.slice(0,4)){check.snapshot.publisherVersion='2'.repeat(32);check.snapshot.prefixCount=4096;}
  return Response.json({policies,access,fanout});
}};

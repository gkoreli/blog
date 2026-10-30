// Closed synthetic publisher conditions. No live vendor or reader request is sent.
export const CACHE_EVIDENCE_CLOCK = '2026-10-30T09:00:00.000Z';
export const CACHE_EVIDENCE_CASES = [
  ['max-age', {'Cache-Control':'max-age=300','X-Fixture-Private':'raw-publisher-canary'}, [], 'max-age', true],
  ['default', {}, [], 'default', true],
  ['expires', {Expires:'Fri, 30 Oct 2026 09:05:00 GMT'}, [], 'expires', true],
  ['no-cache', {'Cache-Control':'no-cache'}, ['no-cache'], 'default', true],
  ['no-store', {'Cache-Control':'no-store'}, ['no-store'], 'default', false],
  ['private', {'Cache-Control':'private, max-age=300'}, ['private'], 'max-age', false],
  ['zero', {'Cache-Control':'max-age=0'}, ['zero-lifetime'], 'max-age', true],
  ['duplicate', {'Cache-Control':'max-age=300, max-age=600'}, ['invalid-lifetime'], 'max-age', true],
  ['bad-lifetime', {'Cache-Control':'max-age=oops'}, ['invalid-lifetime'], 'max-age', true],
  ['bad-expires', {Expires:'oops'}, ['invalid-lifetime'], 'expires', true],
  ['past-expires', {Expires:'Fri, 30 Oct 2026 08:59:00 GMT'}, ['zero-lifetime'], 'expires', true],
  ['bad-age', {'Cache-Control':'max-age=300',Age:'oops'}, ['invalid-age'], 'max-age', true],
  ['overflow-age', {'Cache-Control':'max-age=300',Age:'9'.repeat(400)}, ['invalid-age'], 'max-age', true],
  ['age-exhausted', {'Cache-Control':'max-age=300',Age:'300'}, ['age-exhausted'], 'max-age', true],
  ['date-exhausted', {'Cache-Control':'max-age=300',Date:'Fri, 30 Oct 2026 08:55:00 GMT'}, ['age-exhausted'], 'max-age', true],
  ['combined', {'Cache-Control':'no-store, private, no-cache, max-age=oops',Age:'oops'}, ['no-store','private','no-cache','invalid-lifetime','invalid-age'], 'max-age', false],
];
export function cacheEvidenceRequest(headers={}) {
  const request=new Request('https://fixture.invalid/article',{headers:{'CF-Connecting-IP':'66.249.66.1',...headers}});
  Object.defineProperty(request,'cf',{value:{asn:64512}});return request;
}
export function cacheEvidenceFeed(headers={}) {
  return Response.json({creationTime:'2026-10-29T00:00:00',prefixes:[{ipv4Prefix:'66.249.66.0/24'}]},
    {headers:{Date:new Date(CACHE_EVIDENCE_CLOCK).toUTCString(),ETag:'"fixture-v1"',...headers}});
}
export async function cacheEvidenceCases(verifyVendorIp,createVendorIpCache) {
  const results=[],now=new Date(CACHE_EVIDENCE_CLOCK);
  for(const [label,headers,blockers,lifetimeSource,stored] of CACHE_EVIDENCE_CASES) {
    const cache=createVendorIpCache();let fetchCalls=0;
    const fetcher=async()=>{fetchCalls++;return cacheEvidenceFeed(headers);};
    const first=await verifyVendorIp(cacheEvidenceRequest(),['Googlebot'],{now,cache,fetcher});
    const second=await verifyVendorIp(cacheEvidenceRequest(),['Googlebot'],{now:new Date(now.getTime()+1000),cache,fetcher});
    results.push({label,expected:{blockers,lifetimeSource,stored},first,second,fetchCalls,stored:cache.feeds.size===1});
  }
  return results;
}

export async function cacheAccessCases(verifyVendorIp,createVendorIpCache) {
  const now=new Date(CACHE_EVIDENCE_CLOCK),at=ms=>new Date(now.getTime()+ms),results=[];
  for(const scenario of ['revalidated','failed','mismatch']) {
    const cache=createVendorIpCache();let fetchCalls=0;
    const fetcher=async()=>{
      fetchCalls++;
      if(fetchCalls===1)return cacheEvidenceFeed({'Cache-Control':'no-cache'});
      if(scenario==='failed')throw Error('synthetic upstream failure');
      return new Response(null,{status:304,headers:{ETag:scenario==='mismatch'?'"fixture-v2"':'"fixture-v1"'}});
    };
    const first=await verifyVendorIp(cacheEvidenceRequest(),['Googlebot'],{now,cache,fetcher});
    const second=await verifyVendorIp(cacheEvidenceRequest(),['Googlebot'],{now:at(31000),cache,fetcher});
    const third=await verifyVendorIp(cacheEvidenceRequest(),['Googlebot'],{now:at(32000),cache,fetcher});
    results.push({label:scenario,first,second,third,fetchCalls});
  }
  for(const failed of [false,true]) {
    const cache=createVendorIpCache();let release,fetchCalls=0;
    const gate=new Promise(resolve=>{release=resolve;});
    const fetcher=async()=>{fetchCalls++;await gate;if(failed)throw Error('synthetic failure');return cacheEvidenceFeed({'Cache-Control':'max-age=300'});};
    const first=verifyVendorIp(cacheEvidenceRequest(),['Googlebot'],{now,cache,fetcher});
    const second=verifyVendorIp(cacheEvidenceRequest(),['Googlebot'],{now:at(1000),cache,fetcher});
    release();
    results.push({label:failed?'coalesced-failure':'coalesced',first:await first,second:await second,fetchCalls});
  }
  return results;
}

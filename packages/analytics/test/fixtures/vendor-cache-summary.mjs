import {cacheEvidenceCases,cacheAccessCases,cacheEvidenceRequest,cacheEvidenceFeed,CACHE_EVIDENCE_CLOCK} from './vendor-cache-evidence.mjs';
import {networkSummaryCases} from './vendor-network-summary.mjs';
export async function vendorCacheSummaryCases(verifyVendorIp,createVendorIpCache) {
 const policies=await cacheEvidenceCases(verifyVendorIp,createVendorIpCache),paths=await cacheAccessCases(verifyVendorIp,createVendorIpCache),cases=[];
 const add=(name,e,expected)=>cases.push({name,e,expected});
 const diagnostic=(access,policy,blockers=[])=>({state:'recognized',applicable:true,access,policy,blockers});
 for(const row of policies){
  const known=row.expected.blockers.length?'blocked':'positive';
  add(row.label+'-accepted',row.first,diagnostic(['fetched'],[known],row.expected.blockers));
  add(row.label+'-next',row.second,diagnostic([row.expected.blockers.length?'cooldown':'memory'],[known],row.expected.blockers));
 }
 const pathExpectations={revalidated:[['fetched','blocked'],['revalidated','blocked'],['cooldown','blocked']],failed:[['fetched','blocked'],['failed','unknown'],['cooldown','unknown']],mismatch:[['fetched','blocked'],['failed','unknown'],['cooldown','unknown']],coalesced:[['fetched','positive'],['coalesced','positive']],'coalesced-failure':[['failed','unknown'],['coalesced','unknown']]};
 for(const row of paths)for(const [i,e]of [row.first,row.second,...(row.third?[row.third]:[])].entries()){
  const [access,policy]=pathExpectations[row.label][i];add(row.label+'-'+i,e,diagnostic([access],[policy],policy==='blocked'?['no-cache']:[]));
 }
 const noMethod=await verifyVendorIp(cacheEvidenceRequest(),['ExaSearchBot'],{now:new Date(CACHE_EVIDENCE_CLOCK),cache:createVendorIpCache(),fetcher:async()=>{throw Error('unmapped must not fetch');}});
 add('unmapped-no-applicable',noMethod,{state:'recognized',applicable:false,access:[],policy:[],blockers:[]});
 const noNames=await verifyVendorIp(cacheEvidenceRequest(),[],{now:new Date(CACHE_EVIDENCE_CLOCK),cache:createVendorIpCache()});
 add('no-names-no-applicable',noNames,{state:'recognized',applicable:false,access:[],policy:[],blockers:[]});
 const guarded=await verifyVendorIp(cacheEvidenceRequest({'CF-Worker':'fixture.invalid'}),['Googlebot'],{now:new Date(CACHE_EVIDENCE_CLOCK),cache:createVendorIpCache()});
 add('address-guard-only',guarded,diagnostic([],[]));
 function combine(name,items,expected){
  const e=structuredClone(items[0]);e.checkedAt='2026-10-30T09:00:01.000Z';
  e.checks=items.map((item,i)=>{
   const check=structuredClone(item.checks[0]);check.source=['google-common','openai-search','applebot','bingbot'][i];
   if(['fetched','revalidated'].includes(check.cache?.access)){
    const delta=Date.parse(e.checkedAt)-Date.parse(check.cache.policy.assessedAt);check.cache.policy.assessedAt=e.checkedAt;
    check.snapshot.validatedAt=e.checkedAt;check.snapshot.freshUntil=new Date(Date.parse(check.snapshot.freshUntil)+delta).toISOString();
    if(check.cache.access==='fetched')check.snapshot.fetchedAt=e.checkedAt;
   }
   return check;
  });
  e.declarationCount=e.configuredDeclarationCount=e.checks.length;e.unmappedDeclarationCount=0;
  e.summary={listed:e.checks.some(c=>c.outcome==='listed'),notListed:e.checks.some(c=>c.outcome==='not-listed'),unavailable:e.checks.some(c=>c.outcome==='unavailable'),notAssessed:e.checks.some(c=>c.outcome==='not-assessed')};
  add(name,e,expected);
 }
 combine('repeated-access-counts-once',[policies[0].first,policies[0].first],diagnostic(['fetched'],['positive']));
 combine('known-and-unknown',[policies[0].second,paths[1].second],diagnostic(['memory','failed'],['positive','unknown']));
 combine('positive-and-blocked',[policies[0].second,policies[3].second],diagnostic(['memory','cooldown'],['positive','blocked'],['no-cache']));
 combine('four-source-overlap',[policies[0].first,policies[3].second,paths[1].second,paths[4].second],diagnostic(['fetched','cooldown','failed','coalesced'],['positive','blocked','unknown'],['no-cache']));
 const budget=await verifyVendorIp(cacheEvidenceRequest(),['AhrefsBot','AhrefsSiteAudit','Googlebot','GPTBot','OAI-SearchBot','DuckDuckBot'],{now:new Date(CACHE_EVIDENCE_CLOCK),cache:createVendorIpCache(),fetcher:async()=>cacheEvidenceFeed({'Cache-Control':'no-store, private, no-cache, max-age=bad',Age:'bad'})});
 add('guard-skips-do-not-count-as-cache-access',budget,diagnostic(['fetched'],['blocked'],['no-store','private','no-cache','invalid-lifetime','invalid-age']));
 for(const old of networkSummaryCases)add('history-'+old.name,old.e,{state:old.e===null||old.recognized?'not-recorded':'unrecognized'});
 const missing=structuredClone(policies[0].first);delete missing.checks[0].cache;add('current-missing-cache',missing,{state:'unrecognized'});
 const conflict=structuredClone(policies[0].first);conflict.checks[0].cache.policy.blockers=['no-cache'];add('current-conflicting-cache',conflict,{state:'unrecognized'});
 return cases;
}
/** Independent set-based expected events from the explicitly labelled upstream
 * conditions and constructed stored cohorts; no production SQL/masks/decoder used. */
export function expectedVendorCacheSummary(cases){
 const result={records:{recognizedViews:0,notRecordedViews:0,unrecognizedViews:0,noApplicableViews:0,guardedOnlyViews:0,withAccessViews:0,policyKnownViews:0,policyUnknownViews:0,partialPolicyViews:0},byAccess:{fetched:0,revalidated:0,memory:0,coalesced:0,cooldown:0,failed:0},byPolicy:{positiveViews:0,blockedViews:0,mixedViews:0},byBlocker:{noStore:0,private:0,noCache:0,invalidLifetime:0,zeroLifetime:0,invalidAge:0,ageExhausted:0}};
 const keys={'no-store':'noStore',private:'private','no-cache':'noCache','invalid-lifetime':'invalidLifetime','zero-lifetime':'zeroLifetime','invalid-age':'invalidAge','age-exhausted':'ageExhausted'};
 for(const {expected:e}of cases){
  const r=result.records;
  if(e.state==='not-recorded'){r.notRecordedViews++;continue;}
  if(e.state==='unrecognized'){r.unrecognizedViews++;continue;}
  r.recognizedViews++;
  if(!e.applicable)r.noApplicableViews++;
  else if(!e.access.length)r.guardedOnlyViews++;else r.withAccessViews++;
  const p=new Set(e.policy),known=p.has('positive')||p.has('blocked');
  if(known)r.policyKnownViews++;if(p.has('unknown'))r.policyUnknownViews++;if(known&&p.has('unknown'))r.partialPolicyViews++;
  for(const access of new Set(e.access))result.byAccess[access]++;
  if(p.has('positive'))result.byPolicy.positiveViews++;if(p.has('blocked'))result.byPolicy.blockedViews++;if(p.has('positive')&&p.has('blocked'))result.byPolicy.mixedViews++;
  for(const blocker of new Set(e.blockers))result.byBlocker[keys[blocker]]++;
 }
 return result;
}

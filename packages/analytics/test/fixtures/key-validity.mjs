export function keyValidityCases(fixture) {
  const [one,two]=Object.values(fixture.directories).map(d=>d.keys[0]),t=Math.floor(new Date(fixture.now).getTime()/1000);
  const active={...one,nbf:t-10,exp:t+60},expired={...one,nbf:t-60,exp:t-1},future={...one,nbf:t+1,exp:t+60};
  const conflict='key-validity-conflict',rejected='key-metadata-rejected';
  return [
    {name:'single-active',keys:[active],reason:null},
    {name:'identical-duplicates',keys:[active,{...active}],reason:null},
    {name:'expired-first',keys:[expired,active],reason:conflict},
    {name:'active-first-expired-second',keys:[active,expired],reason:conflict},
    {name:'future-first',keys:[future,active],reason:conflict},
    {name:'active-first-future-second',keys:[active,future],reason:conflict},
    {name:'different-active-windows',keys:[active,{...active,exp:t+90}],reason:conflict},
    {name:'unbounded-first',keys:[one,active],reason:conflict},
    {name:'bounded-first',keys:[active,one],reason:conflict},
    {name:'malformed-activation',keys:[{...one,nbf:'validity-canary'}],reason:rejected},
    {name:'fractional-expiry',keys:[{...one,exp:t+2.5}],reason:rejected},
    {name:'empty-window',keys:[{...one,nbf:t,exp:t}],reason:rejected},
    {name:'malformed-duplicate-first',keys:[{...one,nbf:'validity-canary'},active],reason:'key-metadata-conflict'},
    {name:'malformed-duplicate-second',keys:[active,{...one,nbf:'validity-canary'}],reason:'key-metadata-conflict'},
    {name:'unrelated-expired-key',keys:[{...two,exp:t-1},active],reason:null},
    {name:'activation-equality',keys:[{...one,nbf:t,exp:t+60}],reason:null},
    {name:'expiry-equality',keys:[{...one,exp:t}],reason:'key-expired'},
    {name:'absent-window',keys:[one],reason:null},
    {name:'draft-algorithm-name',keys:[{...one,alg:'ed25519'}],reason:null},
    {name:'unknown-algorithm',keys:[{...one,alg:'ED25519'}],reason:rejected},
  ];
}
const directory=keys=>Response.json({keys},{headers:{'Content-Type':'application/http-message-signatures-directory+json','Cache-Control':'max-age=300'}});
const snapshot=result=>result.status===undefined?{assessment:result.assessment,verified:result.verifiedCandidates,profileNegative:result.notVerifiedByProfileCandidates,unavailable:result.unavailableCandidates}:{status:result.status,reason:result.reason??null};
export async function keyValidityMatrix(fixture,api) {
 const rows=[];
 for(const trial of keyValidityCases(fixture)){
  const paths=[];
  for(const mode of ['default','selected','audit']){
   let fetches=0;const request=new Request('https://publication.example/a',{headers:fixture.cases[0].headers});
   const options={now:new Date(fixture.now),cache:api.cache(),includeEvidence:true,fetcher:async()=>{fetches++;return directory(trial.keys);}};
   const result=await(mode==='default'?api.verify(request,options):mode==='selected'?api.selected(request,'one',options):api.audit(request,options));
   paths.push({mode,...snapshot(result),fetches});
  }
  rows.push({name:trial.name,expectedReason:trial.reason,paths});
 }
 const traces=[];
 for(const mode of ['default','selected'])for(const boundary of ['activation','expiry']){
  const t=Math.floor(new Date(fixture.now).getTime()/1000),key=Object.values(fixture.directories)[0].keys[0],keys=[{...key,nbf:t-10,exp:t+10}];
  const cache=api.cache(),request=new Request('https://publication.example/a',{headers:fixture.cases[0].headers});let fetches=0;
  const run=(now,useCache)=>{
   const options={now,cache:useCache?cache:api.cache(),fetcher:async()=>{fetches++;return directory(keys);}};
   return mode==='default'?api.verify(request,options):api.selected(request,'one',options);
  };
  const warm=await run(new Date(t*1000),true),now=new Date((t+(boundary==='activation'?-11:10))*1000);
  const cached=await run(now,true),fresh=await run(now,false);
  traces.push({mode,boundary,warm:snapshot(warm),cached:snapshot(cached),fresh:snapshot(fresh),fetches,expectedReason:boundary==='activation'?'key-not-yet-valid':'key-expired'});
 }
 return {rows,traces};
}

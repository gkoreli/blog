/** Independent signing bytes for three supported wire forms; no local base builder. */
export async function wireFailureFixture() {
 const now=new Date(),epoch=Math.floor(now.getTime()/1000),origin='https://wire.fixture.example';
 const pair=await crypto.subtle.generateKey('Ed25519',true,['sign','verify']),jwk=await crypto.subtle.exportKey('jwk',pair.publicKey);
 const canonical=JSON.stringify({crv:'Ed25519',kty:'OKP',x:jwk.x});
 const kid=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical))).toString('base64url'),cases=[];
 for(const form of ['dictionary','legacy-string','bare-uri']){
  const agent=form==='dictionary'?`one="${origin}"`:form==='legacy-string'?`"${origin}"`:origin;
  const component=form==='dictionary'?'"signature-agent";key="one"':'"signature-agent"';
  const value=form==='bare-uri'?origin:`"${origin}"`;
  const params=`("@authority" "user-agent" ${component});created=${epoch};expires=${epoch+300};keyid="${kid}";alg="ed25519";tag="web-bot-auth"`;
  const base=`"@authority": publication.example\n"user-agent": ExaSearchBot/1.0\n${component}: ${value}\n"@signature-params": ${params}`;
  const signature=await crypto.subtle.sign('Ed25519',pair.privateKey,new TextEncoder().encode(base));
  if(!await crypto.subtle.verify('Ed25519',pair.publicKey,signature,new TextEncoder().encode(base)))throw Error('Independent proof failed');
  const headers={'User-Agent':'ExaSearchBot/1.0','Signature-Agent':agent,'Signature-Input':`one=${params}`,Signature:`one=:${Buffer.from(signature).toString('base64')}:`};
  const specifications=[
   ['valid',null,'verified'],['tampered','signature-invalid','invalid'],['expired','expired','policy-rejected'],['future','not-yet-valid','policy-rejected'],
   ['directory-unavailable','dir-http-status','unavailable'],['key-missing','key-not-found','unavailable'],['unsupported-alg','unsupported-alg','unsupported'],
   ['malformed-fields','malformed-signature-fields','invalid'],['unrelated-tag','no-web-bot-auth-signature','not-applicable'],
   ['invalid-clock','invalid-verification-time','indeterminate'],['key-metadata','key-metadata-rejected','policy-rejected'],
   ['key-window','key-validity-conflict','policy-rejected'],['mixed-failures','unsupported-alg','indeterminate'],['missing-input','missing-signature-input','invalid'],
  ];
  for(const[scenario,expectedReason,expectedOutcome]of specifications){
   const h={...headers};
   if(scenario==='tampered')h['User-Agent']='wire-private-canary';
   if(scenario==='unsupported-alg')h['Signature-Input']=h['Signature-Input'].replace('alg="ed25519"','alg="rsa-pss-sha512"');
   if(scenario==='malformed-fields')h.Signature='not-a-dictionary';
   if(scenario==='unrelated-tag')h['Signature-Input']=h['Signature-Input'].replace('tag="web-bot-auth"','tag="other-protocol"');
   if(scenario==='missing-input')delete h['Signature-Input'];
   if(scenario==='mixed-failures'){
    h['User-Agent']='wire-private-canary';
    h['Signature-Input']+=', '+headers['Signature-Input'].replace(/^one=/,'two=').replace('alg="ed25519"','alg="rsa-pss-sha512"');
    h.Signature+=', '+headers.Signature.replace(/^one=/,'two=');
   }
   cases.push({name:form+'/'+scenario,form,scenario,headers:h,url:'https://publication.example/a',expectedReason,expectedOutcome});
  }
 }
 return {now,cases,directories:{[origin+'/.well-known/http-message-signatures-directory']:{keys:[jwk]}}};
}

export async function wireFailureMatrix(fixture,api) {
 const rows=[];
 for(const trial of fixture.cases){
  const request=new Request(trial.url,{headers:trial.headers}),paths=[];
  const inspection=api.inspect(request);
  for(const mode of ['default','selected','audit']){
   let fetches=0;const epoch=Math.floor(new Date(fixture.now).getTime()/1000),keys=Object.values(fixture.directories)[0].keys;
   const options={now:trial.scenario==='invalid-clock'?new Date(NaN):new Date(new Date(fixture.now).getTime()+(trial.scenario==='expired'?400000:trial.scenario==='future'?-120000:0)),includeEvidence:true,cache:api.cache(),fetcher:async()=>{
    fetches++;if(trial.scenario==='directory-unavailable')return new Response(null,{status:503});
    const entries=trial.scenario==='key-missing'?[]:trial.scenario==='key-metadata'?keys.map(k=>({...k,alg:'RS256'})):trial.scenario==='key-window'?[{...keys[0],exp:epoch+60},{...keys[0],exp:epoch+90}]:keys;
    return Response.json({keys:entries},{headers:{'Content-Type':'application/http-message-signatures-directory+json'}});
   }};
   const r=await(mode==='default'?api.verify(request,options):mode==='selected'?api.selected(request,'one',options):api.audit(request,options));
   paths.push(mode==='audit'?{mode,assessment:r.assessment,termination:r.termination,verified:r.verifiedCandidates,profileNegative:r.notVerifiedByProfileCandidates,unsupported:r.unsupportedCandidates,unavailable:r.unavailableCandidates,indeterminate:r.indeterminateCandidates,attempted:r.attemptedCandidates,fetches}:{mode,status:r.status,reason:r.reason??null,reasons:r.status==='unverified'?[...new Set([r.reason,...r.reasons??[]])].sort():[],outcome:api.outcome(r),headerForm:r.evidence?.headerForm??null,fetches});
  }
  rows.push({name:trial.name,form:trial.form,scenario:trial.scenario,expectedReason:trial.expectedReason,expectedOutcome:trial.expectedOutcome,inspection:{status:inspection.status,reason:inspection.reason??null},paths});
 }
 return rows;
}

export function wireAuditExpectation(scenario) {
 const result={assessment:'complete',termination:'exhausted',verified:0,profileNegative:0,unsupported:0,unavailable:0,indeterminate:0,attempted:1};
 if(['invalid-clock','malformed-fields','missing-input'].includes(scenario))return {...result,assessment:'not-assessed',termination:scenario==='invalid-clock'?'invalid-options':'input-not-assessed',attempted:0};
 if(scenario==='unrelated-tag')return {...result,assessment:'not-applicable',termination:'no-eligible-candidate',attempted:0};
 if(scenario==='valid')return {...result,verified:1};
 if(['directory-unavailable','key-missing'].includes(scenario))return {...result,assessment:'partial',unavailable:1};
 if(scenario==='unsupported-alg')return {...result,assessment:'partial',unsupported:1};
 if(scenario==='mixed-failures')return {...result,assessment:'partial',profileNegative:1,unsupported:1,attempted:2};
 return {...result,profileNegative:1};
}

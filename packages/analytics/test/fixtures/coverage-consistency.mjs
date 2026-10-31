import { summaryCases } from './signature-summary.mjs';

/** Supplied stored records, not new signatures, people or population labels. */
export function coverageConsistencyCases() {
  const current=summaryCases.find(row=>row.name==='current-valid');
  const legacy=summaryCases.find(row=>row.name==='legacy-valid');
  const cases=[];
  const add=(name,base,change,before,after)=>{const row=structuredClone(base);change(row.e);cases.push({...row,name,before,after});};
  add('authority-coverage',current,()=>{},true,true);
  add('target-uri-coverage',current,e=>{e.coverage.covered.authority=false;e.coverage.covered.targetUri=true;},true,true);
  add('both-target-components',current,e=>{e.coverage.covered.targetUri=true;},true,true);
  add('no-target-ua-covered',current,e=>{e.coverage.covered.authority=false;},true,false);
  add('method-path-query-without-target',current,e=>{e.coverage.covered.authority=false;e.coverage.covered.method=true;e.coverage.covered.path=true;e.coverage.covered.query=true;},true,false);
  add('negative-recorded-age',current,e=>{e.coverage.ageSeconds=-1;},true,false);
  add('legacy-without-target',legacy,e=>{e.coverage.covered.authority=false;},true,false);
  add('legacy-negative-age',legacy,e=>{e.coverage.ageSeconds=-1;},true,false);
  add('zero-validity',current,e=>{e.coverage.validitySeconds=0;},true,true);
  add('age-after-validity',legacy,e=>{e.coverage.ageSeconds=301;e.coverage.validitySeconds=300;},true,true);
  add('fractional-recorded-age',current,e=>{e.coverage.ageSeconds=0.25;},false,false);
  add('future-coverage-format',current,e=>{e.coverage.version='future-private-canary';},false,false);
  add('coverage-not-recorded',current,e=>{e.coverage=null;},false,false);
  add('selection-independent',current,e=>{e.coverage.selection.attemptedCandidates=3;},true,true);
  return cases;
}

/** Fixed-layout signer independent of the application's signature-base builder. */
export async function coverageProducerCases() {
  const pair=await crypto.subtle.generateKey('Ed25519',true,['sign','verify']);
  const jwk=await crypto.subtle.exportKey('jwk',pair.publicKey);
  const thumbprint=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify({crv:'Ed25519',kty:'OKP',x:jwk.x})));
  const kid=Buffer.from(thumbprint).toString('base64url');
  const now='2026-10-31T10:00:00Z',epoch=Math.floor(Date.parse(now)/1000),url='https://publication.example/article?x=1';
  const values={'@authority':'publication.example','@target-uri':url,'user-agent':'SyntheticClient/1.0','signature-agent':'"https://fixture.example";type=directory'};
  const specifications=[
    {id:'authority',components:['@authority','user-agent','signature-agent'],expected:'verified'},
    {id:'target-uri',components:['@target-uri','user-agent','signature-agent'],expected:'verified'},
    {id:'both',components:['@authority','@target-uri','user-agent','signature-agent'],expected:'verified'},
    {id:'missing-target',components:['user-agent','signature-agent'],expected:'unverified'},
    {id:'zero-validity',components:['@authority','user-agent','signature-agent'],lifetime:0,expected:'verified'},
    {id:'future-created',components:['@authority','user-agent','signature-agent'],offset:30,expected:'verified'},
  ];
  const rows=[];
  for(const spec of specifications){
    const created=epoch+(spec.offset??0),expires=created+(spec.lifetime??300);
    const componentNames=spec.components.map(name=>name==='signature-agent'?'"signature-agent";key="sig"':'"'+name+'"');
    const parameters='('+componentNames.join(' ')+`);created=${created};expires=${expires};keyid="${kid}";alg="ed25519";tag="web-bot-auth"`;
    const lines=spec.components.map(name=>name==='signature-agent'?'"signature-agent";key="sig": '+values[name]:'"'+name+'": '+values[name]);
    const bytes=new TextEncoder().encode(lines.join('\n')+'\n"@signature-params": '+parameters);
    const signature=await crypto.subtle.sign('Ed25519',pair.privateKey,bytes);
    if(!await crypto.subtle.verify('Ed25519',pair.publicKey,signature,bytes))throw new Error('Independent signer failed');
    rows.push({id:spec.id,url,now,expected:spec.expected,jwk:{...jwk,kid},headers:{'User-Agent':values['user-agent'],'Signature-Agent':'sig="https://fixture.example";type=directory','Signature-Input':'sig='+parameters,Signature:'sig=:'+Buffer.from(signature).toString('base64')+':'}});
  }
  return rows;
}

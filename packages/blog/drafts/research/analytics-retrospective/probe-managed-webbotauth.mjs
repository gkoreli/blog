import assert from 'node:assert/strict';
import {readFileSync,writeFileSync}from'node:fs';
import {createHash}from'node:crypto';
import {verifyWebBotAuth}from'../../../../analytics/.test-dist/webbotauth.js';

const[prefix,sourceManifest]=process.argv.slice(2);assert.ok(prefix&&sourceManifest);
const endpoint='https://crawltest.com/cdn-cgi/web-bot-auth';
const variants=['unsigned','structured-valid','structured-corrupt','structured-expired','bare-uri-valid','dictionary-valid','agent-not-covered','non-https-agent','missing-keyid'];
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const plan={createdAt:new Date().toISOString(),endpoint,method:'GET',maximumRequests:9,attemptsPerCase:1,requestTimeoutMs:5000,
 identity:'Fresh synthetic diagnostic.invalid key, not submitted for provider registration',privateKeyPersisted:false,
 existingReaderOrVendorInputsUsed:false,credentials:'omit',redirect:'manual',baselineGate:'Stop if unsigned does not return documented 400',
 variants,sourceManifestSha256:hash(readFileSync(sourceManifest)),scriptSha256:hash(readFileSync(new URL(import.meta.url))),
 ownSiteRequests:0,d1Statements:0,humanLabels:0};
writeFileSync(prefix+'plan.json',JSON.stringify(plan,null,2)+'\n',{flag:'wx',mode:0o600});
const pair=await crypto.subtle.generateKey('Ed25519',false,['sign','verify']);
const jwk=await crypto.subtle.exportKey('jwk',pair.publicKey);
const kid=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify({crv:jwk.crv,kty:jwk.kty,x:jwk.x})))).toString('base64url');
const trials=[],rows=[];
async function trial(variant){
 const now=new Date(),epoch=Math.floor(now.getTime()/1000),agent=variant==='non-https-agent'?'http://diagnostic.invalid':'https://diagnostic.invalid';
 const header=variant==='bare-uri-valid'?agent:variant==='dictionary-valid'?`diag=${JSON.stringify(agent)}`:JSON.stringify(agent);
 if(variant==='unsigned')return{vendor:'synthetic',variant,now:now.toISOString(),url:endpoint,method:'GET',headers:{},directory:{keys:[jwk]}};
 const component=variant==='dictionary-valid'?'"signature-agent";key="diag"':'"signature-agent"';
 const components=variant==='agent-not-covered'?'("@authority")':`("@authority" ${component})`;
 const params=`${components};created=${variant==='structured-expired'?epoch-600:epoch};expires=${variant==='structured-expired'?epoch-300:epoch+60}${variant==='missing-keyid'?'':`;keyid="${kid}"`};alg="ed25519";nonce="${crypto.randomUUID()}";tag="web-bot-auth"`;
 const base=`"@authority": crawltest.com\n${variant==='agent-not-covered'?'':`${component}: ${variant==='bare-uri-valid'?agent:JSON.stringify(agent)}\n`}"@signature-params": ${params}`;
 const bytes=new Uint8Array(await crypto.subtle.sign('Ed25519',pair.privateKey,new TextEncoder().encode(base)));
 if(variant==='structured-corrupt')bytes[0]^=1;
 return{vendor:'synthetic',variant,now:now.toISOString(),url:endpoint,method:'GET',headers:{'Signature-Agent':header,'Signature-Input':`proof=${params}`,Signature:`proof=:${Buffer.from(bytes).toString('base64')}:`},directory:{keys:[jwk]}};
}
let baselineConfirmed=false;
for(const variant of variants){
 if(rows.length&&!baselineConfirmed)break;
 const input=await trial(variant);trials.push(input);
 const local=await verifyWebBotAuth(new Request(input.url,{headers:input.headers}),{now:new Date(input.now),includeEvidence:true,maxAgeSeconds:86400,fetcher:async url=>{
  assert.equal(String(url),'https://diagnostic.invalid/.well-known/http-message-signatures-directory');
  return Response.json(input.directory,{headers:{'Content-Type':'application/http-message-signatures-directory+json'}});
 }});
 const expected=variant==='unsigned'?'absent':['structured-valid','bare-uri-valid','dictionary-valid'].includes(variant)?'verified':'unverified';assert.equal(local.status,expected,variant);
 const startedAt=new Date().toISOString();let responseInfo;
 try{
  const response=await fetch(endpoint,{method:'GET',headers:{...input.headers,'User-Agent':'WebBotAuthDiagnostic/1.0',Accept:'application/json','Cache-Control':'no-store'},credentials:'omit',redirect:'manual',signal:AbortSignal.timeout(5000)});
  const bytes=new Uint8Array(await response.arrayBuffer());writeFileSync(prefix+variant+'-response.bin',bytes,{flag:'wx',mode:0o600});
  responseInfo={status:response.status,contentType:response.headers.get('content-type'),serverDate:response.headers.get('date'),bodyBytes:bytes.length,bodySha256:hash(bytes),redirected:response.redirected};
  baselineConfirmed=variant==='unsigned'?response.status===400:baselineConfirmed;
 }catch(error){responseInfo={status:null,transport:'unavailable',errorType:error instanceof Error?error.name:'unknown'};}
 rows.push({variant,startedAt,completedAt:new Date().toISOString(),local:{status:local.status,reason:local.reason??null,headerForm:local.evidence?.headerForm??null},response:responseInfo,
  nativeRequestSignedAgent:'unavailable',registeredIdentityConfirmed:false,positiveManagedVerificationEstablished:false});
 writeFileSync(prefix+'journal.json',JSON.stringify({plan,baselineConfirmed,rows},null,2)+'\n',{mode:0o600});
}
const inputBytes=JSON.stringify({trials})+'\n';writeFileSync(prefix+'input.json',inputBytes,{flag:'wx',mode:0o600});
const result={checkedAt:new Date().toISOString(),plan,baselineConfirmed,inputSha256:hash(inputBytes),executed:rows.length,unexecuted:variants.length-rows.length,rows,
 managedAgreementWithOurSiteEstablished:false,registeredPositiveControls:0,
 limits:['HTTP 401 can mean an unknown key or failed verification; it is not a negative cryptographic oracle.','HTTP 400 is the documented other-error bucket, not proof of a particular parser cause.','No captured reader/vendor input, existing private key, enrollment, plan change or own-site traffic is used.','The public endpoint is separate from our site and exposes no request.cf native boolean.']};
writeFileSync(prefix+'result.json',JSON.stringify(result,null,2)+'\n',{flag:'wx',mode:0o600});
console.log(JSON.stringify({executed:rows.length,unexecuted:result.unexecuted,baselineConfirmed,statuses:rows.map(row=>({variant:row.variant,status:row.response.status,transport:row.response.transport??null}))}));

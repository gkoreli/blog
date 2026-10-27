import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { classifyTraffic } from '../../../../analytics/.test-dist/classify.js';
import { verifyWebBotAuth, createWebBotAuthCache, ed25519JwkThumbprint } from '../../../../analytics/.test-dist/webbotauth.js';
import { verificationEvidence } from '../../../../analytics/.test-dist/signature-evidence.js';
import { VERIFIER_PROFILE_VERSION } from '../../../../analytics/.test-dist/versions.js';
const [input,directoryInput,output]=process.argv.slice(2);
if(!input||!directoryInput||!output)throw new Error('Provide private native export, captured public directory and new public output path');
const bytes=readFileSync(input),directoryBytes=readFileSync(directoryInput);
const rows=JSON.parse(bytes.toString()),directory=JSON.parse(directoryBytes.toString());
const counts={status:{},failureReason:{},headerForm:{},declaredClient:{},nativeVerifiedBot:{},nativeSignedAgent:{},coverage:{userAgent:0,path:0,method:0,targetUri:0,query:0,authority:0}};
const add=(map,value)=>{const key=value===null||value===undefined?'unavailable':String(value);map[key]=(map[key]??0)+1;};
let invalidRows=0,duplicates=0,missingProviderIds=0,truncated=0,nativeCategoryPresentRecords=0;const ids=new Set(),validities=[],ages=[];
for(const row of rows){
 const data=row?.$workers?.event?.request,at=new Date(row.timestamp);
 if(!data||typeof data.url!=='string'||typeof data.method!=='string'||!Number.isFinite(at.getTime())){invalidRows++;continue;}
 const headers=new Headers();for(const [name,value]of Object.entries(data.headers??{}))if(typeof value==='string')headers.set(name,value);
 const request=new Request(data.url,{method:data.method,headers});
 Object.defineProperty(request,'cf',{value:{botManagement:data.cf?.botManagement}});
 const result=await verifyWebBotAuth(request,{now:at,includeEvidence:true,maxAgeSeconds:86400,cache:createWebBotAuthCache(),async fetcher(url){
   if(String(url)!=='https://crawler.exa.ai/.well-known/http-message-signatures-directory')throw new Error('Unreviewed signing directory');
   return new Response(directoryBytes,{headers:{'Content-Type':'application/http-message-signatures-directory+json','Cache-Control':'max-age=300'}});
 }});
 add(counts.status,result.status);
 if(result.status==='unverified')add(counts.failureReason,result.reason);
 if(result.status==='verified'){
   if(result.agent!=='https://crawler.exa.ai')throw new Error('Unexpected verified origin');
   add(counts.headerForm,result.evidence?.headerForm);
   for(const key of Object.keys(counts.coverage))if(result.evidence?.covered[key]===true)counts.coverage[key]++;
   if(result.evidence){validities.push(result.evidence.validitySeconds);ages.push(result.evidence.ageSeconds);}
 }
 add(counts.declaredClient,classifyTraffic(headers.get('User-Agent')??'').agentName??'no-reviewed-name');
 const evidence=verificationEvidence(request,result);
 if(typeof data.cf?.verifiedBotCategory==='string'&&data.cf.verifiedBotCategory.length>0)nativeCategoryPresentRecords++;
 add(counts.nativeVerifiedBot,evidence.native.verifiedBot);add(counts.nativeSignedAgent,evidence.native.signedAgent);
 const id=row.$metadata?.id;if(typeof id==='string'){if(ids.has(id))duplicates++;ids.add(id);}else missingProviderIds++;
 if(row.$workers?.truncated===true)truncated++;
}
const publishedKeys=[];
for(const key of directory.keys??[]){
 const thumbprint=await ed25519JwkThumbprint(key);
 const imported=await crypto.subtle.importKey('jwk',key,'Ed25519',false,['verify']);
 publishedKeys.push({kid:key.kid,thumbprintMatches:thumbprint===key.kid,algorithm:imported.algorithm.name});
}
const summary={checkedAt:new Date().toISOString(),verifierProfile:VERIFIER_PROFILE_VERSION,eventWindow:{start:'2026-10-26T00:00:00Z',endExclusive:'2026-10-27T00:00:00Z'},inputRows:rows.length,invalidRows,distinctProviderIds:ids.size,duplicateProviderIds:duplicates,missingProviderIds,truncated,nativeCategoryPresentRecords,counts,
 validitySeconds:{min:Math.min(...validities),max:Math.max(...validities)},ageSeconds:{min:Math.min(...ages),max:Math.max(...ages)},
 inputSha256:createHash('sha256').update(bytes).digest('hex'),inputBytes:bytes.length,
 directory:{url:'https://crawler.exa.ai/.well-known/http-message-signatures-directory',captureFileModifiedAt:statSync(directoryInput).mtime.toISOString(),sha256:createHash('sha256').update(directoryBytes).digest('hex'),observedMediaType:'application/http-message-signatures-directory+json',observedMaxAgeSeconds:300,publishedKeys},
 networkCalls:0,productionPageRequests:0,
 limits:['Retained native request messages reverified at recorded event time with a separately captured later public directory, not current-time freshness or proof of directory contents at original receipt.',
 'Provider ID collisions are retained, not silently deduplicated; row counts are not proven unique-event counts.',
 'No complete log sampling/retention guarantee, exact D1 join, provider-verifier equivalence or proof that every Exa request is signed.',
 'Native unavailable is null; declared roles are not authenticated unless covered, and key verification proves no human trigger or citation.',
 'Original request context, headers, addresses, URLs, signatures and nonces remain in the restricted private archive, not this aggregate result.']};
writeFileSync(output,JSON.stringify(summary,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(summary));

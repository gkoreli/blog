import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {parseVendorIpFeed} from '../../../../analytics/.test-dist/vendor-ip.js';
import {verifyWebBotAuth,ed25519JwkThumbprint,createWebBotAuthCache} from '../../../../analytics/.test-dist/webbotauth.js';
import {vendorSignatureEvidence} from '../../../../analytics/.test-dist/vendor-signatures.js';
const[privateDirectory,output]=process.argv.slice(2);assert.ok(privateDirectory&&output);
const captures=JSON.parse(readFileSync(privateDirectory+'/public-source-captures.json'));
const feeds=[];
for(const name of ['duckduckbot-feed','google-agent-feed']){
 const raw=JSON.parse(readFileSync(privateDirectory+'/'+name+'.json'));const parsed=parseVendorIpFeed(raw);assert.ok(parsed,name);
 assert.equal(parsed.prefixes.length,raw.prefixes.length);feeds.push({name,acceptedByExistingParser:true,prefixes:parsed.prefixes.length,publisherVersion:parsed.publisherVersion});
}
const directory=JSON.parse(readFileSync(privateDirectory+'/google-agent-directory.json')),rows=[],now=new Date(),t=Math.floor(now.getTime()/1000);
for(const key of directory.keys){
 const kid=await ed25519JwkThumbprint(key);assert.ok(kid);
 const request=new Request('https://publication.example/a',{headers:{'User-Agent':'Google-Agent/1.0','Signature-Agent':'g="https://agent.bot.goog"','Signature-Input':`g=("@authority" "signature-agent";key="g");created=${t};expires=${t+60};keyid="${kid}";alg="ed25519";tag="web-bot-auth"`,Signature:`g=:${Buffer.alloc(64).toString('base64')}:`}});
 let fetches=0;const result=await verifyWebBotAuth(request,{now,cache:createWebBotAuthCache(),fetcher:async url=>{assert.equal(String(url),'https://agent.bot.goog/.well-known/http-message-signatures-directory');fetches++;return Response.json(directory,{headers:{'Content-Type':'application/http-message-signatures-directory+json'}});}});
 assert.equal(result.status,'unverified','Deliberately forged proof must never verify');
 let publishedKidResult=null;
 if(typeof key.kid==='string'){
  const headers=new Headers(request.headers);headers.set('Signature-Input',headers.get('Signature-Input').replace(`keyid="${kid}"`,`keyid="${key.kid}"`));
  const other=await verifyWebBotAuth(new Request(request.url,{headers}),{now,cache:createWebBotAuthCache(),fetcher:async()=>Response.json(directory,{headers:{'Content-Type':'application/http-message-signatures-directory+json'}})});
  assert.equal(other.status,'unverified');publishedKidResult={status:other.status,reason:other.reason};
 }
 rows.push({publicKeyType:key.kty,curve:key.crv??null,algorithm:key.alg??null,publishedKidComparison:key.kid===undefined?'not-published':key.kid===kid?'matches-computed-thumbprint':'differs-from-computed-thumbprint',computedThumbprintProbe:{status:result.status,reason:result.reason,fetches},publishedKidProbe:publishedKidResult,currentDocumentedMethod:vendorSignatureEvidence(['Google-Agent'],result).status});
}
writeFileSync(output,JSON.stringify({checkedAt:new Date().toISOString(),method:'Existing parser accepts captured public feeds; forged zero-byte signatures test Google key-admission failure paths using intercepted captured directory only. No real signed Google request, reader address, production request or registry change.',feeds,googleDirectoryKeys:rows,captures,externalReplayRequests:0,productionRequests:0,d1Statements:0},null,2)+'\n',{mode:0o600,flag:'wx'});
console.log(JSON.stringify({feedsAccepted:feeds.length,prefixCounts:feeds.map(f=>f.prefixes),googleKeys:rows.length,googleKeyReasons:rows.map(r=>r.computedThumbprintProbe.reason),realGoogleProofs:0}));

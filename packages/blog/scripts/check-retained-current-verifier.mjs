import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {createHash} from 'node:crypto';

const [input,output]=process.argv.slice(2);assert.ok(input&&output);
const inputBytes=readFileSync(input);
const trials=JSON.parse(inputBytes.toString()).trials;
assert.equal(trials.length,12);
assert.ok(trials.every(t=>t.vendor==='exa'&&['original','changed-authority','changed-unsigned-role-and-path'].includes(t.variant)));
const bundle=await build({stdin:{resolveDir:process.cwd(),contents:`
 import {verifyWebBotAuth,createWebBotAuthCache} from './packages/analytics/src/webbotauth.ts';
 import {VERIFIER_PROFILE_VERSION} from './packages/analytics/src/versions.ts';
 export default{async fetch(request){
  const trial=await request.json();
  const context=new Request(trial.url,{method:trial.method,headers:trial.headers});
  let resolverCalls=0;
  const result=await verifyWebBotAuth(context,{now:new Date(trial.now),includeEvidence:true,maxAgeSeconds:86400,cache:createWebBotAuthCache(),fetcher:async(url)=>{
   if(String(url)!=='https://crawler.exa.ai/.well-known/http-message-signatures-directory')throw Error('Unreviewed directory');
   resolverCalls++;return Response.json(trial.directory,{headers:{'Content-Type':'application/http-message-signatures-directory+json','Cache-Control':'max-age=300'}});
  }});
  return Response.json({verifierProfile:VERIFIER_PROFILE_VERSION,status:result.status,reason:result.reason??null,coverage:result.evidence??null,resolverCalls});
 }};`},bundle:true,write:false,format:'esm',platform:'browser',logLevel:'silent'});
const req=createRequire(resolve('package.json'));
const {Miniflare}=await import(pathToFileURL(req.resolve('miniflare',{paths:[dirname(req.resolve('wrangler/package.json'))]})));
const mf=new Miniflare({modules:true,script:bundle.outputFiles[0].text,compatibilityDate:'2026-03-06',cf:{}});
try{
 const rows=[];
 for(const trial of trials){
  const response=await mf.dispatchFetch('https://offline.example/verify',{method:'POST',body:JSON.stringify(trial)});
  assert.equal(response.status,200);const result=await response.json();
  assert.equal(result.verifierProfile,'2026-10-29.1');
  assert.equal(result.status,trial.variant==='changed-authority'?'unverified':'verified');
  assert.equal(result.reason,trial.variant==='changed-authority'?'signature-invalid':null);
  rows.push({vendor:trial.vendor,variant:trial.variant,...result});
 }
 const receipt={checkedAt:new Date().toISOString(),inputSha256:createHash('sha256').update(inputBytes).digest('hex'),method:'Actual local workerd Request construction and crypto with supplied recorded times/captured Exa keys; resolver interception, no managed detection service',trials:rows,externalRequests:0,productionRequests:0};
 writeFileSync(output,JSON.stringify(receipt,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify({nativeTrials:rows.length,originalsVerified:rows.filter(r=>r.variant==='original'&&r.status==='verified').length}));
}finally{await mf.dispose();}

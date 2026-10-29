import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {dirname,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {verifyWebBotAuth} from '../../analytics/.test-dist/webbotauth.js';
import {auditRetainedWebBotAuth} from '../../analytics/.test-dist/retained-signature-audit.js';

async function inspect(trial){
 const request=new Request(trial.url,{method:trial.method,headers:trial.headers});
 const fetcher=async url=>{if(String(url)!==trial.directoryUrl)throw Error('Outside fixed captured resolver');
  return Response.json(trial.directory,{headers:{'Content-Type':'application/http-message-signatures-directory+json'}})};
 const result=await verifyWebBotAuth(request,{now:new Date(trial.now),maxAgeSeconds:86400,includeEvidence:true,fetcher});
 const retained=await auditRetainedWebBotAuth(request,{recordedAt:new Date(trial.now),maxAgeSeconds:86400,fetcher});
 return{status:result.status,reason:result.reason??null,publisherMatchesCapture:result.status==='verified'?result.agent===trial.origin:null,
  coverage:result.evidence??null,availability:retained.availability,candidateAudit:retained.capturedInputAudit,
  originalRequestValidity:retained.originalRequestValidity,directorySnapshotEquivalence:retained.directorySnapshotEquivalence};
}
const[inputPath,preflightPath,output]=process.argv.slice(2);assert.ok(output);
const h=v=>createHash('sha256').update(v).digest('hex'),bytes=readFileSync(inputPath),input=JSON.parse(bytes),preflight=JSON.parse(readFileSync(preflightPath));
assert.equal(h(bytes),preflight.inputSha256);assert.equal(input.trials.length,preflight.contexts);
assert.ok([6,9].includes(input.trials.length));
for(const trial of input.trials){assert.ok(['https://crawler.exa.ai','https://bot.duckduckgo.com'].includes(trial.origin));assert.equal(trial.directoryUrl,trial.origin+'/.well-known/http-message-signatures-directory');}
const bundle=await build({stdin:{resolveDir:process.cwd(),contents:`
 import{verifyWebBotAuth}from './packages/analytics/src/webbotauth.ts';
 import{auditRetainedWebBotAuth}from './packages/analytics/src/retained-signature-audit.ts';
 const inspect=${inspect.toString()};export default{async fetch(request){return Response.json(await inspect(await request.json()));}};`
},bundle:true,write:false,format:'esm',platform:'browser',logLevel:'silent'});
const req=createRequire(resolve('package.json'));const{Miniflare}=await import(pathToFileURL(req.resolve('miniflare',{paths:[dirname(req.resolve('wrangler/package.json'))]})));
const mf=new Miniflare({modules:true,script:bundle.outputFiles[0].text,compatibilityDate:'2026-03-06',cf:{}});
try{
 const rows=[];
 for(const trial of input.trials){const node=await inspect(trial);
  const response=await mf.dispatchFetch('https://offline.invalid/failures',{method:'POST',body:JSON.stringify(trial)});assert.equal(response.status,200);
  const native=await response.json();assert.deepEqual(native,node);
  assert.equal(native.originalRequestValidity,'not-established');assert.equal(native.directorySnapshotEquivalence,'not-established');
  assert.equal(native.candidateAudit.assessment,'complete');assert.equal(native.candidateAudit.taggedCandidates,1);
  if(trial.vendor==='exa'){
   assert.equal(native.status,trial.variant==='changed-authority'?'unverified':'verified');
   if(native.status==='verified'){
    assert.equal(native.publisherMatchesCapture,true);assert.equal(native.coverage.covered.authority,true);
    for(const f of ['userAgent','method','targetUri','path','query'])assert.equal(native.coverage.covered[f],false);
   }
  }
  if(trial.vendor==='duck'&&trial.variant==='original'){assert.equal(native.status,'unverified');assert.equal(native.reason,'signature-invalid');}
  rows.push({declaration:trial.vendor==='duck'?'DuckDuckBot':'ExaSearchBot',variant:trial.variant,...native});
 }
 const receipt={checkedAt:new Date().toISOString(),sourceBaseline:'16c8bd8',scriptSha256:h(readFileSync(new URL(import.meta.url))),inputSha256:h(bytes),
  preflightSha256:h(readFileSync(preflightPath)),contextsPerRuntime:rows.length,rows,externalResolverRequests:0,newOwnSiteRequests:0,d1Statements:0,humanLabels:0,
  sourceSha256:Object.fromEntries(['webbotauth.ts','retained-signature-audit.ts','index.ts','versions.ts'].map(name=>[name,h(readFileSync('packages/analytics/src/'+name))])),
  limits:['Fixed archived keys and retained request contexts; original resolver state and wire validity remain unestablished.',
   'A successful later replay does not explain an earlier timeout or overwrite its outcome.',
   'A failed retained-context signature and a listed-address assessment remain separate evidence.']};
 writeFileSync(output,JSON.stringify(receipt,null,2)+'\n',{flag:'wx',mode:0o600});
 console.log(JSON.stringify({contextsPerRuntime:rows.length,results:rows.map(r=>({declaration:r.declaration,variant:r.variant,status:r.status,reason:r.reason}))}));
}finally{await mf.dispose()}

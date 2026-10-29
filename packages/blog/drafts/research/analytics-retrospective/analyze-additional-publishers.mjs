import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { build } from 'esbuild';
import { verifyWebBotAuth } from '../../../../analytics/.test-dist/webbotauth.js';
import { auditRetainedWebBotAuth } from '../../../../analytics/.test-dist/retained-signature-audit.js';

const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
async function inspect(trial){
  if(trial.directory===null)return{assessment:'not-assessed',reason:'directory-capture-unavailable'};
  const request=new Request(trial.url,{method:trial.method,headers:trial.headers});
  const options={now:new Date(trial.now),maxAgeSeconds:86400,includeEvidence:true,fetcher:async url=>{
    if(String(url)!==trial.directoryUrl)throw Error('Outside fixed captured resolver');
    return Response.json(trial.directory,{headers:{'Content-Type':'application/http-message-signatures-directory+json'}});
  }};
  const verdict=await verifyWebBotAuth(request,options);
  const retained=await auditRetainedWebBotAuth(request,{recordedAt:new Date(trial.now),maxAgeSeconds:86400,fetcher:options.fetcher});
  return{assessment:'retained-context',status:verdict.status,reason:verdict.reason??null,
    publisherMatchesCapture:verdict.status==='verified'?verdict.agent===trial.origin:null,coverage:verdict.evidence??null,
    interpretation:retained.replayInterpretation,availability:retained.availability,candidateAudit:retained.capturedInputAudit,
    originalRequestValidity:retained.originalRequestValidity};
}
async function main(){
  const root=process.argv[2];assert.ok(root);const read=name=>JSON.parse(readFileSync(join(root,name)));
  const groups=read('unreviewed-groups.json'),captures=read('directory-captures.json');assert.equal(groups.length,4);assert.equal(captures.length,4);
  const trials=[],originals=[];for(const[index,group]of groups.entries()){
    const alias='publisher-'+(index+1),capture=captures[index];assert.equal(capture.alias,alias);assert.equal(capture.source,group.origin+'/.well-known/http-message-signatures-directory');
    let directory=null;if(capture.responseStatus===200&&capture.exitCode===0){
      assert.equal(capture.allResolvedAddressesGlobal,true);assert.equal(capture.tlsHostPinned,true);assert.equal(capture.redirectsAllowed,false);
      const bytes=readFileSync(join(root,alias+'.json'));assert.equal(hash(bytes),capture.sha256);directory=JSON.parse(bytes);
      const headers=readFileSync(join(root,alias+'-headers.txt'),'utf8');assert.match(headers,/content-type:\s*application\/http-message-signatures-directory\+json/i);
    }
    for(const record of group.records){
      assert.equal(record.$metadata.type,'cf-worker-event');assert.notEqual(record.$workers.truncated,true);
      const data=record.$workers.event.request,now=new Date(record.timestamp).toISOString();
      const original={alias,origin:group.origin,directoryUrl:capture.source,directory,reference:record.$metadata.requestId,
        variant:'original',now,url:data.url,method:data.method,headers:data.headers};trials.push(original);originals.push(original);
      if(directory!==null){const authority=new URL(data.url);authority.hostname='offline-publisher-control.invalid';trials.push({...original,variant:'changed-authority',url:authority.href});
        const path=new URL(data.url);path.pathname='/offline-unsigned-role-control';const headers=new Headers(data.headers);headers.set('User-Agent','OfflineControl/1.0');
        trials.push({...original,variant:'changed-unsigned-role-and-path',url:path.href,headers:Object.fromEntries(headers)});
      }
    }
  }
  assert.equal(originals.length,19);assert.equal(new Set(originals.map(x=>x.reference)).size,19);
  const node=[];for(const trial of trials)node.push(await inspect(trial));
  const bundle=await build({stdin:{resolveDir:process.cwd(),contents:`import{verifyWebBotAuth}from './packages/analytics/src/webbotauth.ts';
    import{auditRetainedWebBotAuth}from './packages/analytics/src/retained-signature-audit.ts';
    const inspect=${inspect.toString()};export default{async fetch(request){return Response.json(await inspect(await request.json()));}};`
  },bundle:true,write:false,format:'esm',platform:'browser',logLevel:'silent'});
  const req=createRequire(resolve('package.json'));const{Miniflare}=await import(pathToFileURL(req.resolve('miniflare',{paths:[dirname(req.resolve('wrangler/package.json'))]})));
  const mf=new Miniflare({modules:true,script:bundle.outputFiles[0].text,compatibilityDate:'2026-03-06',cf:{}});
  try{
    for(const[index,trial]of trials.entries()){
      const response=await mf.dispatchFetch('https://offline.invalid/publisher',{method:'POST',body:JSON.stringify(trial)});assert.equal(response.status,200);
      assert.ok(isDeepStrictEqual(await response.json(),node[index]),'Node/native publisher disagreement');
    }
    const reference=trials.filter(t=>t.directory!==null).map(t=>({vendor:t.alias,variant:t.variant,now:t.now,url:t.url,method:t.method,headers:t.headers,directory:t.directory}));
    const output={checkedAt:new Date().toISOString(),sourceBaseline:'3d245a0',scriptSha256:hash(readFileSync(new URL(import.meta.url))),
      groupInputSha256:hash(readFileSync(join(root,'unreviewed-groups.json'))),captureManifestSha256:hash(readFileSync(join(root,'directory-captures.json'))),
      originalRequests:19,nodeWorkerdContexts:trials.length,referenceContexts:reference.length,
      rows:trials.map((trial,index)=>({publisher:trial.alias,variant:trial.variant,...node[index]})),
      liveDirectoryCaptures:captures.map(({source,...facts})=>facts),externalReplayRequests:0,newSiteRequests:0,newD1Statements:0,newHumanLabels:0,
      limits:['Four fixed publisher candidates only; no discovery from arbitrary replay inputs.',
        'Later public keys do not reconstruct original discovery, wire completeness, D1 linkage or managed verification.',
        'DNS capture failure is unavailable evidence, never an invalid historical signature verdict.',
        'Public publisher labels remain opaque; per-client promises and purpose require separate documentation.']};
    for(const[name,value]of[['additional-replay.json',output],['reference-input.json',{trials:reference}]])writeFileSync(join(root,name),JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});
    const counts={};for(const row of output.rows){const key=row.publisher+':'+row.variant+':'+(row.status??row.assessment)+':'+(row.reason??'none');counts[key]=(counts[key]??0)+1;}
    console.log(JSON.stringify({originals:19,nodeWorkerdContexts:trials.length,referenceContexts:reference.length,counts}));
  }finally{await mf.dispose();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();

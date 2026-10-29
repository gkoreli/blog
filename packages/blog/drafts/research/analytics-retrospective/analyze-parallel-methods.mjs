import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {dirname,resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {analyzeTraffic} from '../../../../analytics/.test-dist/classify.js';
import {verifyWebBotAuth} from '../../../../analytics/.test-dist/webbotauth.js';
import {verificationEvidence} from '../../../../analytics/.test-dist/signature-evidence.js';

const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
async function inspect(trial){
  const request=new Request(trial.url,{method:trial.method,headers:trial.headers});
  const declarations=analyzeTraffic(request.headers.get('User-Agent')??'').declarations;
  const verdict=await verifyWebBotAuth(request,{now:new Date(trial.now),maxAgeSeconds:86400,includeEvidence:true,fetcher:async url=>{
    if(String(url)!==trial.directoryUrl)throw Error('Outside fixed captured resolver');
    return Response.json(trial.directory,{headers:{'Content-Type':'application/http-message-signatures-directory+json'}});
  }});
  const evidence=verificationEvidence(request,verdict,false,declarations.candidates);
  return{declaredNames:declarations.candidates,localStatus:evidence.localStatus,localReason:evidence.localReason,
    vendor:evidence.vendor,publisher:evidence.directoryPublication,coverage:evidence.coverage};
}
const[archive,current,output,referenceOutput]=process.argv.slice(2);
assert.ok(archive&&current&&output&&referenceOutput&&!existsSync(output)&&!existsSync(referenceOutput));
const manifestBytes=readFileSync(join(archive,'manifest.json'));
assert.equal(hash(manifestBytes),'5228bcc1aa4c02259ab065b0794c0185bf7d2c07b949848ecde173dd3c033810');
const manifest=JSON.parse(manifestBytes),groupsBytes=readFileSync(join(archive,'unreviewed-groups.json'));
assert.equal(hash(groupsBytes),manifest.files.find(f=>f.path==='unreviewed-groups.json').sha256);
const groups=JSON.parse(groupsBytes),group=groups.find(g=>g.origin==='https://shapbot.parallel.ai');assert.ok(group);assert.equal(group.records.length,3);
const captures=JSON.parse(readFileSync(join(current,'directory-captures.json'))),capture=captures.find(c=>c.name==='shapbot');
const bytes=readFileSync(join(current,'shapbot-directory.json'));assert.equal(hash(bytes),capture.sha256);
const directory=JSON.parse(bytes),trials=[];
for(const[index,record]of group.records.entries()){
  const data=record.$workers.event.request;
  assert.notEqual(record.$workers.truncated,true);
  const base={context:'retained-'+(index+1),variant:'original',directory,directoryUrl:capture.url,now:new Date(record.timestamp).toISOString(),url:data.url,method:data.method,headers:data.headers};
  trials.push(base);
  const authority=new URL(data.url);authority.hostname='offline-control.invalid';trials.push({...base,variant:'changed-authority',url:authority.href});
  const roleHeaders=new Headers(data.headers);roleHeaders.set('User-Agent','Shap-User/0.1.0');
  trials.push({...base,variant:'changed-unsigned-client-declaration',headers:Object.fromEntries(roleHeaders)});
  const path=new URL(data.url);path.pathname='/offline-resource-control';trials.push({...base,variant:'changed-unsigned-path',url:path.href});
}
const node=[];for(const trial of trials)node.push(await inspect(trial));
const bundle=await build({stdin:{resolveDir:process.cwd(),contents:`
 import{analyzeTraffic}from './packages/analytics/src/classify.ts';
 import{verifyWebBotAuth}from './packages/analytics/src/webbotauth.ts';
 import{verificationEvidence}from './packages/analytics/src/signature-evidence.ts';
 const inspect=${inspect.toString()};export default{async fetch(request){return Response.json(await inspect(await request.json()))}};
`},bundle:true,write:false,format:'esm',platform:'browser',logLevel:'silent'});
const req=createRequire(resolve('package.json'));const{Miniflare}=await import(pathToFileURL(req.resolve('miniflare',{paths:[dirname(req.resolve('wrangler/package.json'))]})));
const mf=new Miniflare({modules:true,script:bundle.outputFiles[0].text,compatibilityDate:'2026-03-06',cf:{}});
try{
 for(const[index,trial]of trials.entries()){
  const result=await(await mf.dispatchFetch('https://offline.invalid/check',{method:'POST',body:JSON.stringify(trial)})).json();assert.deepEqual(result,node[index]);
  const authority=trial.variant==='changed-authority',role=trial.variant==='changed-unsigned-client-declaration';
  assert.equal(result.localStatus,authority?'unverified':'verified');assert.deepEqual(result.declaredNames,[role?'Shap-User':'ShapBot']);
  assert.equal(result.vendor.status,authority?'not-verified':role?'different-origin':'matching-origin');
  assert.equal(result.publisher.status,authority?'not-verified':role?'different-publisher':'matching-publisher');
  if(!authority){assert.equal(result.coverage.covered.authority,true);assert.equal(result.coverage.covered.userAgent,false);assert.equal(result.coverage.covered.path,false);}
 }
 const report={checkedAt:new Date().toISOString(),sourceBaseline:'3639bf6',scriptSha256:hash(readFileSync(new URL(import.meta.url))),privateSourceManifestSha256:hash(manifestBytes),directorySha256:capture.sha256,
  originals:3,contextsPerRuntime:trials.length,rows:trials.map((t,i)=>({context:t.context,variant:t.variant,...node[i]})),newProductionRequests:0,newD1Statements:0,newHumanLabels:0,
  limits:['Later keys against retained representations at recorded times; original directory state and wire completeness remain unproven.','Current method mapping is a fresh interpretation, not a rewrite of stored historical assessments.','A valid proof with a changed unsigned UA authenticates no user-directed trigger.','No authenticated D1 joins or managed-verifier comparison.']};
 writeFileSync(output,JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});
 writeFileSync(referenceOutput,JSON.stringify({trials:trials.map(t=>({vendor:'reviewed-client-context',variant:t.variant,now:t.now,url:t.url,method:t.method,headers:t.headers,directory:t.directory}))},null,2)+'\n',{flag:'wx',mode:0o600});
 console.log(JSON.stringify({originals:3,contextsPerRuntime:12,originalsVerified:3,unsignedRoleChangesRemainVerified:3}));
}finally{await mf.dispose()}

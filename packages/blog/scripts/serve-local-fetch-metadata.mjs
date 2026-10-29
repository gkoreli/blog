import assert from 'node:assert/strict';
import {createServer,request as httpRequest} from 'node:http';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {dirname,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {inspectMetadata} from '../drafts/research/analytics-retrospective/analyze-unresolved-metadata.mjs';

// Local research only: no collector, D1, production bindings or arbitrary proxy.
const[root]=process.argv.slice(2);assert.ok(root&&root.startsWith('/'));
const hash=v=>createHash('sha256').update(v).digest('hex');
const save=(name,value)=>writeFileSync(resolve(root,name),JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});
const selectedNames=['user-agent','accept','accept-language','referer','sec-fetch-mode','sec-fetch-dest','sec-fetch-site','sec-fetch-user'];
const fetchNames=selectedNames.filter(n=>n.startsWith('sec-fetch-'));
const conditions=['direct','preserve-http','strip-all-http','strip-user-http','strip-all-fetch'];
const order=[conditions,[conditions[1],conditions[3],conditions[0],conditions[4],conditions[2]],conditions.toReversed()];
const trials=order.flatMap((names,round)=>names.map(condition=>({id:randomUUID(),round:round+1,condition,label:`Round ${round+1}: ${condition}`})));
const byId=new Map(trials.map(t=>[t.id,t])),frontSeen=new Set(),nativeSeen=new Set(),errors=[];
const plan={preparedAt:new Date().toISOString(),sourceBaseline:'e3f3f37',scriptSha256:hash(readFileSync(new URL(import.meta.url))),
 node:process.version,undici:process.versions.undici,conditions,repetitions:3,trials,operatorLabel:'agent-operated in-app browser; no human-operated visits',
 maximumTrialNavigations:15,attemptsPerTrial:1,maximumPrivateRecords:80,maximumPrivateBytes:1048576,
 captureBudgetEnforcement:'Post-capture review thresholds, not server byte caps; frontend/native per-trial identity guards enforce one accepted capture.',
 cfPolicy:'Miniflare cf:{}; each request separately evaluated with ASN absent and with explicit synthetic unlisted ASN 64512. Neither is provider detection.',
 expectedInvariants:['Preserve selected headers over low-level HTTP.','Remove only selected Fetch Metadata fields according to condition before forwarding.','Match native receipt to the exact planned trial and browser action.','Record actual downstream Fetch-added headers rather than assuming they remain absent.'],
 scoring:'Report request-shape decisions and abstentions separately from operator attribution. Known automation does not make the Browser shape label a human verdict. No human error rate.',
 productionRequests:0,d1Statements:0,humanLabels:0,externalProxyTargets:0,reviewDate:'2026-10-31',automaticErasure:false};
save('plan.json',plan);
const selected=input=>Object.fromEntries(selectedNames.flatMap(name=>{const v=input[name];return typeof v==='string'?[[name,v]]:[]}));
let backendOrigin,closed=false;
const lowLevel=(url,headers)=>new Promise((resolve,reject)=>{
 const req=httpRequest(url,{method:'GET',headers,timeout:5000},res=>{const chunks=[];let bytes=0;
  res.on('data',chunk=>{bytes+=chunk.length;if(bytes>131072)req.destroy(Error('response-cap'));else chunks.push(chunk)});
  res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body:Buffer.concat(chunks)}));res.on('error',reject)});
 req.on('error',reject);req.on('timeout',()=>req.destroy(Error('forward-timeout')));req.end();
});
const front=createServer(async(req,res)=>{
 try{
  const match=/^\/trial\/([0-9a-f-]{36})$/.exec(req.url??'');const trial=match?byId.get(match[1]):undefined;
  if(req.method!=='GET'||!trial||trial.condition==='direct'||!backendOrigin){res.writeHead(404);res.end('No planned relay');return}
  if(frontSeen.has(trial.id)){res.writeHead(409);res.end('Duplicate trial rejected');return}frontSeen.add(trial.id);
  const before=selected(req.headers),after={...before};
  if(trial.condition.startsWith('strip-all'))for(const name of fetchNames)delete after[name];
  if(trial.condition==='strip-user-http')delete after['sec-fetch-user'];
  save('front-'+trial.id+'.json',{at:new Date().toISOString(),trialId:trial.id,condition:trial.condition,before,forwardedHeaders:after,
   transport:trial.condition==='strip-all-fetch'?'Node builtin fetch':'node:http.request',forwardTarget:'fixed owned loopback Worker only'});
  const target=new URL('/trial/'+trial.id,backendOrigin);assert.equal(target.hostname,'127.0.0.1');
  let response;
  if(trial.condition==='strip-all-fetch'){
   const result=await fetch(target,{headers:after,redirect:'error',signal:AbortSignal.timeout(5000)});
   const bytes=new Uint8Array(await result.arrayBuffer());assert.ok(bytes.length<131072);response={status:result.status,headers:Object.fromEntries(result.headers),body:bytes};
  }else response=await lowLevel(target,after);
  assert.equal(response.status,200);save('forward-'+trial.id+'.json',{at:new Date().toISOString(),trialId:trial.id,status:response.status,responseSha256:hash(response.body)});
  res.writeHead(response.status,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'origin','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'"});res.end(response.body);
 }catch(error){errors.push({stage:'relay',code:error?.code??'forward-failed'});res.writeHead(500);res.end('Trial failed; do not repeat');}
});
await new Promise((resolve,reject)=>{front.once('error',reject);front.listen(0,'127.0.0.1',resolve)});
const address=front.address();assert.ok(address&&typeof address==='object');const frontOrigin='http://127.0.0.1:'+address.port;
const worker=`
 import{extractRequestMetadata}from './packages/analytics/src/metadata.ts';
 import{analyzeTraffic}from './packages/analytics/src/classify.ts';
 import{classifyReaderKind,claimsFetchMetadataBrowser}from './packages/analytics/src/readerkind.ts';
 import{classificationEvidence}from './packages/analytics/src/classification-evidence.ts';
 const inspectMetadata=${inspectMetadata.toString()};
 const names=${JSON.stringify(selectedNames)};
 const page=body=>new Response('<!doctype html><html lang="en"><meta charset="utf-8"><title>Local analytics mechanism experiment</title><link rel="icon" href="data:,"><main>'+body+'</main></html>',{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'origin','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'"}});
 export default{async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname==='/__inspect'&&request.method==='POST')return Response.json(inspectMetadata(await request.json()));
  if(url.pathname==='/hub')return page('<h1>Local analytics mechanism experiment</h1><p>Agent-operated visits only. ASN absent and synthetic-ASN assessments are kept separate. No production analytics.</p><ul>'+env.TRIALS.map(t=>'<li><a href="'+(t.condition==='direct'?url.origin:env.FRONT_ORIGIN)+'/trial/'+t.id+'">'+t.label+'</a></li>').join('')+'</ul>');
  const id=url.pathname.startsWith('/trial/')?url.pathname.slice(7):null,trial=env.TRIALS.find(t=>t.id===id);
  if(request.method!=='GET'||!trial)return new Response('No planned trial',{status:404});
  const headers=Object.fromEntries(names.flatMap(name=>request.headers.has(name)?[[name,request.headers.get(name)]]:[]));
  const input={url:request.url,method:request.method,headers};
  const absent=inspectMetadata({...input,cf:{}}),fixture=inspectMetadata({...input,cf:{asn:64512}});
  const receipt={at:new Date().toISOString(),trialId:trial.id,condition:trial.condition,input,asnAbsent:absent,syntheticAsn:fixture};
  const ack=await env.CAPTURE.fetch('https://local-binding.invalid/capture',{method:'POST',body:JSON.stringify(receipt)});
  if(!ack.ok)return new Response('Capture failed; do not repeat',{status:500});
  return page('<h1>Trial captured</h1><p>'+trial.label+'</p><p>ASN absent: '+absent.classification.kind+' / '+absent.classification.reason+'</p><p>Synthetic ASN: '+fixture.classification.kind+' / '+fixture.classification.reason+'</p><p>Mode: '+(fixture.metadata.secFetchMode??'absent')+'; destination: '+(fixture.metadata.secFetchDest??'absent')+'; activation: '+(fixture.metadata.secFetchUser??'absent')+'</p><a href="'+url.origin+'/hub">Return to trial list</a>');
 }};`;
const bundle=await build({stdin:{contents:worker,resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'browser',logLevel:'silent'});
const req=createRequire(resolve('package.json'));const{Miniflare}=await import(pathToFileURL(req.resolve('miniflare',{paths:[dirname(req.resolve('wrangler/package.json'))]})));
const mf=new Miniflare({host:'127.0.0.1',port:0,modules:true,script:bundle.outputFiles[0].text,compatibilityDate:'2026-03-06',cf:{},
 bindings:{TRIALS:trials,FRONT_ORIGIN:frontOrigin},outboundService:()=>{errors.push({stage:'unexpected-outbound'});return new Response(null,{status:503})},
 serviceBindings:{CAPTURE:async request=>{
  const receipt=await request.json(),trial=byId.get(receipt.trialId);
  if(!trial||trial.condition!==receipt.condition||nativeSeen.has(trial.id)){errors.push({stage:'capture-identity'});return new Response(null,{status:409})}
  nativeSeen.add(trial.id);save('native-'+trial.id+'.json',receipt);return new Response(null,{status:204});
 }}});
const nativeUrl=await mf.ready;assert.equal(nativeUrl.hostname,'127.0.0.1');backendOrigin=nativeUrl.origin;
const base={url:'https://fixture.invalid/',method:'GET',headers:{'User-Agent':'Mozilla/5.0 Firefox/140.0','Accept':'text/html','Accept-Language':'en'},cf:{asn:64512}};
const selfCases=[base,{...base,headers:{...base.headers,'Sec-Fetch-Mode':'navigate','Sec-Fetch-Dest':'document'}},
 {...base,headers:{...base.headers,'Sec-Fetch-Mode':'cors'}},{...base,headers:{...base.headers,'Sec-Fetch-Mode':'future'}}];
for(const input of selfCases){const response=await mf.dispatchFetch('http://127.0.0.1/__inspect',{method:'POST',body:JSON.stringify(input)});assert.equal(response.status,200);assert.deepEqual(await response.json(),inspectMetadata(input))}
const bundled=process.binding('natives')['internal/deps/undici/undici'];assert.equal(typeof bundled,'string');
writeFileSync(resolve(root,'node-undici-bundled.js'),bundled,{flag:'wx',mode:0o600});
save('ready.json',{readyAt:new Date().toISOString(),pid:process.pid,hubUrl:backendOrigin+'/hub',frontOrigin,backendOrigin,trialCount:15,nativeSelfComparisons:4,
 scriptSha256:hash(readFileSync(new URL(import.meta.url))),workerBundleSha256:hash(bundle.outputFiles[0].text),nodeUndiciSha256:hash(bundled),node:process.version,undici:process.versions.undici});
console.log(JSON.stringify({ready:true,trials:15,nativeSelfComparisons:4}));
async function stop(){if(closed)return;closed=true;front.closeAllConnections();await new Promise(resolve=>front.close(resolve));await mf.dispose();save('terminal.json',{stoppedAt:new Date().toISOString(),nativeTrials:nativeSeen.size,frontTrials:frontSeen.size,errors,productionRequests:0,d1Statements:0,humanLabels:0});process.exitCode=0;console.log(JSON.stringify({stopped:true,nativeTrials:nativeSeen.size,frontTrials:frontSeen.size,errors:errors.length}))}
process.once('SIGINT',()=>void stop());process.once('SIGTERM',()=>void stop());
// Prefer explicit stdin shutdown: dependency signal hooks may exit before an
// asynchronous SIGINT handler finishes writing its terminal receipt.
process.stdin.setEncoding('utf8');
process.stdin.on('data',value=>{if(value.trim()==='stop')void stop().then(()=>process.stdin.pause())});

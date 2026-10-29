import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {dirname,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {inspectMetadata,reconcileUnresolved} from '../drafts/research/analytics-retrospective/analyze-unresolved-metadata.mjs';

const[root,output]=process.argv.slice(2);assert.ok(output);
const h=v=>createHash('sha256').update(v).digest('hex'),read=n=>JSON.parse(readFileSync(root+'/'+n));
const bytes=readFileSync(root+'/replay-input-final.json'),input=JSON.parse(bytes),accepted=read('reconciliation-final.json');
assert.equal(h(bytes),accepted.inputsSha256.replayInput);assert.equal(input.originals.length,100);
const candidates=read('unresolved-production.json')[0].results,copies=read('invocations.json'),chains=read('chains.json');
const recaptures=Array.from({length:12},(_,i)=>read('recovery-'+i+'.json'));
assert.equal(reconcileUnresolved(candidates,copies,chains,recaptures).accepted.length,100);
const selected=input.originals.find(r=>!recaptures.some(a=>a.some(e=>e.source?.storage?.observationId===r.reference))).reference;
const receipt=chains.find(r=>r.source?.storage?.observationId===selected),requestId=receipt.$metadata.requestId;
const mutationChecks=[];
for(const[name,mutate]of[
 ['missing-invocation',s=>s.chains=s.chains.filter(r=>r.$metadata.requestId!==requestId||r.$metadata.type!=='cf-worker-event')],
 ['duplicate-log-id',s=>{const a=s.chains.filter(r=>r.$metadata.requestId===requestId);a[0].$metadata.id=a[1].$metadata.id}],
 ['wrong-operation',s=>{s.chains.find(r=>r.$metadata.requestId===requestId&&r.source?.message==='analytics.observation_attempt').source.operationId='offline-wrong-operation'}],
 ['changed-receipt-copy',s=>{s.copies.find(r=>r.source?.storage?.observationId===selected).source.receipt.readerKind='browser'}],
 ['truncated-context',s=>{s.chains.find(r=>r.$metadata.requestId===requestId).$workers.truncated=true}],
 ['changed-metadata',s=>{s.chains.find(r=>r.$metadata.requestId===requestId&&r.$metadata.type==='cf-worker-event').$workers.event.request.headers['sec-fetch-mode']='navigate'}],
 ['changed-stored-field',s=>{s.candidates.find(r=>r.privateReference===selected).secFetchMode='navigate'}],
 ['changed-browser-claim',s=>{s.chains.find(r=>r.$metadata.requestId===requestId&&r.$metadata.type==='cf-worker-event').$workers.event.request.headers['user-agent']='OfflineControl/1.0'}],
]){const state=structuredClone({candidates,copies,chains});mutate(state);const result=reconcileUnresolved(state.candidates,state.copies,state.chains,recaptures);
 assert.ok(!result.accepted.some(r=>r.row.privateReference===selected),name);mutationChecks.push(name)}
const without=reconcileUnresolved(candidates,copies,chains);assert.equal(without.accepted.length,88);
for(const[name,changed]of[['missing-recapture',recaptures.slice(1)],['partial-recapture',recaptures.map((a,i)=>i===0?a.slice(1):a)],['duplicate-recapture',[...recaptures,recaptures[0]]]]){
 assert.equal(reconcileUnresolved(candidates,copies,chains,changed).accepted.length,99,name);mutationChecks.push(name)}

const base={url:'https://fixture.invalid/',method:'GET',headers:{'User-Agent':'Mozilla/5.0 Firefox/140.0','Accept':'text/html','Accept-Language':'en'},cf:{asn:64512}};
const navigation={...base,headers:{...base.headers,'Sec-Fetch-Mode':'navigate','Sec-Fetch-Dest':'document','Sec-Fetch-Site':'none','Sec-Fetch-User':'?1'}};
const controls=[
 ['missing-metadata',base,'unresolved','fetch-metadata-absent'],
 ['synthetic-navigation-shape',navigation,'browser','navigation-shaped-network-unlisted'],
 ['cors-subresource',{...base,headers:{...base.headers,'Sec-Fetch-Mode':'cors','Sec-Fetch-Dest':'empty'}},'http-client','not-navigation-shaped'],
 ['unknown-mode',{...navigation,headers:{...navigation.headers,'Sec-Fetch-Mode':'future-mode'}},'unresolved','fetch-metadata-unrecognized'],
 ['old-browser-claim',{...base,headers:{...base.headers,'User-Agent':'Mozilla/5.0 Firefox/89.0'}},'unresolved','fetch-metadata-support-unknown'],
 ['unknown-client-navigation',{...navigation,headers:{...navigation.headers,'User-Agent':'OfflineControl/1.0'}},'unresolved','unrecognized-browser-claim'],
 ['normalization',{...navigation,headers:{...navigation.headers,'Sec-Fetch-Mode':' NAVIGATE ','Sec-Fetch-Dest':' DOCUMENT '}},'browser','navigation-shaped-network-unlisted'],
 ['missing-network',{...navigation,cf:{}},'unresolved','network-evidence-missing'],
];
const bundle=await build({stdin:{resolveDir:process.cwd(),contents:`
 import{extractRequestMetadata}from './packages/analytics/src/metadata.ts';
 import{analyzeTraffic}from './packages/analytics/src/classify.ts';
 import{classifyReaderKind,claimsFetchMetadataBrowser}from './packages/analytics/src/readerkind.ts';
 import{classificationEvidence}from './packages/analytics/src/classification-evidence.ts';
 const inspectMetadata=${inspectMetadata.toString()};export default{async fetch(request){return Response.json(inspectMetadata(await request.json()));}};`
 },bundle:true,write:false,format:'esm',platform:'browser',logLevel:'silent'});
const req=createRequire(resolve('package.json'));const{Miniflare}=await import(pathToFileURL(req.resolve('miniflare',{paths:[dirname(req.resolve('wrangler/package.json'))]})));
const mf=new Miniflare({modules:true,script:bundle.outputFiles[0].text,compatibilityDate:'2026-03-06',cf:{}});
try{
 const native=async input=>{const response=await mf.dispatchFetch('https://offline.invalid/metadata',{method:'POST',body:JSON.stringify(input)});assert.equal(response.status,200);return response.json()};
 for(const original of input.originals){const node=inspectMetadata(original);assert.deepEqual(node,original.expected);assert.deepEqual(await native(original),node)}
 const results=[];for(const[name,context,kind,reason]of controls){const node=inspectMetadata(context);assert.deepEqual(await native(context),node);assert.deepEqual(node.classification,{kind,reason});results.push({condition:name,kind,reason})}
 const result={checkedAt:new Date().toISOString(),sourceBaseline:'7ad2405',scriptSha256:h(readFileSync(new URL(import.meta.url))),inputSha256:h(bytes),
  originalNodeNativeComparisons:input.originals.length,syntheticNodeNativeComparisons:controls.length,syntheticResults:results,linkageNegativeControls:mutationChecks,
  sourceSha256:Object.fromEntries(['metadata.ts','classify.ts','readerkind.ts','classification-evidence.ts','referrals.ts','versions.ts'].map(name=>[name,h(readFileSync('packages/analytics/src/'+name))])),
  externalRequests:0,newOwnSiteRequests:0,newD1Statements:0,newHumanLabels:0,
  limits:['Current replay of retained provider inputs; no original-wire completeness, actual engine, operator or purpose attribution.',
   'A locally constructed request can satisfy Browser shape. This control measures classifier behavior, not a population false-positive rate.',
   'Twelve separate native request-group queries resolve scoped log-ID ambiguity; the eight bulk collision groups remain recorded.',
   'Owner configuration and the historical public-path registry are not replayed.']};
 writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify({originals:input.originals.length,controls:controls.length,negativeControls:mutationChecks.length}));
}finally{await mf.dispose()}

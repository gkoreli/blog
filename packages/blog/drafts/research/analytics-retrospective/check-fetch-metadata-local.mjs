import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,readdirSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {build} from 'esbuild';
import {parseMetadataItem,parseFetchMetadataField,fetchMetadataFields} from '../../../../analytics/.test-dist/fetch-metadata.js';
import {inspectMetadata} from './analyze-unresolved-metadata.mjs';
import {reconcileReceiptStorage} from './reconcile-receipt-storage.mjs';

const [privateRoot,output]=process.argv.slice(2);assert.ok(privateRoot&&output);
const root=resolve(privateRoot),base='b890dfda76aee0944d11fd7a0ec5844710ea394b';
const hash=b=>createHash('sha256').update(b).digest('hex'),read=p=>JSON.parse(readFileSync(p));
const require=createRequire(resolve('package.json'));
const {Miniflare}=await import(pathToFileURL(require.resolve('miniflare',{paths:[dirname(require.resolve('wrangler/package.json'))]})));
const oldRoot=join(root,'baseline');mkdirSync(oldRoot,{recursive:true,mode:0o700});
execFileSync('tar',['-x','-C',oldRoot],{input:execFileSync('git',['archive',base,'packages/analytics/src'])});
const current=resolve('packages/analytics/src'),old=join(oldRoot,'packages/analytics/src');
const projection=`function inspect(input,old=false){const r=new Request(input.url,{method:input.method,headers:input.headers});Object.defineProperty(r,'cf',{value:input.cf});const m=(old?oldMetadata:extractRequestMetadata)(r),a=analyzeTraffic(m.userAgent);const f={...m,...a,observationSource:'edge',signature:{status:'absent'}};return {metadata:{secFetchMode:m.secFetchMode,secFetchDest:m.secFetchDest,secFetchSite:m.secFetchSite,secFetchUser:m.secFetchUser},classification:(old?oldClassify:classifyReaderKind)(f),bits:m.fetchMetadataBits??null,fields:old?null:fetchMetadataFields(m.fetchMetadataBits)};}`;
const imports=`import {extractRequestMetadata} from ${JSON.stringify(current+'/metadata.ts')};import {classifyReaderKind} from ${JSON.stringify(current+'/readerkind.ts')};import {analyzeTraffic} from ${JSON.stringify(current+'/classify.ts')};import {parseMetadataItem,fetchMetadataFields} from ${JSON.stringify(current+'/fetch-metadata.ts')};import {observePageResponse} from ${JSON.stringify(current+'/index.ts')};import {extractRequestMetadata as oldMetadata} from ${JSON.stringify(old+'/metadata.ts')};import {classifyReaderKind as oldClassify} from ${JSON.stringify(old+'/readerkind.ts')};`;
const bundle=await build({stdin:{contents:imports+projection+`export default {async fetch(request,env){const p=await request.json();if(p.action==='syntax')return Response.json(p.inputs.map(value=>{try{return {ok:true,...parseMetadataItem(value)}}catch{return {ok:false}}}));if(p.action==='inspect')return Response.json(p.inputs.map(input=>({old:inspect(input,true),current:inspect(input)})));if(p.action==='collect'){const logs=[],original=console.log;console.log=(...args)=>logs.push(args);try{for(const input of p.inputs){const r=new Request(input.url,{headers:input.headers});Object.defineProperty(r,'cf',{value:input.cf});const pending=[];observePageResponse(r,new Response('<html>fixture</html>',{headers:{'Content-Type':'text/html'}}),'html',{DB:env.DB,ANALYTICS_HASH_KEY:'local-only'},{waitUntil:p=>pending.push(p)},{publicPagePaths:async()=>new Set()});await Promise.all(pending)}return Response.json(logs)}finally{console.log=original}}return new Response('unknown',{status:400})}};`,resolveDir:resolve('.')},bundle:true,write:false,format:'esm',platform:'browser',target:'es2022'});
const script=bundle.outputFiles[0].text;writeFileSync(join(root,'worker.js'),script,{mode:0o600});
const nodeBundle=await build({stdin:{contents:imports+projection+'export {inspect};',resolveDir:resolve('.')},bundle:true,write:false,format:'esm',platform:'node',target:'es2022'});
writeFileSync(join(root,'node.mjs'),nodeBundle.outputFiles[0].text,{mode:0o600});const node=await import(pathToFileURL(join(root,'node.mjs')));
const corpus=[];
for(const file of readdirSync(join(root,'httpwg')).filter(n=>n.endsWith('.json'))){for(const row of read(join(root,'httpwg',file))){if(row.header_type==='item')corpus.push({...row,file,input:row.raw.join(', ')})}}
assert.equal(corpus.length,854);
const own=[
 ['canonical',{},'browser'],['upper-mode',{'Sec-Fetch-Mode':'NAVIGATE'},'unresolved'],['upper-dest',{'Sec-Fetch-Dest':'DOCUMENT'},'unresolved'],['upper-site',{'Sec-Fetch-Site':'NONE'},'unresolved'],
 ['invalid-user',{'Sec-Fetch-User':'private-canary'},'unresolved'],['duplicate-mode',{'Sec-Fetch-Mode':'navigate, navigate'},'unresolved'],['quoted-mode',{'Sec-Fetch-Mode':'"navigate"'},'unresolved'],['unicode-space',{'Sec-Fetch-Mode':'\u00a0navigate\u00a0'},'unresolved'],
 ['parameters',{'Sec-Fetch-Mode':'navigate;x=1'},'browser'],['date-parameters',{'Sec-Fetch-Mode':'navigate;x=@1;y=?0'},'browser'],['display-parameters',{'Sec-Fetch-Mode':'navigate;x=%"%c3%a9"'},'browser'],['invalid-extension',{'Sec-Fetch-Mode':'navigate;x=1.1234'},'unresolved'],
 ['unknown-dest',{'Sec-Fetch-Dest':'future-destination'},'unresolved'],['optional-site-absent',{'Sec-Fetch-Site':null},'browser'],['user-false',{'Sec-Fetch-User':'?0'},'browser'],['user-extension',{'Sec-Fetch-User':'?1;x=?0'},'browser'],['oversize-mode',{'Sec-Fetch-Mode':'a'.repeat(32769)},'unresolved'],
];
const inputs=own.map(([label,changes])=>{const headers={'User-Agent':'Mozilla/5.0 Chrome/152.0.0.0 Safari/537.36',Accept:'text/html','Accept-Language':'en','Sec-Fetch-Mode':'navigate','Sec-Fetch-Dest':'document','Sec-Fetch-Site':'none','Sec-Fetch-User':'?1',...changes};for(const name in headers)if(headers[name]===null)delete headers[name];return {url:'https://publication.example/'+label,method:'GET',headers,cf:{asn:64512}}});
const mf=new Miniflare({modules:true,script,compatibilityDate:'2026-03-06',cf:{},d1Databases:{DB:'metadata-local'}});
const summary={baseline:base,checkedAt:new Date().toISOString(),node:process.version,workerSha256:hash(script),productionRequests:0,humanTrials:0};
try{
 async function call(action,inputs){const r=await mf.dispatchFetch('https://local.invalid/',{method:'POST',body:JSON.stringify({action,inputs}),headers:{'Content-Type':'application/json'},cf:{}});assert.equal(r.status,200);return r.json()}
 const syntax=await call('syntax',corpus.map(r=>r.input));let permittedRejections=0,mandatoryPass=0;
 for(const [i,row]of corpus.entries()){
  let local;try{local={ok:true,...parseMetadataItem(row.input)}}catch{local={ok:false}}
  assert.deepEqual(syntax[i],local,row.file+': '+row.name);
  if(row.can_fail){if(!local.ok)permittedRejections++}else{assert.equal(local.ok,!row.must_fail,row.file+': '+row.name);mandatoryPass++}
  if(local.ok&&row.expected){const value=row.expected[0];if(typeof value==='boolean')assert.deepEqual(local.item,{type:'boolean',value});else if(value?.__type==='token')assert.deepEqual(local.item,{type:'token',value:value.value});else assert.equal(local.item.type,'other');assert.equal(local.parameters,row.expected[1].length>0)}
 }
 summary.corpus={itemCases:corpus.length,mandatoryPass,permittedRejections,scope:'Item acceptance, primary token/boolean values/types and parameter presence only; not discarded parameter values or general List/Dictionary conformance'};
 const native=await call('inspect',inputs);summary.controls=[];
 for(const [i,input]of inputs.entries()){const expected={old:node.inspect(input,true),current:node.inspect(input)};assert.deepEqual(native[i],expected);assert.equal(expected.current.classification.kind,own[i][2]);summary.controls.push({label:own[i][0],old:expected.old.classification,current:expected.current.classification,fields:expected.current.fields});}
 // Reuse accepted private contexts rather than collecting new production traffic.
 function archive(name, expected){const dir='/Users/goga/Documents/goga/analytics-evidence/'+name,bytes=readFileSync(dir+'/manifest.json');assert.equal(hash(bytes),expected);const manifest=JSON.parse(bytes);return {files:manifest.files,read(name){const entry=manifest.files.find(f=>f.path===name);assert.ok(entry);const bytes=readFileSync(dir+'/'+name);assert.equal(hash(bytes),entry.sha256);return JSON.parse(bytes)}}}
 const a88=archive('2026-10-29-unresolved-metadata-data','c1a2ae8be9f9b47ebd7a21f987eee2b0362d91a6b8ce07edb5fa940445ff64b6'),a89=archive('2026-10-29-local-metadata-relay-data','7f13f5c3fc352f8c9554b48a0cf8632e68646a767d61bb041543faac9cc02052');
 const historical=a88.read('replay-input-final.json').originals;assert.equal(historical.length,100);
 const relays=a89.files.filter(f=>/^native-.*\.json$/.test(f.path)).map(f=>a89.read(f.path));assert.equal(relays.length,15);
 const saved=[...historical,...relays.map(r=>({...r.input,cf:{asn:64512}}))];const replay=await call('inspect',saved);
 for(const [i,input]of saved.entries()){assert.deepEqual(replay[i].current,node.inspect(input));assert.deepEqual(replay[i].old.classification,replay[i].current.classification);if(i<100)assert.deepEqual(inspectMetadata(input),input.expected)}
 const commitment=read(resolve('packages/blog/drafts/research/analytics-retrospective/signed-slice-sources.json')).previousArchives[2].manifestSha256;
 const a75=archive('2026-10-29-frozen-signed-cohort',commitment),frozen=reconcileReceiptStorage(a75.read('gk-export75-readback.json')[0].results,a75.read('gk-export75-old-chains.json'));
 assert.equal(frozen.identicalProjectionPairs,52);assert.equal(frozen.differentProjectionPairs,0);
 summary.legacyReceiptPairs=52;
 summary.savedRegression={historical:100,agentBrowser:15,nativeAndNode:115,classificationChanges:0,scope:'Two saved cohorts, original capture provenance unchanged; not a historical error-rate estimate'};
 const db=await mf.getD1Database('DB');const sql=readFileSync('packages/analytics/schema.sql','utf8').replace(/^\s*--.*$/gm,'');await db.batch(sql.split(';').map(x=>x.trim()).filter(Boolean).map(x=>db.prepare(x)));
 const selected=[0,1,4,8,9].map(i=>inputs[i]);const logs=await call('collect',selected);const stored=logs.filter(r=>r[0]==='analytics.observation_stored');assert.equal(stored.length,5);
 const rows=(await db.prepare('SELECT CAST(id AS TEXT) AS privateReference,collection_version AS collectionVersion,classifier_version AS classifierVersion,reader_kind AS readerKind,signature_status AS signatureStatus,signature_agent AS signatureAgent,classification_evidence AS classificationEvidence,signature_evidence AS signatureEvidence,vendor_ip_evidence AS vendorIpEvidence FROM page_observations ORDER BY id').all()).results;
 const receipts=stored.map(([message,source],i)=>({timestamp:'2026-10-29T00:00:00.000Z',$metadata:{id:'fixture-'+i,type:'cf-worker',requestId:'request-'+i},source:{message,...source}}));const pairing=reconcileReceiptStorage(rows,receipts);assert.equal(pairing.identicalProjectionPairs,5);assert.equal(pairing.differentProjectionPairs,0);
 assert.ok(rows.every(r=>r.collectionVersion==='2026-10-29.6'&&r.classifierVersion==='2026-10-29.3'&&JSON.parse(r.classificationEvidence).version==='2026-10-29.2'));assert.ok(stored.every(r=>r[1].receipt.version==='2026-10-29.2'));
 assert.equal(JSON.stringify(rows).includes('private-canary'),false);
 summary.collector={runtime:'native workerd collector and D1',rows:5,exactReceiptProjectionPairs:5,rawCanaryPersisted:false,newSchema:false,managedCloudflareCompared:false};
 writeFileSync(join(root,'native-results.json'),JSON.stringify({syntax,native,replay,rows,receipts},null,2),{mode:0o600});
 writeFileSync(output,JSON.stringify(summary,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({corpus:summary.corpus,controls:inputs.length,regression:summary.savedRegression,collector:summary.collector}));
}finally{await mf.dispose()}

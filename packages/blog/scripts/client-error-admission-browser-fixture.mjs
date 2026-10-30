import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {dirname,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {build} from 'esbuild';

const output=process.argv[2];assert.ok(output?.startsWith('/'),'Pass a new absolute evidence directory');mkdirSync(output,{mode:0o700});
const repo=resolve(dirname(fileURLToPath(import.meta.url)),'../../..'),require=createRequire(repo+'/package.json');
const{Miniflare}=await import(pathToFileURL(require.resolve('miniflare',{paths:[dirname(require.resolve('wrangler/package.json'))]})));
const clientSource=`import {BeaconTransport,FetchTransport} from ${JSON.stringify(repo+'/packages/client-observability/src/transport.ts')};
import {browserContext,defaultRedact} from ${JSON.stringify(repo+'/packages/client-observability/src/redact.ts')};
for(const kind of ['beacon','fetch'])document.getElementById(kind).addEventListener('click',async event=>{event.currentTarget.disabled=true;const label=document.getElementById(kind+'-result');const payload=defaultRedact({type:'interaction_error',component:'admission_fixture',message:'admission_browser_'+kind,source:'https://user:fixture-token@example.invalid/main.js?token=fixture-token#fixture-token'},browserContext());if(!payload)throw Error('Fixture payload rejected');try{const receipt=await(kind==='beacon'?new BeaconTransport():new FetchTransport()).send(payload);label.textContent=receipt.state;}catch{label.textContent='unconfirmed';}});`;
const clientBuild=await build({stdin:{contents:clientSource,resolveDir:repo},bundle:true,write:false,format:'esm',minify:true,target:'es2024'});
const client=clientBuild.outputFiles[0].text;writeFileSync(output+'/client-entry.js',clientSource,{mode:0o600});writeFileSync(output+'/client.js',client,{mode:0o600});
const page='<!doctype html><html lang="en"><meta charset="utf-8"><title>Local diagnostic admission</title><body><h1>Local diagnostic admission</h1><p>Agent-operated controls. No production traffic, signup or human label.</p><button id="beacon">Send one beacon control</button><p id="beacon-result">Not sent</p><button id="fetch">Send one fetch control</button><p id="fetch-result">Not sent</p><p><a href="/_fixture/result">Read independent server receipt</a></p><script type="module" src="/client.js"></script></body></html>';
const source=`import {handleClientError} from ${JSON.stringify(repo+'/packages/client-observability/src/server.ts')};
const client=${JSON.stringify(client)},page=${JSON.stringify(page)},requests=[];
export default{async fetch(request,env,ctx){const url=new URL(request.url);
 if(url.pathname==='/')return new Response(page,{headers:{'content-type':'text/html; charset=utf-8'}});
 if(url.pathname==='/client.js')return new Response(client,{headers:{'content-type':'text/javascript; charset=utf-8'}});
 if(url.pathname==='/api/client-error'&&request.method==='POST'){const result=await handleClientError(request,env,ctx);requests.push({originPresent:request.headers.has('origin'),originMatches:request.headers.get('origin')===url.origin,jsonEssence:request.headers.get('content-type')?.split(';')[0]?.toLowerCase()==='application/json',status:result.status});return result;}
 if(url.pathname==='/_fixture/result'){const rows=await env.DB.prepare('SELECT message,path,component,source,processing_evidence FROM client_errors ORDER BY message').all();return Response.json({fixtureOnly:true,requests,rows:rows.results});}
 return new Response(null,{status:404});}};`;
writeFileSync(output+'/worker-entry.js',source,{mode:0o600});
const worker=await build({stdin:{contents:source,resolveDir:repo},bundle:true,write:false,format:'esm',target:'es2024'});writeFileSync(output+'/worker.js',worker.outputFiles[0].text,{mode:0o600});
const mf=new Miniflare({modules:true,script:worker.outputFiles[0].text,compatibilityDate:'2026-03-06',cf:{},host:'127.0.0.1',port:0,d1Databases:{DB:'admission-browser'},ratelimits:{CLIENT_ERROR_RATE_LIMITER:{simple:{limit:60,period:60}}}});
try{
 const db=await mf.getD1Database('DB');
 for(const n of ['0001_create_client_errors.sql','0002_add_subscription_error_evidence.sql','0003_add_processing_evidence.sql'])for(const sql of readFileSync(repo+'/packages/client-observability/migrations/'+n,'utf8').split(';').filter(s=>s.trim()))await db.prepare(sql).run();
 const url=await mf.ready;
 const plan={frozenAt:new Date().toISOString(),fixtureOnly:true,url:url.origin,controllerPid:process.pid,operator:'agent-browser',maximumClicks:2,oneClickPerTransport:true,expectedMessages:['admission_browser_beacon','admission_browser_fetch'],expectedRows:2,expectedRequests:2,expectedServerStatus:204,expectedOriginMatch:true,expectedSource:'https://example.invalid/main.js',expectedProcessing:{profile:'client-error-processing-v1',sanitization:'client-error-urls-v1',admission:'origin-route-budget-v1'},nativeLimit:{limit:60,period:60},clientSha256:createHash('sha256').update(client).digest('hex'),workerSha256:createHash('sha256').update(worker.outputFiles[0].text).digest('hex'),productionRequests:0,humanLabels:0,populationCompatibilityMeasured:false};
 writeFileSync(output+'/plan.json',JSON.stringify(plan,null,2)+'\n',{mode:0o600,flag:'wx'});console.log(JSON.stringify(plan));
 await new Promise(resolve=>{process.once('SIGINT',resolve);process.once('SIGTERM',resolve)});
}finally{await mf.dispose();console.log('Owned local admission fixture disposed');}

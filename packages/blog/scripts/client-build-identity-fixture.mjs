import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {dirname,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {clientDefines} from '../src/pipeline/client-mode.ts';

// Local, agent-operated browser fixture. No production traffic or human labels.
const output=process.argv[2];assert.ok(typeof output==='string'&&output.startsWith('/'),'Pass a new absolute output directory');mkdirSync(output,{mode:0o700});
const repo=resolve(dirname(fileURLToPath(import.meta.url)),'../../..'),require=createRequire(repo+'/package.json');
const{Miniflare}=await import(pathToFileURL(require.resolve('miniflare',{paths:[dirname(require.resolve('wrangler/package.json'))]})));
const metadata={WORKERS_CI:'1',WORKERS_CI_BUILD_UUID:'12345678-1234-4234-8234-123456789abc',WORKERS_CI_COMMIT_SHA:'a'.repeat(40)};
const buildId='cf:'+metadata.WORKERS_CI_BUILD_UUID+':'+metadata.WORKERS_CI_COMMIT_SHA;
const bundle=await build({entryPoints:[repo+'/packages/blog/src/client/main.ts'],bundle:true,write:false,format:'esm',minify:true,target:'es2024',define:clientDefines(true,metadata)});
const client=bundle.outputFiles[0].text;writeFileSync(output+'/main.js',client,{mode:0o600});
const page='<!doctype html><html lang="en"><meta charset="utf-8"><title>Local client build identity fixture</title><body><h1>Local diagnostic fixture</h1><p>Synthetic build identity. No signup or human trial.</p><button onclick="throw new Error(\'client_build_fixture\')">Emit one labelled error</button><script type="module" src="/main.js"></script></body></html>';
const source=`import {handleClientError} from ${JSON.stringify(repo+'/packages/client-observability/src/server.ts')};
const client=${JSON.stringify(client)},page=${JSON.stringify(page)};
export default{async fetch(request,env,ctx){const path=new URL(request.url).pathname;
 if(path==='/')return new Response(page,{headers:{'content-type':'text/html; charset=utf-8'}});
 if(path==='/main.js')return new Response(client,{headers:{'content-type':'text/javascript; charset=utf-8'}});
 if(path==='/api/client-error'&&request.method==='POST')return handleClientError(request,env,ctx);
 if(path==='/_fixture/result'){const rows=await env.DB.prepare('SELECT build_id AS buildId,type,message FROM client_errors').all();return Response.json({fixtureOnly:true,rows:rows.results});}
 return new Response(null,{status:404});}};`;
writeFileSync(output+'/worker-entry.js',source,{mode:0o600});
const worker=await build({stdin:{contents:source,resolveDir:repo},bundle:true,write:false,format:'esm',target:'es2024'});
const mf=new Miniflare({modules:true,script:worker.outputFiles[0].text,compatibilityDate:'2026-03-06',cf:{},ratelimits:{CLIENT_ERROR_RATE_LIMITER:{simple:{limit:1000,period:60}}},host:'127.0.0.1',port:0,d1Databases:{DB:'client-build-fixture'}});
try{
 const db=await mf.getD1Database('DB');
 const{readFileSync}=await import('node:fs');
 for(const n of ['0001_create_client_errors.sql','0002_add_subscription_error_evidence.sql','0003_add_processing_evidence.sql'])for(const sql of readFileSync(repo+'/packages/client-observability/migrations/'+n,'utf8').split(';').filter(x=>x.trim()))await db.prepare(sql).run();
 const url=await mf.ready;
 const plan={fixtureOnly:true,url:url.origin,buildId,metadataSynthetic:true,operator:'agent-browser',maximumClicks:1,expectedRows:1,allowedMessages:['client_build_fixture','Uncaught Error: client_build_fixture'],clientSha256:createHash('sha256').update(client).digest('hex'),productionCalls:0,humanLabels:0};
 writeFileSync(output+'/plan.json',JSON.stringify(plan,null,2)+'\n',{mode:0o600});console.log(JSON.stringify(plan));
 await new Promise(resolve=>{process.once('SIGINT',resolve);process.once('SIGTERM',resolve)});
 // Read /_fixture/result before stopping; shutdown must not depend on another D1 read.
}finally{await mf.dispose()}

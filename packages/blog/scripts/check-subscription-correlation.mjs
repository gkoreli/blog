import assert from 'node:assert/strict';
import {readFileSync,readdirSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {dirname,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';

const baseline=process.argv[2],output=process.argv[3];
assert.match(baseline??'',/^[0-9a-f]{40}$/);
assert.ok(output?.startsWith('/'),'Pass a new absolute evidence directory');
mkdirSync(output,{mode:0o700});
const repo=resolve(dirname(fileURLToPath(import.meta.url)),'../../..');
execFileSync('git',['cat-file','-e',baseline+'^{commit}'],{cwd:repo});
const rootRequire=createRequire(repo+'/package.json'),blogRequire=createRequire(repo+'/packages/blog/package.json');
const{Miniflare}=await import(pathToFileURL(rootRequire.resolve('miniflare',{paths:[dirname(rootRequire.resolve('wrangler/package.json'))]})));
const{build}=await import(pathToFileURL(blogRequire.resolve('esbuild')));
const cases=['config','missing','invalid','redirected','lost-response','idle'];
const plan={createdAt:new Date().toISOString(),baseline,cases,variants:['before','after'],expectedReportsPerCase:1,expectedAfterMatchedIds:1,expectedBeforeMatchedIds:0,productionCalls:0,humanLabels:0,actualBrowser:false,network:'local dispatch only; missing/invalid/redirected/lost responses are constructed controls; adapter checks but omits browser keepalive because workerd dispatch does not accept it',mail:'configuration absent; must stop before verification/admission/send'};
writeFileSync(output+'/plan.json',JSON.stringify(plan,null,2)+'\n',{mode:0o600,flag:'wx'});
const worker=await build({entryPoints:[repo+'/packages/blog/test/fixtures/subscription-correlation-worker.js'],bundle:true,write:false,format:'esm',platform:'browser',target:'es2024'});
writeFileSync(output+'/worker.js',worker.outputFiles[0].text,{mode:0o600});
const mf=new Miniflare({modules:true,script:worker.outputFiles[0].text,compatibilityDate:'2026-03-06',cf:{},d1Databases:{DB:'subscription-correlation'}});
const results={};
try{
 const db=await mf.getD1Database('DB');
 for(const name of ['0001_create_client_errors.sql','0002_add_subscription_error_evidence.sql'])for(const sql of readFileSync(repo+'/packages/client-observability/migrations/'+name,'utf8').split(';').filter(s=>s.trim()))await db.prepare(sql).run();
 for(const variant of plan.variants){
  const dir=output+'/'+variant;mkdirSync(dir+'/observability',{recursive:true,mode:0o700});
  const copy=(relative,target)=>writeFileSync(target,variant==='before'?execFileSync('git',['show',baseline+':'+relative],{cwd:repo}):readFileSync(repo+'/'+relative),{mode:0o600});
  copy('packages/blog/src/client/subscribe.ts',dir+'/subscribe.ts');
  for(const name of readdirSync(repo+'/packages/client-observability/src'))if(name.endsWith('.ts'))copy('packages/client-observability/src/'+name,dir+'/observability/'+name);
  const bundle=await build({stdin:{contents:'import {initSubscribeForm} from "./subscribe.ts";import {createDefaultClientLogger} from "@gkoreli/client-observability/client";initSubscribeForm({logger:createDefaultClientLogger()});',resolveDir:dir},alias:{'@gkoreli/client-observability/client':dir+'/observability/client.ts'},bundle:true,write:false,format:'iife',platform:'browser',target:'es2024'});
  writeFileSync(dir+'/client.js',bundle.outputFiles[0].text,{mode:0o600});
  const rows=[];
  for(const mode of cases){
   assert.equal((await mf.dispatchFetch('https://fixture.invalid/reset')).status,204);
   class Element extends EventTarget{attributes=new Map();textContent='';setAttribute(k,v){this.attributes.set(k,v)}removeAttribute(k){this.attributes.delete(k)}replaceChildren(){}}
   class Input extends Element{value='fixture@example.invalid';checkValidity(){return true}reportValidity(){return true}}
   class Button extends Element{disabled=false}
   class Form extends Element{dataset={turnstileSitekey:'synthetic-site-key'};input=new Input();button=new Button();message=new Element();slot=new Element();elements={namedItem:()=>this.input};querySelector(s){return s==='.subscribe-btn'?this.button:s==='.subscribe-msg'?this.message:this.slot}}
   const form=new Form(),tasks=[],statuses=[],failures=[],requestedPaths=[];let options,apiCalls=0;
   const delivered=Promise.withResolvers();
   const fetch= (path,init)=>{
    requestedPaths.push(path);
    const task=(async()=>{
     const headers=new Headers(init.headers);
     if(path==='/api/client-error')headers.set('cf-ray','fixture-ingestion-ray');
     const {keepalive,...dispatchInit}=init;
     if(path==='/api/client-error')assert.equal(keepalive,true);
     const response=await mf.dispatchFetch('https://fixture.invalid'+path,{...dispatchInit,headers});
     if(path==='/api/client-error'){statuses.push(response.status);delivered.resolve();return response;}
     assert.equal(path,'/api/subscribe');apiCalls++;assert.equal(response.status,503);
     if(mode==='lost-response')throw new Error('synthetic response loss after server handler');
     const modified=new Response(await response.text(),{status:response.status,headers:response.headers});
     if(mode==='missing')modified.headers.delete('x-request-id');
     if(mode==='invalid')modified.headers.set('x-request-id','private-invalid-header');
     if(mode==='redirected')Object.defineProperty(modified,'redirected',{value:true});
     return modified;
    })();tasks.push(task.catch(error=>{failures.push(String(error))}));return task;
   };
   runInNewContext(bundle.outputFiles[0].text,{Blob,Date,Response,URL,URLSearchParams,AbortController,HTMLElement:Element,HTMLInputElement:Input,HTMLButtonElement:Button,HTMLFormElement:Form,location:{origin:'https://fixture.invalid',pathname:'/owner',search:''},document:{getElementById:()=>form,referrer:''},navigator:{userAgent:'FixtureBrowser/1',sendBeacon(){return false}},window:{setTimeout(){return 1},clearTimeout(){},turnstile:{render(_slot,value){options=value;return'fixture-widget'},execute(){},remove(){}}},fetch});
   if(mode==='idle')options['error-callback']('110100');
   else{form.dispatchEvent(new Event('submit',{cancelable:true}));options.callback('synthetic-no-real-token');}
   let deadline;
   try{await Promise.race([delivered.promise,new Promise((_,reject)=>{deadline=setTimeout(()=>reject(new Error('Local diagnostic completion deadline: '+variant+'/'+mode)),5000)})]);}
   catch(error){writeFileSync(dir+'/failure.json',JSON.stringify({mode,apiCalls,statuses,failures,requestedPaths,message:form.message.textContent},null,2)+'\n',{mode:0o600});throw error;}
   finally{clearTimeout(deadline)}
   let consumed=0;
   while(consumed<tasks.length){await tasks[consumed++];await Promise.resolve();await Promise.resolve();}
   assert.deepEqual(statuses,[204]);
   const stored=await db.prepare('SELECT ray,subscription_evidence FROM client_errors').all();assert.equal(stored.results.length,1);
   const evidence=JSON.parse(stored.results[0].subscription_evidence);
   const stages=await(await mf.dispatchFetch('https://fixture.invalid/stages')).json();
   assert.equal(apiCalls,mode==='idle'?0:1);assert.equal(stages.length,apiCalls);
   if(apiCalls)assert.equal(stages[0].stage,'configuration_unavailable');
   const operation=evidence.operation??{state:'unrecorded'};
   const matched=operation.state==='response-id'&&operation.requestId===stages[0]?.attemptId;
   assert.equal(matched,variant==='after'&&mode==='config');
   if(variant==='after')assert.equal(operation.state,({config:'response-id',missing:'response-id-missing',invalid:'response-id-invalid',redirected:'redirected-response','lost-response':'response-unavailable',idle:'not-started'})[mode]);
   assert.equal(stored.results[0].ray,'fixture-ingestion-ray');
   assert.ok(!JSON.stringify(evidence).match(/fixture@example|synthetic-no-real-token|private-invalid-header|fixture-ingestion-ray/));
   rows.push({mode,apiCalls,reportsStored:1,diagnosticStatus:204,phase:evidence.phase,operationState:operation.state,matchedServerLog:matched,ingestionRaySeparate:true,serverStages:stages.map(s=>s.stage),actualResponseRequestId:stages[0]?.attemptId??null,evidence});
  }
  results[variant]={clientSha256:createHash('sha256').update(bundle.outputFiles[0].text).digest('hex'),rows};
  writeFileSync(dir+'/results.json',JSON.stringify(results[variant],null,2)+'\n',{mode:0o600});
 }
}finally{await mf.dispose()}
const receipt={checkedAt:new Date().toISOString(),baseline,casesPerVariant:cases.length,matchedBefore:results.before.rows.filter(r=>r.matchedServerLog).length,matchedAfter:results.after.rows.filter(r=>r.matchedServerLog).length,nativeWorkerSha256:createHash('sha256').update(worker.outputFiles[0].text).digest('hex'),...results};
writeFileSync(output+'/native.json',JSON.stringify(receipt,null,2)+'\n',{mode:0o600});
console.log(JSON.stringify({pairedNative:'pass',casesPerVariant:cases.length,matchedBefore:receipt.matchedBefore,matchedAfter:receipt.matchedAfter,productionCalls:0}));

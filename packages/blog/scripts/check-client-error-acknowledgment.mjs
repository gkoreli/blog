import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {dirname,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';

// Offline only: snapshot an explicit baseline and current source, then probe local workerd/D1.
const baseline=process.argv[2],output=process.argv[3];
assert.ok(typeof baseline==='string'&&/^[0-9a-f]{40}$/.test(baseline),'Pass a full baseline commit');
assert.ok(typeof output==='string'&&output.startsWith('/'),'Pass a new absolute output directory');
mkdirSync(output,{mode:0o700});
const repo=resolve(dirname(fileURLToPath(import.meta.url)),'../../..');
const rootRequire=createRequire(repo+'/package.json'),blogRequire=createRequire(repo+'/packages/blog/package.json');
const{Miniflare}=await import(pathToFileURL(rootRequire.resolve('miniflare',{paths:[dirname(rootRequire.resolve('wrangler/package.json'))]})));
const{build}=await import(pathToFileURL(blogRequire.resolve('esbuild')));
const names=['server.ts','db.ts','schema.ts','types.ts','subscription-evidence.ts','transport.ts'];
const writes=['normal','delayed','native-rejection','negative-ack','zero-changes','unexpected-count','write-then-error'];
const transports=['200','201','202','204','205','301','400','429','500','503','network','beacon-queued','beacon-fallback','beacon-rejected','noop'];
const outputs={};
for(const variant of ['before','after']){
 const directory=output+'/'+variant;mkdirSync(directory+'/src',{recursive:true,mode:0o700});
 for(const name of variant==='before'?names:[...names,'sanitization.ts']){const relative='packages/client-observability/src/'+name;writeFileSync(directory+'/src/'+name,variant==='before'?execFileSync('git',['show',baseline+':'+relative],{cwd:repo}):readFileSync(repo+'/'+relative),{mode:0o600});}
 writeFileSync(directory+'/probe.js',readFileSync(repo+'/packages/blog/test/fixtures/client-error-ack-worker.js'),{mode:0o600});
 const bundle=await build({entryPoints:[directory+'/probe.js'],bundle:true,write:false,format:'esm',platform:'browser',target:'es2024'});
 const script=bundle.outputFiles[0].text;writeFileSync(directory+'/worker.js',script,{mode:0o600});
 const mf=new Miniflare({modules:true,script,compatibilityDate:'2026-03-06',cf:{},ratelimits:{CLIENT_ERROR_RATE_LIMITER:{simple:{limit:1000,period:60}}},d1Databases:{DB:'acknowledgment-'+variant}});
 try{
  const db=await mf.getD1Database('DB');
  for(const name of ['0001_create_client_errors.sql','0002_add_subscription_error_evidence.sql','0003_add_processing_evidence.sql'])for(const statement of readFileSync(repo+'/packages/client-observability/migrations/'+name,'utf8').split(';').filter(part=>part.trim()))await db.prepare(statement).run();
  const result={writes:[],transports:[]};
  for(const mode of writes){const response=await mf.dispatchFetch('https://fixture.invalid/write/'+mode);assert.equal(response.status,200);result.writes.push(await response.json());}
  for(const mode of transports){const response=await mf.dispatchFetch('https://fixture.invalid/transport/'+mode);assert.equal(response.status,200);result.transports.push(await response.json());}
  result.workerSha256=createHash('sha256').update(script).digest('hex');
  writeFileSync(output+'/'+variant+'.json',JSON.stringify(result,null,2)+'\n',{mode:0o600});outputs[variant]=result;
 }finally{await mf.dispose()}
}
const{before,after}=outputs;
assert.ok(before.writes.every(row=>row.status===204));
assert.equal(before.writes.find(row=>row.mode==='delayed').returnedBeforeWriteConfirmation,true);
assert.ok(before.transports.filter(row=>!row.mode.startsWith('beacon')&&row.mode!=='noop'&&row.mode!=='network').every(row=>row.outcome==='resolved'));
for(const row of after.writes){assert.equal(row.status,['normal','delayed'].includes(row.mode)?204:503);assert.equal(row.runCalls,1);assert.equal(row.backgroundCalls,1);assert.equal(row.bodyEmpty,true);assert.equal(row.insertedRows,['normal','delayed','write-then-error'].includes(row.mode)?1:0);}
assert.equal(after.writes.find(row=>row.mode==='delayed').returnedBeforeWriteConfirmation,false);
for(const row of after.transports){
 const acknowledged=['204','beacon-fallback'].includes(row.mode),queued=row.mode==='beacon-queued',disabled=row.mode==='noop';
 assert.equal(row.outcome,acknowledged||queued||disabled?'resolved':'rejected');
 assert.equal(row.receiptState,acknowledged?'server-acknowledged':queued?'browser-queued':disabled?'disabled':'unconfirmed');
 assert.equal(row.fetchCalls,queued||disabled?0:1);
 if(row.fetchCalls)assert.equal(row.redirectPolicy,'error');
}
const receipt={checkedAt:new Date().toISOString(),baseline,runtime:'paired workerd handlers with native D1; injected storage/HTTP faults',writeCasesPerVersion:writes.length,transportCasesPerVersion:transports.length,oldPrematureResponse:true,newPrematureResponse:false,old204WithoutInsertedRow:before.writes.filter(row=>row.status===204&&row.insertedRows===0).length,new204WithoutInsertedRow:after.writes.filter(row=>row.status===204&&row.insertedRows===0).length,committedRowWithUnconfirmed503:true,oneRunCallPerHandler:true,browserQueueDistinct:true,waitUntilRegistrationRetained:true,actualClientDisconnectMeasured:false,actualBrowserTransportMeasured:false,automaticRetriesAdded:false,productionCalls:0,humanLabels:0,before,after};
writeFileSync(output+'/native.json',JSON.stringify(receipt,null,2)+'\n',{mode:0o600});
console.log(JSON.stringify({pairedNative:'pass',writeCasesPerVersion:7,transportCasesPerVersion:15,oldFalse204:receipt.old204WithoutInsertedRow,newFalse204:0,uncertainCommit503:true}));

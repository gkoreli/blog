import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {dirname,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';

// Offline only: compare actual-body admission in local workerd/D1; no production traffic.
const baseline=process.argv[2],output=process.argv[3];
assert.ok(typeof baseline==='string'&&/^[0-9a-f]{40}$/.test(baseline),'Pass a full baseline commit');
assert.ok(typeof output==='string'&&output.startsWith('/'),'Pass a new absolute output directory');
mkdirSync(output,{mode:0o700});
const repo=resolve(dirname(fileURLToPath(import.meta.url)),'../../..');
const rootRequire=createRequire(repo+'/package.json'),blogRequire=createRequire(repo+'/packages/blog/package.json');
const{Miniflare}=await import(pathToFileURL(rootRequire.resolve('miniflare',{paths:[dirname(rootRequire.resolve('wrangler/package.json'))]})));
const{build}=await import(pathToFileURL(blogRequire.resolve('esbuild')));
const names=['server.ts','db.ts','schema.ts','types.ts','subscription-evidence.ts','transport.ts'];
const cases=['ordinary','boundary','oversize','zero-hint','short-hint','malformed-hint','unicode-boundary','unicode-oversize','drain-control','invalid-json','read-error'];
const outputs={};
for(const variant of ['before','after']){
 const directory=output+'/'+variant;mkdirSync(directory+'/src',{recursive:true,mode:0o700});
 for(const name of variant==='before'?names:[...names,'sanitization.ts']){const relative='packages/client-observability/src/'+name;writeFileSync(directory+'/src/'+name,variant==='before'?execFileSync('git',['show',baseline+':'+relative],{cwd:repo}):readFileSync(repo+'/'+relative),{mode:0o600});}
 writeFileSync(directory+'/probe.js',readFileSync(repo+'/packages/blog/test/fixtures/client-error-body-worker.js'),{mode:0o600});
 const bundle=await build({entryPoints:[directory+'/probe.js'],bundle:true,write:false,format:'esm',platform:'browser',target:'es2024'});
 const script=bundle.outputFiles[0].text;writeFileSync(directory+'/worker.js',script,{mode:0o600});
 const mf=new Miniflare({modules:true,script,compatibilityDate:'2026-03-06',cf:{},ratelimits:{CLIENT_ERROR_RATE_LIMITER:{simple:{limit:1000,period:60}}},d1Databases:{DB:'body-limit-'+variant}});
 try{
  const db=await mf.getD1Database('DB');
  for(const name of ['0001_create_client_errors.sql','0002_add_subscription_error_evidence.sql','0003_add_processing_evidence.sql'])for(const statement of readFileSync(repo+'/packages/client-observability/migrations/'+name,'utf8').split(';').filter(part=>part.trim()))await db.prepare(statement).run();
  const rows=[];
  for(const mode of cases){const response=await mf.dispatchFetch('https://fixture.invalid/'+mode);assert.equal(response.status,200);rows.push(await response.json());}
  outputs[variant]={rows,workerSha256:createHash('sha256').update(script).digest('hex')};
  writeFileSync(output+'/'+variant+'.json',JSON.stringify(outputs[variant],null,2)+'\n',{mode:0o600});
 }finally{await mf.dispose()}
}
for(const variant of ['before','after'])for(const row of outputs[variant].rows){
 const invalid=['invalid-json','read-error'].includes(row.mode),valid=['ordinary','boundary','unicode-boundary'].includes(row.mode);
 assert.equal(row.status,invalid?400:variant==='before'||valid?204:413);
 assert.equal(row.insertedRows,row.status===204?1:0);assert.equal(row.runCalls,row.insertedRows);assert.equal(row.emptyResponse,true);assert.equal(row.noStore,true);
}
const drain=outputs.after.rows.find(row=>row.mode==='drain-control');assert.equal(drain.pulls,1);assert.equal(drain.cancels,1);
const receipt={checkedAt:new Date().toISOString(),baseline,runtime:'paired actual handlers in local workerd with native D1 and constructed Request streams',casesPerVersion:cases.length,oldOversizeWrites:outputs.before.rows.filter(row=>row.bodyBytes>8192&&row.insertedRows===1).length,newOversizeWrites:outputs.after.rows.filter(row=>row.bodyBytes>8192&&row.insertedRows===1).length,actualWireFramingMeasured:false,productionCalls:0,humanLabels:0,...outputs};
writeFileSync(output+'/native.json',JSON.stringify(receipt,null,2)+'\n',{mode:0o600});
console.log(JSON.stringify({pairedNative:'pass',casesPerVersion:cases.length,oldOversizeWrites:receipt.oldOversizeWrites,newOversizeWrites:receipt.newOversizeWrites}));

import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {dirname,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';

const baseline=process.argv[2],output=process.argv[3];
assert.match(baseline??'',/^[0-9a-f]{40}$/);assert.ok(output?.startsWith('/'),'Pass a new absolute evidence directory');
const repo=resolve(dirname(fileURLToPath(import.meta.url)),'../../..');
execFileSync('git',['cat-file','-e',baseline+'^{commit}'],{cwd:repo});
mkdirSync(output,{mode:0o700});
const rootRequire=createRequire(repo+'/package.json'),blogRequire=createRequire(repo+'/packages/blog/package.json');
const{Miniflare}=await import(pathToFileURL(rootRequire.resolve('miniflare',{paths:[dirname(rootRequire.resolve('wrangler/package.json'))]})));
const{build}=await import(pathToFileURL(blogRequire.resolve('esbuild')));
const deniedOrigin=['foreign','missing','null','subdomain','referrer-spoof'];
const deniedMime=['mime-parameter','mime-suffix','mime-list'];
const cases=['ordinary',...deniedOrigin,...deniedMime,'charset','limiter-denied','limiter-missing','limiter-throw','invalid-json','oversize','budget-1','budget-2','budget-3','budget-4'];
const plan={frozenAt:new Date().toISOString(),baseline,cases,variants:['before','after'],matrixNativeLimit:{limit:1000,period:60},budgetControlNativeLimit:{limit:3,period:60},productionConfiguredLimit:{limit:60,period:60},scope:'local actual handlers/native D1 and native rate-limit binding; injected missing/denied/throw controls separate; no managed-edge/global accuracy claim',productionRequests:0,humanLabels:0};
writeFileSync(output+'/plan.json',JSON.stringify(plan,null,2)+'\n',{mode:0o600,flag:'wx'});
const variants={};
for(const variant of plan.variants){
 const dir=output+'/'+variant;mkdirSync(dir+'/src',{recursive:true,mode:0o700});
 for(const name of ['server.ts','db.ts','schema.ts','types.ts','subscription-evidence.ts',...(variant==='after'?['sanitization.ts']:[])]){
  const relative='packages/client-observability/src/'+name;
  writeFileSync(dir+'/src/'+name,variant==='before'?execFileSync('git',['show',baseline+':'+relative],{cwd:repo}):readFileSync(repo+'/'+relative),{mode:0o600});
 }
 writeFileSync(dir+'/probe.js',readFileSync(repo+'/packages/blog/test/fixtures/client-error-admission-worker.js'),{mode:0o600});
 const built=await build({entryPoints:[dir+'/probe.js'],bundle:true,write:false,format:'esm',platform:'browser',target:'es2024'});
 const script=built.outputFiles[0].text;writeFileSync(dir+'/worker.js',script,{mode:0o600});
 const mf=new Miniflare({modules:true,script,compatibilityDate:'2026-03-06',cf:{},d1Databases:{DB:'admission-'+variant},ratelimits:{CLIENT_ERROR_RATE_LIMITER:{simple:{limit:1000,period:60}},BUDGET_CONTROL:{simple:{limit:3,period:60}}}});
 try{
  const db=await mf.getD1Database('DB');
  for(const name of ['0001_create_client_errors.sql','0002_add_subscription_error_evidence.sql','0003_add_processing_evidence.sql'])for(const sql of readFileSync(repo+'/packages/client-observability/migrations/'+name,'utf8').split(';').filter(s=>s.trim()))await db.prepare(sql).run();
  const rows=[];
  for(const mode of cases){const response=await mf.dispatchFetch('https://fixture.invalid/'+mode);assert.equal(response.status,200);const row=await response.json();rows.push(row);writeFileSync(dir+'/rows.json',JSON.stringify(rows,null,2)+'\n',{mode:0o600});}
  for(const row of rows){
   const common=row.mode==='invalid-json'?400:row.mode==='oversize'?413:204;
   const expected=variant==='before'?common:deniedOrigin.includes(row.mode)?403:deniedMime.includes(row.mode)?415:row.mode==='limiter-denied'||row.mode==='budget-4'?429:row.mode==='limiter-missing'||row.mode==='limiter-throw'?503:common;
   assert.equal(row.status,expected,row.mode);assert.equal(row.insertedRows,expected===204?1:0,row.mode);assert.equal(row.writes,row.insertedRows);
   assert.equal(row.emptyBody,true);assert.equal(row.noStore,true);assert.equal(row.corsGranted,false);assert.equal(row.retryAfter,null);
   if(variant==='after'&&[403,415,429,503,413].includes(expected))assert.equal(row.pulls,0,row.mode);
   if(variant==='after'&&[403,415,413].includes(expected))assert.equal(row.checks,0,row.mode);
   if(variant==='after')assert.ok(row.keys.every(key=>key==='client-error:v1'));
  }
  variants[variant]={workerSha256:createHash('sha256').update(script).digest('hex'),rows};
 }finally{await mf.dispose()}
}
const receipt={checkedAt:new Date().toISOString(),baseline,casesPerVersion:cases.length,productionRequests:0,humanLabels:0,actualBrowser:false,managedAccuracyMeasured:false,...variants};
writeFileSync(output+'/native.json',JSON.stringify(receipt,null,2)+'\n',{mode:0o600});
console.log(JSON.stringify({pairedNative:'pass',casesPerVersion:cases.length,oldInserted:variants.before.rows.reduce((n,r)=>n+r.insertedRows,0),newInserted:variants.after.rows.reduce((n,r)=>n+r.insertedRows,0),productionRequests:0}));

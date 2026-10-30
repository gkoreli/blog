import assert from 'node:assert/strict';
import{readFileSync,writeFileSync,mkdirSync,readdirSync}from'node:fs';
import{execFileSync}from'node:child_process';
import{createRequire}from'node:module';
import{dirname,resolve}from'node:path';
import{fileURLToPath,pathToFileURL}from'node:url';
import{createHash}from'node:crypto';
const baseline=process.argv[2],output=process.argv[3];assert.match(baseline??'',/^[0-9a-f]{40}$/);assert.ok(output?.startsWith('/'));
const repo=resolve(dirname(fileURLToPath(import.meta.url)),'../../..');execFileSync('git',['cat-file','-e',baseline+'^{commit}'],{cwd:repo});mkdirSync(output,{mode:0o700});
const rootRequire=createRequire(repo+'/package.json'),blogRequire=createRequire(repo+'/packages/blog/package.json');
const{Miniflare}=await import(pathToFileURL(rootRequire.resolve('miniflare',{paths:[dirname(rootRequire.resolve('wrangler/package.json'))]})));
const{build}=await import(pathToFileURL(blogRequire.resolve('esbuild')));
const cases=['ordinary','source-url','referrer-url','message-url','stack-url','token-path','data-source','file-stack','long-userinfo','component','invalid-referrer','network-path','free-text-residual'];
const migrations=['0001_create_client_errors.sql','0002_add_subscription_error_evidence.sql','0003_add_processing_evidence.sql'];
writeFileSync(output+'/plan.json',JSON.stringify({frozenAt:new Date().toISOString(),baseline,cases,variants:['before','after'],scope:'selected structural URL cases; free-text residual explicitly unresolved; local workerd/native D1 only',rollout:['old-before','new-before-unconfirmed','new-after','old-after'],productionRequests:0,humanLabels:0},null,2)+'\n',{mode:0o600,flag:'wx'});
async function migrate(db,names){for(const n of names)for(const sql of readFileSync(repo+'/packages/client-observability/migrations/'+n,'utf8').split(';').filter(s=>s.trim()))await db.prepare(sql).run()}
const variants={};
for(const variant of ['before','after']){
 const dir=output+'/'+variant;mkdirSync(dir+'/src',{recursive:true,mode:0o700});
 const prefix='packages/client-observability/src/';
 const files=variant==='before'?execFileSync('git',['ls-tree','-r','--name-only',baseline,'--',prefix],{cwd:repo}).toString().split('\n').filter(n=>n.endsWith('.ts')):readdirSync(repo+'/'+prefix).filter(n=>n.endsWith('.ts')).map(n=>prefix+n);
 for(const relative of files)writeFileSync(dir+'/src/'+relative.slice(prefix.length),variant==='before'?execFileSync('git',['show',baseline+':'+relative],{cwd:repo}):readFileSync(repo+'/'+relative),{mode:0o600});
 writeFileSync(dir+'/probe.js',readFileSync(repo+'/packages/blog/test/fixtures/client-error-sanitization-worker.js'),{mode:0o600});
 const built=await build({entryPoints:[dir+'/probe.js'],bundle:true,write:false,format:'esm',target:'es2024'}),script=built.outputFiles[0].text;writeFileSync(dir+'/worker.js',script,{mode:0o600});
 const mf=new Miniflare({modules:true,script,compatibilityDate:'2026-03-06',cf:{},d1Databases:{DB:'sanitize-'+variant},ratelimits:{CLIENT_ERROR_RATE_LIMITER:{simple:{limit:1000,period:60}}}});
 try{
  const db=await mf.getD1Database('DB');await migrate(db,migrations);const rows=[];
  for(const mode of cases){const response=await mf.dispatchFetch('https://fixture.invalid/'+mode);assert.equal(response.status,200);rows.push(await response.json());writeFileSync(dir+'/rows.json',JSON.stringify(rows,null,2)+'\n',{mode:0o600});}
  for(const row of rows){assert.equal(row.status,variant==='after'&&row.mode==='network-path'?400:204);assert.equal(row.insertedRows,row.status===204?1:0);if(variant==='after')assert.equal(row.syntheticUrlSecretRetained,false,row.mode);if(variant==='after'&&row.insertedRows)assert.deepEqual(row.processing,{profile:'client-error-processing-v1',sanitization:'client-error-urls-v1',admission:'origin-route-budget-v1'});if(variant==='before')assert.equal(row.processing,null);assert.equal(row.clientProfileForged,false);}
  assert.equal(rows.find(r=>r.mode==='free-text-residual').freeTextEmailShapeRetained,true,'record the residual, not a claim of universal PII removal');
  variants[variant]={workerSha256:createHash('sha256').update(script).digest('hex'),rows};
 }finally{await mf.dispose()}
}
const rolloutSource=`import{handleClientError as oldHandler}from'./before/src/server.ts';import{handleClientError as newHandler}from'./after/src/server.ts';export default{fetch(request,env){const handler=new URL(request.url).pathname==='/old'?oldHandler:newHandler;return handler(request,env)}};`;
writeFileSync(output+'/rollout-entry.js',rolloutSource,{mode:0o600});
const rolloutBuild=await build({entryPoints:[output+'/rollout-entry.js'],bundle:true,write:false,format:'esm',target:'es2024'});
const mf=new Miniflare({modules:true,script:rolloutBuild.outputFiles[0].text,compatibilityDate:'2026-03-06',cf:{},d1Databases:{DB:'sanitize-rollout'},ratelimits:{CLIENT_ERROR_RATE_LIMITER:{simple:{limit:1000,period:60}}}});
let rollout;
try{
 const db=await mf.getD1Database('DB');await migrate(db,migrations.slice(0,2));
 const send=path=>mf.dispatchFetch('https://fixture.invalid/'+path,{method:'POST',headers:{origin:'https://fixture.invalid','content-type':'application/json'},body:JSON.stringify({type:'interaction_error',component:'subscribe_form',message:'rollout_fixture',path:'/owner',occurredAt:'2026-10-30T00:00:00.000Z'})});
 const oldBefore=(await send('old')).status;assert.equal(oldBefore,204);const oldRows=(await db.prepare('SELECT * FROM client_errors').all()).results;
 const newBefore=(await send('new')).status;assert.equal(newBefore,503);assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM client_errors').first()).n,1);
 await migrate(db,migrations.slice(2));const migrated=(await db.prepare('SELECT * FROM client_errors').all()).results;assert.equal(migrated[0].processing_evidence,null);const{processing_evidence,...oldFields}=migrated[0];assert.deepEqual(oldFields,oldRows[0]);
 const newAfter=(await send('new')).status;assert.equal(newAfter,204);const oldAfter=(await send('old')).status;assert.equal(oldAfter,204);
 const rows=(await db.prepare('SELECT processing_evidence FROM client_errors ORDER BY rowid').all()).results;assert.equal(rows.length,3);assert.equal(rows[0].processing_evidence,null);assert.equal(rows[2].processing_evidence,null);assert.equal(JSON.parse(rows[1].processing_evidence).admission,'origin-route-budget-v1');
 rollout={oldBefore,newBefore,newAfter,oldAfter,historicalRowsPreserved:true,historicalProcessingRemainsNull:true,legacyWriterStillCompatible:true,newRowsStamped:1,oldRowsUnrecorded:2};
}finally{await mf.dispose()}
const receipt={checkedAt:new Date().toISOString(),baseline,casesPerVersion:cases.length,urlMarkerRetainedBefore:variants.before.rows.filter(r=>r.syntheticUrlSecretRetained).length,urlMarkerRetainedAfter:variants.after.rows.filter(r=>r.syntheticUrlSecretRetained).length,knownFreeTextResidualsPerVersion:1,privacyComplianceEstablished:false,productionRequests:0,humanLabels:0,rollout,...variants};
writeFileSync(output+'/native.json',JSON.stringify(receipt,null,2)+'\n',{mode:0o600});console.log(JSON.stringify({pairedNative:'pass',casesPerVersion:cases.length,oldUrlMarkerRetained:receipt.urlMarkerRetainedBefore,newUrlMarkerRetained:receipt.urlMarkerRetainedAfter,knownResidual:1,rollout}));

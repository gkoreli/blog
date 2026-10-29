import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {wireFailureFixture} from '../../analytics/test/fixtures/wire-failures.mjs';
import {DIRECTORY_FAILURE_CASES} from '../../analytics/test/fixtures/directory-failures.mjs';
import {COLLECTION_VERSION,VERIFIER_PROFILE_VERSION} from '../../analytics/.test-dist/versions.js';

const output=process.argv[2];assert.ok(output);
const fixture=await wireFailureFixture(),trial=fixture.cases.find(row=>row.form==='dictionary'&&row.scenario==='valid');
const req=createRequire(resolve('package.json'));
const {Miniflare}=await import(pathToFileURL(req.resolve('miniflare',{paths:[dirname(req.resolve('wrangler/package.json'))]})));
const bundle=await build({stdin:{resolveDir:process.cwd(),contents:`
 import {observePageResponse} from './packages/analytics/src/index.ts';
 import {directoryFailureResponse} from './packages/analytics/test/fixtures/directory-failures.mjs';
 let active,receipt;
 const keys=${JSON.stringify(Object.values(fixture.directories)[0].keys)};
 console.log=(event,data)=>{if(event==='analytics.observation_stored')receipt=data;};
 globalThis.fetch=()=>directoryFailureResponse(active,keys);
 export default{async fetch(request,env){
  active=request.headers.get('X-Fixture-Case');receipt=null;const waits=[];
  observePageResponse(request,new Response('local fixture',{headers:{'Content-Type':'text/html'}}),'html',env,{waitUntil(p){waits.push(p);},passThroughOnException(){}});
  await Promise.all(waits);return Response.json(receipt);
 }};
`},bundle:true,write:false,format:'esm',platform:'browser',logLevel:'silent'});
const mf=new Miniflare({modules:true,script:bundle.outputFiles[0].text,compatibilityDate:'2026-03-06',cf:{},d1Databases:{DB:'directory-failures'},bindings:{ANALYTICS_HASH_KEY:'local-fixture-only'}});
try {
 const db=await mf.getD1Database('DB');const schema=readFileSync('packages/analytics/schema.sql','utf8').replace(/^\s*--.*$/gm,'');
 await db.batch(schema.split(';').map(value=>value.trim()).filter(Boolean).map(value=>db.prepare(value)));
 const rows=[];
 // End with a valid lookup too: a prior synchronous failure cannot poison the shared collector cache.
 for(const item of [...DIRECTORY_FAILURE_CASES,{name:'valid',reason:null}]) {
  const response=await mf.dispatchFetch('https://publication.example/privacy',{headers:{...trial.headers,'X-Fixture-Case':item.name,Referer:'https://traffic2cash.xyz/'}});
  assert.equal(response.status,200);const log=await response.json();assert.ok(log?.storage?.observationId);
  const stored=await db.prepare('SELECT signature_evidence,collection_version,request_evidence FROM page_observations WHERE id=CAST(? AS INTEGER)').bind(log.storage.observationId).first();
  const evidence=JSON.parse(stored.signature_evidence);assert.equal(stored.collection_version,COLLECTION_VERSION);assert.equal(evidence.verifierProfile,VERIFIER_PROFILE_VERSION);
  assert.equal(evidence.localReason,item.reason);assert.equal(evidence.localOutcome,item.reason===null?'verified':'unavailable');
  assert.equal(log.receipt.signature.reason,item.reason??'none');assert.equal(log.receipt.signature.reasonNames,evidence.localReasons.join(',')||'none');assert.equal(log.receipt.signature.outcome,evidence.localOutcome);
  assert.equal(stored.request_evidence,null);assert.ok(Buffer.byteLength(stored.signature_evidence)<=2048);
  assert.equal(evidence.native.verifiedBot,null);assert.equal(evidence.native.signedAgent,null);
  assert.equal(JSON.stringify(evidence).includes('directory-private-canary'),false);
  rows.push({case:item.name,reason:evidence.localReason,outcome:evidence.localOutcome,storedReceiptAgreement:true,signatureBytes:Buffer.byteLength(stored.signature_evidence)});
 }
 assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM page_observations').first()).n,rows.length);
 const receipt={checkedAt:new Date().toISOString(),runtime:'local workerd/WebCrypto/D1, actual collector and exact returned row references',collectionVersion:COLLECTION_VERSION,verifierProfile:VERIFIER_PROFILE_VERSION,rows,controls:rows.length,rawRequestEvidenceAbsent:true,nativeUnavailable:true,productionRequests:0,externalRequests:0};
 writeFileSync(output,JSON.stringify(receipt,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify({nativeCollectorControls:rows.length,exactReceiptMatches:rows.length,productionRequests:0}));
} finally {await mf.dispose();}

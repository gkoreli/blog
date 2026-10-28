import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { signatureSelectionFixture } from '../../analytics/test/fixtures/signature-selection.mjs';
import { keyMetadataCases } from '../../analytics/test/fixtures/key-metadata.mjs';
import { keyValidityCases } from '../../analytics/test/fixtures/key-validity.mjs';
import { createReferralAssessor } from '../../analytics/.test-dist/referral-policy.js';
import { ACTIVE_REFERRAL_POLICY } from '../../analytics/.test-dist/referral-policy.generated.js';
import { COLLECTION_VERSION, VERIFIER_PROFILE_VERSION } from '../../analytics/.test-dist/versions.js';

const [output, profile = 'metadata'] = process.argv.slice(2); assert.ok(output); assert.ok(['metadata','validity'].includes(profile));
const fixture = await signatureSelectionFixture();
const base=Object.values(fixture.directories)[0].keys[0],material={kty:base.kty,crv:base.crv,x:base.x};
const cases=profile==='validity'?keyValidityCases(fixture).map(row=>({...row,accepted:row.reason===null})):keyMetadataCases().map(row=>{
 const jwk={...material,...row.patch},keys=row.duplicate==='rejected-first'?[jwk,material]:row.duplicate==='accepted-first'?[material,jwk]:[jwk];
 return {...row,keys,reason:row.accepted?null:row.duplicate?'key-metadata-conflict':'key-metadata-rejected'};
});
const require = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] })));
const bundle = await build({ stdin: { resolveDir: process.cwd(), contents: `
 import { observePageResponse } from './packages/analytics/src/index.ts';
 const cases=${JSON.stringify(cases)};let active,receipt;
 console.log=(event,fields)=>{if(event==='analytics.observation_stored')receipt=fields;};
 globalThis.fetch=async()=>Response.json({keys:active.keys},{headers:{'Content-Type':'application/http-message-signatures-directory+json','Cache-Control':'no-store'}});
 export default { async fetch(request,env) {
   active=cases.find(row=>row.name===request.headers.get('X-Fixture-Case'));if(!active)throw Error('Unknown fixture');receipt=null;
   const waits=[],context={waitUntil(p){waits.push(p);},passThroughOnException(){}};
   const response=new Response('Native collector fixture',{headers:{'Content-Type':'text/html'}});
   observePageResponse(request,response,'html',env,context);await Promise.all(waits);
   return Response.json(receipt);
 }};
` }, bundle: true, write: false, format: 'esm', platform: 'browser', logLevel: 'silent' });
const mf = new Miniflare({ modules: true, script: bundle.outputFiles[0].text, compatibilityDate: '2026-03-06', cf: {}, d1Databases: { DB: 'key-metadata-controls' }, bindings: { ANALYTICS_HASH_KEY: 'local-fixture-only' } });
try {
 const db=await mf.getD1Database('DB');const schema=readFileSync('packages/analytics/schema.sql','utf8').replace(/^\s*--.*$/gm,'');
 await db.batch(schema.split(';').map(s=>s.trim()).filter(Boolean).map(s=>db.prepare(s)));
 const names=profile==='validity'?['expired-first','active-first-expired-second','malformed-activation','malformed-duplicate-first','draft-algorithm-name','identical-duplicates']:['ed25519-algorithm','incompatible-algorithm','duplicate-operations','conflicting-key-rejected-first','conflicting-key-accepted-first','unknown-optional-member'],trials=[];
 for(const name of names){
   const trial=cases.find(row=>row.name===name);
   const response=await mf.dispatchFetch('https://publication.example/privacy',{headers:{...fixture.cases[0].headers,'X-Fixture-Case':name,Referer:'https://traffic2cash.xyz/'}});
   assert.equal(response.status,200);const receipt=await response.json();assert.ok(receipt?.storage?.observationId);
   const row=await db.prepare('SELECT collection_version,signature_status,signature_evidence,request_evidence,referrer_host FROM page_observations WHERE id=CAST(? AS INTEGER)').bind(receipt.storage.observationId).first();
   assert.ok(row);const evidence=JSON.parse(row.signature_evidence);
   assert.equal(row.collection_version,COLLECTION_VERSION);assert.equal(evidence.verifierProfile,VERIFIER_PROFILE_VERSION);assert.equal(row.request_evidence,null);assert.equal(createReferralAssessor(ACTIVE_REFERRAL_POLICY)(row.referrer_host).action,'exclude');
   assert.equal(row.signature_status,trial.accepted?'verified':'unverified');
   const reason=trial.reason;
   assert.equal(evidence.localReason,reason);assert.equal(receipt.receipt.signature.reason,reason??'none');
   assert.equal(receipt.receipt.signature.outcome,evidence.localOutcome);assert.equal(receipt.receipt.signature.verifierProfile,evidence.verifierProfile);
   for(const canary of ['metadata-canary','validity-canary'])assert.equal(JSON.stringify(receipt.receipt).includes(canary),false);
   trials.push({name,collectionVersion:row.collection_version,verifierProfile:evidence.verifierProfile,status:row.signature_status,outcome:evidence.localOutcome,reason,receiptMatches:true,optionalEvidenceAbsent:true,excluded:true});
 }
 writeFileSync(output,JSON.stringify({checkedAt:new Date().toISOString(),fixtureProfile:profile,method:'Actual collector, local workerd/WebCrypto and D1; independent proofs, intercepted no-store directory per control, awaited actual waitUntil work and exact returned text row reference. All controls referral-excluded; optional diagnostics off.',trials,externalRequests:0,productionRequests:0},null,2)+'\n',{mode:0o600,flag:'wx'});
 console.log(JSON.stringify({nativeCollectorControls:trials.length,exactReceiptPairs:trials.length,productionRequests:0}));
} finally {await mf.dispose();}

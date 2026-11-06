import assert from 'node:assert/strict';
import test from 'node:test';
import {runInNewContext} from 'node:vm';
import {clientBootstrap} from '../src/templates/client-bootstrap.ts';
import {verifyTurnstile} from '../../newsletter/src/turnstile.ts';
import {captureSubscriptionError,parseSubscriptionErrorEvidence} from '../../client-observability/src/subscription-evidence.ts';
import {parseClientErrorPayload} from '../../client-observability/src/schema.ts';
import {createDefaultClientLogger} from '../../client-observability/src/client.ts';

const attemptId='12345678-1234-4234-8234-123456789abc';
const context={attemptId,elapsedMs:123,online:'offline',visibility:'hidden',widget:'interactive',script:'available',recovery:'automatic-retry'};

test('v3 context is closed, bounded and compatible with historical profiles',()=>{
 const evidence=captureSubscriptionError('verifying',{errorCode:'300031'},{state:'not-started'},context);
 assert.equal(evidence.profile,'subscribe-error-v3');
 assert.deepEqual(parseSubscriptionErrorEvidence(evidence),evidence);
 const clean=parseSubscriptionErrorEvidence({...evidence,context:{...context,attemptId:'private@example.invalid',elapsedMs:300001,online:'private',widget:'private',secret:'never-store'}});
 assert.equal(clean.context.attemptId,null);assert.equal(clean.context.elapsedMs,null);assert.equal(clean.context.online,'unknown');assert.equal(clean.context.widget,'unknown');assert.doesNotMatch(JSON.stringify(clean),/private|never-store/);
 for(const profile of ['subscribe-error-v1','subscribe-error-v2']) {
  const old=parseSubscriptionErrorEvidence({...evidence,profile});assert.equal(old.profile,profile);assert.equal('context' in old,false);
 }
});

test('early script/CSP reporting works with no main client, deduplicates and excludes private resource URLs',async()=>{
 const windowListeners=new Map(),documentListeners=new Map(),requests=[];
 runInNewContext(clientBootstrap(JSON.stringify('fixture-build')),{Set,URL,Date,Event,location:{origin:'https://fixture.invalid',pathname:'/owner'},console:{warn(){}},window:{dispatchEvent(){},addEventListener(name,callback){windowListeners.set(name,callback)}},document:{querySelectorAll(){return []},addEventListener(name,callback){documentListeners.set(name,callback)}},fetch:async(url,init)=>{requests.push({url,...init});return new Response(null,{status:204});}});
 const error=windowListeners.get('error'),csp=documentListeners.get('securitypolicyviolation');
 error({target:{tagName:'SCRIPT',src:'https://fixture.invalid/main.js?email=private@example.invalid'}});
 for(let i=0;i<5;i++)error({target:{tagName:'SCRIPT',src:'https://challenges.cloudflare.com/turnstile/v0/api.js?token=private'}});
 error({target:{tagName:'IMG',src:'https://challenges.cloudflare.com/private'}});
 error({target:{tagName:'SCRIPT',src:'https://unrelated.invalid/private'}});
 csp({disposition:'report',blockedURI:'https://challenges.cloudflare.com/private',effectiveDirective:'frame-src'});
 csp({disposition:'enforce',blockedURI:'https://challenges.cloudflare.com/private',effectiveDirective:'frame-src'});
 assert.equal(requests.length,3);
 assert.deepEqual(requests.map(r=>JSON.parse(r.body).message),['client_entry_script_load_error','turnstile_script_load_error','turnstile_csp_blocked']);
 assert.doesNotMatch(JSON.stringify(requests),/private|token=|email=/);
 for(const request of requests){assert.equal(request.keepalive,true);assert.equal(request.redirect,'error');assert.ok(parseClientErrorPayload(JSON.parse(request.body),'https://fixture.invalid'));}
});

test('Siteverify transient retry reuses its payload/idempotency key and exposes only bounded provider diagnostics',async t=>{
 const calls=[];t.mock.method(globalThis,'fetch',async(url,init)=>{calls.push(init);return calls.length===1?Response.json({success:false,'error-codes':['internal-error','private-response']},{status:503}):Response.json({success:true,hostname:'gkoreli.com',action:'subscribe'});});
 const result=await verifyTurnstile('private-token','private-secret','private-ip','gkoreli.com');
 assert.equal(result.ok,true);assert.equal(result.attempts,2);assert.equal(calls[0].body,calls[1].body);assert.match(JSON.parse(calls[0].body).idempotency_key,/^[a-f0-9-]{36}$/);assert.doesNotMatch(JSON.stringify(result),/private/);
});

for(const [code,reason,kind] of [['invalid-input-secret','invalid_secret','unavailable'],['timeout-or-duplicate','timeout_or_duplicate','rejected'],['bad-request','verifier_bad_request','unavailable']])test('Siteverify preserves '+code+' without retrying a permanent result',async t=>{
 let calls=0;t.mock.method(globalThis,'fetch',async()=>{calls++;return Response.json({success:false,'error-codes':[code,'private']});});
 const result=await verifyTurnstile('token','secret','ip','gkoreli.com');assert.equal(result.reason,reason);assert.equal(result.kind,kind);assert.deepEqual(result.errorCodes,[code]);assert.equal(calls,1);
});

test('default reporting uses confirmed fetch and enforces per-page and duplicate budgets',async t=>{
 for(const [name,value] of [['location',{origin:'https://fixture.invalid',pathname:'/owner'}],['document',{referrer:''}]]) {
  const original=Object.getOwnPropertyDescriptor(globalThis,name);
  Object.defineProperty(globalThis,name,{configurable:true,value});
  t.after(()=>{if(original)Object.defineProperty(globalThis,name,original);else Reflect.deleteProperty(globalThis,name);});
 }
 const requests=[];t.mock.method(globalThis,'fetch',async(url,init)=>{requests.push(init);return new Response(null,{status:204});});
 const logger=createDefaultClientLogger();
 for(let i=0;i<8;i++)logger.report({type:'window_error',message:'same'});
 assert.equal(requests.length,3);
 for(let i=0;i<30;i++)logger.report({type:'window_error',message:'unique-'+i});
 assert.equal(requests.length,20);assert.ok(requests.every(r=>r.keepalive&&r.redirect==='error'));
});

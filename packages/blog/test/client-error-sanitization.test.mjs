import assert from 'node:assert/strict';
import test from 'node:test';
import{DatabaseSync}from'node:sqlite';
import{readFileSync}from'node:fs';
import{parseClientErrorPayload}from'../../client-observability/src/schema.ts';
import{defaultRedact}from'../../client-observability/src/redact.ts';
import{recordClientError}from'../../client-observability/src/db.ts';
import{handleClientError}from'../../client-observability/src/server.ts';

const origin='https://fixture.invalid';
const base={type:'interaction_error',component:'subscribe_form',message:'subscribe_api_rejected',path:'/owner',occurredAt:'2026-10-30T00:00:00.000Z'};
const secret='fixture-secret-value';
const credentialUrl='https://fixture-user:'+secret+'@fixture.invalid/main.js?token='+secret+'#'+secret;
test('parentheses inside a URL path do not expose its following query or fragment',()=>{
 const url=origin+'/main(1).js?token='+secret+'#'+secret;
 const parsed=parseClientErrorPayload({...base,message:'Failed '+url,stack:'Error\n at fn ('+url+')'},origin);
 assert.equal(parsed.message,'Failed '+origin+'/main(1).js');
 assert.equal(parsed.stack,'Error\n at fn ('+origin+'/main(1).js)');
 assert.ok(!JSON.stringify(parsed).includes(secret));assert.deepEqual(parseClientErrorPayload(parsed,origin),parsed);
});
function fixture(t){
 const db=new DatabaseSync(':memory:');t.after(()=>db.close());
 for(const name of ['0001_create_client_errors.sql','0002_add_subscription_error_evidence.sql','0003_add_processing_evidence.sql'])db.exec(readFileSync(new URL('../../client-observability/migrations/'+name,import.meta.url),'utf8'));
 const DB={
  prepare(sql){
   return {bind(...values){
    return {async run(){
     const result=db.prepare(sql).run(...values);
     return {success:true,meta:{changes:Number(result.changes)}};
    }};
   }};
  },
 };
 return{db,DB};
}

test('browser and server remove URL credentials/query/fragment while preserving debugging fields and UA',t=>{
 const previous=Object.getOwnPropertyDescriptor(globalThis,'location');Object.defineProperty(globalThis,'location',{configurable:true,value:{origin}});
 t.after(()=>{if(previous)Object.defineProperty(globalThis,'location',previous);else Reflect.deleteProperty(globalThis,'location')});
 const raw={...base,message:'Failed '+credentialUrl,source:credentialUrl,stack:'Error: failed\n at fn ('+credentialUrl+')',referrer:origin+'/article?token='+secret+'#'+secret,line:12,column:8,userAgent:'FixtureBrowser/1',buildId:'cf:12345678-1234-4234-8234-123456789abc:'+ 'a'.repeat(40)};
 const server=parseClientErrorPayload(raw,origin),browser=defaultRedact(raw,raw);assert.deepEqual(browser,server);
 assert.equal(server.source,origin+'/main.js');assert.equal(server.referrer,origin+'/article');assert.equal(server.message,'Failed '+origin+'/main.js');
 assert.equal(server.line,12);assert.equal(server.column,8);assert.equal(server.userAgent,raw.userAgent);assert.equal(server.buildId,raw.buildId);
 assert.ok(!JSON.stringify(server).includes(secret));assert.deepEqual(parseClientErrorPayload(server,origin),server,'multiple processing boundaries must be idempotent');
});

test('URL structure, token routes, unsupported sources and referrer context have explicit limits',()=>{
 for(const path of ['/api/confirm/'+secret,'/api/unsubscribe/'+secret,'/api/%63onfirm/'+secret]){
  const event=parseClientErrorPayload({...base,path,source:origin+path,referrer:origin+path},origin);assert.ok(!JSON.stringify(event).includes(secret));assert.match(event.path,/\[redacted\]/);
 }
 for(const source of ['data:text/javascript,'+secret,'file:///Users/'+secret+'/main.js','javascript:'+secret,'blob:'+origin+'/'+secret,secret]){
  const event=parseClientErrorPayload({...base,source,stack:'at f ('+source+')'},origin);
  assert.equal(event.source,'[unsupported-source]');assert.equal(parseClientErrorPayload(event,origin).source,event.source);
 }
 for(const referrer of ['javascript:'+secret,'data:text/plain,'+secret,'not-a-url'])assert.equal(parseClientErrorPayload({...base,referrer},origin).referrer,undefined);
 assert.equal(parseClientErrorPayload({...base,referrer:'https://external.invalid/path?token='+secret},origin).referrer,'https://external.invalid');
 assert.equal(parseClientErrorPayload({...base,referrer:origin+'/article'},undefined).referrer,origin,'unknown target origin cannot justify preserving a referrer path');
 for(const path of ['//external.invalid/'+secret,'not-local','/owner\u0000'+secret])assert.equal(parseClientErrorPayload({...base,path},origin),null);
});

test('scrub complete URL fields before output truncation instead of retaining partial userinfo',()=>{
 const user='x'.repeat(220)+secret;
 const event=parseClientErrorPayload({...base,source:'https://'+user+':'+secret+'@fixture.invalid/a?token='+secret},origin);
 assert.equal(event.source,origin+'/a');assert.ok(!JSON.stringify(event).includes(secret));
 const huge=parseClientErrorPayload({...base,source:'x'.repeat(8193)},origin);assert.equal(huge.source,undefined);
 assert.equal(parseClientErrorPayload({...base,message:'x'.repeat(8193)},origin),null);
 assert.equal(parseClientErrorPayload({...base,component:'private@example.invalid'},origin).component,undefined);
});

test('storage reapplies the boundary and stamps direct writes without inventing HTTP admission',async t=>{
 const h=fixture(t);
 await recordClientError(h.DB,{...base,id:'direct',source:credentialUrl,referrer:origin+'/article?token='+secret,requestOrigin:origin,ray:null,country:null,colo:null,asOrganization:null,processing_evidence:'forged'});
 const row=h.db.prepare('SELECT source,referrer,processing_evidence FROM client_errors').get();assert.equal(row.source,origin+'/main.js');assert.equal(row.referrer,origin+'/article');
 assert.deepEqual(JSON.parse(row.processing_evidence),{profile:'client-error-processing-v1',sanitization:'client-error-urls-v2',admission:'unassessed'});
});

test('HTTP admission provenance is server-generated, and logging sees scrubbed values before persistence',async t=>{
 const h=fixture(t),logs=[];t.mock.method(console,'warn',(...args)=>logs.push(args));
 const response=await handleClientError(new Request(origin+'/api/client-error',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({...base,message:'Failed '+credentialUrl,source:credentialUrl,admissionProfile:'forged-client-profile',processing_evidence:{profile:'forged'}})}),{DB:h.DB,CLIENT_ERROR_RATE_LIMITER:{async limit(){return{success:true}}}});
 assert.equal(response.status,204);assert.ok(!JSON.stringify(logs).includes(secret));
 const row=h.db.prepare('SELECT message,source,processing_evidence FROM client_errors').get();assert.ok(!JSON.stringify(row).includes(secret));
 assert.deepEqual(JSON.parse(row.processing_evidence),{profile:'client-error-processing-v1',sanitization:'client-error-urls-v2',admission:'origin-route-budget-v1'});
});

import assert from 'node:assert/strict';
import test from 'node:test';
import {handleClientError} from '../../client-observability/src/server.ts';
import {FetchTransport,BeaconTransport,NoopTransport} from '../../client-observability/src/transport.ts';
import {createClientLogger} from '../../client-observability/src/client.ts';

const event={type:'interaction_error',component:'subscribe_form',message:'diagnostic_fixture',path:'/owner',occurredAt:'2026-10-29T12:00:00.000Z'};
const request=()=>new Request('https://example.invalid/api/client-error',{method:'POST',headers:{'origin':'https://example.invalid','content-type':'application/json'},body:JSON.stringify(event)});
const success={success:true,meta:{changes:1}};
function database(run){return{CLIENT_ERROR_RATE_LIMITER:{async limit(){return{success:true}}},DB:{prepare(){return{bind(){return{run};}};}}};}
function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return{promise,resolve,reject};}

test('204 waits for confirmed storage even when a waitUntil context is available',async t=>{
 const started=deferred(),write=deferred();t.after(()=>write.resolve(success));
 let response,backgroundCalls=0,calls=0;
 const operation=handleClientError(request(),database(()=>{calls++;started.resolve();return write.promise;}),{waitUntil(){backgroundCalls++;}}).then(value=>{response=value;});
 await started.promise;await new Promise(resolve=>setImmediate(resolve));
 assert.equal(response,undefined);assert.equal(backgroundCalls,1,'disconnect lifetime remains protected');
 write.resolve(success);await operation;assert.equal(response.status,204);assert.equal(calls,1);
 assert.equal(response.headers.get('cache-control'),'no-store');assert.equal(await response.text(),'');
});

test('rejected or contradictory D1 acknowledgment stays unconfirmed without retrying',async t=>{
 const errors=[];t.mock.method(console,'error',(...args)=>{errors.push(args.at(-1));});
 for(const outcome of [new Error('synthetic-storage-failure'),{success:false,meta:{changes:0}},{success:true,meta:{changes:0}},{success:true,meta:{changes:2}},{success:true,meta:{}}]){
  let calls=0;
  const response=await handleClientError(request(),database(async()=>{calls++;if(outcome instanceof Error)throw outcome;return outcome;}));
  assert.equal(response.status,503);assert.equal(await response.text(),'');assert.equal(calls,1);
  assert.equal(response.headers.has('retry-after'),false);
 }
 assert.deepEqual(errors.slice(1).map(error=>error.cause),[
  {resultStatus:'not-successful',affectedRows:0},
  {resultStatus:'success',affectedRows:0},
  {resultStatus:'success',affectedRows:2},
  {resultStatus:'success',affectedRows:null},
 ]);
});

test('a lost write acknowledgment can coexist with a committed record',async()=>{
 let stored=0;
 const response=await handleClientError(request(),database(async()=>{stored++;throw new Error('synthetic-ack-lost-after-commit');}));
 assert.equal(response.status,503);assert.equal(stored,1);
});

test('fetch requires the endpoint acknowledgment and does not copy response text or retry',async t=>{
 let calls=0,current=204,options;
 t.mock.method(globalThis,'fetch',async(_input,init)=>{calls++;options=init;return new Response([204,205,304].includes(current)?null:'private-response-text',{status:current});});
 assert.deepEqual(await new FetchTransport().send(event),{state:'server-acknowledged'});
 assert.equal(options.keepalive,true);assert.equal(options.redirect,'error');
 for(const status of [200,201,202,205,301,400,429,500,503]){
  current=status;const before=calls;
  await assert.rejects(new FetchTransport().send(event),error=>error.message==='client_error_report_unconfirmed');
  assert.equal(calls,before+1);
 }
});

test('beacon queueing, acknowledged fallback and disabled reporting stay distinct',async t=>{
 let queued=true,fetchCalls=0,beaconCalls=0;
 const previous=Object.getOwnPropertyDescriptor(globalThis,'navigator');
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{sendBeacon(){beaconCalls++;return queued;}}});
 t.after(()=>{if(previous)Object.defineProperty(globalThis,'navigator',previous);else Reflect.deleteProperty(globalThis,'navigator');});
 t.mock.method(globalThis,'fetch',async()=>{fetchCalls++;return new Response(null,{status:204});});
 assert.deepEqual(await new BeaconTransport().send(event),{state:'browser-queued'});assert.equal(fetchCalls,0);
 queued=false;assert.deepEqual(await new BeaconTransport().send(event),{state:'server-acknowledged'});assert.equal(fetchCalls,1);assert.equal(beaconCalls,2);
 assert.deepEqual(await new NoopTransport().send(event),{state:'disabled'});assert.equal(fetchCalls,1);
});

test('reporting failures stay isolated from the interaction and are not retried',async()=>{
 let sends=0;
 const logger=createClientLogger({context:()=>({path:'/owner',occurredAt:event.occurredAt}),redact:()=>event,sample:()=>true,transport:{async send(){sends++;throw new Error('synthetic-transport-rejection');}}});
 assert.doesNotThrow(()=>logger.report(event));await new Promise(resolve=>setImmediate(resolve));assert.equal(sends,1);
});

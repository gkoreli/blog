import assert from 'node:assert/strict';
import test from 'node:test';
import {handleClientError} from '../../client-observability/src/server.ts';

const origin='https://fixture.invalid';
const event={type:'interaction_error',component:'subscribe_form',message:'admission_fixture',path:'/owner',occurredAt:'2026-10-30T00:00:00.000Z'};
function input(headers={},body=JSON.stringify(event)){
 return new Request(origin+'/api/client-error',{method:'POST',headers:{origin,'content-type':'application/json',...headers},body,duplex:'half'});
}
function harness(decision='allow'){
 let writes=0,checks=0;const keys=[];
 const env={DB:{prepare(){return{bind(){return{async run(){writes++;return{success:true,meta:{changes:1}}}}}}}},CLIENT_ERROR_RATE_LIMITER:{async limit({key}){checks++;keys.push(key);if(decision==='throw')throw new Error('private-limiter-detail');return{success:decision==='allow'}}}};
 if(decision==='missing')delete env.CLIENT_ERROR_RATE_LIMITER;
 return{env,keys,get writes(){return writes},get checks(){return checks}};
}
function unreadBody(){let pulls=0;return{get pulls(){return pulls},stream:new ReadableStream({pull(){pulls++;throw new Error('body-must-not-be-read')}},{highWaterMark:0})}}
async function assess(request,h,status){
 const response=await handleClientError(request,h.env);
 assert.equal(response.status,status);assert.equal(await response.text(),'');assert.equal(response.headers.get('cache-control'),'no-store');
 assert.equal(response.headers.has('access-control-allow-origin'),false);assert.equal(response.headers.has('retry-after'),false);
 return response;
}

test('only an exact same Origin is admitted; Referer, same-site and forged forwarding do not override it',async()=>{
 for(const value of ['', 'null','https://other.invalid','https://sub.fixture.invalid',origin+'/',origin+':443','https://fixture.invalid.evil.invalid',origin+' '+origin]){
  const body=unreadBody(),h=harness();
  await assess(input({origin:value,referer:origin+'/', 'sec-fetch-site':'same-origin','x-forwarded-host':'other.invalid'},body.stream),h,403);
  assert.equal(body.pulls,0);assert.equal(h.checks,0);assert.equal(h.writes,0);
 }
 const absent=input();absent.headers.delete('origin');const h=harness();await assess(absent,h,403);assert.equal(h.checks,0);
 // Origin is a browser isolation check, not authentication: a constructed caller can supply it.
 const accepted=harness();await assess(input(),accepted,204);assert.equal(accepted.writes,1);
});

test('JSON essence, not an application/json substring, gates the rate check and body reader',async()=>{
 for(const value of ['text/plain; application/json','application/jsonp','x-application/json','application/json, text/plain','text/plain','']){
  const body=unreadBody(),h=harness();await assess(input({'content-type':value},body.stream),h,415);
  assert.equal(body.pulls,0);assert.equal(h.checks,0);assert.equal(h.writes,0);
 }
 for(const value of ['application/json','Application/JSON; charset=utf-8']){const h=harness();await assess(input({'content-type':value}),h,204);assert.equal(h.checks,1);assert.equal(h.writes,1)}
});

test('limiter denial, missing binding and limiter failure do not read the body or acknowledge storage',async()=>{
 for(const [decision,status]of [['deny',429],['missing',503],['throw',503]]){
  const body=unreadBody(),h=harness(decision);await assess(input({},body.stream),h,status);
  assert.equal(body.pulls,0);assert.equal(h.checks,decision==='missing'?0:1);assert.equal(h.writes,0);
 }
});

test('one fixed route key ignores client identity claims and invalid JSON consumes admission but never stores',async()=>{
 const h=harness();
 await assess(input({'cf-connecting-ip':'192.0.2.1','user-agent':'private-one'}),h,204);
 await assess(input({'cf-connecting-ip':'2001:db8::1','user-agent':'private-two'}),h,204);
 await assess(input({},'{'),h,400);
 assert.deepEqual(h.keys,['client-error:v1','client-error:v1','client-error:v1']);assert.equal(h.writes,2);
 const large=harness();await assess(input({'content-length':'8193'}),large,413);assert.equal(large.checks,0);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import {handleClientError} from '../../client-observability/src/server.ts';

const limit=8192;
const event={type:'interaction_error',message:'body_limit_fixture',component:'subscribe_form',path:'/owner',occurredAt:'2026-10-30T00:00:00.000Z'};
const encoded=new TextEncoder();
function exactBytes(size,multibyte=false){
 const base=JSON.stringify({...event,padding:''});
 const extra=size-encoded.encode(base).byteLength;
 return encoded.encode(JSON.stringify({...event,padding:multibyte?'é'.repeat(Math.floor(extra/2))+' '.repeat(extra%2):' '.repeat(extra)}));
}
function input(body,headers={}){return new Request('https://fixture.invalid/api/client-error',{method:'POST',headers:{'content-type':'application/json',...headers},body,duplex:'half'});}
function database(){let writes=0;return{get writes(){return writes},env:{DB:{prepare(){return{bind(){return{async run(){writes++;return{success:true,meta:{changes:1}};}}}}}}}};}
async function assess(request,status){const db=database();const response=await handleClientError(request,db.env);assert.equal(response.status,status);assert.equal(db.writes,status===204?1:0);assert.equal(response.headers.get('cache-control'),'no-store');assert.equal(await response.text(),'');}

test('actual byte cap rejects absent, zero, understated and malformed length hints',async()=>{
 for(const headers of [{},{'content-length':'0'},{'content-length':'1'},{'content-length':'invalid'}])await assess(input(exactBytes(limit+1),headers),413);
});
test('inclusive byte boundary and streaming UTF-8 decoding preserve valid payloads',async()=>{
 await assess(input(exactBytes(limit)),204);
 const bytes=exactBytes(limit,true);assert.equal(bytes.byteLength,limit);
 let at=0;const stream=new ReadableStream({pull(controller){if(at===bytes.length){controller.close();return}controller.enqueue(bytes.slice(at,++at));}},{highWaterMark:0});
 await assess(input(stream),204);
 await assess(input(exactBytes(limit+1,true)),413);
});
test('overflow cancels an unfinished stream without draining or awaiting cancellation',async()=>{
 let pulls=0,cancelled=0;
 const stream=new ReadableStream({pull(controller){pulls++;controller.enqueue(new Uint8Array(limit+1));},cancel(){cancelled++;return new Promise(()=>{});}},{highWaterMark:0});
 await assess(input(stream),413);assert.equal(pulls,1);assert.equal(cancelled,1);
});
test('read failures, consumed bodies and invalid JSON never write a diagnostic',async()=>{
 const stream=new ReadableStream({start(controller){controller.error(new Error('synthetic-reader-failure'));}});
 await assess(input(stream),400);await assess(input('{'),400);
 const consumed=input(JSON.stringify(event));await consumed.text();await assess(consumed,400);
 await assess(new Request('https://fixture.invalid/api/client-error',{method:'POST',headers:{'content-type':'application/json'}}),400);
});

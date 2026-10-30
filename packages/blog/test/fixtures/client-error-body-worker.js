import {handleClientError} from './src/server.ts';
const limit=8192,encoder=new TextEncoder();
const event={type:'interaction_error',message:'body_limit_fixture',component:'subscribe_form',path:'/owner',occurredAt:'2026-10-30T00:00:00.000Z'};
function bytes(size,unicode){const extra=size-encoder.encode(JSON.stringify({...event,padding:''})).byteLength;return encoder.encode(JSON.stringify({...event,padding:unicode?'é'.repeat(Math.floor(extra/2))+' '.repeat(extra%2):' '.repeat(extra)}));}
export default{async fetch(request,env){
 const mode=new URL(request.url).pathname.slice(1);let pulls=0,cancels=0;
 const headers={'content-type':'application/json'};
 if(mode==='zero-hint')headers['content-length']='0';
 if(mode==='short-hint')headers['content-length']='1';
 if(mode==='malformed-hint')headers['content-length']='invalid';
 const size=mode==='ordinary'?1024:mode==='drain-control'?16384:mode==='boundary'||mode==='unicode-boundary'?limit:limit+1;
 const body=mode==='invalid-json'?encoder.encode('{'):bytes(size,mode.startsWith('unicode'));
 let at=0;const step=mode==='unicode-boundary'?1:mode==='drain-control'?8193:4096;
 const stream=new ReadableStream({pull(controller){pulls++;if(mode==='read-error'){controller.error(new Error('synthetic-reader-failure'));return}if(at===body.length){controller.close();return}controller.enqueue(body.slice(at,at+step));at=Math.min(at+step,body.length);},cancel(){cancels++;}},{highWaterMark:0});
 const before=await env.DB.prepare('SELECT COUNT(*) AS n FROM client_errors').first();
 let runCalls=0;const DB={prepare(sql){const statement=env.DB.prepare(sql);return{bind(...values){const bound=statement.bind(...values);return{async run(){runCalls++;return bound.run();}}}}}};
 const response=await handleClientError(new Request('https://fixture.invalid/api/client-error',{method:'POST',headers,body:stream}),{DB});
 const after=await env.DB.prepare('SELECT COUNT(*) AS n FROM client_errors').first();
 return Response.json({mode,status:response.status,bodyBytes:body.length,insertedRows:after.n-before.n,runCalls,pulls,cancels,emptyResponse:(await response.text())==='',noStore:response.headers.get('cache-control')==='no-store'});
}};

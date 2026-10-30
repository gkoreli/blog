import {handleClientError} from './src/server.ts';
const encoder=new TextEncoder();
const event={type:'interaction_error',message:'admission_fixture',component:'subscribe_form',path:'/owner',occurredAt:'2026-10-30T00:00:00.000Z'};
export default{async fetch(request,env){
 const mode=new URL(request.url).pathname.slice(1),origin='https://fixture.invalid';
 const headers={origin,'content-type':'application/json'};
 if(mode==='foreign')headers.origin='https://other.invalid';
 if(mode==='missing')delete headers.origin;
 if(mode==='null')headers.origin='null';
 if(mode==='subdomain')headers.origin='https://sub.fixture.invalid';
 if(mode==='referrer-spoof'){headers.origin='https://other.invalid';headers.referer=origin+'/';headers['sec-fetch-site']='same-origin';}
 if(mode==='mime-parameter')headers['content-type']='text/plain; application/json';
 if(mode==='mime-suffix')headers['content-type']='application/jsonp';
 if(mode==='mime-list')headers['content-type']='application/json, text/plain';
 if(mode==='charset')headers['content-type']='Application/JSON; charset=utf-8';
 if(mode==='oversize')headers['content-length']='8193';
 const bytes=encoder.encode(mode==='invalid-json'?'{':JSON.stringify(event));
 let pulls=0,checks=0,writes=0,at=0;const keys=[];
 const stream=new ReadableStream({pull(controller){pulls++;if(at===bytes.length){controller.close();return}controller.enqueue(bytes);at=bytes.length;}},{highWaterMark:0});
 const DB={prepare(sql){const statement=env.DB.prepare(sql);return{bind(...values){const bound=statement.bind(...values);return{async run(){writes++;return bound.run();}}}}}};
 const native=mode.startsWith('budget-')?env.BUDGET_CONTROL:env.CLIENT_ERROR_RATE_LIMITER;
 const limiter=mode==='limiter-missing'?undefined:{async limit({key}){checks++;keys.push(key);if(mode==='limiter-throw')throw new Error('fixture-limiter-failure');if(mode==='limiter-denied')return{success:false};return native.limit({key});}};
 const before=await env.DB.prepare('SELECT COUNT(*) AS n FROM client_errors').first();
 const response=await handleClientError(new Request(origin+'/api/client-error',{method:'POST',headers,body:stream}),{DB,CLIENT_ERROR_RATE_LIMITER:limiter});
 const after=await env.DB.prepare('SELECT COUNT(*) AS n FROM client_errors').first();
 return Response.json({mode,status:response.status,insertedRows:after.n-before.n,writes,checks,keys,pulls,emptyBody:(await response.text())==='',noStore:response.headers.get('cache-control')==='no-store',corsGranted:response.headers.has('access-control-allow-origin'),retryAfter:response.headers.get('retry-after')});
}};

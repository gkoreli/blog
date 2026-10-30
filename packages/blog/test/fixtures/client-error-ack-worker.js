import {handleClientError} from './src/server.ts';
import {FetchTransport,BeaconTransport,NoopTransport} from './src/transport.ts';

const event={type:'interaction_error',component:'subscribe_form',message:'ack_fixture',path:'/owner',occurredAt:'2026-10-29T12:00:00.000Z'};
const input=()=>new Request('https://fixture.invalid/api/client-error',{method:'POST',headers:{'origin':'https://fixture.invalid','content-type':'application/json'},body:JSON.stringify(event)});

export default {
 async fetch(request,env){
  const url=new URL(request.url),mode=url.pathname.split('/').at(-1);
  if(url.pathname.startsWith('/write/')){
   const before=await env.DB.prepare('SELECT COUNT(*) AS n FROM client_errors').first();
   let release,started,runTask,responseSettled=false,runCalls=0;
   const gate=new Promise(resolve=>{release=resolve});
   const writeStarted=new Promise(resolve=>{started=resolve});
   const background=[];
   const DB={prepare(sql){const statement=env.DB.prepare(mode==='native-rejection'?sql.replace('client_errors','missing_fixture_table'):sql);return{bind(...values){const bound=statement.bind(...values);return{run(){
    runCalls++;
    runTask=(async()=>{
     started();
     if(mode==='delayed')await gate;
     if(mode==='negative-ack')return{success:false,meta:{changes:0}};
     if(mode==='zero-changes')return env.DB.prepare('SELECT 1 AS value').run();
     if(mode==='unexpected-count')return{success:true,meta:{changes:2}};
     const result=await bound.run();
     if(mode==='write-then-error')throw new Error('synthetic-ack-lost-after-commit');
     return result;
    })();return runTask;
   }}}}}};
   const responseTask=handleClientError(input(),{DB,CLIENT_ERROR_RATE_LIMITER:env.CLIENT_ERROR_RATE_LIMITER},{waitUntil(promise){background.push(promise)}}).then(response=>{responseSettled=true;return response});
   await writeStarted;
   let returnedBeforeWriteConfirmation=null;
   if(mode==='delayed'){
    await new Promise(resolve=>setTimeout(resolve,0));
    returnedBeforeWriteConfirmation=responseSettled;
    release();
   }
   const response=await responseTask;
   if(runTask)await runTask.catch(()=>{});
   await Promise.all(background);
   const after=await env.DB.prepare('SELECT COUNT(*) AS n FROM client_errors').first();
   return Response.json({mode,status:response.status,bodyEmpty:(await response.text())==='',runCalls,backgroundCalls:background.length,insertedRows:after.n-before.n,returnedBeforeWriteConfirmation});
  }
  if(url.pathname.startsWith('/transport/')){
   const previousFetch=globalThis.fetch;
   const previousNavigator=Object.getOwnPropertyDescriptor(globalThis,'navigator');
   let fetchCalls=0,beaconCalls=0,redirectPolicy=null;
   try{
    globalThis.fetch=async(_request,init)=>{
     fetchCalls++;redirectPolicy=init.redirect??null;
     if(mode==='network')throw new Error('synthetic-network-error');
     const status=mode==='beacon-rejected'?503:mode==='beacon-fallback'?204:Number(mode);
     return new Response([204,205,304].includes(status)?null:'private-response-text',{status});
    };
    Object.defineProperty(globalThis,'navigator',{configurable:true,value:{sendBeacon(){beaconCalls++;return mode==='beacon-queued'}}});
    const transport=mode==='noop'?new NoopTransport():mode.startsWith('beacon-')?new BeaconTransport():new FetchTransport();
    let outcome,receiptState;
    try{const receipt=await transport.send(event);outcome='resolved';receiptState=receipt?.state??'not-exposed'}catch{outcome='rejected';receiptState='unconfirmed'}
    return Response.json({mode,outcome,receiptState,fetchCalls,beaconCalls,redirectPolicy});
   }finally{
    globalThis.fetch=previousFetch;
    if(previousNavigator)Object.defineProperty(globalThis,'navigator',previousNavigator);else delete globalThis.navigator;
   }
  }
  return new Response(null,{status:404});
 }
};

import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';

const [output, fixturePath] = process.argv.slice(2); assert.ok(output && fixturePath);
const fixture = JSON.parse(readFileSync(fixturePath, 'utf8'));
const require = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] })));
const main = await build({ stdin: { resolveDir: process.cwd(), contents: `
  import {verifyWebBotAuth,createWebBotAuthCache} from './packages/analytics/src/webbotauth.ts';
  const fixture=${JSON.stringify(fixture)};
  let cache=createWebBotAuthCache(),lookups=0,active=0;
  export default {async fetch(request,env){
    const u=new URL(request.url);
    if(u.pathname==='/reset'){cache=createWebBotAuthCache();lookups=0;return Response.json({reset:true});}
    if(u.pathname==='/state')return Response.json({lookups,active,pending:cache.pendingDirectories.size,keys:cache.keys.size});
    active++;
    const controller=new AbortController(),ms=Number(u.searchParams.get('deadline')??1000);
    let timer;
    const task=verifyWebBotAuth(new Request(fixture.requests[0].url,{headers:fixture.requests[0].headers}),{
      cache,now:new Date(fixture.now),signal:controller.signal,fetcher:async(url,init)=>{
        if(String(url)!==fixture.url)throw Error('Unexpected origin');
        lookups++;return env.DIRECTORY.fetch('https://directory.invalid/key',{...init,signal:controller.signal});
      }
    });
    try{
      const result=await Promise.race([task,new Promise(resolve=>{timer=setTimeout(()=>{controller.abort();resolve({status:'unverified',reason:'fixture-deadline'});},ms);})]);
      return Response.json({status:result.status,reason:result.status==='unverified'?result.reason:null});
    }finally{clearTimeout(timer);controller.abort();active--;}
  }};
` }, bundle: true, write: false, format: 'esm', platform: 'browser', logLevel: 'silent' });
const directory = `const key=${JSON.stringify(fixture.keys[0].jwk)}; let starts=0;
export default {async fetch(request){
  const u=new URL(request.url);if(u.pathname==='/state')return Response.json({starts});
  if(u.pathname==='/reset'){starts=0;return Response.json({reset:true});}
  starts++;await new Promise(resolve=>setTimeout(resolve,250));
  return Response.json({keys:[key]},{headers:{'Content-Type':'application/http-message-signatures-directory+json','Cache-Control':'max-age=300'}});
}};`;
const mf = new Miniflare({ workers: [
  { name: 'main', modules: true, script: main.outputFiles[0].text, compatibilityDate: '2026-03-06', cf: {}, serviceBindings: { DIRECTORY: 'directory' } },
  { name: 'directory', modules: true, script: directory, compatibilityDate: '2026-03-06', cf: {} },
] });
const response = async promise => { const r=await promise; const text=await r.text(); return {httpStatus:r.status,...(r.status===200?JSON.parse(text):{runtimeBodySha256:createHash('sha256').update(text).digest('hex')})}; };
try {
  const mainWorker=await mf.getWorker('main'),dir=await mf.getWorker('directory');
  const rows=[];
  for(const condition of ['cross-request-shared-success','owner-deadline','newer-waiter-deadline','owner-deadline-five-waiters']){
    await mainWorker.fetch('https://control.invalid/reset');await dir.fetch('https://control.invalid/reset');
    const ownerExpires=condition.startsWith('owner-deadline');
    const first=response(mainWorker.fetch('https://control.invalid/verify?deadline='+(ownerExpires?100:1000)));
    // A control response proves the first physical lookup actually started.
    let observed=false;
    for(let attempt=0;attempt<20;attempt++){
      const state=await(await mainWorker.fetch('https://control.invalid/state')).json();
      if(state.pending===1){observed=true;break;}
      await new Promise(resolve=>setTimeout(resolve,2));
    }
    assert.equal(observed,true,'Initial lookup live before starting the second request');
    const waiters=Array.from({length:condition==='owner-deadline-five-waiters'?5:1},()=>response(mainWorker.fetch('https://control.invalid/verify?deadline='+(condition==='newer-waiter-deadline'?100:1000))));
    const results=await Promise.all([first,...waiters]);
    // Let the actual service subrequest settle; this is not a synthetic cleanup result.
    await new Promise(resolve=>setTimeout(resolve,300));
    const state=await(await mainWorker.fetch('https://control.invalid/state')).json();
    const recovery=await response(mainWorker.fetch('https://control.invalid/verify?deadline=1000'));
    const finalState=await(await mainWorker.fetch('https://control.invalid/state')).json();
    assert.equal(results[0].status,ownerExpires?'unverified':'verified',condition);
    assert.equal(results[0].reason,ownerExpires?'fixture-deadline':null,condition);
    for(const result of results.slice(1))assert.equal(result.status,condition==='newer-waiter-deadline'?'unverified':'verified',condition);
    assert.equal(state.lookups,ownerExpires?2:1,condition);
    assert.equal(state.active,0);assert.equal(state.pending,0);assert.equal(recovery.status,'verified');
    assert.deepEqual(finalState,state);
    rows.push({condition,results,state,recovery,finalState});
  }
  writeFileSync(output,JSON.stringify({checkedAt:new Date().toISOString(),method:'Actual separate Worker requests and local service-binding fetches with 100/1000ms caller deadlines and 250ms directory delay; not production timing or managed bot service.',rows,
    inputSha256:createHash('sha256').update(readFileSync(fixturePath)).digest('hex'),sourceSha256:createHash('sha256').update(readFileSync('packages/analytics/src/webbotauth.ts')).digest('hex'),
    productionRequests:0,externalRequests:0,d1Statements:0},null,2)+'\n',{flag:'wx',mode:0o600});
  console.log(JSON.stringify(rows));
}finally{await mf.dispose();}

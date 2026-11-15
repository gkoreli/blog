import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSearchIndex } from '../dist/index.js';
import { prepareArticle } from '../dist/html.js';
import { createHttpSearch } from '../dist/http.js';
import { manageEncoder } from '../dist/resources.js';

const document = text => prepareArticle({ id:'notes',url:'/notes',title:'Search notes',html:`<p>${text}</p>` }).article;
const encoder = {space:'fixture-v1',dimensions:2,async encode(){return [Float32Array.of(1,0)];}};
const deferred = () => {let resolve; const promise=new Promise(r=>{resolve=r;});return {promise,resolve};};

async function fixture() {
  const first=await buildSearchIndex([document('Alpha old source.')],{encoder});
  const second=await buildSearchIndex([document('Beta replacement source.')],{encoder});
  let version=1,retireIndex=false,retireVectors=false,offline=false;const calls=[];
  const request=async url=>{
    const path=new URL(url).pathname;calls.push(path);
    if(path==='/manifest') {
      if(offline) throw Error('Offline');
      return Response.json({format:1,index:`/v${version}/index`,vectors:`/v${version}/vectors`,space:encoder.space,model:{revision:'fixed'}});
    }
    if(retireIndex&&path==='/v1/index'||retireVectors&&path==='/v1/vectors'){version=2;return new Response(null,{status:410});}
    const bundle=path.startsWith('/v1/')?first:second;
    return path.endsWith('/index')?new Response(bundle.index):new Response(bundle.vectors);
  };
  return {calls,request,retireIndex(){retireIndex=true;},retireVectors(){retireVectors=true;},offline(){offline=true;},update(){version=2;}};
}

test('HTTP session coalesces corpus loading and both reader modes share the corpus/model lifetime',async()=>{
  const f=await fixture();let created=0,closed=0;
  const session=createHttpSearch({manifestUrl:'https://blog.test/manifest',fetch:f.request,createEncoder:async()=>{created++;return manageEncoder(encoder,async()=>{closed++;});}});
  await Promise.all([session.search('Alpha'),session.search('Alpha')]);
  assert.deepEqual(f.calls,['/manifest','/v1/index']);assert.equal(created,0);
  await session.search('Alpha',{mode:'related'});await session.search('source',{mode:'related'});
  assert.equal(created,1);assert.equal(f.calls.filter(p=>p==='/v1/index').length,1);assert.equal(f.calls.filter(p=>p==='/v1/vectors').length,1);
  await Promise.all([session.close(),session.close()]);assert.equal(closed,1);
  await assert.rejects(session.search('Alpha'),/closed/);
});

test('retired index and vectors retry once against a fresh coherent manifest',async()=>{
  for(const kind of ['retireIndex','retireVectors']){
    const f=await fixture();f[kind]();let created=0;
    const session=createHttpSearch({manifestUrl:'https://blog.test/manifest',fetch:f.request,createEncoder:async()=>{created++;return manageEncoder(encoder,async()=>{});}});
    const result=await session.search('Beta',{mode:kind==='retireVectors'?'related':'words'});
    assert.equal(result.articles[0].passages[0].passage.text,'Beta replacement source.');
    assert.equal(f.calls.filter(p=>p==='/manifest').length,2);assert.equal(created,kind==='retireVectors'?1:0);await session.close();
  }
});

test('refresh switches corpus while preserving a compatible loaded model; offline refresh keeps words usable',async()=>{
  const f=await fixture();let created=0;
  const session=createHttpSearch({manifestUrl:'https://blog.test/manifest',refreshAfterMs:0,fetch:f.request,createEncoder:async()=>{created++;return manageEncoder(encoder,async()=>{});}});
  await session.search('Alpha',{mode:'related'});f.update();
  const result=await session.search('Beta',{mode:'related'});assert.match(result.articles[0].passages[0].passage.text,/Beta/);assert.equal(created,1);
  f.offline();assert.equal((await session.search('Beta')).articles.length,1);await session.close();
});

test('failed model initialization can retry and close waits for an accepted search',async()=>{
  const f=await fixture(),gate=deferred(),entered=deferred();let attempts=0,closed=0;
  const session=createHttpSearch({manifestUrl:'https://blog.test/manifest',fetch:f.request,createEncoder:async()=>{
    if(++attempts===1)throw Error('First load failed');
    return manageEncoder({...encoder,async encode(){entered.resolve();await gate.promise;return [Float32Array.of(1,0)];}},async()=>{closed++;});
  }});
  await assert.rejects(session.search('Alpha',{mode:'related'}),/First load failed/);
  const search=session.search('Alpha',{mode:'related'});await entered.promise;
  let finished=false;const closing=session.close().then(()=>{finished=true;});await Promise.resolve();assert.equal(finished,false);
  await assert.rejects(session.search('Alpha'),/closed/);gate.resolve();await search;await closing;assert.equal(closed,1);
});

test('malformed/cross-origin manifests and persistent retired assets fail without retry loops',async()=>{
  let calls=0;
  const bad=createHttpSearch({manifestUrl:'https://blog.test/manifest',fetch:async()=>Response.json({format:1,index:'https://other.test/index',vectors:'/vectors',space:'x',model:{}})});
  await assert.rejects(bad.search('word'),/manifest origin/);await bad.close();
  const retired=createHttpSearch({manifestUrl:'https://blog.test/manifest',fetch:async url=>{calls++;return url.endsWith('/manifest')?Response.json({format:1,index:'/index',vectors:'/vectors',space:'x',model:{}}):new Response(null,{status:404});}});
  await assert.rejects(retired.search('word'),/corpus changed/);assert.equal(calls,4);await retired.close();
});

test('owned encoder serializes calls and releases once even when inference rejects',async()=>{
  let concurrent=0,maximum=0,released=0;
  const model=manageEncoder({...encoder,async encode(text){concurrent++;maximum=Math.max(maximum,concurrent);await Promise.resolve();concurrent--;if(text==='fail')throw Error('Inference');return [Float32Array.of(1,0)];}},async()=>{released++;});
  const first=model.encode('fail','query'),second=model.encode('next','query');
  await assert.rejects(first,/Inference/);await second;await model.close();await model.close();assert.equal(maximum,1);assert.equal(released,1);await assert.rejects(model.encode('later','query'),/closed/);
});

test('a changed model configuration retires the old owned model after its last search',async()=>{
 const f=await fixture();let revision=1,created=0,closed=0;
 const session=createHttpSearch({manifestUrl:'https://blog.test/manifest',refreshAfterMs:0,fetch:async(url,init)=>{
  const response=await f.request(url,init);if(!url.endsWith('/manifest'))return response;
  return Response.json({...await response.json(),model:{revision}});
 },createEncoder:async()=>{created++;return manageEncoder(encoder,async()=>{closed++;});}});
 await session.search('Alpha',{mode:'related'});revision=2;
 await session.search('Alpha',{mode:'related'});assert.equal(created,2);assert.equal(closed,1);
 await session.close();assert.equal(closed,2);
});

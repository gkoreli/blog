import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSearchIndex, createSearch } from '../dist/index.js';
import { prepareArticle } from '../dist/html.js';

const article = (id,title,html,section='engineering') => prepareArticle({id,title,url:'/'+id,section,html}).article;
const documents = [
  article('orbit','Space machinery','<h1>Space machinery</h1><h2>Orbit</h2><p>The orbital transfer changes the spacecraft trajectory.</p><p>A different operational detail.</p>'),
  article('ocean','Water notes','<h1>Water notes</h1><p>The ocean tide rises and falls.</p>','essays'),
  article('cafe','A café notebook','<h1>A café notebook</h1><p>A quiet café serves coffee.</p>','essays'),
];

test('portable build/open returns distinct articles and actual source passage links',async()=>{
  const bundle=await buildSearchIndex(documents),search=await createSearch(bundle.index);
  const result=await search.search('orbital transfer');
  assert.equal(search.articleCount,3);assert.equal(result.articles[0].article.id,'orbit');
  const hit=result.articles[0].passages[0];assert(hit.passage.text.includes('spacecraft'));assert.equal(hit.url,'/orbit#'+hit.passage.anchor);
  assert(hit.preview.matches.length>0);assert.equal(new Set(result.articles.map(row=>row.article.id)).size,result.articles.length);
  assert.equal(hit.context[1].text,'A different operational detail.');
});

test('corpus order is deterministic and cached index corruption fails before search',async()=>{
  const first=await buildSearchIndex(documents),second=await buildSearchIndex([...documents].reverse());
  assert.equal(first.index,second.index);
  const data=JSON.parse(first.index);data.articles[0].title='Tampered';
  await assert.rejects(createSearch(JSON.stringify(data)),/integrity/);
});

test('quoted phrases, article scopes, section filters, accents and bounded queries retain their meaning',async()=>{
  const search=await createSearch((await buildSearchIndex(documents)).index);
  assert.equal((await search.search('"orbital transfer"')).articles[0].article.id,'orbit');
  assert.equal((await search.search('"transfer orbital"')).articles.length,0);
  assert.equal((await search.search('cafe')).articles[0].article.id,'cafe');
  assert.equal((await search.search('orbital',{section:'essays'})).articles.length,0);
  assert.deepEqual((await search.search('orbital',{article:'orbit'})).articles.map(x=>x.article.id),['orbit']);
  assert.deepEqual((await search.search('ocean',{article:'orbit'})).articles,[]);
  await assert.rejects(search.search('x'.repeat(513)),/shorten/);
  await assert.rejects(search.search('orbit',{limit:0}),/limit/);
  assert.equal((await search.search('')).articles.length,0);
});

test('prefix recovery finds an unfinished name and cannot reorder an existing exact result',async()=>{
  const search=await createSearch((await buildSearchIndex(documents)).index);
  assert.equal((await search.search('orbit')).articles[0].article.id,'orbit');
  assert.equal((await search.search('orbi')).articles[0].article.id,'orbit');
  assert.equal((await search.search('orbital')).articles[0].article.id,'orbit');
});

const encoder = {
  space:'fixture-space-v1',dimensions:2,
  async encode(text,purpose){return [Float32Array.from(purpose==='query' || text.includes('spacecraft') ? [1,0] : [0,1])];},
};

test('compatible semantic data stays lazy for word searches and supports nonliteral queries',async()=>{
  const bundle=await buildSearchIndex(documents,{encoder});let loads=0;
  const search=await createSearch(bundle.index,{encoder,loadVectors:async()=>{loads++;return bundle.vectors;}});
  await search.search('ocean');assert.equal(loads,0);
  const result=await search.search('celestial maneuver',{mode:'related'});
  assert.equal(result.articles[0].article.id,'orbit');assert(result.missingWords.includes('celestial'));assert.equal(loads,1);
  await search.search('another idea',{mode:'related'});assert.equal(loads,1);
});

test('equal dimensions do not authorize a different embedding space',async()=>{
  const bundle=await buildSearchIndex(documents,{encoder});let loads=0;
  const search=await createSearch(bundle.index,{encoder:{...encoder,space:'different-space'},loadVectors:async()=>{loads++;return bundle.vectors;}});
  await assert.rejects(search.search('orbital',{mode:'related'}),/same embedding space/);assert.equal(loads,0);
});

test('vector corruption, zero vectors and interrupted work fail explicitly',async()=>{
  const bundle=await buildSearchIndex(documents,{encoder});const changed=new Uint8Array(bundle.vectors);changed[0]^=1;
  const search=await createSearch(bundle.index,{encoder,loadVectors:async()=>changed});
  await assert.rejects(search.search('orbital',{mode:'related'}),/do not belong/);
  await assert.rejects(buildSearchIndex(documents,{encoder:{...encoder,encode:async()=>[new Float32Array(2)]}}),/zero length/);
  const abort=new AbortController();abort.abort();
  await assert.rejects(search.search('orbital',{signal:abort.signal}),error=>error.name==='AbortError');
});

test('long source passages keep the matching text in their preview',async()=>{
  const doc=article('long','Long text','<p>'+('Background detail. '.repeat(80))+'needleword is the particular topic.</p>');
  const search=await createSearch((await buildSearchIndex([doc])).index);const result=await search.search('needleword');
  assert(result.articles[0].passages[0].preview.text.includes('needleword'));assert(result.articles[0].passages[0].preview.start>0);
});

test('an article scope cannot fabricate a hit for a query with no matching unit',async()=>{
 const bundle=await buildSearchIndex(documents),engine=await createSearch(bundle.index);
 assert.deepEqual((await engine.search('zqwxvnosuchword',{article:'orbit'})).articles,[]);
});

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

test('bounded prefix recovery finds unfinished names and retains single-term exact lookup',async()=>{
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

test('source passages cannot be mutated through result/context references',async()=>{
 const engine=await createSearch((await buildSearchIndex(documents)).index),result=await engine.search('orbital');
 const hit=result.articles[0].passages[0];
 assert.throws(()=>{hit.passage.text='Replaced';},TypeError);
 assert.throws(()=>{hit.context[0].headings.push('Injected');},TypeError);
 assert.match((await engine.search('orbital')).articles[0].passages[0].passage.text,/spacecraft/);
});

test('more passages preserves the initial ranking and reports the matching source count',async()=>{
 const doc=article('many','Examples','<h2>Notes</h2>'+Array.from({length:12},(_,i)=>`<p>Needle detail ${i}.</p>`).join(''));
 const engine=await createSearch((await buildSearchIndex([doc])).index);
 const first=(await engine.search('needle')).articles[0],more=(await engine.search('needle',{article:'many',passagesPerArticle:8})).articles[0];
 assert.equal(first.passages.length,3);assert.equal(first.totalPassages,12);assert.equal(more.passages.length,8);
 assert.deepEqual(more.passages.slice(0,3),first.passages);
});

test('paragraph selection uses body/heading evidence rather than repeated article-title words',async()=>{
 const doc=article('details','Orbital machinery','<p>Brief introduction.</p><p>The pump regulates fuel pressure during transfer.</p><p>Closing remarks.</p>');
 const engine=await createSearch((await buildSearchIndex([doc])).index);
 const result=await engine.search('orbital fuel pressure');assert.equal(result.articles[0].passages.length,1);assert.match(result.articles[0].passages[0].passage.text,/pump/);
 const titleOnly=await engine.search('machinery');assert.equal(titleOnly.articles.length,1);assert.equal(titleOnly.articles[0].passages.length,0);
});

test('recovery with more matched query terms can beat an unrelated partial exact match',async()=>{
 const docs=[article('weak','Needle','<p>Needle alone.</p>'),article('wanted','Other topic','<p>Needle spacecraft navigation.</p>')];
 const engine=await createSearch((await buildSearchIndex(docs)).index);
 assert.equal((await engine.search('needle spacecraf')).articles[0].article.id,'wanted');
});

const numberedDocuments = [
  article('wanted-issue', 'Growing seedlings in spring', '<p>Plant the seedlings in spring.</p><p>Water the roots after transplanting.</p>'),
  article('other-issue', 'Field Notes #07: Soil', '<p>Field measurements show 8 samples.</p><p>Seedlings need water after transplanting.</p>', 'essays'),
];
const numberedCollections = [{
  title: 'Field Notes', aliases: ['Field', 'field-notes'],
  issues: [{ number: 8, articleId: 'wanted-issue' }, { number: 7, articleId: 'other-issue' }],
}];

test('declared issue references survive a title change and respect filters without a model', async () => {
  const search = await createSearch((await buildSearchIndex(numberedDocuments, { numberedCollections })).index);
  for (const [query, mode] of [['field 8', 'words'], ['Field Notes 08', 'words'], ['FIELD#008', 'related'], ['field-notes #8', 'words']]) {
    const result = await search.search(query, { mode });
    assert.deepEqual(result.reference, { title: 'Field Notes', number: '8', outcome: 'found', passageQuery: false });
    assert.deepEqual(result.articles.map(match => [match.article.id, match.passages.length]), [['wanted-issue', 0]]);
    assert.deepEqual(result.missingWords, []);
  }
  for (const scope of [{ section: 'essays' }, { article: 'other-issue' }]) {
    const result = await search.search('field 8', scope);
    assert.equal(result.reference.outcome, 'outside-scope');
    assert.deepEqual(result.articles, []);
  }
  const absent = await search.search('Field Notes 6', { mode: 'related' });
  assert.equal(absent.reference.outcome, 'missing');
  assert.deepEqual(absent.articles, []);
  assert.equal((await search.search('8 samples')).articles[0].passages[0].passage.text, 'Field measurements show 8 samples.');
  assert.equal((await search.search('field 8.0')).reference, undefined);
  assert.equal((await search.search('"Field Notes 8"')).reference, undefined);
});

test('issue plus detail searches within the issue and keeps the article when no passage matches', async () => {
  const bundle = await buildSearchIndex(numberedDocuments, { numberedCollections, encoder });
  const search = await createSearch(bundle.index, { encoder, loadVectors: async () => bundle.vectors });
  for (const mode of ['words', 'related']) {
    const query = 'Field Notes #08: "after transplanting"';
    const result = await search.search(query, { mode });
    assert.equal(result.query, query);
    assert.equal(result.reference.passageQuery, true);
    assert.deepEqual(result.articles.map(match => match.article.id), ['wanted-issue']);
    assert.deepEqual(result.articles[0].passages.map(p => p.passage.text), ['Water the roots after transplanting.']);
    assert.match(result.articles[0].passages[0].url, /^\/wanted-issue#/);
  }
  const absent = await search.search('Field Notes 08 "8 samples"');
  assert.equal(absent.reference.outcome, 'found');
  assert.equal(absent.articles[0].article.id, 'wanted-issue');
  assert.equal(absent.articles[0].passages.length, 0);
});

test('catalogue rejects conflicting identities and legacy snapshots still search by topic', async () => {
  const [collection] = numberedCollections;
  const build = collections => buildSearchIndex(numberedDocuments, { numberedCollections: collections });
  await assert.rejects(build([collection, { title: 'Field Reports', aliases: [' FIELD '], issues: [] }]), /Duplicate numbered collection name/);
  await assert.rejects(build([{ ...collection, issues: [...collection.issues, { number: 8, articleId: 'other-issue' }] }]), /Duplicate issue number/);
  await assert.rejects(build([{ ...collection, issues: [{ number: 1, articleId: 'unknown' }] }]), /Invalid issue/);
  const legacy = await createSearch((await buildSearchIndex(numberedDocuments)).index);
  const result = await legacy.search('Field Notes 7');
  assert.equal(result.reference, undefined);
  assert.equal(result.articles[0].article.id, 'other-issue');
});

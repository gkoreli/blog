import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

if (process.argv.length !== 4) throw new Error('Usage: node prepare-cases.mjs /original-source-corpus /fresh-public-cases');
const [corpusFile, output] = process.argv.slice(2).map(value => resolve(value));
const corpus = JSON.parse(readFileSync(corpusFile, 'utf8'));
const input = JSON.parse(readFileSync(new URL('./topics.json', import.meta.url), 'utf8'));
const sha = text => createHash('sha256').update(text).digest('hex');
const development = new Set([...input.topics].sort((a,b)=>sha('search-package-20261114:'+a.article).localeCompare(sha('search-package-20261114:'+b.article))).slice(0,10).map(row=>row.article));
const cases = [];
for (const topic of input.topics) {
  const article = corpus.articles.find(row=>row.slug===topic.article); assert(article, topic.article);
  const knownBlocks = topic.blocks.map(id=>topic.article+'/'+id);
  for(const id of knownBlocks) assert(article.blocks.some(block=>block.id===id && !/^h[1-6]$/.test(block.kind)), id);
  assert.equal(topic.queries.length,3);
  for(const [i,form] of ['topic','recollection','typo'].entries()) cases.push({id:topic.id+'-'+form,article:topic.article,form,query:topic.queries[i],knownBlocks,split:development.has(topic.article)?'development':'validation'});
}
for(const [i,query] of input.noKnownAnswer.entries()) cases.push({id:'N'+String(i+1).padStart(2,'0'),article:null,form:'no-known-answer',query,knownBlocks:[],split:i<3?'development':'validation'});
writeFileSync(output,JSON.stringify({provenance:input.provenance,sourceCommit:corpus.sourceCommit,sourceCorpusSha256:sha(readFileSync(corpusFile)),split:'Ten development and five reserved article groups chosen by SHA256; three related forms stay together. Prior source/results knowledge is disclosed; this is not independent reader validation.',cases},null,2)+'\n',{flag:'wx'});
console.log({cases:cases.length,development:cases.filter(row=>row.split==='development').length,validation:cases.filter(row=>row.split==='validation').length});

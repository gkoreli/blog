import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import assert from 'node:assert/strict';
import { loadEncoder, modelConfig } from '../passage-search/model.mjs';
import { readVectors } from '../passage-search/retrieval.mjs';
import { reciprocalRankFusion } from '../passage-search/vendor/bm25.ts';
import { createReaderIndex } from '../reader-search/ranking.mjs';
import { lexicalQuery, miniOptions } from './lexical-query.mjs';
import { loadReranker, rerankerConfig } from './reranker.mjs';

if(process.argv.length!==6)throw new Error('Usage: node evaluate-reranking.mjs /local-config development-or-validation /cases /fresh-output');
const [configFile,split,caseFile,output]=process.argv.slice(2);assert(['development','validation'].includes(split));
const config=JSON.parse(readFileSync(resolve(configFile),'utf8')),sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const cases=JSON.parse(readFileSync(caseFile,'utf8')).cases.filter(row=>row.split===split);
writeFileSync(output+'.started.json',JSON.stringify({startedAt:new Date().toISOString(),split,cases:cases.length},null,2)+'\n',{flag:'wx'});
const req=createRequire(join(config.comparatorRuntime,'package.json'));const {default:MiniSearch}=await import(pathToFileURL(req.resolve('minisearch')));
const indexes={},minis={},units={};
for(const [kind,file,vectors]of [['passage',config.passageFile,config.passageVectors],['block',config.unitFile,config.unitVectors]]){const records=JSON.parse(readFileSync(file,'utf8')).passages;units[kind]=new Map(records.map(unit=>[unit.id,unit]));indexes[kind]=createReaderIndex(records,readVectors(readFileSync(vectors)));minis[kind]=new MiniSearch(miniOptions);minis[kind].addAll(records.map(unit=>({id:unit.id,title:unit.title,heading:unit.heading,text:unit.text})));}
const encoder=await loadEncoder(config.runtime,config.model);const reranker=await loadReranker(config.runtime,config.rerankerModel);const results=[];
function describe(query,lists){const blocks=new Map(indexes.block.group(lists.block,46).map(row=>[row.article,row]));const articles=indexes.passage.group(lists.passage).map(row=>({article:row.article,score:row.score,matches:(blocks.get(row.article)?.matches??[]).map(unit=>({id:unit.id,sourceBlocks:unit.sourceBlocks,score:unit.score}))}));const rank=articles.findIndex(row=>row.article===query.article),target=articles.find(row=>row.article===query.article);const knownBlock=!!target?.matches.some(unit=>unit.sourceBlocks.some(id=>query.knownBlocks.includes(id)));return{articles,topUnits:Object.fromEntries(Object.entries(lists).map(([kind,rows])=>[kind,rows.slice(0,10)])),rankingDigests:Object.fromEntries(Object.entries(lists).map(([kind,rows])=>[kind,sha(JSON.stringify(rows))])),knownArticleAt1:rank===0,knownArticleAt3:rank>=0&&rank<3,knownArticleRankThrough5:rank<0?null:rank+1,knownBlockShownInTargetArticle:knownBlock,knownArticleAt3AndKnownBlockShown:rank>=0&&rank<3&&knownBlock};}
try{for(const query of cases){const [vector]=await encoder.embed([modelConfig.queryPrefix+query.query]);const exactHybrid={},reranked={},pools={};const lexical=lexicalQuery(query.query);
  for(const kind of ['passage','block']){const dense=indexes[kind].rankings(query.query,vector).lists.semantic;const exact=minis[kind].search(lexical).map(({id,score})=>({id,score}));exactHybrid[kind]=reciprocalRankFusion([dense.map(row=>row.id),exact.map(row=>row.id)],60);
    const pool=[...new Set([...exact.slice(0,20),...dense.slice(0,20)].map(row=>row.id))];const before=performance.now();const scored=await reranker.rank(query.query,pool.map(id=>units[kind].get(id)));reranked[kind]=scored.rows;
    pools[kind]={ids:pool,rerankingMs:performance.now()-before,truncated:scored.truncated,knownBlockInPool:pool.some(id=>units[kind].get(id).sourceBlocks.some(block=>query.knownBlocks.includes(block))),knownArticleInPool:pool.some(id=>units[kind].get(id).article===query.article),knownBlockInLexicalPool:exact.slice(0,20).some(row=>units[kind].get(row.id).sourceBlocks.some(block=>query.knownBlocks.includes(block))),knownBlockInDensePool:dense.slice(0,20).some(row=>units[kind].get(row.id).sourceBlocks.some(block=>query.knownBlocks.includes(block)))};
  }
  results.push({id:query.id,article:query.article,form:query.form,knownBlocks:query.knownBlocks,conditions:{'e5-minisearch-exact-hybrid':describe(query,exactHybrid),'retrieve-rerank':{...describe(query,reranked),pools}}});console.log({completed:results.length,total:cases.length,id:query.id});
}writeFileSync(output,JSON.stringify({completedAt:new Date().toISOString(),split,model:modelConfig,reranker:rerankerConfig,caseSha256:sha(readFileSync(caseFile)),rerankerReceiptSha256:sha(readFileSync(join(config.rerankerModel,'receipt.json'))),results},null,2)+'\n',{flag:'wx'});}finally{await reranker.dispose();await encoder.dispose();}

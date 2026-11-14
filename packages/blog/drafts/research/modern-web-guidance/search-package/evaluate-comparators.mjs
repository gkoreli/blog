import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { Worker } from 'node:worker_threads';
import { once } from 'node:events';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import assert from 'node:assert/strict';
import { loadEncoder, modelConfig } from '../passage-search/model.mjs';
import { readVectors } from '../passage-search/retrieval.mjs';
import { reciprocalRankFusion } from '../passage-search/vendor/bm25.ts';
import { createReaderIndex } from '../reader-search/ranking.mjs';
import { lexicalQuery, miniOptions, tolerantOptions } from './lexical-query.mjs';

if(process.argv.length!==6)throw new Error('Usage: node evaluate-comparators.mjs /local-config development-or-validation /fresh-output /cases');
const [configFile,split,output,caseFile]=process.argv.slice(2);assert(['development','validation'].includes(split));
const config=JSON.parse(readFileSync(resolve(configFile),'utf8'));const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const cases=JSON.parse(readFileSync(resolve(caseFile),'utf8')).cases.filter(row=>row.split===split);
writeFileSync(resolve(output)+'.started.json',JSON.stringify({startedAt:new Date().toISOString(),split,cases:cases.length,caseFileSha256:sha(readFileSync(caseFile))},null,2)+'\n',{flag:'wx'});
const req=createRequire(join(resolve(config.comparatorRuntime),'package.json'));const {default:MiniSearch}=await import(pathToFileURL(req.resolve('minisearch')));
assert.equal(JSON.parse(readFileSync(join(config.comparatorRuntime,'node_modules/minisearch/package.json'))).version,'7.2.0');
const data={},indexes={},minis={},builds={};
for(const [kind,file,vectors] of [['passage',config.passageFile,config.passageVectors],['block',config.unitFile,config.unitVectors]]) {
  data[kind]=JSON.parse(readFileSync(file,'utf8')).passages;
  indexes[kind]=createReaderIndex(data[kind],readVectors(readFileSync(vectors)));
  const before=performance.now();minis[kind]=new MiniSearch(miniOptions);minis[kind].addAll(data[kind].map(unit=>({id:unit.id,title:unit.title,heading:unit.heading,text:unit.text})));
  builds[kind]={records:data[kind].length,buildMs:performance.now()-before,serializedBytes:Buffer.byteLength(JSON.stringify(minis[kind].toJSON()))};
}
const worker=new Worker(new URL('./pagefind-worker.mjs',import.meta.url),{workerData:{directory:config.pagefindDirectory}});
const [ready]=await once(worker,'message');assert(ready.ready);let serial=0;
async function pagefindSearch(queries) {const id=++serial;const promise=once(worker,'message');worker.postMessage({id,queries});const [result]=await promise;if(result.error)throw new Error(result.error);assert.equal(result.id,id);return result.output;}
const encoder=await loadEncoder(config.runtime,config.model);const results=[];
function describe(query, method, searchText, lists, timing) {
  const articles=indexes.passage.group(lists.passage).map(candidate=>{
    const selected=indexes.block.group(lists.block,46).find(article=>article.article===candidate.article);
    return {article:candidate.article,score:candidate.score,matches:(selected?.matches??[]).map(unit=>({id:unit.id,sourceBlocks:unit.sourceBlocks,score:unit.score}))};
  });
  const rank=articles.findIndex(row=>row.article===query.article);const selected=articles.find(row=>row.article===query.article);
  const blockShown=!!selected?.matches.some(unit=>unit.sourceBlocks.some(block=>query.knownBlocks.includes(block)));
  return {method,searchText,timing,articles,topUnits:Object.fromEntries(Object.entries(lists).map(([kind,rows])=>[kind,rows.slice(0,10)])),rankingDigests:Object.fromEntries(Object.entries(lists).map(([kind,rows])=>[kind,sha(JSON.stringify(rows))])),rankedUnits:Object.fromEntries(Object.entries(lists).map(([kind,rows])=>[kind,rows.length])),knownArticleAt1:rank===0,knownArticleAt3:rank>=0&&rank<3,knownArticleRankThrough5:rank<0?null:rank+1,knownBlockShownInTargetArticle:blockShown,knownArticleAt3AndKnownBlockShown:rank>=0&&rank<3&&blockShown};
}
try {
  for(const query of cases) {
    const conditions={},lexical=lexicalQuery(query.query),before=performance.now();
    const [vector]=await encoder.embed([modelConfig.queryPrefix+query.query]);const encodingMs=performance.now()-before;
    const original=Object.fromEntries(Object.entries(indexes).map(([kind,index])=>[kind,index.rankings(query.query,vector)]));
    const exact={},tolerant={};const miniStart=performance.now();
    for(const kind of ['passage','block']) {
      exact[kind]=minis[kind].search(lexical).map(({id,score})=>({id,score}));
      tolerant[kind]=minis[kind].search(lexical,tolerantOptions).map(({id,score})=>({id,score}));
    }
    const miniMs=performance.now()-miniStart;
    for(const [label,method] of [['bm25','keyword'],['e5','semantic'],['original-hybrid','hybrid']]) conditions[label]=describe(query,label,query.query,Object.fromEntries(Object.entries(original).map(([kind,result])=>[kind,result.lists[method]])),{encodingMs,byIndex:Object.fromEntries(Object.entries(original).map(([kind,result])=>[kind,result.timing]))});
    conditions['minisearch-exact']=describe(query,'minisearch-exact',lexical,exact,{bothVariantsAndIndexesMs:miniMs});
    conditions['minisearch-tolerant']=describe(query,'minisearch-tolerant',lexical,tolerant,{bothVariantsAndIndexesMs:miniMs});
    const hybrid=Object.fromEntries(['passage','block'].map(kind=>[kind,reciprocalRankFusion([original[kind].lists.semantic.map(row=>row.id),tolerant[kind].map(row=>row.id)],60)]));
    conditions['e5-minisearch-hybrid']=describe(query,'e5-minisearch-hybrid',{semantic:query.query,lexical},hybrid,{encodingMs});
    const pagefind=await pagefindSearch({raw:query.query,prepared:lexical});
    for(const variant of ['raw','prepared']) conditions['pagefind-'+variant]=describe(query,'pagefind-'+variant,variant==='raw'?query.query:lexical,Object.fromEntries(['passage','block'].map(kind=>[kind,pagefind[kind+'-'+variant].rows])),Object.fromEntries(['passage','block'].map(kind=>{const {rows,...timing}=pagefind[kind+'-'+variant];return[kind,timing];})));
    results.push({id:query.id,article:query.article,form:query.form,knownBlocks:query.knownBlocks,conditions});
    console.log(JSON.stringify({completed:results.length,total:cases.length,id:query.id}));
  }
  const paths={caseFile,passageFile:config.passageFile,unitFile:config.unitFile,passageVectors:config.passageVectors,unitVectors:config.unitVectors,pagefindReceipt:join(config.pagefindDirectory,'receipt.json')};
  writeFileSync(resolve(output),JSON.stringify({completedAt:new Date().toISOString(),split,model:modelConfig,miniBuilds:builds,inputHashes:Object.fromEntries(Object.entries(paths).map(([key,path])=>[key,sha(readFileSync(path))])),results},null,2)+'\n',{flag:'wx'});
}finally{await encoder.dispose();await worker.terminate();}

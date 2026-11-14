import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import assert from 'node:assert/strict';

if(process.argv.length!==6)throw new Error('Usage: node build-native-pagefind.mjs /original-corpus /retained-built-dist /comparator-runtime /fresh-output');
const [corpusFile,dist,runtime,output]=process.argv.slice(2).map(value=>resolve(value));mkdirSync(output);
const corpus=JSON.parse(readFileSync(corpusFile,'utf8'));const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const pagefind=await import(pathToFileURL(join(runtime,'node_modules/pagefind/lib/index.js')));
const start=performance.now();const {index,errors}=await pagefind.createIndex({rootSelector:'.post-content',forceLanguage:'en'});assert.deepEqual(errors,[]);assert(index);const htmlInputs=[];
try {
  for(const article of corpus.articles){const bytes=readFileSync(join(dist,article.slug,'index.html'));htmlInputs.push({article:article.slug,bytes:bytes.length,sha256:sha(bytes)});const result=await index.addHTMLFile({url:article.url,content:bytes.toString('utf8')});assert.deepEqual(result.errors,[],article.slug);}
  const result=await index.writeFiles({outputPath:join(output,'index')});assert.deepEqual(result.errors,[]);
}finally{await pagefind.close();}
writeFileSync(join(output,'receipt.json'),JSON.stringify({completedAt:new Date().toISOString(),version:'1.6.0',mode:'Native HTML pages; .post-content; English; default ranking',sourceCommit:corpus.sourceCommit,corpusSha256:sha(readFileSync(corpusFile)),totalBuildMs:performance.now()-start,htmlInputs},null,2)+'\n',{flag:'wx'});
console.log({pages:htmlInputs.length,buildMs:performance.now()-start});

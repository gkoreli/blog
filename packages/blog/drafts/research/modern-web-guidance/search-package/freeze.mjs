import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

if(process.argv.length!==3)throw new Error('Usage: node freeze.mjs /local-config');
const root=dirname(fileURLToPath(import.meta.url)),config=JSON.parse(readFileSync(resolve(process.argv[2]),'utf8'));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const files=['protocol.md','topics.json','cases.json','prepare-cases.mjs','lexical-query.mjs','build-comparators.mjs','pagefind-worker.mjs','evaluate-comparators.mjs','freeze.mjs','runtime/package.json','runtime/package-lock.json','registry-pins.json'];
const inputs={passageFile:config.passageFile,unitFile:config.unitFile,passageVectors:config.passageVectors,unitVectors:config.unitVectors,pagefindReceipt:join(config.pagefindDirectory,'receipt.json'),originalCorpus:config.corpusFile,originalModelFreeze:join(root,'../passage-search/input-freeze.json')};
const dependencies=['../passage-search/model.mjs','../passage-search/retrieval.mjs','../passage-search/vendor/bm25.ts','../reader-search/ranking.mjs','../reader-search/query-v2.mjs'];
const cases=JSON.parse(readFileSync(join(root,'cases.json'),'utf8')).cases;assert.equal(cases.length,51);
const receipt=JSON.parse(readFileSync(inputs.pagefindReceipt,'utf8'));assert.equal(receipt.version,'1.6.0');
assert.equal(receipt.builds.passage.inputSha256,sha(readFileSync(config.passageFile)));assert.equal(receipt.builds.block.inputSha256,sha(readFileSync(config.unitFile)));
writeFileSync(join(root,'pagefind-build.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
writeFileSync(join(root,'input-freeze.json'),JSON.stringify({frozenAt:new Date().toISOString(),beforeNewBlogComparatorQueries:true,files:Object.fromEntries([...files,'pagefind-build.json',...dependencies].map(file=>[file,sha(readFileSync(join(root,file)))])),inputs:Object.fromEntries(Object.entries(inputs).map(([name,path])=>[name,sha(readFileSync(path))])),cases:{total:cases.length,development:cases.filter(q=>q.split==='development').length,validation:cases.filter(q=>q.split==='validation').length},boundary:'New source-aware engineering comparator pack. Prior results influenced topic/alternative selection; not independent reader validation. No old benchmark is relabeled.'},null,2)+'\n',{flag:'wx'});
console.log({frozen:true,cases:cases.length});

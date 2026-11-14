import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

if(process.argv.length!==3)throw new Error('Usage: node download-reranker.mjs /fresh-model-directory');
const model='Xenova/ms-marco-MiniLM-L-6-v2',revision='a09144355adeed5f58c8ed011d209bf8ee5a1fec';
const root=resolve(process.argv[2]);mkdirSync(root);const results=[];
for(const file of ['config.json','tokenizer.json','tokenizer_config.json','special_tokens_map.json','onnx/model_quantized.onnx']){
  const url=`https://huggingface.co/${model}/resolve/${revision}/${file}`;const response=await fetch(url,{signal:AbortSignal.timeout(120000)});assert.equal(response.status,200,file);const bytes=Buffer.from(await response.arrayBuffer());const path=join(root,file);mkdirSync(dirname(path),{recursive:true});writeFileSync(path,bytes,{flag:'wx'});results.push({file,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),url});console.log({file,bytes:bytes.length});
}
const config=JSON.parse(readFileSync(join(root,'config.json')));assert.equal(config.architectures[0],'BertForSequenceClassification');
writeFileSync(join(root,'receipt.json'),JSON.stringify({downloadedAt:new Date().toISOString(),model,revision,files:results},null,2)+'\n',{flag:'wx'});

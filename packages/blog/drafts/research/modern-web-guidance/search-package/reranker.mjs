import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

export const rerankerConfig={id:'Xenova/ms-marco-MiniLM-L-6-v2',revision:'a09144355adeed5f58c8ed011d209bf8ee5a1fec',runtime:'@huggingface/transformers@3.8.1',dtype:'q8',device:'cpu',intraOpThreads:2,interOpThreads:1,maximumPairTokens:512,batchSize:8,candidateDepthPerRetriever:20,score:'raw single relevance logit, not calibrated confidence'};
export async function loadReranker(runtime, directory) {
  const root=resolve(directory),receipt=JSON.parse(readFileSync(join(root,'receipt.json'),'utf8'));
  assert.equal(receipt.revision,rerankerConfig.revision);
  for(const file of receipt.files)assert.equal(createHash('sha256').update(readFileSync(join(root,file.file))).digest('hex'),file.sha256);
  const req=createRequire(join(resolve(runtime),'package.json'));const imported=await import(pathToFileURL(req.resolve('@huggingface/transformers')));const api=imported.AutoTokenizer?imported:imported.default;
  api.env.allowLocalModels=true;api.env.allowRemoteModels=false;
  const previousFetch=globalThis.fetch;globalThis.fetch=()=>{throw Error('Reranker network fetch prohibited');};
  const tokenizer=await api.AutoTokenizer.from_pretrained(root,{local_files_only:true});
  const model=await api.AutoModelForSequenceClassification.from_pretrained(root,{local_files_only:true,dtype:'q8',device:'cpu',session_options:{intra_op_num_threads:2,inter_op_num_threads:1}});
  return {async rank(query,units){const rows=[],truncated=[];
    for(let offset=0;offset<units.length;offset+=rerankerConfig.batchSize){const batch=units.slice(offset,offset+rerankerConfig.batchSize);for(const unit of batch){const count=tokenizer(query,{text_pair:unit.searchText,padding:false,truncation:false}).input_ids.data.length;if(count>512)truncated.push({id:unit.id,untruncatedTokens:count});}
      const inputs=tokenizer(batch.map(()=>query),{text_pair:batch.map(unit=>unit.searchText),padding:true,truncation:true,max_length:512});
      const result=await model(inputs);const values=result.logits.tolist();assert.equal(values.length,batch.length);
      for(const [i,unit]of batch.entries()){assert.equal(values[i].length,1);assert(Number.isFinite(values[i][0]));rows.push({id:unit.id,score:values[i][0]});}
    }
    rows.sort((a,b)=>b.score-a.score);return{rows,truncated};
  },async dispose(){await model.dispose();globalThis.fetch=previousFetch;}};
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { createE5Encoder, E5_SPACE, readE5WebFiles } from '../dist/e5.js';

const tokenizer={encode:text=>text.split(/\s+/).map((_,i)=>i),decode:ids=>ids.join(' ')};
const vector=()=>Float32Array.from({length:384},(_,i)=>i===0?2:0);
test('E5 adapter applies distinct retrieval prefixes and persists only document embeddings',async()=>{
 const calls=[],saved=new Map();const model=createE5Encoder({tokenizer,infer:async(text)=>{calls.push(text);return vector();},cache:{get:async key=>saved.get(key),put:async(key,value)=>{saved.set(key,value);}}});
 assert.equal(model.space,E5_SPACE);await model.encode('orbital transfer','document');await model.encode('orbital transfer','document');await model.encode('orbital transfer','query');await model.encode('orbital transfer','query');
 assert.deepEqual(calls,['passage: orbital transfer','query: orbital transfer','query: orbital transfer']);assert.equal(saved.size,1);
});
test('long documents are completely split under the token ceiling; queries cannot silently truncate',async()=>{
 const inputs=[];const model=createE5Encoder({tokenizer,infer:async(text,ids)=>{assert(ids.length<=480);inputs.push(text.slice('passage: '.length));return vector();}});
 const text='detailed source paragraph '.repeat(1000);const rows=await model.encode(text,'document');assert(rows.length>1);assert.equal(inputs.join(''),text);
 await assert.rejects(model.encode(text,'query'),/token limit/);const signal=AbortSignal.abort();await assert.rejects(model.encode('stopped','query',signal));
});
test('model asset paths remain self hosted and malformed receipts fail before loading',()=>{
 assert.throws(()=>readE5WebFiles({model:[]}),/manifest/);
 const asset={url:'https://unexpected.invalid/model',bytes:3,sha256:'0'.repeat(64)};assert.throws(()=>readE5WebFiles({model:[asset],tokenizer:asset,tokenizerConfig:asset,wasmUrl:'x',moduleUrl:'x'}),/path/);
});

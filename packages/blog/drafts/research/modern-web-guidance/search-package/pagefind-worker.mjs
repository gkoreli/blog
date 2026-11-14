// The real generated Pagefind WASM engine; only file reads inside its index root.
import { workerData, parentPort } from 'node:worker_threads';
import { readFile } from 'node:fs/promises';
import { resolve, join, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { performance } from 'node:perf_hooks';

const root=resolve(workerData.directory);let reads=0,bytesRead=0;
globalThis.fetch=async input=>{
  const url=new URL(typeof input==='string'?input:input.url??input.href);
  if(url.protocol!=='file:')throw new Error('Comparator network request prohibited');
  const path=resolve(fileURLToPath(url));if(!path.startsWith(root+sep))throw new Error('Comparator read outside index root');
  const bytes=await readFile(path);reads++;bytesRead+=bytes.length;
  return new Response(bytes,{headers:{'Content-Type':path.endsWith('.pagefind')?'application/wasm':'application/octet-stream'}});
};
const indexes={};
for(const kind of ['passage','block']) {indexes[kind]=await import(pathToFileURL(join(root,kind,'pagefind.js')));await indexes[kind].options({baseUrl:'/'});}
parentPort.on('message',async message=>{
  try {
    const output={};
    for(const [variant,query] of Object.entries(message.queries)) for(const [kind,index] of Object.entries(indexes)) {
      const start=performance.now(),beforeReads=reads,beforeBytes=bytesRead;const result=await index.search(query);
      const rows=await Promise.all(result.results.map(async row=>{const data=await row.data();if(typeof data.meta.unit!=='string')throw new Error('Missing Pagefind unit identity');return{id:data.meta.unit,score:typeof row.score==='number'?row.score:null};}));
      output[kind+'-'+variant]={rows,totalMs:performance.now()-start,assetReads:reads-beforeReads,assetBytes:bytesRead-beforeBytes};
    }
    parentPort.postMessage({id:message.id,output});
  }catch(error){parentPort.postMessage({id:message.id,error:error instanceof Error?error.message:String(error)});}
});
parentPort.postMessage({ready:true});

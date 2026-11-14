import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import assert from 'node:assert/strict';

if (process.argv.length !== 6) throw new Error('Usage: node build-comparators.mjs /passages /units /comparator-runtime /fresh-output');
const [passageFile, unitFile, runtime, output] = process.argv.slice(2).map(value=>resolve(value));
mkdirSync(output);
assert.equal(JSON.parse(readFileSync(join(runtime,'node_modules/pagefind/package.json'))).version,'1.6.0');
// Pinned package has an import-only export; require.resolve selects CJS conditions.
const pagefind = await import(pathToFileURL(join(runtime,'node_modules/pagefind/lib/index.js')));
const sha = bytes=>createHash('sha256').update(bytes).digest('hex'); const builds = {};
function files(directory) {return readdirSync(directory).flatMap(name=>{const path=join(directory,name);return statSync(path).isDirectory()?files(path):[{file:path.slice(output.length+1),bytes:statSync(path).size,sha256:sha(readFileSync(path))}];});}
try {
  for(const [kind,file] of [['passage',passageFile],['block',unitFile]]) {
    const records=JSON.parse(readFileSync(file,'utf8')).passages;
    const start=performance.now(); const created=await pagefind.createIndex({forceLanguage:'en'});assert.deepEqual(created.errors,[]);assert(created.index);
    for(const unit of records) {
      const response=await created.index.addCustomRecord({url:'/records/'+encodeURIComponent(unit.id),content:unit.searchText,language:'en',meta:{title:unit.title,unit:unit.id,article:unit.article}});
      assert.deepEqual(response.errors,[],unit.id);
    }
    const written=await created.index.writeFiles({outputPath:join(output,kind)});assert.deepEqual(written.errors,[]);
    builds[kind]={records:records.length,totalBuildMs:performance.now()-start,inputSha256:sha(readFileSync(file)),files:files(join(output,kind))};
    await created.index.deleteIndex();
  }
} finally {await pagefind.close();}
writeFileSync(join(output,'receipt.json'),JSON.stringify({completedAt:new Date().toISOString(),version:'1.6.0',language:'en',customRecords:true,builds},null,2)+'\n',{flag:'wx'});
console.log(Object.fromEntries(Object.entries(builds).map(([kind,data])=>[kind,{records:data.records,ms:data.totalBuildMs,bytes:data.files.reduce((n,f)=>n+f.bytes,0)}])));

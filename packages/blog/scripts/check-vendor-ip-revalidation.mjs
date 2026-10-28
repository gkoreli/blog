import assert from 'node:assert/strict';
import { readFileSync,writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve,dirname } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { verifyVendorIp,createVendorIpCache } from '../../analytics/.test-dist/vendor-ip.js';
import {runValidationCases} from '../../analytics/test/fixtures/vendor-ip-revalidation.mjs';
const [output,mode='compare']=process.argv.slice(2);assert.ok(output);const baseline='faa9d65';
const previous=execFileSync('git',['show',`${baseline}:packages/analytics/src/vendor-ip.ts`],{encoding:'utf8'});
const pinned=await build({stdin:{contents:previous,loader:'ts',resolveDir:resolve('packages/analytics/src')},bundle:true,write:false,platform:'node',format:'esm',logLevel:'silent'});const old=await import('data:text/javascript;base64,'+Buffer.from(pinned.outputFiles[0].contents).toString('base64'));
const nodeBefore=await runValidationCases(old.verifyVendorIp,old.createVendorIpCache);const nodeAfter=mode==='compare'?await runValidationCases(verifyVendorIp,createVendorIpCache):null;
const native=await build({stdin:{contents:`import {verifyVendorIp,createVendorIpCache} from './vendor-ip.js'; import {runValidationCases} from '../test/fixtures/vendor-ip-revalidation.mjs'; export default {async fetch(){return Response.json(await runValidationCases(verifyVendorIp,createVendorIpCache));}}`,loader:'js',resolveDir:resolve('packages/analytics/src')},bundle:true,write:false,platform:'browser',format:'esm',logLevel:'silent'});
const req=createRequire(resolve('package.json'));const {Miniflare}=await import(pathToFileURL(req.resolve('miniflare',{paths:[dirname(req.resolve('wrangler/package.json'))]})));const mf=new Miniflare({modules:true,script:new TextDecoder().decode(native.outputFiles[0].contents),compatibilityDate:'2026-03-06'});
try{const workerd=await (await mf.dispatchFetch('https://fixture.example/')).json();if(nodeAfter){for(const results of [nodeAfter,workerd])for(const c of results){assert.equal(c.accepted,c.expectedAccepted,c.name);assert.equal(c.calls,2);if(!c.expectedAccepted){assert.equal(c.reason,'revalidation-mismatch');assert.equal(c.cacheEntries,0);}}assert.deepEqual(workerd,nodeAfter);}
 const r={checkedAt:new Date().toISOString(),baselineCommit:baseline,mode,nodeBefore,...(nodeAfter?{nodeAfter}:{}),workerd,productionCalls:0,limits:'Synthetic local transports and edge context; not production publisher behavior or vendor identity.'};writeFileSync(output,JSON.stringify(r,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({cases:workerd.length,beforeAccepted:nodeBefore.filter(c=>c.accepted).length,afterAccepted:nodeAfter?.filter(c=>c.accepted).length}));
}finally{await mf.dispose();}

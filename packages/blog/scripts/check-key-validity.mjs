import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {signatureSelectionFixture} from '../../analytics/test/fixtures/signature-selection.mjs';
import {keyValidityMatrix} from '../../analytics/test/fixtures/key-validity.mjs';
import {verifyWebBotAuth,verifyWebBotAuthCandidate,createWebBotAuthCache} from '../../analytics/.test-dist/webbotauth.js';
import {auditWebBotAuth} from '../../analytics/.test-dist/webbotauth-audit.js';
import {VERIFIER_PROFILE_VERSION} from '../../analytics/.test-dist/versions.js';
const [output,fixtureOutput,expectation]=process.argv.slice(2);assert.ok(output&&fixtureOutput);
const fixture=await signatureSelectionFixture();writeFileSync(fixtureOutput,JSON.stringify(fixture)+'\n',{mode:0o600,flag:'wx'});
const node=await keyValidityMatrix(fixture,{verify:verifyWebBotAuth,selected:verifyWebBotAuthCandidate,audit:auditWebBotAuth,cache:createWebBotAuthCache});
const require=createRequire(resolve('package.json'));const {Miniflare}=await import(pathToFileURL(require.resolve('miniflare',{paths:[dirname(require.resolve('wrangler/package.json'))]})));
const bundle=await build({stdin:{resolveDir:process.cwd(),contents:`
 import {keyValidityMatrix} from './packages/analytics/test/fixtures/key-validity.mjs';
 import {verifyWebBotAuth,verifyWebBotAuthCandidate,createWebBotAuthCache} from './packages/analytics/src/webbotauth.ts';
 import {auditWebBotAuth} from './packages/analytics/src/webbotauth-audit.ts';
 export default {async fetch(){return Response.json(await keyValidityMatrix(${JSON.stringify(fixture)},{verify:verifyWebBotAuth,selected:verifyWebBotAuthCandidate,audit:auditWebBotAuth,cache:createWebBotAuthCache}));}};
`},bundle:true,write:false,format:'esm',platform:'browser',logLevel:'silent'});
const mf=new Miniflare({modules:true,script:bundle.outputFiles[0].text,compatibilityDate:'2026-03-06',cf:{}});
try{
 const response=await mf.dispatchFetch('https://local.fixture.example/');assert.equal(response.status,200);const native=await response.json();
 if(expectation==='expect-policy')for(const runtime of [node,native]){
  for(const row of runtime.rows)for(const p of row.paths){
   if(p.mode==='audit'){assert.equal(p.verified,row.expectedReason===null?1:0,row.name);assert.equal(p.assessment,row.expectedReason==='key-expired'?'partial':'complete',row.name);}
   else{assert.equal(p.status,row.expectedReason===null?'verified':'unverified',row.name);assert.equal(p.reason,row.expectedReason,row.name);}
  }
  for(const trace of runtime.traces){assert.equal(trace.warm.status,'verified');assert.deepEqual(trace.cached,trace.fresh);assert.equal(trace.cached.reason,trace.expectedReason);}
 }
 const result={checkedAt:new Date().toISOString(),verifierProfile:VERIFIER_PROFILE_VERSION,policyExpectationEnforced:expectation==='expect-policy',method:'Actual independent proof across default, selected and audit APIs; directory order/validity/algorithm metadata varies. Separate warmed-versus-fresh cache traces move caller time across key activation or expiry. Node and local workerd, intercepted transport only. No production clock failure or native-provider agreement claim.',node,native,externalRequests:0,productionRequests:0,d1Statements:0};
 assert.equal(JSON.stringify(result).includes('validity-canary'),false);writeFileSync(output,JSON.stringify(result,null,2)+'\n',{mode:0o600,flag:'wx'});
 console.log(JSON.stringify({casesPerRuntime:native.rows.length,apiPathsPerRuntime:native.rows.length*3,cacheTracesPerRuntime:native.traces.length,nodeCacheDisagreements:node.traces.filter(t=>JSON.stringify(t.cached)!==JSON.stringify(t.fresh)).length,nativeCacheDisagreements:native.traces.filter(t=>JSON.stringify(t.cached)!==JSON.stringify(t.fresh)).length}));
}finally{await mf.dispose();}

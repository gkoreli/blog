import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {wireFailureFixture,wireFailureMatrix,wireAuditExpectation} from '../../analytics/test/fixtures/wire-failures.mjs';
import {verifyWebBotAuth,verifyWebBotAuthCandidate,inspectWebBotAuthCandidates,createWebBotAuthCache} from '../../analytics/.test-dist/webbotauth.js';
import {verificationOutcome} from '../../analytics/.test-dist/signature-evidence.js';
import {auditWebBotAuth} from '../../analytics/.test-dist/webbotauth-audit.js';
import {VERIFIER_PROFILE_VERSION} from '../../analytics/.test-dist/versions.js';
const[output,fixtureOutput,expectation]=process.argv.slice(2);assert.ok(output&&fixtureOutput);
const fixture=await wireFailureFixture();writeFileSync(fixtureOutput,JSON.stringify(fixture)+'\n',{mode:0o600,flag:'wx'});
const node=await wireFailureMatrix(fixture,{verify:verifyWebBotAuth,selected:verifyWebBotAuthCandidate,inspect:inspectWebBotAuthCandidates,cache:createWebBotAuthCache,audit:auditWebBotAuth,outcome:verificationOutcome});
const require=createRequire(resolve('package.json'));const {Miniflare}=await import(pathToFileURL(require.resolve('miniflare',{paths:[dirname(require.resolve('wrangler/package.json'))]})));
const bundle=await build({stdin:{resolveDir:process.cwd(),contents:`
 import {wireFailureMatrix} from './packages/analytics/test/fixtures/wire-failures.mjs';
 import {verifyWebBotAuth,verifyWebBotAuthCandidate,inspectWebBotAuthCandidates,createWebBotAuthCache} from './packages/analytics/src/webbotauth.ts';
 import {verificationOutcome} from './packages/analytics/src/signature-evidence.ts';
 import {auditWebBotAuth} from './packages/analytics/src/webbotauth-audit.ts';
 export default {async fetch(){return Response.json(await wireFailureMatrix(${JSON.stringify(fixture)},{verify:verifyWebBotAuth,selected:verifyWebBotAuthCandidate,inspect:inspectWebBotAuthCandidates,cache:createWebBotAuthCache,audit:auditWebBotAuth,outcome:verificationOutcome}));}};
`},bundle:true,write:false,format:'esm',platform:'browser',logLevel:'silent'});
const mf=new Miniflare({modules:true,script:bundle.outputFiles[0].text,compatibilityDate:'2026-03-06',cf:{}});
try{
 const response=await mf.dispatchFetch('https://local.fixture.example/');assert.equal(response.status,200);const native=await response.json();
 if(expectation==='expect-policy')for(const rows of [node,native])for(const row of rows)for(const p of row.paths){
  if(p.mode==='audit'){for(const[key,value]of Object.entries(wireAuditExpectation(row.scenario)))assert.equal(p[key],value,row.name+'/'+key);continue;}
  assert.equal(p.status,row.expectedReason===null?'verified':'unverified',row.name);
  assert.equal(p.reason,row.scenario==='mixed-failures'&&p.mode==='selected'?'signature-invalid':row.expectedReason,row.name);
  assert.equal(p.outcome,row.scenario==='mixed-failures'&&p.mode==='selected'?'invalid':row.expectedOutcome,row.name);
  assert.equal(p.headerForm,row.scenario==='valid'?row.form:null,row.name);
 }
 const result={checkedAt:new Date().toISOString(),verifierProfile:VERIFIER_PROFILE_VERSION,policyExpectationEnforced:expectation==='expect-policy',method:'Three independently signed wire forms, fourteen scenarios each, actual default/selected/audit/inspection paths in Node and local workerd. Closed reason/outcome counts only; intercepted discovery, no vendor key or injected verification verdict.',node,native,externalRequests:0,productionRequests:0,d1Statements:0};
 assert.equal(JSON.stringify(result).includes('wire-private-canary'),false);writeFileSync(output,JSON.stringify(result,null,2)+'\n',{mode:0o600,flag:'wx'});
 console.log(JSON.stringify({casesPerRuntime:native.length,apiPathsPerRuntime:native.length*3,nodeDefaultMismatches:node.filter(r=>r.paths[0].reason!==r.expectedReason).length,nativeDefaultMismatches:native.filter(r=>r.paths[0].reason!==r.expectedReason).length}));
}finally{await mf.dispose();}

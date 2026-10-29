import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {wireFailureFixture} from '../../analytics/test/fixtures/wire-failures.mjs';
import {DIRECTORY_FAILURE_CASES,directoryFailureMatrix,directoryFailureResponse} from '../../analytics/test/fixtures/directory-failures.mjs';
import {verifyWebBotAuth,verifyWebBotAuthCandidate,createWebBotAuthCache} from '../../analytics/.test-dist/webbotauth.js';
import {auditWebBotAuth} from '../../analytics/.test-dist/webbotauth-audit.js';
import {verificationOutcome} from '../../analytics/.test-dist/signature-evidence.js';

const [output,mode='current']=process.argv.slice(2);assert.ok(output);assert.ok(['baseline','current'].includes(mode));
const baseline=mode==='baseline',fixture=await wireFailureFixture();
const api={verify:verifyWebBotAuth,selected:verifyWebBotAuthCandidate,cache:createWebBotAuthCache,audit:auditWebBotAuth,outcome:verificationOutcome};
const node=await directoryFailureMatrix(fixture,api,baseline);
const req=createRequire(resolve('package.json'));
const {Miniflare}=await import(pathToFileURL(req.resolve('miniflare',{paths:[dirname(req.resolve('wrangler/package.json'))]})));
const bundle=await build({stdin:{resolveDir:process.cwd(),contents:`
 import {directoryFailureMatrix} from './packages/analytics/test/fixtures/directory-failures.mjs';
 import {verifyWebBotAuth,verifyWebBotAuthCandidate,createWebBotAuthCache} from './packages/analytics/src/webbotauth.ts';
 import {auditWebBotAuth} from './packages/analytics/src/webbotauth-audit.ts';
 import {verificationOutcome} from './packages/analytics/src/signature-evidence.ts';
 const fixture=${JSON.stringify(fixture)};fixture.now=new Date(fixture.now);
 export default{async fetch(){return Response.json(await directoryFailureMatrix(fixture,{verify:verifyWebBotAuth,selected:verifyWebBotAuthCandidate,cache:createWebBotAuthCache,audit:auditWebBotAuth,outcome:verificationOutcome},${baseline}));}};
`},bundle:true,write:false,format:'esm',platform:'browser',logLevel:'silent'});
const mf=new Miniflare({modules:true,script:bundle.outputFiles[0].text,compatibilityDate:'2026-03-06',cf:{}});
try {
  const response=await mf.dispatchFetch('https://local.fixture.example/');assert.equal(response.status,200);
  const native=await response.json();assert.deepEqual(native,node);
  const trial=fixture.cases.find(row=>row.form==='dictionary'&&row.scenario==='valid'),request=new Request(trial.url,{headers:trial.headers});
  const cache=createWebBotAuthCache();let fetches=0;
  const options={now:fixture.now,cache,fetcher:()=>{fetches++;return directoryFailureResponse(fetches===1?'fetch-failed':'valid',Object.values(fixture.directories)[0].keys);}};
  await verifyWebBotAuth(request,options);const retry=await verifyWebBotAuth(request,options);
  const syncThrowRecovery={fetches,status:retry.status,pending:cache.pendingDirectories.size};
  if(baseline)assert.deepEqual(syncThrowRecovery,{fetches:1,status:'unverified',pending:1});
  else assert.deepEqual(syncThrowRecovery,{fetches:2,status:'verified',pending:0});
  assert.equal(JSON.stringify({node,native,syncThrowRecovery}).includes('directory-private-canary'),false);
  writeFileSync(output,JSON.stringify({checkedAt:new Date().toISOString(),mode,cases:DIRECTORY_FAILURE_CASES.length,pathsPerRuntime:DIRECTORY_FAILURE_CASES.length*3,node,native,syncThrowRecovery,productionRequests:0,externalRequests:0},null,2)+'\n',{flag:'wx',mode:0o600});
  console.log(JSON.stringify({mode,cases:DIRECTORY_FAILURE_CASES.length,pathsPerRuntime:DIRECTORY_FAILURE_CASES.length*3,syncThrowRecovery}));
} finally {await mf.dispose();}

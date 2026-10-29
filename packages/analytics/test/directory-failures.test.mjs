import assert from 'node:assert/strict';
import test from 'node:test';
import {wireFailureFixture} from './fixtures/wire-failures.mjs';
import {directoryFailureMatrix,directoryFailureResponse} from './fixtures/directory-failures.mjs';
import {verifyWebBotAuth,verifyWebBotAuthCandidate,createWebBotAuthCache} from '../.test-dist/webbotauth.js';
import {auditWebBotAuth} from '../.test-dist/webbotauth-audit.js';
import {verificationOutcome} from '../.test-dist/signature-evidence.js';

test('directory failures remain closed unavailable reasons across verification and audit APIs',async()=>{
  const rows=await directoryFailureMatrix(await wireFailureFixture(),{verify:verifyWebBotAuth,selected:verifyWebBotAuthCandidate,cache:createWebBotAuthCache,audit:auditWebBotAuth,outcome:verificationOutcome});
  assert.equal(rows.length,13);assert.equal(JSON.stringify(rows).includes('directory-private-canary'),false);
});

test('synchronous directory failure clears its pending entry and permits a later success',async()=>{
  const fixture=await wireFailureFixture(),trial=fixture.cases.find(row=>row.form==='dictionary'&&row.scenario==='valid');
  const request=new Request(trial.url,{headers:trial.headers}),cache=createWebBotAuthCache();let fetches=0;
  const options={now:fixture.now,cache,fetcher:()=>directoryFailureResponse(++fetches===1?'fetch-failed':'valid',Object.values(fixture.directories)[0].keys)};
  assert.equal((await verifyWebBotAuth(request,options)).reason,'dir-fetch-failed');assert.equal(cache.pendingDirectories.size,0);
  assert.equal((await verifyWebBotAuth(request,options)).status,'verified');assert.equal(fetches,2);assert.equal(cache.pendingDirectories.size,0);
});

test('concurrent requests share one pending result and clear failures before a later lookup',async()=>{
  const fixture=await wireFailureFixture(),trial=fixture.cases.find(row=>row.form==='dictionary'&&row.scenario==='valid');
  const request=new Request(trial.url,{headers:trial.headers}),cache=createWebBotAuthCache();let fetches=0,release;
  const pending=new Promise(resolve=>{release=resolve;});
  const options={now:fixture.now,cache,fetcher:()=>{fetches++;return pending;}};
  const first=verifyWebBotAuth(request,options),second=verifyWebBotAuth(request,options);
  assert.equal(cache.pendingDirectories.size,1);assert.equal(fetches,1);
  release(new Response(null,{status:503}));
  const outcomes=await Promise.all([first,second]);assert.ok(outcomes.every(result=>result.reason==='dir-http-status'));assert.equal(cache.pendingDirectories.size,0);
  assert.equal((await verifyWebBotAuth(request,{...options,fetcher:()=>{fetches++;return directoryFailureResponse('valid',Object.values(fixture.directories)[0].keys);}})).status,'verified');
  assert.equal(fetches,2);assert.equal(cache.pendingDirectories.size,0);
});

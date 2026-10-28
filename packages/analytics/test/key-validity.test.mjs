import assert from 'node:assert/strict';
import test from 'node:test';
import {signatureSelectionFixture} from './fixtures/signature-selection.mjs';
import {keyValidityMatrix} from './fixtures/key-validity.mjs';
import {verifyWebBotAuth,verifyWebBotAuthCandidate,createWebBotAuthCache} from '../.test-dist/webbotauth.js';
import {auditWebBotAuth} from '../.test-dist/webbotauth-audit.js';
import {verificationEvidence,verificationOutcome} from '../.test-dist/signature-evidence.js';
import {PUBLIC_KEY_POLICY_VERSION} from '../.test-dist/known-test-keys.js';
const request=f=>new Request('https://publication.example/a',{headers:f.cases[0].headers});
const directory=keys=>Response.json({keys},{headers:{'Content-Type':'application/http-message-signatures-directory+json','Cache-Control':'max-age=300'}});

test('duplicate validity policy is order independent; malformed bounds stay visible and the draft algorithm token is supported',async()=>{
 const fixture=await signatureSelectionFixture();
 const {rows}=await keyValidityMatrix(fixture,{verify:verifyWebBotAuth,selected:verifyWebBotAuthCandidate,audit:auditWebBotAuth,cache:createWebBotAuthCache});
 assert.equal(rows.length,20);
 for(const row of rows)for(const p of row.paths){
  if(p.mode==='audit'){assert.equal(p.verified,row.expectedReason===null?1:0,row.name);assert.equal(p.assessment,row.expectedReason==='key-expired'?'partial':'complete',row.name);}
  else{assert.equal(p.status,row.expectedReason===null?'verified':'unverified',row.name);assert.equal(p.reason,row.expectedReason,row.name);}
 }
 assert.equal(verificationOutcome({status:'unverified',reason:'key-validity-conflict'}),'policy-rejected');
 const evidence=verificationEvidence(request(fixture),{status:'unverified',reason:'key-validity-conflict'},false,['ExaSearchBot']);
 assert.equal(evidence.localReason,'key-validity-conflict');assert.equal(evidence.vendor.status,'not-verified');assert.equal(evidence.coverage,null);
 assert.equal(JSON.stringify(rows).includes('validity-canary'),false);
});

test('warmed and fresh verifiers agree when caller time moves before activation or reaches expiry',async()=>{
 const fixture=await signatureSelectionFixture();
 const {traces}=await keyValidityMatrix(fixture,{verify:verifyWebBotAuth,selected:verifyWebBotAuthCandidate,audit:auditWebBotAuth,cache:createWebBotAuthCache});
 assert.equal(traces.length,4);
 for(const trace of traces){assert.equal(trace.warm.status,'verified');assert.deepEqual(trace.cached,trace.fresh,trace.mode+'/'+trace.boundary);assert.equal(trace.cached.reason,trace.expectedReason);}
});

test('imported key activation is checked at millisecond boundaries without discarding a reusable key',async()=>{
 const fixture=await signatureSelectionFixture(),t=Math.floor(new Date(fixture.now).getTime()/1000),key=Object.values(fixture.directories)[0].keys[0],cache=createWebBotAuthCache();let fetches=0;
 const run=ms=>verifyWebBotAuth(request(fixture),{now:new Date(ms),cache,fetcher:async()=>{fetches++;return directory([{...key,nbf:t-10,exp:t+10}]);}});
 assert.equal((await run(t*1000)).status,'verified');
 assert.equal((await run((t-10)*1000-1)).reason,'key-not-yet-valid');assert.equal(cache.keys.size,1);
 assert.equal((await run((t-10)*1000)).status,'verified');
 assert.equal((await run((t+10)*1000-1)).status,'verified');assert.equal((await run((t+10)*1000)).reason,'key-expired');
 assert.equal(fetches,1);assert.equal([...cache.directories.values()][0].keyPolicy,PUBLIC_KEY_POLICY_VERSION);
});

test('old imported keys missing activation bounds are rechecked under the new key policy',async()=>{
 const fixture=await signatureSelectionFixture(),key=Object.values(fixture.directories)[0].keys[0],cache=createWebBotAuthCache(),url=Object.keys(fixture.directories)[0];
 const {ed25519JwkThumbprint}=await import('../.test-dist/webbotauth.js');const id=await ed25519JwkThumbprint(key);let fetches=0;
 cache.keys.set(url+'\n'+id,{key:await crypto.subtle.importKey('jwk',key,'Ed25519',false,['verify']),keyPolicy:'2026-10-28.1',expiresAt:new Date(fixture.now).getTime()+60000});
 const verdict=await verifyWebBotAuth(request(fixture),{now:new Date(fixture.now),cache,fetcher:async()=>{fetches++;return directory([{...key,nbf:Math.floor(new Date(fixture.now).getTime()/1000)+1}]);}});
 assert.equal(verdict.reason,'key-not-yet-valid');assert.equal(fetches,1);assert.equal(cache.keys.size,0);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import {wireFailureFixture,wireFailureMatrix,wireAuditExpectation} from './fixtures/wire-failures.mjs';
import {verifyWebBotAuth,verifyWebBotAuthCandidate,inspectWebBotAuthCandidates,createWebBotAuthCache} from '../.test-dist/webbotauth.js';
import {verificationOutcome,verificationEvidence} from '../.test-dist/signature-evidence.js';
import {auditWebBotAuth} from '../.test-dist/webbotauth-audit.js';
const api={verify:verifyWebBotAuth,selected:verifyWebBotAuthCandidate,inspect:inspectWebBotAuthCandidates,cache:createWebBotAuthCache,audit:auditWebBotAuth,outcome:verificationOutcome};

test('supported wire formats preserve actual causes, eligible selection and mixed failure sets',async()=>{
 const rows=await wireFailureMatrix(await wireFailureFixture(),api);assert.equal(rows.length,42);
 for(const row of rows){
  for(const p of row.paths.filter(p=>p.mode!=='audit')){
   assert.equal(p.status,row.expectedReason===null?'verified':'unverified',row.name);
   assert.equal(p.reason,row.scenario==='mixed-failures'&&p.mode==='selected'?'signature-invalid':row.expectedReason,row.name);
   assert.equal(p.outcome,row.scenario==='mixed-failures'&&p.mode==='selected'?'invalid':row.expectedOutcome,row.name);
   assert.equal(p.headerForm,row.scenario==='valid'?row.form:null);
  }
  if(row.scenario==='mixed-failures')assert.deepEqual(row.paths[0].reasons,['signature-invalid','unsupported-alg']);
  if(row.scenario==='malformed-fields')assert.deepEqual(row.inspection,{status:'unverified',reason:'malformed-signature-fields'});
  if(row.scenario==='missing-input')assert.deepEqual(row.inspection,{status:'unverified',reason:'missing-signature-input'});
 }
 assert.equal(JSON.stringify(rows).includes('wire-private-canary'),false);
});

test('all-proof audit buckets reflect real invalid, unavailable, policy and unsupported outcomes for every wire form',async()=>{
 const rows=await wireFailureMatrix(await wireFailureFixture(),api);
 for(const row of rows){
  const audit=row.paths.find(p=>p.mode==='audit');
  for(const[key,value]of Object.entries(wireAuditExpectation(row.scenario)))assert.equal(audit[key],value,row.name+'/'+key);
 }
});

test('historical bare-URI fallback stays readable while current failures retain closed evidence',async()=>{
 assert.equal(verificationOutcome({status:'unverified',reason:'bare-uri-signature-agent'}),'unsupported');
 const f=await wireFailureFixture(),trial=f.cases.find(t=>t.form==='bare-uri'&&t.scenario==='directory-unavailable'),request=new Request(trial.url,{headers:trial.headers});
 const result=await verifyWebBotAuth(request,{now:f.now,cache:createWebBotAuthCache(),fetcher:async()=>new Response(null,{status:503})});
 const evidence=verificationEvidence(request,result,false,['ExaSearchBot']);
 assert.equal(evidence.localReason,'directory-unavailable');assert.equal(evidence.localOutcome,'unavailable');assert.deepEqual(evidence.localReasons,['directory-unavailable']);
 assert.equal(evidence.vendor.status,'not-verified');assert.equal(evidence.coverage,null);
 for(const canary of [trial.headers.Signature,trial.headers['Signature-Agent'],trial.url])assert.equal(JSON.stringify(evidence).includes(canary),false);
});

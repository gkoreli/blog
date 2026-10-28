import test from 'node:test';
import assert from 'node:assert/strict';
import { reconcileReceiptStorage } from '../../blog/drafts/research/analytics-retrospective/reconcile-receipt-storage.mjs';
import { storedObservationReceipt } from '../.test-dist/observation-receipt.js';
import { verificationEvidence } from '../.test-dist/signature-evidence.js';
import { analyzeTraffic } from '../.test-dist/classify.js';

function fixture() {
  const candidates=[],receipts=[];
  for(const [index,ref] of ['9007199254740992','9007199254740993'].entries()) {
    const c={version:'2026-10-27.2',classifierProfile:'2026-10-27.5',declarations:analyzeTraffic('ExaSearchBot/1.0').declarations,categoryAgreement:'single-match'};
    const request=new Request('https://publication.example/article');
    Object.defineProperty(request,'cf',{value:{verifiedBotCategory:'Search Engine Crawler',botManagement:{verifiedBot:index===0?null:false,signedAgent:null}}});
    const e=verificationEvidence(request,{status:'verified',agent:'https://crawler.exa.ai',evidence:{version:'2026-10-27.1',headerForm:'dictionary',covered:{authority:true,targetUri:false,method:false,path:false,query:false,userAgent:false,contentDigest:false},otherComponentCount:0,validitySeconds:300,ageSeconds:1,replayPolicy:'expiry-only'}},false,['ExaSearchBot']);
    e.verifierProfile='2026-10-27.6';
    const row={privateReference:ref,observedAt:'2026-10-27 23:45:54',path:'/same-path',collectionVersion:'2026-10-27.10',classifierVersion:'2026-10-27.5',readerKind:'ai-search',signatureStatus:'verified',signatureAgent:'https://crawler.exa.ai',classificationEvidence:JSON.stringify(c),signatureEvidence:JSON.stringify(e)};
    candidates.push(row);receipts.push({timestamp:'2026-10-27T23:45:55.000Z',$metadata:{id:'record-'+index,type:'cf-worker',requestId:'request-'+index},$workers:{truncated:false},source:{message:'analytics.observation_stored',operationId:'operation-'+index,collectionVersion:row.collectionVersion,storage:{version:'2026-10-27.1',status:'returned',observationId:ref},receipt:storedObservationReceipt({readerKind:row.readerKind,signatureStatus:row.signatureStatus,signatureAgent:row.signatureAgent,classificationEvidence:c,signatureEvidence:e})}});
  }
  return {candidates,receipts};
}
function resnapshot(row,record) {
  record.source.receipt=storedObservationReceipt({readerKind:row.readerKind,signatureStatus:row.signatureStatus,signatureAgent:row.signatureAgent,classificationEvidence:JSON.parse(row.classificationEvidence),signatureEvidence:JSON.parse(row.signatureEvidence)});
}
test('exact text references distinguish unsafe-integer neighbors without a time/path surrogate',()=>{
  const {candidates,receipts}=fixture();const result=reconcileReceiptStorage(candidates,receipts);
  assert.equal(Number(candidates[0].privateReference),Number(candidates[1].privateReference));
  assert.equal(result.matchedReferencePairs,2);assert.equal(result.identicalProjectionPairs,2);assert.equal(result.storedLocalVerifiedPairs,2);
  receipts[0].source.storage.observationId='12';const wrong=reconcileReceiptStorage(candidates,receipts);
  assert.equal(wrong.matchedReferencePairs,1);assert.equal(wrong.unmatchedCandidateRows,1);assert.equal(wrong.unmatchedReceiptRecords,1);
});
test('duplicate references, operations, provider records, missing links and truncation remain unaccepted',()=>{
  for(const mutate of [
    f=>{f.candidates.push(structuredClone(f.candidates[0]));},
    f=>{f.receipts.push(structuredClone(f.receipts[0]));},
    f=>{f.receipts[1].source.operationId=f.receipts[0].source.operationId;},
    f=>{f.receipts[1].$metadata.id=f.receipts[0].$metadata.id;},
    f=>{delete f.receipts[0].$metadata.requestId;},
    f=>{f.receipts[0].$workers.truncated=true;},
    f=>{f.receipts[0].source.storage.observationId=Number(f.receipts[0].source.storage.observationId);},
    f=>{f.receipts[0].source.storage.observationId='9223372036854775808';},
    f=>{f.receipts[0].source.storage.status='unavailable';delete f.receipts[0].source.storage.observationId;},
    f=>{f.receipts[0].source.receipt.version='future';},
  ]) {
    const f=fixture();mutate(f);assert.ok(reconcileReceiptStorage(f.candidates,f.receipts).identicalProjectionPairs<2);
  }
  const f=fixture();f.receipts[0].source.storage.observationId=f.candidates[1].privateReference;f.receipts[1].source.storage.observationId=f.candidates[0].privateReference;
  const swapped=reconcileReceiptStorage(f.candidates,f.receipts);assert.equal(swapped.matchedReferencePairs,2);assert.equal(swapped.differentProjectionPairs,2);
});
test('unknown evidence and unexpected fields cannot leak arbitrary operational context',()=>{
  for(const mutate of [
    f=>{f.candidates[0].readerKind='private-reader@example.test';},
    f=>{f.candidates[0].signatureAgent=null;},
    f=>{const e=JSON.parse(f.candidates[0].signatureEvidence);e.native.verifiedBot='private-native';f.candidates[0].signatureEvidence=JSON.stringify(e);},
    f=>{f.receipts[0].source.receipt['private-extra@example.test']='private-content';},
    f=>{f.candidates[0].collectionVersion='private-version';f.receipts[0].source.collectionVersion='private-version';},
  ]) {
    const f=fixture();mutate(f);const result=reconcileReceiptStorage(f.candidates,f.receipts);
    assert.ok(result.identicalProjectionPairs<2);assert.equal(JSON.stringify(result).includes('private-'),false);
  }
  const f=fixture();f.receipts[0].source.receipt.native.verifiedBot='false';const result=reconcileReceiptStorage(f.candidates,f.receipts);
  assert.equal(result.changedFields['native.verifiedBot'],1);assert.equal(result.differentProjectionPairs,1);
});
test('matching copied facts do not turn contradictory stored status into a verified local result',()=>{
  const f=fixture(),e=JSON.parse(f.candidates[0].signatureEvidence);
  e.localStatus='unverified';e.localOutcome='invalid';e.localReason='signature-invalid';e.localReasons=['signature-invalid'];e.coverage=null;
  f.candidates[0].signatureEvidence=JSON.stringify(e);resnapshot(f.candidates[0],f.receipts[0]);
  const result=reconcileReceiptStorage(f.candidates,f.receipts);
  assert.equal(result.identicalProjectionPairs,2);assert.equal(result.conflictingStoredStatusPairs,1);assert.equal(result.storedLocalVerifiedPairs,1);
  const injected=fixture();const e2=verificationEvidence(new Request('https://publication.example/article'),{status:'verified',agent:'https://crawler.exa.ai'},true,['ExaSearchBot']);
  injected.candidates[0].signatureEvidence=JSON.stringify(e2);resnapshot(injected.candidates[0],injected.receipts[0]);
  const injectedResult=reconcileReceiptStorage(injected.candidates,injected.receipts);
  assert.equal(injectedResult.identicalProjectionPairs,2);assert.equal(injectedResult.testInjectedPairs,1);
  assert.equal(injectedResult.conflictingStoredStatusPairs,0);assert.equal(injectedResult.storedLocalVerifiedPairs,1);
});

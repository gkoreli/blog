import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeAccessEvidence } from '../.test-dist/access-evidence.js';

// Synthetic controls; the actual retained BIC response is accepted separately, privately.
export function fixture() {
  const context = {method:'GET',host:'example.test',path:'/private-path-canary',query:'private-query-canary=1'};
  return {
    version:'access-evidence-v2',provenance:'synthetic',
    attempts:[{reference:'private-attempt-canary',executed:true,labelSource:'controlled-client-receipt',declaredOperator:'automation',context,contextBasis:'recorded-request',
      startInclusive:'2026-10-31T08:26:51Z',endExclusive:'2026-10-31T08:26:52Z',timingBasis:'observation-second-window',
      response:{status:403,observationBasis:'after-body-read',observedAt:'2026-10-31T08:26:51.586Z',ray:'1234567890abcdef'},collector:null}],
    securityRecords:[{reference:'private-event-canary',context:{...context},datetime:'2026-10-31T08:26:51Z',ray:'1234567890abcdef',
      action:'block',source:'bic',ruleId:'bic',sampleInterval:1}],
  };
}
test('one blocked response joins by context without inventing downstream absence or classifier outcomes',()=>{
  const f=fixture(), before=structuredClone(f), r=analyzeAccessEvidence(f);
  assert.deepEqual(f,before);
  assert.deepEqual(r.totals,{plannedAttempts:1,executedAttempts:1,observedResponses:1,suppliedSecurityRecords:1,
    uniquelyAssignedSecurityRecords:1,ambiguousSecurityRecords:0,unmatchedSecurityRecords:0,attemptsWithAssignedSecurityRecords:1,
    suppliedCollectorRecords:0,completeCollectorLookups:0,partialCollectorLookups:0,unknownCollectorAttempts:1,identicalSecurityFactGroups:0});
  assert.equal(r.attempts[0].collector,'unknown'); assert.deepEqual(r.attempts[0].storedKinds,[]);
  assert.equal(r.securityRecords[0].feature,'bic'); assert.equal(r.sourceAuthenticity,'not-established');
  for(const s of ['private-','1234567890abcdef','example.test','confusionMatrix']) assert.ok(!JSON.stringify(r).includes(s));
});
test('reused Ray needs exact method host path and query and a received response',()=>{
  for(const [key,value] of [['method','HEAD'],['host','other.test'],['path','/private-path-canary/'],['path','/%70rivate-path-canary'],['query','private-query-canary=2']]) {
    const f=fixture(); f.securityRecords[0].context[key]=value; const r=analyzeAccessEvidence(f);
    assert.equal(r.totals.uniquelyAssignedSecurityRecords,0); assert.equal(r.securityRecords[0].sameRayTimeCompatibleContextConflicts,1);
  }
  for(const change of [f=>f.attempts[0].response.ray=null,f=>{f.attempts[0].response=null;f.attempts[0].timingBasis='execution-window';}]) {
    const f=fixture();change(f);assert.equal(analyzeAccessEvidence(f).totals.unmatchedSecurityRecords,1);
  }
});
test('second intervals are half-open; outside-window Ray reuse is distinct from context disagreement',()=>{
  for(const datetime of ['2026-10-31T08:26:50Z','2026-10-31T08:26:52Z']) {
    const f=fixture();f.securityRecords[0].datetime=datetime; f.securityRecords[0].context.path='/other';
    const e=analyzeAccessEvidence(f).securityRecords[0];assert.equal(e.association,'unmatched');
    assert.equal(e.sameRayOutsideWindow,1);assert.equal(e.sameRayTimeCompatibleContextConflicts,0);
  }
  const f=fixture();Object.assign(f.attempts[0],{startInclusive:'2026-10-31T08:26:51.500Z',endExclusive:'2026-10-31T08:26:52.500Z',timingBasis:'execution-window'});
  assert.equal(analyzeAccessEvidence(f).totals.uniquelyAssignedSecurityRecords,1);
});
test('multiple records stay records; repeated fact copies surface; ambiguous attempts receive no allocation',()=>{
  const f=fixture();f.securityRecords.push({...structuredClone(f.securityRecords[0]),reference:'copy'});
  let r=analyzeAccessEvidence(f);assert.equal(r.totals.uniquelyAssignedSecurityRecords,2);assert.equal(r.totals.attemptsWithAssignedSecurityRecords,1);
  assert.equal(r.totals.identicalSecurityFactGroups,1);assert.deepEqual(r.securityRecords.map(e=>e.identicalFactCopies),[2,2]);
  f.securityRecords[1].source='private-source-canary';r=analyzeAccessEvidence(f);
  assert.equal(r.totals.identicalSecurityFactGroups,0); assert.equal(r.securityRecords[1].feature,'not-established');
  assert.ok(!JSON.stringify(r).includes('private-source-canary'));
  f.attempts.push({...structuredClone(f.attempts[0]),reference:'second'}); r=analyzeAccessEvidence(f);
  assert.equal(r.totals.ambiguousSecurityRecords,2);assert.equal(r.totals.uniquelyAssignedSecurityRecords,0);
  assert.deepEqual(r.securityRecords[0].candidateAttemptOrdinals,[1,2]);assert.deepEqual(r.attempts.map(a=>a.assignedSecurityRecords),[0,0]);
});
test('partial and unavailable empty lookups stay separate from complete scoped zero',()=>{
  for(const [state,expected] of [['complete','complete-empty'],['partial','partial'],['unavailable','unknown']]) {
    const f=fixture();f.attempts[0].collector={scope:'private-scope-canary',state,records:[]};
    const r=analyzeAccessEvidence(f);assert.equal(r.attempts[0].collector,expected);assert.equal(r.attempts[0].collectorLookupState,state);
    assert.ok(!JSON.stringify(r).includes('private-scope-canary'));
  }
});
test('stored kinds and method history remain observations; contradictory stages are warnings',()=>{
  const f=fixture();f.attempts[0].response.status=200;
  f.attempts[0].collector={scope:'selection-1',state:'partial',records:[
    {reference:'row1',kind:'browser',collection:'2026-10-30.1',classifier:'2026-10-29.3'},
    {reference:'row2',kind:null,collection:null,classifier:null},
    {reference:'row3',kind:'private-kind-canary',collection:null,classifier:null},
  ]};
  const r=analyzeAccessEvidence(f),a=r.attempts[0];assert.equal(r.totals.suppliedCollectorRecords,3);
  assert.deepEqual(a.storedKinds,[{kind:'browser',records:1},{kind:'not-recorded',records:1},{kind:'unrecognized',records:1}]);
  assert.deepEqual(a.warnings,['block-with-success-response','block-with-collector-records']);
  assert.ok(a.methodHistory.some(h=>h.collection===null&&h.records===2));assert.ok(!JSON.stringify(r).includes('private-kind-canary'));
});
test('operator declaration stays separate from receipt provenance',()=>{
  const f=fixture();f.attempts[0].declaredOperator='human-reported';
  const r=analyzeAccessEvidence(f);assert.equal(r.attempts[0].declaredOperator,'human-reported');assert.equal(r.attempts[0].labelSource,'controlled-client-receipt');
  f.attempts[0].labelSource='agent-controller';assert.throws(()=>analyzeAccessEvidence(f),/label-provenance/);
  f.attempts[0].labelSource='human-attestation';assert.equal(analyzeAccessEvidence(f).attempts[0].declaredOperator,'human-reported');
});
test('not executed plans remain plans; response and collector evidence cannot attach',()=>{
  const f=fixture();Object.assign(f.attempts[0],{executed:false,labelSource:'unconfirmed',declaredOperator:'unconfirmed',response:null,timingBasis:'execution-window'});
  const r=analyzeAccessEvidence(f);assert.equal(r.totals.executedAttempts,0);assert.equal(r.totals.unknownCollectorAttempts,0);
  assert.equal(r.attempts[0].collector,'not-executed');assert.equal(r.totals.unmatchedSecurityRecords,1);
  for(const change of [a=>a.labelSource='agent-controller',a=>a.response=fixture().attempts[0].response,a=>a.collector={scope:'x',state:'complete',records:[]}]) {
    const g=structuredClone(f);change(g.attempts[0]);assert.throws(()=>analyzeAccessEvidence(g),/unexecuted-evidence/);
  }
});
test('strict schemas budgets clocks duplicates and malformed states reject entire input',()=>{
  const changes=[
    f=>f.rawIP='secret',f=>f.securityRecords[0].userAgent='secret',f=>f.attempts[0].response.secret='secret',
    f=>f.attempts[0].collector={scope:'x',state:'unavailable',records:[{reference:'r',kind:null,collection:null,classifier:null}]},
    f=>f.securityRecords.push(structuredClone(f.securityRecords[0])),f=>f.attempts.push(structuredClone(f.attempts[0])),
    f=>f.attempts=Array.from({length:33},()=>f.attempts[0]),f=>f.securityRecords=Array.from({length:129},()=>f.securityRecords[0]),
    f=>f.attempts[0].reference='x'.repeat(262144),f=>f.securityRecords[0].datetime='2026-02-30T00:00:00Z',
    f=>f.securityRecords[0].datetime='2026-10-31T08:26:51.001Z',f=>f.attempts[0].response.observedAt='2026-10-31T08:26:52Z',
    f=>f.attempts[0].endExclusive='2026-10-31T08:28:00Z',f=>f.attempts[0].endExclusive=f.attempts[0].startInclusive,
    f=>f.securityRecords[0].ray+='-SEA',f=>f.securityRecords[0].sampleInterval=0,f=>f.securityRecords[0].context.path='/x/../y',
    f=>f.securityRecords[0].context.query='?x=1',f=>f.securityRecords[0].context.path='/bad%zz',
  ];
  for(const change of changes){const f=fixture();change(f);assert.throws(()=>analyzeAccessEvidence(f),/Access evidence rejected:/);}
});


test('v2 observation and context provenance survive without silent v1 reinterpretation',()=>{
  const f=fixture();f.attempts[0].contextBasis='protocol-reconstruction';f.attempts[0].response.observationBasis='controller-completed';
  const r=analyzeAccessEvidence(f);assert.equal(r.version,'access-evidence-v2');assert.equal(r.profile,'2026-10-31.2');
  assert.equal(r.attempts[0].contextBasis,'protocol-reconstruction');assert.equal(r.attempts[0].responseObservationBasis,'controller-completed');
  for(const mutate of [
    f=>f.version='access-evidence-v1',f=>{f.attempts[0].response.receivedAt=f.attempts[0].response.observedAt;delete f.attempts[0].response.observedAt;},
    f=>f.attempts[0].timingBasis='receipt-second-window',f=>delete f.attempts[0].response.observationBasis,
    f=>f.attempts[0].response.observationBasis='arrival-guessed',f=>delete f.attempts[0].contextBasis,f=>f.attempts[0].contextBasis='authenticated-wire',
  ]){const g=fixture();mutate(g);assert.throws(()=>analyzeAccessEvidence(g),/Access evidence rejected:/);}
});

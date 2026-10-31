import assert from 'node:assert/strict';
import test from 'node:test';
import {DatabaseSync} from 'node:sqlite';
import {assessStoredNetworkAssignment,networkAssignmentJsonStateSql} from '../.test-dist/vendor-declaration-assessment.js';
import {vendorNetworkStateSql} from '../.test-dist/vendor-network-summary.js';
import {networkAssignmentCases} from './fixtures/network-assignment.mjs';

test('retained declaration/source assignments keep contradictions, missingness and historical maps distinct',t=>{
 const db=new DatabaseSync(':memory:');t.after(()=>db.close());
 const guard=db.prepare(`SELECT ${networkAssignmentJsonStateSql('classification_evidence')} AS c,${networkAssignmentJsonStateSql('vendor_ip_evidence')} AS n FROM (SELECT ? AS classification_evidence,? AS vendor_ip_evidence)`);
 for(const row of networkAssignmentCases()){
  const states=guard.get(row.classificationJson,row.networkJson);
  const result=assessStoredNetworkAssignment({...row,classificationJsonState:states.c,networkJsonState:states.n});
  assert.equal(result.state,row.state,row.id);assert.deepEqual(result.reasons,row.reasons,row.id);assert.ok(!JSON.stringify(result).includes('private-canary'),row.id);
 }
});

test('source structure can be recognized while retained declarations contradict that source',t=>{
 const db=new DatabaseSync(':memory:');t.after(()=>db.close());const row=networkAssignmentCases().find(r=>r.id==='gpt-wrong-source');
 const structural=db.prepare('SELECT '+vendorNetworkStateSql()+' AS state FROM (SELECT ? AS vendor_ip_evidence)').get(row.networkJson).state;assert.equal(structural,'recognized');
 const result=assessStoredNetworkAssignment({...row,classificationJsonState:'parsed',networkJsonState:'parsed'});assert.equal(result.state,'contradictory');assert.deepEqual(result.expected.sources,['openai-gpt']);
});

test('canonical aliases and shared source widths do not multiply declarations or erase source order',()=>{
 for(const [id,declarations,configured,sources]of [['aliases-one-declaration',1,1,['google-common']],['five-declarations-two-sources',5,5,['ahrefs-crawlers','google-common']],['old-google-unmapped',2,0,[]]]){
  const row=networkAssignmentCases().find(r=>r.id===id),r=assessStoredNetworkAssignment({...row,classificationJsonState:'parsed',networkJsonState:'parsed'});assert.equal(r.state,'consistent');assert.equal(r.expected.declarations,declarations);assert.equal(r.expected.configured,configured);assert.deepEqual(r.expected.sources,sources);
 }
});

test('output mutation and unrelated cache corruption cannot change the assignment contract',()=>{
 assert.throws(()=>networkAssignmentJsonStateSql('private-canary; DROP TABLE page_observations'));
 const row=networkAssignmentCases()[0],input={...row,classificationJsonState:'parsed',networkJsonState:'parsed'};
 const first=assessStoredNetworkAssignment(input);first.expected.sources.push('private-canary');first.reasons.push('private-canary');
 assert.deepEqual(assessStoredNetworkAssignment(input).expected.sources,['openai-gpt']);
 const n=JSON.parse(row.networkJson);n.checks[0].cache={private:'private-canary'};
 const result=assessStoredNetworkAssignment({...input,networkJson:JSON.stringify(n)});assert.equal(result.state,'consistent');assert.ok(!JSON.stringify(result).includes('private-canary'),'assignment agreement is independent of separate cache validity');
});

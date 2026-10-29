import test from 'node:test';
import assert from 'node:assert/strict';
import { vendorIpReceipt } from '../.test-dist/vendor-ip-receipt.js';
import { VENDOR_IP_SOURCES } from '../.test-dist/vendor-ip-sources.js';
import { networkEvidence, networkSummaryCases } from './fixtures/vendor-network-summary.mjs';
import { recognizedNetworkEvidence, validNetworkReceipt } from '../../blog/drafts/research/analytics-retrospective/network-receipt-fields.mjs';

test('network receipt keeps recorded, absent and unsupported history distinct against the report validator', () => {
  assert.deepEqual(vendorIpReceipt(undefined), {status:'not-recorded'});
  assert.equal(validNetworkReceipt(vendorIpReceipt(undefined)),true);
  for (const item of networkSummaryCases) {
    assert.equal(recognizedNetworkEvidence(item.e),item.recognized,item.name);
    if (item.recognized) assert.equal(validNetworkReceipt(vendorIpReceipt(item.e)),true,item.name);
  }
  const empty=networkEvidence(null);
  assert.equal(vendorIpReceipt(empty).status,'recorded');
  assert.equal(vendorIpReceipt(empty).configuredDeclarationCount,0);
  assert.deepEqual(vendorIpReceipt(empty).checks,{status:'none'});
});

test('closed scalar projection survives omission and snapshots all four outcomes without request context', () => {
  for (const outcome of ['listed','not-listed','unavailable','not-assessed']) {
    const evidence=networkEvidence(outcome),receipt=vendorIpReceipt(evidence);
    const snapshot=structuredClone(receipt);
    const scalars=value=>{
      assert.notEqual(value,null);assert.equal(Array.isArray(value),false);
      if(typeof value==='object')for(const child of Object.values(value))scalars(child);
      else assert.ok(['string','number','boolean'].includes(typeof value));
    };
    scalars(receipt);
    assert.equal(receipt.checks.sources['google-common'].outcome,outcome);
    evidence.summary.listed=!evidence.summary.listed;evidence.checks[0].reason='private-canary';
    if(evidence.checks[0].snapshot)evidence.checks[0].snapshot.sha256='private-canary';
    evidence.checks.push({...evidence.checks[0],source:'ahrefs-crawlers'});
    assert.deepEqual(receipt,snapshot);
    assert.equal(JSON.stringify(receipt).includes('private-canary'),false);
  }
  for(const source of VENDOR_IP_SOURCES){assert.notEqual(source.id,'none');assert.equal(source.id.includes(','),false);}
});

test('network receipt retains ordered fanout, overlapping outcomes and the shared Ahrefs method', () => {
  const e=networkEvidence('listed',{profile:'2026-10-29.1',source:'ahrefs-crawlers'});
  e.declarationCount=6;e.configuredDeclarationCount=6;
  for(const source of ['google-common','openai-search','applebot'])e.checks.push({...structuredClone(e.checks[0]),source,outcome:'not-listed'});
  e.checks.push({source:'bingbot',outcome:'not-assessed',reason:'request-budget',snapshot:null});
  e.summary.notListed=true;e.summary.notAssessed=true;
  const receipt=vendorIpReceipt(e);
  assert.equal(receipt.checkCount,5);assert.equal(receipt.configuredDeclarationCount,6);
  assert.equal(receipt.sourceNames,'ahrefs-crawlers,google-common,openai-search,applebot,bingbot');
  assert.equal(validNetworkReceipt(receipt),true);
  const reversed=structuredClone(receipt);reversed.sourceNames=receipt.sourceNames.split(',').reverse().join(',');
  assert.equal(validNetworkReceipt(reversed),false,'budget check moved before fanout boundary');
});

test('lost fields, unknown names and contradictory assessments cannot pass receipt validation', () => {
  const base=vendorIpReceipt(networkEvidence());
  for(const mutate of [
    n=>{delete n.checkCount;},n=>{n.checkCount=2;},n=>{n.summary.listed=false;},n=>{n.profile='future';},
    n=>{n.sourceNames='private-source';},n=>{n.sourceNames='google-common,google-common';},
    n=>{n.checks.sources['private-field']='private-data';},n=>{delete n.checks.sources['google-common'].snapshot.sha256;},
    n=>{n.checks.sources['google-common'].reason='fetch-timeout';},
    n=>{n.checks.sources['google-common'].snapshot.status='future';},
    n=>{n.addressHeader='none';},n=>{n.addressState='worker-subrequest';},
    n=>{n.privateRequest='private-data';},n=>{n.checks.status='none';},
  ]) {const n=structuredClone(base);mutate(n);assert.equal(validNetworkReceipt(n),false);}
  assert.equal(validNetworkReceipt({status:'not-recorded',checkCount:0}),false);
});

test('publisher-version availability does not collapse a recorded sentinel-looking value', () => {
  const e=networkEvidence();
  for(const value of [null,'none','2026-09-08T05:24:10.610952Z']) {
    e.checks[0].snapshot.publisherVersion=value;
    const receipt=vendorIpReceipt(e),snapshot=receipt.checks.sources['google-common'].snapshot;
    assert.equal(snapshot.publisherVersionStatus,value===null?'unavailable':'recorded');
    assert.equal(validNetworkReceipt(receipt),true);
  }
});

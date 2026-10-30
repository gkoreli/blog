import assert from 'node:assert/strict';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { verifyVendorIp,createVendorIpCache } from '../.test-dist/vendor-ip.js';
import { KNOWN_AGENT_NAMES } from '../.test-dist/classify.js';
import { vendorIpReceipt } from '../.test-dist/vendor-ip-receipt.js';
import { vendorNetworkStateSql } from '../.test-dist/vendor-network-summary.js';
import { validNetworkReceipt } from '../../blog/drafts/research/analytics-retrospective/network-receipt-fields.mjs';
import { cacheEvidenceCases,cacheAccessCases,cacheEvidenceRequest,cacheEvidenceFeed,CACHE_EVIDENCE_CLOCK } from './fixtures/vendor-cache-evidence.mjs';
const db=new DatabaseSync(':memory:');
const state=e=>db.prepare(`SELECT (${vendorNetworkStateSql()}) state FROM (SELECT ? vendor_ip_evidence)`).get(JSON.stringify(e)).state;

test('explicit publisher conditions preserve membership and expose distinct bounded policy facts',async()=>{
  for(const row of await cacheEvidenceCases(verifyVendorIp,createVendorIpCache)) {
    const a=row.first.checks[0],b=row.second.checks[0];
    assert.equal(a.outcome,'listed',row.label);assert.equal(a.cache.access,'fetched');
    assert.deepEqual(a.cache.policy,{assessedAt:CACHE_EVIDENCE_CLOCK,lifetimeSource:row.expected.lifetimeSource,blockers:row.expected.blockers});
    assert.equal(row.stored,row.expected.stored);assert.equal(row.fetchCalls,1);
    assert.equal(b.outcome,row.expected.blockers.length?'not-assessed':'listed');
    assert.equal(b.cache.access,row.expected.blockers.length?'cooldown':'memory');
    assert.deepEqual(b.cache.policy,a.cache.policy);
    for(const e of [row.first,row.second]){assert.equal(state(e),'recognized',row.label);assert.equal(validNetworkReceipt(vendorIpReceipt(e)),true,row.label);}
  }
});

test('revalidation, failures and coalescing have their own access facts without stale membership',async()=>{
  for(const row of await cacheAccessCases(verifyVendorIp,createVendorIpCache)) {
    const check=row.second.checks[0];
    assert.equal(check.cache.access,row.label.startsWith('coalesced')?'coalesced':row.label==='revalidated'?'revalidated':'failed');
    assert.equal(check.outcome,['revalidated','coalesced'].includes(row.label)?'listed':'unavailable');
    if(check.outcome==='unavailable')assert.equal(check.cache.policy,null);
    if(row.third){assert.equal(row.third.checks[0].outcome,'not-assessed');assert.equal(row.third.checks[0].cache.access,'cooldown');
      assert.equal(row.third.checks[0].cache.policy===null,row.label!=='revalidated');assert.equal(row.fetchCalls,2);}
    else assert.equal(row.fetchCalls,1);
    for(const e of [row.first,row.second,...(row.third?[row.third]:[])]){assert.equal(state(e),'recognized',row.label);assert.equal(validNetworkReceipt(vendorIpReceipt(e)),true,row.label);}
  }
});

test('guards retain explicit inapplicability and maximum source fanout fits the unchanged storage cap',async()=>{
  const now=new Date(CACHE_EVIDENCE_CLOCK),fetcher=async()=>cacheEvidenceFeed({'Cache-Control':'no-store, private, no-cache, max-age=oops',Age:'oops'});
  const all=await verifyVendorIp(cacheEvidenceRequest(),KNOWN_AGENT_NAMES,{now,cache:createVendorIpCache(),fetcher});
  assert.equal(all.checks.length,16);assert.equal(all.checks.slice(4).every(c=>c.cache===null&&c.reason==='request-budget'),true);
  // Max accepted publisher-version width and prefix-count width, four accepted sources.
  for(const c of all.checks.slice(0,4)){c.snapshot.publisherVersion='2'.repeat(32);c.snapshot.prefixCount=4096;}
  const bytes=Buffer.byteLength(JSON.stringify(all));assert.ok(bytes<=4096,String(bytes));assert.equal(state(all),'recognized');
  const store=new DatabaseSync(':memory:');store.exec(readFileSync(new URL('../schema.sql',import.meta.url),'utf8'));
  store.prepare("INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,observed_at,vendor_ip_evidence) VALUES('/fixture',?,'browser','desktop',0,'2026-10-30 09:00:00',?)").run('0'.repeat(32),JSON.stringify(all));
  assert.equal(store.prepare('SELECT vendor_ip_evidence FROM page_observations').get().vendor_ip_evidence,JSON.stringify(all));store.close();
  const relay=await verifyVendorIp(cacheEvidenceRequest({'CF-Worker':'fixture.invalid'}),KNOWN_AGENT_NAMES,{now,cache:createVendorIpCache(),fetcher:async()=>{throw Error('must not fetch');}});
  assert.equal(relay.checks.every(c=>c.cache===null&&c.reason==='address-unavailable'),true);assert.equal(state(relay),'recognized');
  assert.equal(validNetworkReceipt(vendorIpReceipt(relay)),true);
});

test('missing and contradictory new cache fields reject while historical profiles remain unchanged',async()=>{
  const base=(await cacheEvidenceCases(verifyVendorIp,createVendorIpCache))[0].first;
  for(const mutate of [
    e=>delete e.checks[0].cache,e=>e.checks[0].cache=null,e=>e.checks[0].cache.access='cooldown',
    e=>e.checks[0].cache.policy=null,e=>e.checks[0].cache.policy.blockers=['private-canary'],
    e=>e.checks[0].cache.policy.blockers=['no-cache','no-cache'],e=>e.checks[0].cache.policy.blockers=['no-cache'],
    e=>e.checks[0].cache.policy.assessedAt='2026-10-31T09:00:00.000Z',
    e=>e.checks[0].snapshot.freshUntil=e.checkedAt,
  ]){const e=structuredClone(base);mutate(e);assert.equal(state(e),'unrecognized');assert.equal(validNetworkReceipt(vendorIpReceipt(e)),false);}
  const old=structuredClone(base);old.profile='2026-10-29.2';delete old.checks[0].cache;
  assert.equal(state(old),'recognized');assert.equal(validNetworkReceipt(vendorIpReceipt(old)),true);
  assert.equal('cache' in vendorIpReceipt(old).checks.sources['google-common'],false);
});

test('outward evidence and scalar receipts cannot mutate the cache or earlier evidence',async()=>{
  const cache=createVendorIpCache(),now=new Date(CACHE_EVIDENCE_CLOCK),fetcher=async()=>cacheEvidenceFeed({'Cache-Control':'no-cache'});
  const first=await verifyVendorIp(cacheEvidenceRequest(),['Googlebot'],{now,cache,fetcher});
  const receipt=vendorIpReceipt(first),saved=structuredClone(receipt);
  first.checks[0].cache.policy.blockers.push('private');first.checks[0].snapshot.sha256='a'.repeat(64);
  const second=await verifyVendorIp(cacheEvidenceRequest(),['Googlebot'],{now:new Date(now.getTime()+1000),cache,fetcher});
  assert.deepEqual(second.checks[0].cache.policy.blockers,['no-cache']);assert.deepEqual(receipt,saved);
});

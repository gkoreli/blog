import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { queryStats } from '../.test-dist/stats.js';
import { networkEvidence, networkSummaryCases } from './fixtures/vendor-network-summary.mjs';
import { consistentVendorNetworkSummary } from '../.test-dist/vendor-network-summary.js';
import { verifyVendorIp, createVendorIpCache } from '../.test-dist/vendor-ip.js';
import { vendorNetworkStateSql } from '../.test-dist/vendor-network-summary.js';

test('Parallel address source is recognized only under its introducing profile',()=>{
  const sqlite=new DatabaseSync(':memory:');sqlite.exec(readFileSync(new URL('../schema.sql',import.meta.url),'utf8'));
  const insert=sqlite.prepare("INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,vendor_ip_evidence) VALUES('/a','00000000000000000000000000000000','ai','desktop',0,?)");
  for(const profile of ['2026-10-29.2','2026-10-29.1','2026-10-28.2'])insert.run(JSON.stringify(networkEvidence('listed',{profile,source:'parallel-shapbot'})));
  assert.deepEqual(sqlite.prepare(`SELECT ${vendorNetworkStateSql()} state FROM page_observations`).all().map(r=>r.state),['recognized','unrecognized','unrecognized']);
});

test('IP evidence migration preserves history and validates the derived JSON byte boundary', () => {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../schema.sql',import.meta.url),'utf8').split('\n').filter(s=>!s.trim().startsWith('vendor_ip_evidence ')).join('\n'));
  sqlite.exec("INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner) VALUES('/old','00000000000000000000000000000000','browser','desktop',0)");
  sqlite.exec(readFileSync(new URL('../migrations/0014_vendor_ip_evidence.sql',import.meta.url),'utf8'));
  assert.equal(sqlite.prepare('SELECT vendor_ip_evidence FROM page_observations').get().vendor_ip_evidence,null);
  assert.throws(()=>sqlite.prepare('UPDATE page_observations SET vendor_ip_evidence=?').run('bad'));
  assert.throws(()=>sqlite.prepare('UPDATE page_observations SET vendor_ip_evidence=?').run(JSON.stringify({padding:'x'.repeat(4096)})));
});

test('IP report counts views once per outcome, preserves overlaps/unknown history and applies all selection boundaries', async () => {
  const sqlite=new DatabaseSync(':memory:');sqlite.exec(readFileSync(new URL('../schema.sql',import.meta.url),'utf8'));
  const db={prepare(sql){return{bind(...values){return{execute(){return{results:sqlite.prepare(sql).all(...values)}}}}}},async batch(statements){return statements.map(s=>s.execute())}};
  const insert=sqlite.prepare("INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,observed_at,vendor_ip_evidence,referrer_host) VALUES(?,?,'browser','desktop',?,'browser','fixture',?,?,?)");
  let id=0;const add=(evidence,options={})=>insert.run(options.path??'/a',(++id).toString(16).padStart(32,'0'),options.owner??0,options.at??'2026-10-27 01:00:00',evidence===null?null:JSON.stringify(evidence),options.referrer??null);
  const base=networkEvidence();
  const mixed=structuredClone(base);mixed.checks.push({...structuredClone(base.checks[0]),source:'ahrefs-crawlers',outcome:'not-listed'});mixed.declarationCount=2;mixed.configuredDeclarationCount=2;mixed.summary.notListed=true;
  const skipped=networkEvidence('not-assessed');skipped.declarationCount=2;skipped.unmappedDeclarationCount=1;
  const noDeclaration=networkEvidence(null);noDeclaration.declarationCount=0;noDeclaration.unmappedDeclarationCount=0;
  add(null);add(mixed);add(networkEvidence('unavailable',{addressState:'worker-subrequest'}));add(skipped);add(noDeclaration);
  add(base,{owner:1});add(base,{referrer:'traffic2cash.xyz'});add(base,{at:'2026-10-28 00:00:00'});add(base,{path:'/outside'});
  const report=await queryStats(db,{range:'7d',traffic:'all',path:'/a'},new Date('2026-10-27T02:00:00Z'));
  assert.equal(report.totals.views,5);assert.equal(report.referralPolicy.excludedViews,1);
  assert.deepEqual(report.vendorNetwork,{recognizedViews:4,unrecognizedViews:0,recordedViews:4,notRecordedViews:1,configuredDeclarationViews:3,unmappedDeclarationViews:1,noDeclarationViews:1,listedViews:1,notListedViews:1,unavailableViews:1,notAssessedViews:1,addressUnavailableViews:1});
  const empty=await queryStats(db,{range:'7d',traffic:'all',path:'/missing'},new Date('2026-10-27T02:00:00Z'));assert.ok(Object.values(empty.vendorNetwork).every(x=>x===0));
  assert.equal(JSON.stringify(report).includes('worker-subrequest'),false);
});


test('network record consistency rejects unsupported claims without losing the observation', async () => {
 const sqlite=new DatabaseSync(':memory:');sqlite.exec(readFileSync(new URL('../schema.sql',import.meta.url),'utf8'));
 const db={prepare(sql){return{bind(...values){return{execute(){return{results:sqlite.prepare(sql).all(...values)}}}}}},async batch(statements){return statements.map(s=>s.execute())}};
 const add=sqlite.prepare("INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,observed_at,vendor_ip_evidence) VALUES('/a',?,'browser','desktop',0,'browser','fixture','2026-10-28 04:00:00',?)");
 for(const [i,c] of networkSummaryCases.entries())add.run(String(i).padStart(32,'0'),c.e===null?null:JSON.stringify(c.e));
 const r=await queryStats(db,{range:'7d',traffic:'all'},new Date('2026-10-28T05:00:00Z'));
 assert.equal(r.totals.views,networkSummaryCases.length);assert.equal(r.vendorNetwork.recognizedViews,networkSummaryCases.filter(c=>c.recognized).length);
 assert.equal(r.vendorNetwork.unrecognizedViews,networkSummaryCases.filter(c=>c.e!==null&&!c.recognized).length);
 assert.equal(r.vendorNetwork.listedViews,10);assert.equal(r.vendorNetwork.notRecordedViews,1);
 assert.ok(consistentVendorNetworkSummary(r.vendorNetwork,r.totals.views));assert.ok(!JSON.stringify(r).includes('private-canary'));
 const good=r.vendorNetwork;
 for(const patch of [{recognizedViews:good.recognizedViews+1},{unrecognizedViews:NaN},{listedViews:100},{addressUnavailableViews:good.unavailableViews+1},{notRecordedViews:undefined},{configuredDeclarationViews:0}])assert.equal(consistentVendorNetworkSummary({...good,...patch},r.totals.views),false);
});

test('actual producer output including fanout skips remains recognized by the stored report', async () => {
 const request=new Request('https://publication.example/',{headers:{'CF-Connecting-IP':'66.249.66.1'}});Object.defineProperty(request,'cf',{value:{asn:64512}});
 const e=await verifyVendorIp(request,['AhrefsBot','AhrefsSiteAudit','GPTBot','OAI-SearchBot','DuckDuckBot','Google-Agent','ExaSearchBot'],{now:new Date('2026-10-28T04:00:00Z'),cache:createVendorIpCache(),fetcher:async()=>Response.json({prefixes:[{ipv4Prefix:'66.249.66.0/24'}]})});
 assert.equal(e.checks.length,5);assert.equal(e.summary.notAssessed,true);assert.equal(e.unmappedDeclarationCount,1);
 const sqlite=new DatabaseSync(':memory:');sqlite.exec(readFileSync(new URL('../schema.sql',import.meta.url),'utf8'));
 sqlite.prepare("INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,observed_at,vendor_ip_evidence) VALUES('/a','00000000000000000000000000000000','browser','desktop',0,'browser','fixture','2026-10-28 04:00:00',?)").run(JSON.stringify(e));
 const db={prepare(sql){return{bind(...values){return{execute(){return{results:sqlite.prepare(sql).all(...values)}}}}}},async batch(s){return s.map(x=>x.execute())}};
 const r=await queryStats(db,{range:'7d',traffic:'all'},new Date('2026-10-28T05:00:00Z'));assert.equal(r.vendorNetwork.recognizedViews,1);assert.equal(r.vendorNetwork.notAssessedViews,1);assert.equal(r.vendorNetwork.listedViews,1);
});

test('revalidation failure is recognized only in its producing method profile', async () => {
 const sqlite=new DatabaseSync(':memory:');sqlite.exec(readFileSync(new URL('../schema.sql',import.meta.url),'utf8'));
 const insert=sqlite.prepare("INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,observed_at,vendor_ip_evidence) VALUES('/a',?,'browser','desktop',0,'browser','fixture','2026-10-28 04:00:00',?)");
 for(const [i,profile] of ['2026-10-27.1','2026-10-28.1','2026-10-28.2'].entries()){const e=networkEvidence('unavailable',{profile});e.checks[0].reason='revalidation-mismatch';insert.run(String(i).padStart(32,'0'),JSON.stringify(e));}
 const db={prepare(sql){return{bind(...values){return{execute(){return{results:sqlite.prepare(sql).all(...values)}}}}}},async batch(s){return s.map(x=>x.execute())}};
 const r=await queryStats(db,{range:'7d',traffic:'all'},new Date('2026-10-28T05:00:00Z'));
 assert.equal(r.totals.views,3);assert.equal(r.vendorNetwork.recordedViews,3);assert.equal(r.vendorNetwork.recognizedViews,1);assert.equal(r.vendorNetwork.unrecognizedViews,2);assert.equal(r.vendorNetwork.unavailableViews,1);
});

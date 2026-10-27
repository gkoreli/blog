import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { queryStats } from '../.test-dist/stats.js';

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
  const base={source:'local-vendor-ip',declarationCount:1,configuredDeclarationCount:1,unmappedDeclarationCount:0,address:{state:'usable'},summary:{listed:false,notListed:false,unavailable:false,notAssessed:false}};
  add(null);add({...base,summary:{...base.summary,listed:true,notListed:true}});add({...base,summary:{...base.summary,unavailable:true},address:{state:'worker-subrequest'}});add({...base,summary:{...base.summary,notAssessed:true},unmappedDeclarationCount:1});add({...base,declarationCount:0,configuredDeclarationCount:0});
  add(base,{owner:1});add(base,{referrer:'traffic2cash.xyz'});add(base,{at:'2026-10-28 00:00:00'});add(base,{path:'/outside'});
  const report=await queryStats(db,{range:'7d',traffic:'all',path:'/a'},new Date('2026-10-27T02:00:00Z'));
  assert.equal(report.totals.views,5);assert.equal(report.referralPolicy.excludedViews,1);
  assert.deepEqual(report.vendorNetwork,{recordedViews:4,notRecordedViews:1,configuredDeclarationViews:3,unmappedDeclarationViews:1,noDeclarationViews:1,listedViews:1,notListedViews:1,unavailableViews:1,notAssessedViews:1,addressUnavailableViews:1});
  const empty=await queryStats(db,{range:'7d',traffic:'all',path:'/missing'},new Date('2026-10-27T02:00:00Z'));assert.ok(Object.values(empty.vendorNetwork).every(x=>x===0));
  assert.equal(JSON.stringify(report).includes('worker-subrequest'),false);
});

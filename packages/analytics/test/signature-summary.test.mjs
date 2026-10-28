import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { consistentSignatureSummary } from '../.test-dist/signature-summary.js';
import { queryStats } from '../.test-dist/stats.js';
import { summaryCases } from './fixtures/signature-summary.mjs';
const now=new Date('2026-10-28T05:00:00Z'),query={range:'7d',traffic:'all',path:'/privacy'};
function fixture() {
 const sqlite=new DatabaseSync(':memory:');sqlite.exec(readFileSync(new URL('../schema.sql',import.meta.url),'utf8'));
 let id=0,alter=rows=>rows;
 const add=(c,options={})=>sqlite.prepare(`INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,reader_kind,reader_reason,observed_at,signature_status,signature_evidence,is_owner,referrer_host) VALUES('/privacy',?,'ai','desktop','ai-search','fixture','2026-10-28 04:00:00',?,?,?,?)`).run(String(++id).padStart(32,'0'),c.status,c.e===null?null:JSON.stringify(c.e),options.owner??0,options.referrer??null);
 const db={prepare(sql){return{bind(...v){return{run:()=>alter(sqlite.prepare(sql).all(...v))}}}},async batch(stmts){return stmts.map(s=>({results:s.run()}))}};
 return{sqlite,db,add,alter:fn=>alter=fn};
}
test('all public signature summary families follow coherent stored states; native booleans stay independent',async()=>{
 for(const c of summaryCases){
  const f=fixture();f.add(c);const report=await queryStats(f.db,query,now),v=report.verification;
  assert.equal(report.totals.views,1,c.name);
  assert.equal(v.localVerifiedViews,Number(c.local==='verified'),c.name);
  assert.equal(v.unrecognizedLocalViews,Number(c.local==='unrecognized'),c.name);
  assert.equal(v.testVerdictViews,Number(c.local==='test-injected'),c.name);
  assert.equal(v.coverageRecordedViews,Number(c.local==='verified'&&c.coverage==='known'),c.name);
  assert.equal(v.coverageUnrecognizedVerifiedViews,Number(c.local==='verified'&&c.coverage==='unrecognized'),c.name);
  assert.equal(v.nativeAvailableViews,Number(c.native==='available'),c.name);
  assert.equal(v.nativeVerifiedBotViews,Number(c.native==='available' && c.nativeVerified!==false),c.name);
  assert.equal(v.nativeUnrecognizedViews,Number(c.native==='unrecognized'),c.name);
  assert.equal(v.vendorMatchingOriginViews,Number(c.vendor==='matching-origin'),c.name);
  assert.equal(v.vendorCheckUnrecognizedViews,Number(c.vendor==='unrecognized'),c.name);
  if(c.vendor==='conflicting-origins'){assert.equal(v.vendorOriginConflictViews,1);assert.equal(v.vendorConflictWithMatchingOriginViews,Number(c.local==='verified'));}
  if(c.vendor==='test-injected')assert.equal(v.vendorCheckRecognizedViews,1);
  if(c.local==='unrecognized')assert.ok(!report.byDirectoryPublication.some(r=>r.basis==='matching-publisher'),c.name);
  if(c.name==='bad-selection') {assert.equal(v.selectionUnrecognizedVerifiedViews,1);assert.equal(v.multipleTaggedCandidateViews,0);assert.equal(v.userAgentBoundViews,1);}
 }
});
test('summary rejects missing, negative, inflated and contradictory dimensions rather than fabricating zero',async()=>{
 const f=fixture();f.add(summaryCases[0]);
 f.add(summaryCases[0],{owner:1});f.add(summaryCases[0],{referrer:'traffic2cash.xyz'});
 const report=await queryStats(f.db,query,now);assert.equal(report.totals.views,1);assert.equal(report.verification.coverageRecordedViews,1);
 assert.equal(consistentSignatureSummary(report.verification,1,[]),false);
 assert.equal(consistentSignatureSummary(report.verification,1,[{...report.byKindSignature[0],basis:'private-unknown'}]),false);
 for(const edit of [r=>({...r,coverageRecordedViews:0}),r=>({...r,nativeAvailableViews:2}),r=>({...r,localVerifiedViews:-1}),r=>{const copy={...r};delete copy.vendorCheckUnrecognizedViews;return copy;},r=>({...r,nativeUnrecognizedViews:'0'})]){
  f.alter(rows=>rows.map(row=>row.section==='verification'?{...row,payload:JSON.stringify([edit(JSON.parse(row.payload)[0])])}:row));
  await assert.rejects(queryStats(f.db,query,now),/Malformed statistics report/);
 }
});

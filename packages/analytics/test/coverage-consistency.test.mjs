import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {signatureCoverageRecordedSql} from '../.test-dist/signature-coverage-report.js';
import {queryStats} from '../.test-dist/stats.js';
import {verifyWebBotAuth,createWebBotAuthCache} from '../.test-dist/webbotauth.js';
import {coverageConsistencyCases,coverageProducerCases} from './fixtures/coverage-consistency.mjs';

const coverageSql='SELECT '+signatureCoverageRecordedSql()+' AS known FROM(SELECT ? AS signature_evidence)';
test('coverage rejects impossible historical producer facts while preserving zero-duration and historical time facts',()=>{
 const db=new DatabaseSync(':memory:');try{
  for(const row of coverageConsistencyCases())assert.equal(db.prepare(coverageSql).get(JSON.stringify(row.e)).known,Number(row.after),row.name);
 }finally{db.close();}
});
test('impossible coverage withholds binding claims without discarding verified outcomes, signer history or events',async()=>{
 const sqlite=new DatabaseSync(':memory:');try{
  sqlite.exec(readFileSync(new URL('../schema.sql',import.meta.url),'utf8'));
  const db={prepare(sql){return{bind(...values){return{sql,values};}}},async batch(statements){return statements.map(s=>({results:sqlite.prepare(s.sql).all(...s.values)}));}};
  const insert=sqlite.prepare("INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,reader_kind,reader_reason,observed_at,signature_status,signature_agent,signature_evidence,is_owner) VALUES('/article','00000000000000000000000000000001','ai','desktop','ai-search','fixture','2026-10-28 04:00:00','verified','https://crawler.exa.ai',?,0)");
  for(const row of coverageConsistencyCases()){
   sqlite.exec('DELETE FROM page_observations');insert.run(JSON.stringify(row.e));
   const report=await queryStats(db,{range:'7d',traffic:'all'},new Date('2026-10-28T05:00:00Z')),v=report.verification;
   assert.equal(report.totals.views,1,row.name);assert.equal(report.bySigner[0].views,1,row.name);assert.equal(v.localVerifiedViews,1,row.name);
   assert.equal(v.coverageRecordedViews,Number(row.after),row.name);
   assert.equal(v.coverageNotRecordedVerifiedViews,Number(row.e.coverage===null),row.name);
   assert.equal(v.coverageUnrecognizedVerifiedViews,Number(!row.after&&row.e.coverage!==null),row.name);
   if(!row.after)for(const field of ['userAgentBoundViews','resourceBoundViews','methodBoundViews','authorityOnlyViews','vendorUserAgentBoundViews'])assert.equal(v[field],0,row.name+':'+field);
   assert.equal(v.nativeAvailableViews,1,row.name);
  }
 }finally{sqlite.close();}
});
test('actual signed producer controls preserve target policy, zero validity and clamped future-created age',async()=>{
 for(const row of await coverageProducerCases()){
  let fetches=0;const result=await verifyWebBotAuth(new Request(row.url,{headers:row.headers}),{now:new Date(row.now),includeEvidence:true,cache:createWebBotAuthCache(),fetcher:async()=>{fetches++;return Response.json({keys:[row.jwk]},{headers:{'Content-Type':'application/http-message-signatures-directory+json'}});}});
  assert.equal(result.status,row.expected,row.id);
  if(row.id==='missing-target'){assert.equal(result.reason,'missing-target-component');assert.equal(fetches,0);}
  else{assert.ok(result.evidence.covered.authority||result.evidence.covered.targetUri,row.id);assert.ok(result.evidence.ageSeconds>=0,row.id);}
  if(row.id==='zero-validity')assert.equal(result.evidence.validitySeconds,0);
  if(row.id==='future-created')assert.equal(result.evidence.ageSeconds,0);
 }
});

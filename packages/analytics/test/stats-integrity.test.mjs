import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {queryStats} from '../.test-dist/stats.js';
import {STATS_INTEGRITY_NOW,STATS_INTEGRITY_INSERT,statsIntegrityValues,statsIntegrityFaults,applyStatsFault} from './fixtures/stats-integrity.mjs';

function fixture() {
  const sqlite=new DatabaseSync(':memory:');sqlite.exec(readFileSync(new URL('../schema.sql',import.meta.url),'utf8'));
  for(const row of statsIntegrityValues())sqlite.prepare(STATS_INTEGRITY_INSERT).run(...row);
  let fault=null;
  const db={prepare(sql){return{bind(...values){return{sql,values};}}},async batch(statements){return statements.map(s=>{
    const results=sqlite.prepare(s.sql).all(...s.values);applyStatsFault(results,fault);return{success:true,results};
  });}};
  return{sqlite,db,alter(value){fault=value;}};
}
const now=new Date(STATS_INTEGRITY_NOW),all={range:'7d',traffic:'all'};
test('complete event partitions reconcile while shared daily IDs and subset tables remain non-additive',async()=>{
  const {sqlite,db}=fixture();try{
    const r=await queryStats(db,all,now);assert.equal(r.totals.views,5);assert.equal(r.totals.dailyClients,3);
    assert.equal(r.byPath.reduce((n,row)=>n+row.dailyClients,0),5);assert.equal(r.byCountry.reduce((n,row)=>n+row.views,0),4);
    assert.equal(r.byAgent.reduce((n,row)=>n+row.views,0),1);assert.equal(r.bySigner.reduce((n,row)=>n+row.views,0),1);
    assert.equal(r.otherReferrerViews,1);assert.equal(r.referralPolicy.excludedViews,1);
    for(const rows of [r.byPath,r.timeSeries,r.byReferrerState,r.byClientForm])assert.equal(rows.reduce((n,row)=>n+row.views,0),5);
    assert.equal(r.clientFormEvidence.recordedViews,0);assert.equal(r.clientFormEvidence.historicalViews,5);
    assert.equal(r.clientFormEvidence.unsupportedHintViews,0); // Native SUM(NULL) in a populated historical group.
    sqlite.prepare("UPDATE page_observations SET referrer_host='www.google.com' WHERE path='/delta'").run();
    assert.deepEqual((await queryStats(db,all,now)).byReferrer,[{referrerHost:'google.com',views:2}]);
  }finally{sqlite.close();}
});
test('valid empty results and legitimate nullable sums remain successful across report scopes',async()=>{
  const {sqlite,db}=fixture();try{
    for(const query of [all,{...all,range:'all'},{...all,traffic:'agents'},{...all,kind:'browser'},{...all,path:'/alpha'},{...all,path:'/absent'}]){
      const r=await queryStats(db,query,now);assert.equal(r.byPath.reduce((n,row)=>n+row.views,0),r.totals.views);
    }
    const empty=await queryStats(db,{...all,path:'/absent'},now);assert.deepEqual(empty.totals,{views:0,dailyClients:0,unattributedViews:0});
    assert.ok(empty.timeSeries.every(r=>r.views===0&&r.dailyClients===0));
    const scoped=await queryStats(db,{...all,path:'/alpha'},now);assert.equal(scoped.totals.views,1);
    assert.equal(scoped.internalTransitions.reduce((n,row)=>n+row.views,0),2);
  }finally{sqlite.close();}
});
test('malformed required fields and contradictory partial tables reject rather than become plausible zeros',async()=>{
  const {sqlite,db,alter}=fixture();try{
    const before=sqlite.prepare('SELECT * FROM page_observations ORDER BY id').all();
    for(const trial of statsIntegrityFaults()){
      alter(trial.fault);await assert.rejects(()=>queryStats(db,all,now),/Malformed statistics report/,trial.name);
    }
    alter(null);assert.equal((await queryStats(db,all,now)).totals.views,5);
    assert.deepEqual(sqlite.prepare('SELECT * FROM page_observations ORDER BY id').all(),before);
  }finally{sqlite.close();}
});
test('returned later-hour buckets survive clock boundaries without inventing later zero buckets',async()=>{
  const {sqlite,db}=fixture();try{
    sqlite.prepare("UPDATE page_observations SET observed_at='2026-10-31 13:00:00' WHERE path='/alpha'").run();
    const r=await queryStats(db,all,new Date('2026-10-31T12:59:59Z'));
    assert.equal(r.totals.views,5);assert.equal(r.timeSeries.reduce((n,row)=>n+row.views,0),5);
    assert.equal(r.timeSeries.at(-1).bucket,'2026-10-31T13:00:00Z');
    assert.equal(r.timeSeries.at(-1).views,1);assert.ok(!r.timeSeries.some(row=>row.bucket==='2026-10-31T14:00:00Z'));
    assert.equal(r.period.updatedAt,'2026-10-31T12:59:59.000Z');
  }finally{sqlite.close();}
});

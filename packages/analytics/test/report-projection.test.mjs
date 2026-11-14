import {buildProjectedStatsQueryPlan} from '../.test-dist/stats-query.js';
import {createStatsWindow} from '../.test-dist/dates.js';
import {referralReportProjectionSql,REFERRAL_REPORT_RULES_JSON,REFERRAL_REPORT_RULE_SHA256,referralReportRuleDefinition} from '../.test-dist/referral-report-projection.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {reportProjectionSelectSql,reportProjectionSql,projectReportObservation,REPORT_PROJECTION_RULE_SHA256} from '../.test-dist/report-projection.js';
import {queryStats,queryProjectedStats} from '../.test-dist/stats.js';
import {STATS_INTEGRITY_INSERT,statsIntegrityValues} from './fixtures/stats-integrity.mjs';
import {ACTIVE_REFERRAL_POLICY} from '../.test-dist/referral-policy.generated.js';

function fixture() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../schema.sql',import.meta.url),'utf8'));
  for (const values of statsIntegrityValues()) sqlite.prepare(STATS_INTEGRITY_INSERT).run(...values);
  let batches=0;
  const db={prepare(sql){return{bind(...values){return{sql,values,async run(){const result=sqlite.prepare(sql).run(...values);return{success:true,meta:{changes:result.changes}};}};}};},async batch(statements){batches++;return statements.map(s=>({success:true,results:sqlite.prepare(s.sql).all(...s.values)}));}};
  return {sqlite,db,batches:()=>batches};
}
const now=new Date('2026-10-31T12:00:00Z'),query={range:'7d',traffic:'all'};
function rebuild(sqlite){const result=sqlite.prepare(reportProjectionSql('range')).run(0,Number.MAX_SAFE_INTEGER);sqlite.prepare(referralReportProjectionSql()).run(0,Number.MAX_SAFE_INTEGER,REFERRAL_REPORT_RULES_JSON);return result;}

test('report projection fingerprint covers the complete interpretation and ordered metric layout',()=>{
  assert.equal(createHash('sha256').update(reportProjectionSelectSql('id = ?')).digest('hex'),REPORT_PROJECTION_RULE_SHA256);
  assert.equal(createHash('sha256').update(referralReportRuleDefinition()).digest('hex'),REFERRAL_REPORT_RULE_SHA256);
});

test('signature-format upgrade promotes only equivalent predecessor facts and preserves new-format/stale fallback', async () => {
  const f=fixture();
  try {
    const predecessor='2ca641b0fed3defaeb8bcc0556ec88a47abda3a7a8d4918655269007978569d2';
    const insert=f.sqlite.prepare(`INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,signature_status,signature_evidence,observed_at)
      VALUES('/upgrade',?,'ai','desktop',0,'verified',?,'2026-10-30 12:00:00')`);
    const envelope={version:'2026-10-27.5',source:'local-webbotauth',localStatus:'verified',localOutcome:'verified',verifierProfile:'2026-10-31.3',coverage:null};
    const ids=[];
    for(const e of [envelope,{...envelope,verifierProfile:'2026-11-13.1'}, {...envelope,coverage:{version:'2026-11-13.1'}},envelope]) {
      ids.push(Number(insert.run(String(ids.length+500).padStart(32,'0'),JSON.stringify(e)).lastInsertRowid));
    }
    rebuild(f.sqlite);
    f.sqlite.prepare('UPDATE page_observation_report_facts SET rule_sha256=?').run(predecessor);
    f.sqlite.prepare('UPDATE page_observation_report_facts SET rule_sha256=? WHERE observation_id=?').run('0'.repeat(64),ids[3]);
    const source=f.sqlite.prepare('SELECT * FROM page_observations ORDER BY id').all();
    const values=f.sqlite.prepare('SELECT * FROM page_observation_report_facts ORDER BY observation_id').all().map(({rule_sha256,...row})=>row);
    f.sqlite.exec(readFileSync(new URL('../schema/0003_signature_reporting_profiles.sql',import.meta.url),'utf8'));
    const fingerprint=id=>f.sqlite.prepare('SELECT rule_sha256 FROM page_observation_report_facts WHERE observation_id=?').get(id).rule_sha256;
    assert.equal(fingerprint(ids[0]),REPORT_PROJECTION_RULE_SHA256);
    assert.equal(fingerprint(ids[1]),predecessor);assert.equal(fingerprint(ids[2]),predecessor);assert.equal(fingerprint(ids[3]),'0'.repeat(64));
    assert.deepEqual(f.sqlite.prepare('SELECT * FROM page_observations ORDER BY id').all(),source);
    assert.deepEqual(f.sqlite.prepare('SELECT * FROM page_observation_report_facts ORDER BY observation_id').all().map(({rule_sha256,...row})=>row),values);
    assert.deepEqual(await queryProjectedStats(f.db,query,now),await queryStats(f.db,query,now));
  }finally{f.sqlite.close();}
});

test('complete projection, missing/stale fallback, dimension repairs and rebuild preserve exact reports',async()=>{
  const f=fixture();try{
    const source=f.sqlite.prepare('SELECT * FROM page_observations ORDER BY id').all();
    const expected=await queryStats(f.db,query,now);
    let before=f.batches();assert.deepEqual(await queryProjectedStats(f.db,query,now),expected);assert.equal(f.batches()-before,2);
    rebuild(f.sqlite);before=f.batches();assert.deepEqual(await queryProjectedStats(f.db,query,now),expected);assert.equal(f.batches()-before,1);
    assert.equal(rebuild(f.sqlite).changes,0);
    assert.deepEqual(f.sqlite.prepare('SELECT * FROM page_observations ORDER BY id').all(),source);
    f.sqlite.prepare('UPDATE page_observation_report_facts SET rule_sha256=? WHERE observation_id=1').run('0'.repeat(64));
    assert.deepEqual(await queryProjectedStats(f.db,query,now),expected);
    rebuild(f.sqlite);
    f.sqlite.prepare("UPDATE page_observations SET path='/repaired' WHERE id=1").run();
    assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM page_observation_report_facts WHERE observation_id=1').get().n,0);
    assert.deepEqual(await queryProjectedStats(f.db,query,now),await queryStats(f.db,query,now));
    rebuild(f.sqlite);
    f.sqlite.prepare('DELETE FROM page_observations WHERE id=1').run();
    assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM page_observation_report_facts WHERE observation_id=1').get().n,0);
    assert.deepEqual(await queryProjectedStats(f.db,query,now),await queryStats(f.db,query,now));
  }finally{f.sqlite.close();}
});

test('owner registry, referral changes, outgoing path scope and global empty-filter boundary stay read-time policies',async()=>{
  const f=fixture();try{
    rebuild(f.sqlite);
    const client=f.sqlite.prepare('SELECT daily_client_id FROM page_observations WHERE is_owner=0 LIMIT 1').get();
    f.sqlite.prepare("INSERT INTO owner_clients(daily_client_id,utc_date) VALUES(?,'2026-10-30')").run(client.daily_client_id);
    const policy={...ACTIVE_REFERRAL_POLICY,upstreamHosts:['google.com'],localRules:[],publicHosts:[]};
    for(const q of [query,{...query,path:'/alpha'},{range:'all',traffic:'crawlers'},{...query,path:'/absent'}])
      assert.deepEqual(await queryProjectedStats(f.db,q,now,policy),await queryStats(f.db,q,now,policy));
  }finally{f.sqlite.close();}
});

test('malformed accepted facts fail closed rather than publishing partial evidence',async()=>{
  const f=fixture();try{
    rebuild(f.sqlite);
    f.sqlite.prepare("UPDATE page_observation_report_facts SET report_native_category='invalid-fact' WHERE is_owner=0").run();
    await assert.rejects(queryProjectedStats(f.db,query,now),/Malformed/);
  }finally{f.sqlite.close();}
});


test('forward projection guards the acknowledged referral input and policy changes cannot reuse exclusions',async()=>{
  const f=fixture();try{
    const row=f.sqlite.prepare('SELECT id,referrer_host FROM page_observations WHERE is_owner=0 LIMIT 1').get();
    f.sqlite.prepare("UPDATE page_observations SET referrer_host='traffic2cash.xyz' WHERE id=?").run(row.id);
    await projectReportObservation(f.db,String(row.id),row.referrer_host);
    assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM page_observation_report_facts WHERE observation_id=?').get(row.id).n,0);
    await projectReportObservation(f.db,String(row.id),'traffic2cash.xyz');
    const fact=f.sqlite.prepare('SELECT report_referral_excluded,report_referral_rule_sha256 FROM page_observation_report_facts WHERE observation_id=?').get(row.id);
    assert.equal(fact.report_referral_excluded,1);assert.equal(fact.report_referral_rule_sha256,REFERRAL_REPORT_RULE_SHA256);
    rebuild(f.sqlite);
    assert.equal(f.sqlite.prepare(referralReportProjectionSql()).run(0,Number.MAX_SAFE_INTEGER,REFERRAL_REPORT_RULES_JSON).changes,0);
    f.sqlite.prepare('UPDATE page_observation_report_facts SET report_referral_rule_sha256=?').run('0'.repeat(64));
    const events=[];
    assert.deepEqual(await queryProjectedStats(f.db,query,now,undefined,event=>events.push(event)),await queryStats(f.db,query,now));
    assert.deepEqual(events.map(e=>e.readModel),['projection','source-fallback']);
  }finally{f.sqlite.close();}
});


test('core report and complete-window coverage use covering range searches',()=>{
  const f=fixture();try{
    const [plan]=buildProjectedStatsQueryPlan(query,createStatsWindow(query.range,now));
    const steps=f.sqlite.prepare('EXPLAIN QUERY PLAN '+plan.sql).all(...plan.values).map(row=>row.detail);
    assert.ok(steps.some(step=>step.includes('COVERING INDEX idx_page_observation_report_facts_public_cover')));
    assert.ok(steps.some(step=>step.includes('COVERING INDEX idx_page_observations_public_time')));
  }finally{f.sqlite.close();}
});

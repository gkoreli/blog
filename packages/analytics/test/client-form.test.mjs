import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { analyzeTraffic } from '../.test-dist/classify.js';
import { clientFormEvidence, CLIENT_FORMS, CLIENT_FORM_PROFILE, CLIENT_FORM_PROFILES } from '../.test-dist/client-form.js';
import { queryStats } from '../.test-dist/stats.js';

const browser='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/150.0.0.0 Safari/537.36';
const evidence=(ua,hint=null)=>clientFormEvidence(ua,hint,analyzeTraffic(ua).declarations.browserFamily);

test('unknowns and preference-only claims never become desktop or inferred tablet hardware',()=>{
  for(const ua of ['', 'curl/8.0','ExaUser/1.0','NotMobileish/1.0','UnknownTabletish/1.0','Silk/1.0','Android/1.0'])assert.equal(evidence(ua).form,'unknown',ua);
  assert.equal(evidence(browser).form,'no-form-marker');
  assert.equal(evidence(browser,'?0').form,'non-mobile-preference');
  assert.equal(evidence(browser,'?1').form,'mobile-preference');
  assert.equal(evidence('Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/150.0.0.0 Safari/537.36','?0').form,'non-mobile-preference');
  assert.equal(evidence('','?1').form,'mobile-preference');
  assert.equal(evidence('','?0').form,'non-mobile-preference');
});

test('exact markers preserve mobile/tablet compatibility, explicit conflicts and independent hint semantics',()=>{
  assert.equal(evidence('Mozilla/5.0 (iPad; CPU OS 18) AppleWebKit/605.1 Mobile/15E148 Safari/604.1','?0').form,'tablet-marker');
  assert.equal(evidence('Mozilla/5.0 (Android; Tablet) Mobile Safari/537.36','?0').form,'tablet-marker');
  assert.equal(evidence('Mozilla/5.0 (iPhone; CPU iPhone OS) Mobile/15E148 Safari/604.1','?1').form,'mobile-marker');
  assert.equal(evidence('iPhone iPad','?1').form,'conflicting-markers');
  assert.equal(evidence('IEMobile Tablet').form,'conflicting-markers');
  assert.equal(evidence('iPhone iPad').legacyCompatibility.value,'tablet');
  assert.equal(evidence(browser).legacyCompatibility.value,'desktop');
  assert.equal(evidence(browser).legacyCompatibility.defaulted,true);
  assert.equal(evidence('Mobile','?0').comparison,'different-indicators');
  assert.equal(evidence(browser,'?1').comparison,'different-indicators');
  assert.equal(evidence('iPad Mobile','?0').comparison,'not-comparable');
  assert.equal(evidence('Mobile','?1').comparison,'aligned-mobile');
});

test('unsupported hint text and unknown products cannot enter retained evidence; worst marker set fits budget',()=>{
  for(const hint of ['true','?2','?1, ?0','?1;x=private-canary','\u00a0?1\u00a0','\u00a0?0\u00a0','private-canary'.repeat(1000)]){
    const e=evidence('private-canary',hint);assert.equal(e.mobileHint,'unsupported');assert.equal(e.form,'unknown');assert.equal(JSON.stringify(e).includes('private-canary'),false);
  }
  assert.equal(evidence('',' ?0 ').mobileHint,'non-mobile');
  const e=evidence('Mobile iPhone iPod IEMobile iPad Tablet PlayBook','?0');assert.equal(e.markers.length,7);assert.ok(Buffer.byteLength(JSON.stringify(e))<=1024);assert.equal(e.form,'conflicting-markers');
});

test('new modern URI-excluded form markers preserve recognized history and the deprecated raw heuristic',()=>{
  assert.equal(CLIENT_FORM_PROFILE,'2026-11-10.1');
  assert.deepEqual(CLIENT_FORM_PROFILES,['2026-10-27.1','2026-11-06.1','2026-11-10.1']);
  for(const ua of ['https://example.test/iPad','https://example.test/;iPad','https://example.test/;Mobile']){
    const e=evidence(ua);assert.equal(e.profile,CLIENT_FORM_PROFILE);assert.equal(e.form,'unknown');assert.deepEqual(e.markers,[]);
    assert.equal(e.legacyCompatibility.value,ua.endsWith('Mobile')?'mobile':'tablet','raw compatibility is retained without claiming hardware');
  }
  const e=evidence(`${browser} (+https://example.test/;iPad;Mobile)`);
  assert.equal(e.form,'no-form-marker');assert.deepEqual(e.markers,[]);
  assert.equal(e.legacyCompatibility.value,'tablet');
  assert.equal(evidence(`iPhone (+https://example.test/;iPad)`).form,'mobile-marker','real form marker outside URI survives');
});

test('client-form migration preserves history and rejects invalid/oversized JSON',()=>{
  const sqlite=new DatabaseSync(':memory:');sqlite.exec(readFileSync(new URL('../schema.sql',import.meta.url),'utf8').split('\n').filter(s=>!s.trim().startsWith('client_form_evidence ')).join('\n'));
  sqlite.exec("INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner) VALUES('/old','00000000000000000000000000000000','browser','desktop',0)");sqlite.exec(readFileSync(new URL('../migrations/0015_client_form_evidence.sql',import.meta.url),'utf8'));
  assert.equal(sqlite.prepare('SELECT client_form_evidence FROM page_observations').get().client_form_evidence,null);
  assert.throws(()=>sqlite.prepare('UPDATE page_observations SET client_form_evidence=?').run('bad'));assert.throws(()=>sqlite.prepare('UPDATE page_observations SET client_form_evidence=?').run(JSON.stringify({x:'x'.repeat(1024)})));
});

test('new hint normalization preserves the recorded interpretation of both earlier form profiles',async()=>{
  const sqlite=new DatabaseSync(':memory:');
  try {
    sqlite.exec(readFileSync(new URL('../schema.sql',import.meta.url),'utf8'));
    const db={prepare(sql){return{bind(...v){return{execute(){return{results:sqlite.prepare(sql).all(...v)}}}}}},async batch(statements){return statements.map(s=>s.execute())}};
    const insert=sqlite.prepare("INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,observed_at,client_form_evidence)VALUES('/history',?,'browser','desktop',0,'browser','fixture','2026-11-10 01:00:00',?)");
    const current=evidence(browser,'\u00a0?1\u00a0');
    const records=[{...evidence(browser,'?1'),profile:'2026-10-27.1'}, {...evidence(browser,'?1'),profile:'2026-11-06.1'},current];
    records.forEach((record,index)=>insert.run(String(index+1).padStart(32,'0'),JSON.stringify(record)));
    const report=await queryStats(db,{range:'7d',traffic:'all',path:'/history'},new Date('2026-11-10T02:00:00Z'));
    assert.equal(report.clientFormEvidence.recordedViews,3);
    assert.equal(report.clientFormEvidence.unrecognizedRecordViews,0);
    assert.equal(report.clientFormEvidence.unsupportedHintViews,1);
    assert.equal(report.byClientForm.find(row=>row.form==='mobile-preference')?.views,2);
    assert.equal(report.byClientForm.find(row=>row.form==='no-form-marker')?.views,1);
  } finally {sqlite.close();}
});

test('form reporting partitions every selected row, preserves history/unsupported records and all exclusions',async()=>{
  const sqlite=new DatabaseSync(':memory:');sqlite.exec(readFileSync(new URL('../schema.sql',import.meta.url),'utf8'));
  const db={prepare(sql){return{bind(...v){return{execute(){return{results:sqlite.prepare(sql).all(...v)}}}}}},async batch(statements){return statements.map(s=>s.execute())}};
  let id=0;const insert=sqlite.prepare("INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,observed_at,client_form_evidence,referrer_host) VALUES(?,?,'browser',?,?,'browser','fixture',?,?,?)");
  const add=(value,opts={})=>insert.run(opts.path??'/a',(++id).toString(16).padStart(32,'0'),opts.legacy??'desktop',opts.owner??0,opts.at??'2026-10-27 01:00:00',value===null?null:JSON.stringify(value),opts.referrer??null);
  for(const type of ['desktop','mobile','tablet'])add(null,{legacy:type});
  for(const form of CLIENT_FORMS)add({...evidence(''),form});
  add(evidence('Mobile','?0'));add(evidence('','private-canary'));add({profile:'future-private-canary',form:'mobile-marker'});
  add(evidence('Mobile'),{owner:1});add(evidence('Mobile'),{referrer:'traffic2cash.xyz'});add(evidence('Mobile'),{path:'/other'});add(evidence('Mobile'),{at:'2026-10-28 00:00:00'});
  const report=await queryStats(db,{range:'7d',traffic:'all',path:'/a'},new Date('2026-10-27T02:00:00Z'));
  assert.equal(report.totals.views,13);assert.equal(report.byClientForm.reduce((sum,r)=>sum+r.views,0),13);assert.equal(report.byClientForm.length,11);assert.equal(report.clientFormEvidence.recordedViews+report.clientFormEvidence.historicalViews+report.clientFormEvidence.unrecognizedRecordViews,report.totals.views);assert.equal(Object.hasOwn(report,'byDevice'),false);
  assert.deepEqual(report.clientFormEvidence,{recordedViews:9,historicalViews:3,unrecognizedRecordViews:1,unsupportedHintViews:1,differingSignalsViews:1,legacyDefaultedViews:8});
  assert.equal(JSON.stringify(report).includes('private-canary'),false);
  assert.ok(report.byClientForm.every(r=>!['desktop','mobile','tablet'].includes(r.form)));
  const empty=await queryStats(db,{range:'7d',traffic:'all',path:'/missing'},new Date('2026-10-27T02:00:00Z'));assert.deepEqual(empty.byClientForm,[]);assert.ok(Object.values(empty.clientFormEvidence).every(n=>n===0));
});

test('form reporting recognizes both frozen producer profiles without reinterpreting their markers',async()=>{
  const sqlite=new DatabaseSync(':memory:');
  try {
    sqlite.exec(readFileSync(new URL('../schema.sql',import.meta.url),'utf8'));
    const db={prepare(sql){return{bind(...v){return{execute(){return{results:sqlite.prepare(sql).all(...v)}}}}}},async batch(statements){return statements.map(s=>s.execute())}};
    const insert=sqlite.prepare("INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,observed_at,client_form_evidence)VALUES('/mixed',?,'browser','tablet',0,'browser','fixture','2026-11-06 01:00:00',?)");
    const records=[
      {...evidence('iPad'),profile:'2026-10-27.1'},
      evidence('https://example.test/;iPad'),
      {...evidence('iPad'),profile:'future-profile'},
    ];
    records.forEach((record,index)=>insert.run(String(index+1).padStart(32,'0'),JSON.stringify(record)));
    const report=await queryStats(db,{range:'7d',traffic:'all',path:'/mixed'},new Date('2026-11-06T02:00:00Z'));
    assert.equal(report.totals.views,3);
    assert.equal(report.clientFormEvidence.recordedViews,2);
    assert.equal(report.clientFormEvidence.unrecognizedRecordViews,1);
    assert.equal(report.clientFormEvidence.historicalViews,0);
    assert.deepEqual(report.byClientForm.map(({form,views})=>({form,views})).sort((a,b)=>a.form.localeCompare(b.form)),[
      {form:'tablet-marker',views:1},{form:'unknown',views:1},{form:'unrecognized-record',views:1},
    ]);
  } finally { sqlite.close(); }
});

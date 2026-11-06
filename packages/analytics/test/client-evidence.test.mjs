import assert from 'node:assert/strict';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { queryStats } from '../.test-dist/stats.js';
import { verificationEvidence } from '../.test-dist/signature-evidence.js';
import { clientNameCoverage, consistentClientEvidence, decodeClientEvidenceRows } from '../.test-dist/client-evidence.js';
import { analyzeTraffic } from '../.test-dist/classify.js';
import { classificationEvidence } from '../.test-dist/classification-evidence.js';
import { extractRequestMetadata } from '../.test-dist/metadata.js';

function fixture() {
  const sqlite = new DatabaseSync(':memory:'); sqlite.exec(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'));
  let alter = rows => rows, sql;
  const db = { prepare(query) { sql = query; return { bind(...values) { return { execute() { return { results: alter(sqlite.prepare(query).all(...values)) }; } }; } }; }, async batch(statements) { return statements.map(statement => statement.execute()); } };
  const insert = sqlite.prepare(`INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,observed_at,agent_name,signature_evidence,referrer_host,classification_evidence) VALUES(?,?,'bot','desktop',?,?,?,'2026-11-05 01:00:00',?,?,?,?)`);
  let id = 0;
  function add({ kind = 'other-bot', name = null, category = 'AI Crawler', owner = 0, referrer = null, path = '/article', ua } = {}) {
    const request = new Request('https://fixture.example/article',ua===undefined?{}:{headers:{'User-Agent':ua}}); Object.defineProperty(request,'cf',{value:{verifiedBotCategory:category}});
    const evidence = verificationEvidence(request,{status:'absent'});
    const analysis=ua===undefined?null:analyzeTraffic(ua);
    const classification=analysis===null?null:classificationEvidence({...extractRequestMetadata(request),...analysis,observationSource:'edge',signature:{status:'absent'}},analysis.declarations);
    const client = (++id).toString(16).padStart(32,'0');
    insert.run(path,client,owner,kind,kind==='other-bot'?'generic-bot':'fixture',name,JSON.stringify(evidence),referrer,classification===null?null:JSON.stringify(classification));
    return client;
  }
  return { sqlite, db, add, alter: callback => alter = callback, sql: () => sql };
}
const now = new Date('2026-11-05T02:00:00Z'), query = {range:'7d',traffic:'all'};

test('the same-event table identifies unnamed crawler-role requests without inferring an operator or missing declarations', async () => {
  const f = fixture();
  f.add(); f.add(); f.add({name:'GoogleOther'});
  // Compatible multiple names intentionally have no selected scalar name.
  f.add({kind:'ai-assistant',category:'',ua:'ChatGPT-User/1.0 ExaUser/1.0'});
  const compatible=f.sqlite.prepare("SELECT agent_name,classification_evidence FROM page_observations WHERE reader_kind='ai-assistant'").get();
  assert.equal(compatible.agent_name,null);
  assert.deepEqual(JSON.parse(compatible.classification_evidence).declarations.candidates,['ChatGPT-User','ExaUser']);
  f.add({kind:null,category:'private-canary-category'});
  f.add({owner:1}); f.add({referrer:'traffic2cash.xyz'});
  const marked=f.add();f.sqlite.prepare("INSERT INTO owner_clients(daily_client_id,utc_date)VALUES(?,'2026-11-05')").run(marked);
  const report=await queryStats(f.db,query,now);
  assert.equal(report.totals.views,5);assert.equal(report.referralPolicy.excludedViews,1);
  assert.deepEqual(report.clientNameCoverage,{selectedNameViews:1,noSelectedNameViews:4});
  assert.deepEqual(report.byKindClientEvidence.filter(row=>row.kind==='other-bot'&&row.nativeCategory==='AI Crawler').map(row=>[row.nameSelection,row.signatureBasis,row.views]),[
    ['not-selected','unsigned',2],['selected','unsigned',1],
  ]);
  assert.equal(report.byKindClientEvidence.find(row=>row.kind===null).nativeCategory,'unrecognized');
  assert.equal(JSON.stringify(report.byKindClientEvidence).includes('private-canary'),false);
  assert.ok(consistentClientEvidence(report.byKindClientEvidence,report.clientNameCoverage,5,report.byKindSignature,report.byKindNativeCategory,report.byAgent));
  assert.ok(Buffer.byteLength(f.sql())<100000,'D1 SQL text limit');
  const empty=await queryStats(f.db,{...query,path:'/missing'},now);assert.deepEqual(empty.byKindClientEvidence,[]);assert.deepEqual(empty.clientNameCoverage,{selectedNameViews:0,noSelectedNameViews:0});
});

test('balanced total corruption cannot silently change name coverage or its signature/provider margins', async () => {
  const f=fixture();f.add();f.add({name:'GoogleOther'});
  const original=await queryStats(f.db,query,now);
  for(const mutate of [
    rows=>rows[0].views++,
    rows=>rows[0].key2=rows[0].key2==='selected'?'not-selected':'selected',
    rows=>rows[0].key3='AI Search',
    rows=>rows[0].key4='not-recorded',
    rows=>rows[0].key5='not-recorded',
    rows=>rows.push({...rows[0]}),
    rows=>rows[0].key2='private-canary',
  ]){
    f.alter(rows=>rows.map(row=>{
      if(row.section!=='client-evidence')return row;
      const payload=JSON.parse(row.payload);mutate(payload);return{...row,payload:JSON.stringify(payload)};
    }));
    await assert.rejects(queryStats(f.db,query,now),/Malformed|client evidence|Incomplete|Duplicate/);
  }
  f.alter(rows=>rows.filter(row=>row.section!=='client-evidence'));
  await assert.rejects(queryStats(f.db,query,now),/Malformed statistics report/);
  assert.equal(original.byKindClientEvidence.length,2);
});

test('browser consistency rejects duplicate marginal rows, unavailable dimensions and empty software names', () => {
  const rows=[{kind:'other-bot',nameSelection:'selected',nativeCategory:'AI Crawler',signatureBasis:'unsigned',verifierProfile:'not-recorded',views:2}];
  const signatures=[{kind:'other-bot',basis:'unsigned',profile:'not-recorded',views:2}];
  const categories=[{kind:'other-bot',basis:'AI Crawler',views:2}];
  const names=[{agentName:'GoogleOther',trafficClass:'bot',views:2}];
  const check=(s=signatures,c=categories,n=names,r=rows,coverage=clientNameCoverage(r))=>consistentClientEvidence(r,coverage,2,s,c,n);
  assert.equal(check(),true);
  assert.equal(check([{...signatures[0],views:1},{...signatures[0],views:1}]),false);
  assert.equal(check(signatures,[{...categories[0],views:1},{...categories[0],views:1}]),false);
  assert.equal(check(signatures,categories,[{...names[0],views:1},{...names[0],views:1}]),false);
  // Current catalogue membership must not erase a selected historical name.
  assert.equal(check(signatures,categories,[{...names[0],agentName:'HistoricalCrawlerName'}]),true);
  assert.equal(check(signatures,categories,[{...names[0],agentName:''}]),false);
  assert.equal(check(signatures,categories,[{...names[0],trafficClass:'browser'}]),false);
  assert.equal(check([{...signatures[0],kind:undefined}]),false);
  assert.equal(check(signatures,[{...categories[0],basis:undefined}]),false);
  assert.equal(check(signatures,categories,names,rows,{selectedNameViews:1,noSelectedNameViews:1}),false);
  for(const changes of [{nameSelection:'unknown'},{views:-1},{views:NaN},{kind:'unknown'},{nativeCategory:'unknown'},{verifierProfile:'future'}])assert.equal(check(signatures,categories,names,[{...rows[0],...changes}]),false);
  assert.throws(()=>decodeClientEvidenceRows([{key1:null,key2:'not-selected',key3:'empty',key4:'unsigned',key5:'not-recorded',views:0}],0),/Malformed/);
});

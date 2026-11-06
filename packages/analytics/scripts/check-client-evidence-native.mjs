import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { queryStats } from '../.test-dist/stats.js';
import { verificationEvidence } from '../.test-dist/signature-evidence.js';
import { consistentClientEvidence } from '../.test-dist/client-evidence.js';
import { schemaObjects } from './fresh-schema.mjs';

const output = process.argv[2], baselineDirectory = process.argv[3];
assert.ok(output,'Output path required');
const baseline = baselineDirectory ? await import(pathToFileURL(resolve(baselineDirectory,'stats.js'))) : null;
const require = createRequire(new URL('../../../package.json',import.meta.url));
const { Miniflare } = await import(pathToFileURL(require.resolve('miniflare',{paths:[dirname(require.resolve('wrangler/package.json'))]})));
const mf = new Miniflare({modules:true,script:'export default { fetch(){return new Response("native client evidence controls")} }',compatibilityDate:'2026-03-06',cf:{},d1Databases:{DB:'client-evidence-native'}});
const schema = await readFile(new URL('../schema/0001_fresh_analytics.sql',import.meta.url),'utf8');
const sqlite = new DatabaseSync(':memory:');sqlite.exec(schema);
const local = {
  prepare(sql){return{bind(...values){return{execute(){return{results:sqlite.prepare(sql).all(...values)}}}}}},
  async batch(statements){return statements.map(statement=>statement.execute())},
};
const db = await mf.getD1Database('DB');
const columns = ['path','daily_client_id','traffic_class','device_type','is_owner','reader_kind','reader_reason','observed_at','agent_name','signature_status','signature_evidence','referrer_host','referrer_state','internal_referrer_path'];
const insert = `INSERT INTO page_observations(${columns.join(',')})VALUES(${columns.map(()=>'?').join(',')})`;
const nodeInsert = sqlite.prepare(insert);
const requests = [
  {kind:'other-bot',name:null,category:'AI Crawler'},
  {kind:'other-bot',name:'GoogleOther',category:'AI Crawler'},
  {kind:'unresolved',name:null,category:'Search Engine Crawler'},
  {kind:'browser',name:null,category:''},
  {kind:'ai-assistant',name:null,category:'AI Assistant'},
  {kind:null,name:null,category:null},
  {kind:'future-private-canary-kind',name:null,category:'private-canary-category'},
  {kind:'seo-crawler',name:'AhrefsBot',category:'Search Engine Optimization'},
];
const queries = [
  {range:'7d',traffic:'all'}, {range:'30d',traffic:'all'}, {range:'all',traffic:'all'},
  ...['browser','agents','crawlers','automation','unresolved'].map(traffic=>({range:'7d',traffic})),
  ...['/article-a','/article-b','/missing'].map(path=>({range:'7d',traffic:'all',path})),
  {range:'7d',traffic:'all',kind:'other-bot'}, {range:'7d',traffic:'all',agent:'GoogleOther'},
];
const now = new Date('2026-11-06T05:42:48Z'), records = [];
const common = report => {const {clientNameCoverage,byKindClientEvidence,...remaining}=report;return remaining};
const canonical = value => Array.isArray(value) ? value.map(canonical).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)))
  : value !== null && typeof value==='object' ? Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([key,item])=>[key,canonical(item)])) : value;
const compare = (left,right) => assert.deepEqual(canonical(left),canonical(right));
try {
  // Reuse the parsed empty-install schema, including comments/quoted SQL safely.
  for(const row of schemaObjects(sqlite))await db.prepare(row.sql).run();
  // Same supplied population in native D1 and Node; IDs are synthetic and repeat.
  const nativeInserts = [];
  for(let index=0;index<512;index++){
    const item=requests[index%requests.length],request=new Request('https://fixture.example/article');
    Object.defineProperty(request,'cf',{value:item.category===null?{}:{verifiedBotCategory:item.category}});
    const evidence=index%29===0?null:verificationEvidence(request,{status:'absent'});
    const client=(index%101+1).toString(16).padStart(32,'0'),path=index%3===0?'/privacy':index%2===0?'/article-a':'/article-b';
    const values=[path,client,'bot','desktop',Number(index%17===0),item.kind,item.name??'fixture','2026-11-05 01:00:00',item.name,null,evidence===null?null:JSON.stringify(evidence),index%23===0?'traffic2cash.xyz':null,'absent',null];
    nodeInsert.run(...values);nativeInserts.push(db.prepare(insert).bind(...values));
  }
  for(let index=0;index<nativeInserts.length;index+=64)await db.batch(nativeInserts.slice(index,index+64));
  const owner='00000000000000000000000000000003';
  sqlite.prepare("INSERT INTO owner_clients(daily_client_id,utc_date)VALUES(?,'2026-11-05')").run(owner);
  await db.prepare("INSERT INTO owner_clients(daily_client_id,utc_date)VALUES(?,'2026-11-05')").bind(owner).run();
  for(const query of queries){
    let meter,currentSql;
    const measuredDb={prepare(sql){currentSql=sql;return db.prepare(sql)},batch:statements=>db.batch(statements)};
    const report=await queryStats(measuredDb,query,now,undefined,event=>meter=event);
    const nodeReport=await queryStats(local,query,now);compare(report,nodeReport);
    assert.ok(consistentClientEvidence(report.byKindClientEvidence,report.clientNameCoverage,report.totals.views,report.byKindSignature,report.byKindNativeCategory,report.byAgent));
    assert.ok(Buffer.byteLength(currentSql)<100000);assert.equal(meter.reportedRowsWritten,0);
    let oldMeter=null;
    if(baseline){
      const before=await baseline.queryStats(db,query,now,undefined,event=>oldMeter=event);
      compare(common(report),before);assert.equal(oldMeter.reportedRowsWritten,0);
    }
    records.push({query,events:report.totals.views,clientNameCoverage:report.clientNameCoverage,jointGroups:report.byKindClientEvidence.length,
      nodeNativeEqual:true,commonBaselineValuesEqual:baseline!==null,comparisonOrdering:'Unordered report tables compared as multisets; times and all field values retained.',
      sqlBytes:Buffer.byteLength(currentSql),sqlSha256:createHash('sha256').update(currentSql).digest('hex'),nativeMeter:meter,baselineNativeMeter:oldMeter});
  }
  const receipt={checkedAt:new Date().toISOString(),syntheticRows:512,selectors:queries.length,records,
    scope:'Supplied synthetic stored records and actual local workerd D1 SQL, not production prevalence, cryptographic proof, browser operation or Cloudflare identity.',
    baselineDirectory:baselineDirectory??null,productionCalls:0,humanLabels:0};
  await writeFile(output,JSON.stringify(receipt,null,2)+'\n',{flag:'wx',mode:0o600});
  console.log(JSON.stringify({selectors:queries.length,rows:512,allNodeNativeEqual:true,allCommonBaselineValuesEqual:baseline!==null,firstMeter:records[0].nativeMeter,firstBaselineMeter:records[0].baselineNativeMeter}));
}finally{sqlite.close();await mf.dispose()}

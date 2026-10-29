import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {queryStats} from '../.test-dist/stats.js';
import {fetchMetadataReportCtes,fetchMetadataReportProjectionSql,decodeFetchMetadataRows} from '../.test-dist/fetch-metadata-report.js';
import {consistentFetchMetadataSummary,FETCH_METADATA_REPORT_FIELDS,FETCH_METADATA_REPORT_STATES} from '../.test-dist/fetch-metadata-report-contract.js';
import {current,now,parsingCases} from './fixtures/fetch-metadata-summary.mjs';
function fixture(){const sqlite=new DatabaseSync(':memory:');sqlite.exec(readFileSync(new URL('../schema.sql',import.meta.url),'utf8'));return sqlite}
function add(db,row){const keys=Object.keys(row);return db.prepare(`INSERT INTO page_observations(${keys.join(',')})VALUES(${keys.map(()=>'?').join(',')})RETURNING id`).get(...Object.values(row)).id}
function cohorts(db,where='1'){return JSON.parse(db.prepare(`WITH included AS (SELECT * FROM page_observations WHERE ${where}),${fetchMetadataReportCtes()} SELECT (${fetchMetadataReportProjectionSql()}) AS payload`).get().payload)}
function database(sqlite){return {prepare(sql){return {bind(...values){return {sql,values}}}},async batch(statements){return statements.map(s=>({results:sqlite.prepare(s.sql).all(...s.values)}))}}}

test('parsing records distinguish syntax facts, historical absence of evidence and inconsistent records',async()=>{
 const db=fixture(),cases=parsingCases();
 assert.throws(()=>add(db,{...current(),classification_evidence:'{'}),/CHECK constraint failed/);
 for(const [label,row,state]of cases){const id=add(db,{...row,daily_client_id:cases.findIndex(c=>c[0]===label).toString(16).padStart(32,'0')});const result=cohorts(db,'id='+id);assert.equal(result.length,1);assert.equal(result[0].state,state,label)}
 const result=decodeFetchMetadataRows(cohorts(db),cases.length);assert.deepEqual(result.records,{recognizedViews:8,notRecordedViews:2,unrecognizedViews:6,inconsistentViews:9});
 assert.equal(result.fields.mode.absentViews,1);assert.equal(result.fields.mode.validViews,4);assert.equal(result.fields.mode.unrecognizedViews,1);assert.equal(result.fields.mode.policyLimitedViews,1);assert.equal(result.fields.mode.parametersViews,1);assert.equal(result.fields.mode.notAssessedViews,18);
 assert.equal(result.fields.activation.absentViews,1);assert.equal(result.fields.activation.invalidViews,1);assert.equal(result.fields.activation.validViews,5);assert.deepEqual(result.activation,{trueClaimViews:4,falseValueViews:1});
 assert.equal(JSON.stringify(result).includes('private-'),false);assert.equal(consistentFetchMetadataSummary(result,cases.length),true);
 const report=await queryStats(database(db),{range:'7d',traffic:'all'},now);assert.deepEqual(report.fetchMetadata,result);
});

test('every field follows the headline selection, owner/client/referral exclusions and path boundary',async()=>{
 const db=fixture();add(db,current());add(db,{...current(),is_owner:1});add(db,{...current(),referrer_host:'traffic2cash.xyz'});add(db,{...current(),daily_client_id:'1'.repeat(32)});db.prepare("INSERT INTO owner_clients(daily_client_id,utc_date)VALUES(?,?)").run('1'.repeat(32),'2026-10-29');
 add(db,{...current({'User-Agent':'ExaSearchBot/1.0'}),path:'/named'});add(db,{...current(),path:'/outgoing',referrer_state:'internal',internal_referrer_path:'/fixture',representation:'html'});
 for(const query of [{range:'7d',traffic:'all',path:'/fixture'},{range:'7d',traffic:'browser',path:'/fixture'},{range:'7d',traffic:'all',agent:'ExaSearchBot'},{range:'7d',traffic:'all',kind:'ai-search'},{range:'7d',traffic:'all',path:'/missing'},{range:'all',traffic:'all'}]){
  const report=await queryStats(database(db),query,now);assert.equal(consistentFetchMetadataSummary(report.fetchMetadata,report.totals.views),true);for(const field of FETCH_METADATA_REPORT_FIELDS)assert.equal(FETCH_METADATA_REPORT_STATES.reduce((n,key)=>n+report.fetchMetadata.fields[field][key],0),report.totals.views);
  if(query.path==='/fixture'){assert.equal(report.totals.views,1);assert.equal(report.fetchMetadata.records.recognizedViews,1);assert.equal(report.referralPolicy.excludedViews,1);assert.equal(report.internalTransitions.length,1)}
  if(query.agent){assert.equal(report.totals.views,1);assert.equal(report.fetchMetadata.records.recognizedViews,1)}
  if(query.path==='/missing')assert.equal(report.totals.views,0);
 }
});

test('malformed cohort rows and inconsistent summaries fail instead of returning plausible totals',()=>{
 const valid={state:'recognized',bits:1170,activation:1,views:1},base=decodeFetchMetadataRows([valid],1);
 for(const rows of [[{...valid,activation:null}],[{...valid,bits:7}],[{...valid,bits:2194,activation:1}],[{...valid,state:'future-private-state'}],[{...valid,views:1.5}],[{...valid,views:0}],[{...valid,extra:'private-canary'}],[valid,valid],[{state:'not-recorded',bits:1170,activation:null,views:1}],[{state:'not-recorded',bits:null,views:1}]])assert.throws(()=>decodeFetchMetadataRows(rows,1));
 for(const mutate of [v=>delete v.fields.mode,v=>v.records.notRecordedViews++,v=>v.fields.mode.absentViews++,v=>v.fields.mode.parametersViews=2,v=>v.activation.falseValueViews=1,v=>v.fields.mode.validViews='1',v=>v.fields.mode.extra=1,v=>v.records.recognizedViews=Infinity,v=>{v.fields.activation.validViews=0;v.fields.activation.unrecognizedViews=1;v.activation.trueClaimViews=0}]){const value=structuredClone(base);mutate(value);assert.equal(consistentFetchMetadataSummary(value,1),false)}
 assert.throws(()=>decodeFetchMetadataRows([valid],2));assert.equal(consistentFetchMetadataSummary(undefined,1),false);
});

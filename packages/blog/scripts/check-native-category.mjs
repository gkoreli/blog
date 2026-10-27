import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { queryStats } from '../../analytics/.test-dist/stats.js';
import { COLLECTION_VERSION } from '../../analytics/.test-dist/versions.js';

const [output, fixtureOutput] = process.argv.slice(2); assert.ok(output && fixtureOutput);
assert.equal(existsSync(output) || existsSync(fixtureOutput), false, 'Use new receipt/fixture paths');
const baselineCommit = 'ce2eecd';
const oldSource = execFileSync('git', ['show', baselineCommit + ':packages/analytics/src/stats.ts'], { encoding: 'utf8' });
const oldBundle = await build({ stdin: { contents: oldSource, resolveDir: resolve('packages/analytics/src'), loader: 'ts' }, bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent' });
const { queryStats: oldQueryStats } = await import('data:text/javascript;base64,' + Buffer.from(oldBundle.outputFiles[0].contents).toString('base64'));
const bundle = await build({ stdin: { resolveDir: process.cwd(), contents: `
  import { observePageResponse } from './packages/analytics/src/index.ts';
  const states={known:{verifiedBotCategory:'Search Engine Crawler'},empty:{verifiedBotCategory:''},unavailable:{},unrecognized:{verifiedBotCategory:'private-canary@example.test'},'known-false':{verifiedBotCategory:'AI Search',botManagement:{verifiedBot:false,signedAgent:false}},owner:{verifiedBotCategory:'AI Assistant'},referral:{verifiedBotCategory:'AI Crawler'}};
  export default { fetch(request,env,ctx) {
    const label=new URL(request.url).searchParams.get('fixture');
    const copy=new Request(request); Object.defineProperty(copy,'cf',{value:states[label]});
    const response=new Response('Native category fixture',{headers:{'Content-Type':'text/html'}});
    observePageResponse(copy,response,'html',env,ctx,{verifiedOwnerExclusion:label==='owner'});return response;
  }};
` }, bundle: true, write: false, format: 'esm', platform: 'browser', logLevel: 'silent' });
const req = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(req.resolve('miniflare', { paths: [dirname(req.resolve('wrangler/package.json'))] })));
const mf = new Miniflare({ modules: true, script: bundle.outputFiles[0].text, compatibilityDate: '2026-03-06', d1Databases: { DB: 'native-category' }, bindings: { ANALYTICS_HASH_KEY: 'local-fixture-only' } });
try {
  const db = await mf.getD1Database('DB');
  const schema = readFileSync('packages/analytics/schema.sql', 'utf8').replace(/^\s*--.*$/gm, '');
  await db.batch(schema.split(';').map(s => s.trim()).filter(Boolean).map(s => db.prepare(s)));
  const insert = "INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,observed_at,signature_evidence) VALUES('/history','00000000000000000000000000000000','bot','desktop',0,'other-bot','fixture',datetime('now'),NULL)";
  await db.prepare(insert).run();
  const trials = [];
  for (const label of ['known','empty','unavailable','unrecognized','known-false','owner','referral']) {
    const path = label === 'referral' ? '/privacy' : label === 'owner' ? '/fixture-owner' : '/' + label;
    const headers = label === 'referral' ? { Referer: 'https://traffic2cash.xyz/' } : {};
    assert.equal((await mf.dispatchFetch('https://publication.example' + path + '?fixture=' + label, { headers })).status, 200);
    let row;
    for (let i = 0; i < 25; i++) {
      row = await db.prepare('SELECT collection_version,signature_evidence,request_evidence FROM page_observations WHERE path=?').bind(path).first();
      if (row) break; await new Promise(resolve => setTimeout(resolve, 25));
    }
    assert.ok(row, 'Missing stored fixture: ' + label); assert.equal(row.collection_version, COLLECTION_VERSION); assert.equal(row.request_evidence, null);
    assert.equal(row.signature_evidence.includes('private-canary'), false);
    const evidence = JSON.parse(row.signature_evidence); assert.equal(evidence.version, '2026-10-27.4');
    assert.equal(evidence.localOutcome, 'absent');
    const expected = ['known','known-false','owner','referral'].includes(label) ? 'known' : label;
    assert.equal(evidence.native.category.status, expected);
    assert.equal(evidence.native.verifiedBot, label === 'known-false' ? false : null);
    trials.push({ label, category: evidence.native.category, nativeVerifiedBot: evidence.native.verifiedBot, localOutcome: evidence.localOutcome });
  }
  const query = { range:'7d',traffic:'all' }, now = new Date();
  let last;
  const tap = { prepare(sql) { return { bind(...values) { last={sql,values};return db.prepare(sql).bind(...values); } }; }, async batch(statements) { const result=await db.batch(statements);last.meta=result[0].meta;return result; } };
  const report = await queryStats(tap,query,now);
  assert.equal(report.totals.views,6); assert.equal(report.referralPolicy.excludedViews,1);
  assert.equal(report.byKindNativeCategory.reduce((n,r)=>n+r.views,0),6); assert.equal(report.verification.nativeAvailableViews,1);
  const empty = await queryStats(tap,{...query,path:'/missing'},now); assert.deepEqual(empty.byKindNativeCategory,[]);
  const scoped = await queryStats(tap,{...query,path:'/known'},now); assert.deepEqual(scoped.byKindNativeCategory,[{kind:'unresolved',basis:'Search Engine Crawler',views:1}]);
  const sql = readFileSync('packages/blog/drafts/research/analytics-retrospective/native-category-control-acceptance.sql','utf8').replace("collection_version='2026-10-27.7'", "collection_version='" + COLLECTION_VERSION + "'");
  const binds=['2000-01-01 00:00:00','2100-01-01 00:00:00'];
  const selected=(await db.prepare(sql).bind(...binds).all()).results;assert.equal(selected.length,1);assert.equal(selected[0].categoryStatus,'known');
  const plan=(await db.prepare('EXPLAIN QUERY PLAN '+sql).bind(...binds).all()).results;assert.ok(plan.some(r=>r.detail.includes('idx_page_observations_public_path_time')));
  writeFileSync(fixtureOutput,JSON.stringify([report,scoped,empty],null,2)+'\n',{flag:'wx',mode:0o600});
  await db.prepare('DELETE FROM page_observations').run();
  for(let i=0;i<8;i++) await db.batch(Array.from({length:64},()=>db.prepare(insert)));
  const old=await oldQueryStats(tap,query,now),oldReads=last.meta.rows_read;
  const current=await queryStats(tap,query,now),currentReads=last.meta.rows_read;
  const {byKindNativeCategory,...common}=current;assert.deepEqual(common,old);assert.equal(current.totals.views,512);
  assert.deepEqual(byKindNativeCategory,[{kind:'other-bot',basis:'not-recorded',views:512}]);
  const sources=['packages/analytics/src/native-bot-evidence.ts','packages/analytics/src/signature-evidence.ts','packages/analytics/src/signature-basis.ts','packages/analytics/src/stats.ts','packages/analytics/src/versions.ts','packages/blog/drafts/research/analytics-retrospective/native-category-control-acceptance.sql'];
  writeFileSync(output,JSON.stringify({checkedAt:new Date().toISOString(),runtime:process.version,baselineCommit,
    method:'Actual collector and persistence in native local workerd/D1 with deliberately supplied cf fixtures. No native Cloudflare verdict, vendor request or human label. Baseline SQL compiled from pinned source with current helpers; the cost dataset contains only older null evidence, exercising unchanged shared-helper behavior.',
    trials,checks:{historyUnrecorded:true,categoryIndependentOfBooleans:true,closedPrivateOutput:true,ownerAndReferralExclusion:true,scopedAndEmpty:true,partitionInvariant:true,commonReportUnchanged:true,optionalCaptureOff:true},
    reportCategories:report.byKindNativeCategory,measurements:{storedFixtureRows:512,oldReads,currentReads,delta:currentReads-oldReads},queryPlan:plan,
    sourceSha256:Object.fromEntries(sources.map(f=>[f,createHash('sha256').update(readFileSync(f)).digest('hex')])),networkCalls:0,productionCalls:0,
    limits:['Fixture metering is not a production cost forecast. The report adds a grouped scan within the same statement.','Provider category does not establish a native Web Bot Auth verdict, exact vendor product, actual purpose, human trigger or permission.'],
  },null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({trials:trials.length,oldReads,currentReads,productionCalls:0}));
}finally{await mf.dispose();}

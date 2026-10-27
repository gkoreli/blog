import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
import { queryStats } from '../../analytics/.test-dist/stats.js';
import { unreportedKindFixtures, INSERT_UNREPORTED_FIXTURE, unreportedFixtureValues } from '../../analytics/test/fixtures/unreported-kinds.mjs';

const [output, privateFixtures, productionStatement] = process.argv.slice(2);
assert.ok(output && privateFixtures && productionStatement && ![output,privateFixtures,productionStatement].some(existsSync));
const baseline = '0badd15', baseFiles = ['stats.ts','partition.ts','contracts.ts'];
const original = Object.fromEntries(baseFiles.map(file=>[file,execFileSync('git',['show',`${baseline}:packages/analytics/src/${file}`],{encoding:'utf8'})]));
const bundle = await build({ stdin:{contents:original['stats.ts'],resolveDir:resolve('packages/analytics/src'),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node',logLevel:'silent',
  plugins:[{name:'pinned-baseline-partition-and-contracts',setup(build){build.onLoad({filter:/\/(partition|contracts)\.ts$/},args=>({contents:original[args.path.split('/').at(-1)],loader:'ts'}));}}] });
const {queryStats:oldQueryStats}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].contents).toString('base64'));
const req=createRequire(resolve('package.json'));
const {Miniflare}=await import(pathToFileURL(req.resolve('miniflare',{paths:[dirname(req.resolve('wrangler/package.json'))]})));
const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("fixture only")}}',compatibilityDate:'2026-03-06',d1Databases:{DB:'unreported-kinds',KNOWN:'known-control'}});
try {
  const db=await mf.getD1Database('DB'),known=await mf.getD1Database('KNOWN');
  const schema=readFileSync('packages/analytics/schema.sql','utf8').replace(/^\s*--.*$/gm,'');
  for(const database of [db,known])await database.batch(schema.split(';').map(s=>s.trim()).filter(Boolean).map(s=>database.prepare(s)));
  const fixtures=unreportedKindFixtures();
  for(const row of fixtures)await db.prepare(INSERT_UNREPORTED_FIXTURE).bind(...unreportedFixtureValues(row)).run();
  for(const index of [0,2,3,5])await known.prepare(INSERT_UNREPORTED_FIXTURE).bind(...unreportedFixtureValues(fixtures[index])).run();
  const beforeRows=(await db.prepare('SELECT * FROM page_observations ORDER BY id').all()).results;
  let last;
  const tap=database=>({prepare(sql){return{bind(...values){last={sql,values};return database.prepare(sql).bind(...values);}};},async batch(statements){const result=await database.batch(statements);last.meta=result[0].meta;return result;}});
  const now=new Date('2026-10-27T12:00:00Z'),counts={before:{},after:{}},afterReports={};
  for(const [phase,run]of [['before',oldQueryStats],['after',queryStats]])for(const traffic of ['all','browser','agents','crawlers','automation','unresolved']){
    const data=await run(tap(db),{range:'7d',traffic,path:'/audit'},now);
    counts[phase][traffic]={views:data.totals.views,compositionViews:data.byKind.reduce((n,r)=>n+r.views,0),rowsRead:last.meta.rows_read,rowsWritten:last.meta.rows_written};
    if(phase==='after')afterReports[traffic]=data;
  }
  assert.equal(counts.before.all.views,10);assert.equal(counts.before.all.compositionViews,5);assert.equal(counts.before.unresolved.views,1);
  assert.equal(counts.after.all.views,10);assert.equal(counts.after.all.compositionViews,10);assert.equal(counts.after.unresolved.views,5);
  for(const row of Object.values(counts.after))assert.equal(row.views,row.compositionViews);
  assert.equal(Object.entries(counts.after).filter(([kind])=>kind!=='all').reduce((n,[,r])=>n+r.views,0),10);
  assert.equal(afterReports.all.byKind.find(row=>row.reason==='unrecognized-stored-classification').dailyClients,1);
  assert.equal(afterReports.all.referralPolicy.excludedViews,1);
  assert.equal((await queryStats(db,{range:'7d',traffic:'all',path:'/audit',kind:'unresolved'},now)).totals.views,5);
  const allTime=await queryStats(db,{range:'all',traffic:'unresolved',path:'/audit'},now);assert.equal(allTime.totals.views,6);
  const knownBefore=await oldQueryStats(tap(known),{range:'7d',traffic:'all',path:'/audit'},now),knownBeforeReads=last.meta.rows_read;
  const knownAfter=await queryStats(tap(known),{range:'7d',traffic:'all',path:'/audit'},now),knownAfterReads=last.meta.rows_read;
  assert.deepEqual(knownAfter,knownBefore);
  const kindOnly=await queryStats(db,{range:'7d',traffic:'agents',path:'/audit',kind:'ai-assistant'},now);assert.equal(kindOnly.totals.views,1);
  assert.deepEqual((await db.prepare('SELECT * FROM page_observations ORDER BY id').all()).results,beforeRows);
  for(const data of Object.values(afterReports))for(const canary of ['private-kind','private-reason','another-private'])assert.equal(JSON.stringify(data).includes(canary),false);
  // Native-accept the exact prospective report statement before production use.
  const prospectiveQuery={range:'7d',traffic:'all',path:'/privacy'};
  await queryStats(tap(db),prospectiveQuery,new Date());
  const statement={sql:last.sql,values:last.values,query:prospectiveQuery,readCeiling:50000,method:'One prepared report statement. No production mutation or unknown-kind seeding; command-mode argv only.'};
  writeFileSync(productionStatement,JSON.stringify(statement,null,2)+'\n',{flag:'wx',mode:0o600});
  writeFileSync(privateFixtures,JSON.stringify({afterReports,kindOnly,allTime,prospectiveLocalMeta:last.meta},null,2)+'\n',{flag:'wx',mode:0o600});
  const baselineSource=Object.fromEntries(baseFiles.map(file=>[file,createHash('sha256').update(original[file]).digest('hex')]));
  const result={checkedAt:new Date().toISOString(),method:'Native local D1; pinned baseline stats/partition/contracts, current unchanged shared helpers, same fifteen synthetic stored rows. Known-valid control uses four rows.',baseline,baselineSource,counts,
    knownControl:{fullResponseEqual:true,beforeReads:knownBeforeReads,afterReads:knownAfterReads},checks:{storedHistoryUnchanged:true,ownerReferralPathFutureBoundaries:true,allTimeUnknownScope:true,namedUnknownScopeCoveredByUnitTests:true,sqlGroupingDistinctClients:true,rawCanariesWithheld:true,legacyCombinedAndKindOnlySelectionsPreserved:true,prospectiveStatementNativeAccepted:true},
    productionRequests:0,limits:['Synthetic storage/report fixtures, not measured prevalence of missing classifications in production.','All totals and known-kind groups are preserved; unknown-role composition and Unresolved selections intentionally change.','Current shared helpers are unchanged in behavior; the old partition is pinned so it cannot silently use the new Unresolved semantics.','Observed reads are local fixture costs, not production forecasts. Daily-client counts must not be summed across groups.']};
  writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({before:counts.before.all,after:counts.after.all,unresolvedBefore:1,unresolvedAfter:5,knownResponseEqual:true}));
} finally { await mf.dispose(); }

import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
import { queryStats } from '../../analytics/.test-dist/stats.js';

const [output, privatePrefix] = process.argv.slice(2);
assert.ok(output && privatePrefix, 'Usage: check-native-boolean-availability.mjs RESULTS PRIVATE_PREFIX');
const baseline = '31abaf4', sourceRoot = resolve('packages/analytics/src');
const previous = path => execFileSync('git',['show',`${baseline}:${path}`],{encoding:'utf8'});
const oldBuild = await build({ stdin:{contents:previous('packages/analytics/src/stats.ts'),loader:'ts',resolveDir:sourceRoot},
  bundle:true,write:false,format:'esm',platform:'node',logLevel:'silent',plugins:[{ name:'pin-baseline-graph',setup(builder) {
    builder.onLoad({filter:/[/\\]analytics[/\\]src[/\\].*\.ts$/}, args => ({
      contents:previous('packages/analytics/src/'+relative(sourceRoot,args.path).replaceAll('\\','/')),
      loader:'ts',resolveDir:dirname(args.path),
    }));
  }}] });
const oldStats = (await import('data:text/javascript;base64,'+Buffer.from(oldBuild.outputFiles[0].contents).toString('base64'))).queryStats;
const req = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(req.resolve('miniflare',{paths:[dirname(req.resolve('wrangler/package.json'))]})));
const mf = new Miniflare({modules:true,script:'export default{fetch(){return new Response("native availability fixtures")}}',
  compatibilityDate:'2026-03-06',cf:{},d1Databases:{DB:'native-boolean-availability'}});
const added = ['nativeVerifiedBotAvailableViews','nativeSignedAgentAvailableViews'];
const common = report => ({...report,verification:Object.fromEntries(Object.entries(report.verification).filter(([key]) => !added.includes(key)))});
const now = new Date('2026-10-30T05:00:00Z'), query = {range:'7d',traffic:'all',path:'/fixture'};
const evidence = native => ({version:'2026-10-27.1',source:'local-webbotauth',verifierProfile:'fixture',localStatus:'absent',localReason:null,coverage:null,native});
const controls = [], costs = [], captures = [];
try {
  const db = await mf.getD1Database('DB');
  const schema = readFileSync('packages/analytics/schema.sql','utf8').replace(/^\s*--.*$/gm,'');
  await db.batch(schema.split(';').map(x => x.trim()).filter(Boolean).map(x => db.prepare(x)));
  let id = 0, last;
  const insert = (native,options={}) => db.prepare(`INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,reader_kind,
    reader_reason,observed_at,signature_evidence,is_owner,referrer_host) VALUES('/fixture',?,'ai','desktop','other-bot','fixture',?,?,?,?)`)
    .bind(String(++id).padStart(32,'0'),options.at??'2026-10-30 04:00:00',options.history?null:JSON.stringify(evidence(native)),options.owner??0,options.referrer??null);
  const tap = {prepare(sql) { return {bind(...values) { last={sql,values};return db.prepare(sql).bind(...values); }}; },
    async batch(statements) {const results=await db.batch(statements);last={...last,meta:results[0].meta,rows:results[0].results};return results;} };
  async function compare(label,selection=query) {
    const before=await oldStats(tap,selection,now), oldCapture=last, after=await queryStats(tap,selection,now), newCapture=last;
    assert.deepEqual(common(after),before,label+' common fields'); assert.deepEqual(newCapture.values,oldCapture.values);
    assert.equal(newCapture.meta.rows_written,0); assert.ok(Buffer.byteLength(newCapture.sql)<100000);
    const raw=JSON.parse(newCapture.rows.find(x=>x.section==='verification').payload)[0];assert.equal(Object.keys(raw).length,46);
    if(!after.totals.views)assert.ok(Object.values(raw).every(x=>x===null),'empty SQL aggregates stay explicit null');
    costs.push({label,beforeReads:oldCapture.meta.rows_read,afterReads:newCapture.meta.rows_read,writes:0,commonOutputEqual:true,
      sqlBytes:Buffer.byteLength(newCapture.sql),parameters:newCapture.values.length});
    captures.push({label,sql:newCapture.sql,values:newCapture.values,rawRows:newCapture.rows});return {before,after};
  }
  const pairs=[];
  for(const verifiedBot of [true,false,null])for(const signedAgent of [true,false,null]) {
    await db.prepare('DELETE FROM page_observations').run();await insert({verifiedBot,signedAgent}).run();
    const result=await compare(`verified:${verifiedBot}/signed:${signedAgent}`),v=result.after.verification;
    assert.equal(v.nativeVerifiedBotAvailableViews,Number(verifiedBot!==null));
    assert.equal(v.nativeSignedAgentAvailableViews,Number(signedAgent!==null));
    assert.equal(v.nativeVerifiedBotAvailableViews-v.nativeVerifiedBotViews,Number(verifiedBot===false));
    assert.equal(v.nativeSignedAgentAvailableViews-v.nativeSignedAgentViews,Number(signedAgent===false));
    controls.push({verifiedBot,signedAgent,availableVerified:v.nativeVerifiedBotAvailableViews,availableSigned:v.nativeSignedAgentAvailableViews});
    if(verifiedBot===true && signedAgent!==true)pairs.push(result);
  }
  assert.deepEqual(pairs[0].before,pairs[1].before);assert.notDeepEqual(pairs[0].after,pairs[1].after);
  await db.prepare('DELETE FROM page_observations').run();
  const cases=[];for(const verifiedBot of [true,false,null])for(const signedAgent of [true,false,null])cases.push({verifiedBot,signedAgent});
  cases.push({verifiedBot:true,signedAgent:1},{verifiedBot:false},null);
  const rows=Array.from({length:512},(_,i)=>({native:cases[i%cases.length],options:{history:i%17===0,owner:Number(i%19===0),referrer:i%23===0?'traffic2cash.xyz':null}}));
  for(let i=0;i<rows.length;i+=64)await db.batch(rows.slice(i,i+64).map(x=>insert(x.native,x.options)));
  const mixed=await compare('mixed-512'),included=rows.filter(x=>!x.options.owner&&!x.options.referrer);
  const recognized=x=>!x.options.history && x.native!==null && (x.native.verifiedBot===null || typeof x.native.verifiedBot==='boolean')
    && (x.native.signedAgent===null || typeof x.native.signedAgent==='boolean') && Object.hasOwn(x.native,'verifiedBot') && Object.hasOwn(x.native,'signedAgent');
  for(const [field,count] of [['verifiedBot','nativeVerifiedBotAvailableViews'],['signedAgent','nativeSignedAgentAvailableViews']])
    assert.equal(mixed.after.verification[count],included.filter(x=>recognized(x)&&typeof x.native[field]==='boolean').length);
  assert.equal(mixed.after.totals.views,included.length);
  const historyRows=Array.from({length:512},()=>insert(null,{history:true}));
  await db.prepare('DELETE FROM page_observations').run();
  for(let i=0;i<historyRows.length;i+=64)await db.batch(historyRows.slice(i,i+64));
  await compare('history-512');await compare('empty-path',{...query,path:'/missing'});await compare('all-time',{...query,range:'all'});
  writeFileSync(privatePrefix+'-client.json',JSON.stringify(mixed.after,null,2)+'\n',{flag:'wx',mode:0o600});
  writeFileSync(privatePrefix+'-sql.json',JSON.stringify(captures,null,2)+'\n',{flag:'wx',mode:0o600});
  const result={checkedAt:new Date().toISOString(),baseline,method:'Actual workerd/D1 synthetic stored records; no provider verdict or cryptographic comparison.',
    controls,counterexample:{baselineAllFieldsEqual:true,candidateSeparatesFalseAndNull:true},costs,verificationFields:46,
    unionMeaning:'At least one boolean; each field denominator includes only its explicit true/false in the existing recognized envelope.',
    productionRequests:0,productionSqlStatements:0,humanLabels:0,scriptSha256:createHash('sha256').update(readFileSync('packages/blog/scripts/check-native-boolean-availability.mjs')).digest('hex')};
  writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({controls:controls.length,costs,productionRequests:0}));
} finally {await mf.dispose();}

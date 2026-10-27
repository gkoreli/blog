import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { observePageResponse } from '../../../../analytics/.test-dist/index.js';
import { queryStats } from '../../../../analytics/.test-dist/stats.js';
import { parseVendorIpFeed } from '../../../../analytics/.test-dist/vendor-ip.js';
import { VENDOR_IP_SOURCES } from '../../../../analytics/.test-dist/vendor-ip-sources.js';

// Saved PUBLIC vendor feeds, synthetic source addresses and an intercepted fetch.
// Node collector + workerd D1, not real vendor requests or production acceptance.
const [input, output, mode] = process.argv.slice(2);
if (!input || !output) throw new Error('Provide saved-public-feed directory and a new output JSON path; optional --timeout');
const require = createRequire(resolve('package.json'));
const ipaddr = createRequire(resolve('packages/analytics/package.json'))('ipaddr.js');
const { Miniflare } = await import(pathToFileURL(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] })));
const mf = new Miniflare({ modules: true, script: 'export default {fetch(){return new Response("fixture")}}', compatibilityDate: '2026-03-06', d1Databases: { DB: 'vendor-ip-local' } });
const originalFetch = globalThis.fetch;
try {
  const db = await mf.getD1Database('DB');
  const old = readFileSync('packages/analytics/schema.sql','utf8').split('\n').filter(s=>!s.trim().startsWith('vendor_ip_evidence ')).join('\n').replace(/^--.*$/gm,'');
  await db.batch(old.split(';').map(s=>s.trim()).filter(Boolean).map(s=>db.prepare(s)));
  await db.prepare("INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,observed_at) VALUES('/historical','00000000000000000000000000000000','browser','desktop',0,'browser','fixture',datetime('now'))").run();
  await db.prepare(readFileSync('packages/analytics/migrations/0014_vendor_ip_evidence.sql','utf8').replace(/^--.*$/gm,'')).run();
  assert.equal((await db.prepare('SELECT vendor_ip_evidence FROM page_observations').first()).vendor_ip_evidence,null);
  const feeds = new Map(); const sourceSummary=[];
  for(const source of VENDOR_IP_SOURCES){
    const body=readFileSync(join(input,source.id+'.json'));const parsed=parseVendorIpFeed(JSON.parse(body));assert.notEqual(parsed,null,source.id);
    const headers=new Headers();for(const line of readFileSync(join(input,source.id+'-headers.txt'),'utf8').split(/\r?\n/)){const colon=line.indexOf(':');if(colon<0)continue;const key=line.slice(0,colon).toLowerCase();if(['content-type','cache-control','age','etag','last-modified'].includes(key))headers.set(key,line.slice(colon+1).trim());}
    feeds.set(source.url,{body,headers});sourceSummary.push({id:source.id,url:source.url,documentation:source.documentation,bytes:body.byteLength,prefixCount:parsed.prefixes.length,publisherVersion:parsed.publisherVersion,sha256:createHash('sha256').update(body).digest('hex')});
  }
  let fetches=0;
  globalThis.fetch=async url=>{fetches++;assert.ok(feeds.has(String(url)));if(mode==='--timeout')return new Promise(()=>{});const saved=feeds.get(String(url));return new Response(saved.body,{headers:saved.headers});};
  const trials=[];
  async function collect(label,names,ip,expected,extra={}){
    const headers={'User-Agent':names.map(n=>n+'/1.0').join(' ')||'SyntheticClient/1.0',Accept:'text/html','CF-Connecting-IP':ip,...extra};const request=new Request('https://publication.example/'+label,{headers});Object.defineProperty(request,'cf',{value:{asn:64512}});const pending=[];const start=performance.now();
    observePageResponse(request,new Response('fixture',{headers:{'Content-Type':'text/html'}}),'html',{DB:db,ANALYTICS_HASH_KEY:'local-only'},{waitUntil:p=>pending.push(p)});await Promise.all(pending);
    const row=await db.prepare('SELECT vendor_ip_evidence,request_evidence,collection_version,classifier_version,agent_name,reader_kind FROM page_observations WHERE path=?').bind('/'+label).first();assert.ok(row);const e=JSON.parse(row.vendor_ip_evidence);
    assert.equal(row.collection_version,'2026-10-27.4');assert.equal(row.classifier_version,'2026-10-27.4');assert.equal(row.request_evidence,null);assert.ok(Buffer.byteLength(row.vendor_ip_evidence)<=4096);if(expected)assert.ok(e.checks.some(c=>c.outcome===expected),label);
    if(ip)assert.equal(row.vendor_ip_evidence.includes(ip),false,label);trials.push({label,evidence:e,bytes:Buffer.byteLength(row.vendor_ip_evidence),storedName:row.agent_name,storedKind:row.reader_kind,elapsedMs:Math.round(performance.now()-start)});return e;
  }
  if(mode==='--timeout'){
    const e=await collect('timeout',['Googlebot'],'66.249.66.1','unavailable');assert.equal(e.checks[0].reason,'fetch-timeout');assert.equal(trials[0].storedKind,'search-crawler');assert.ok(trials[0].elapsedMs<2400);
  }else{
    for(const source of VENDOR_IP_SOURCES){const parsed=JSON.parse(feeds.get(source.url).body);const first=parsed.prefixes[0];const prefix=first.ipv4Prefix??first.ipv6Prefix;const address=ipaddr.parseCIDR(prefix)[0].toString();const e=await collect(source.id,[source.declarations[0]],address,'listed');assert.equal(e.checks[0].source,source.id);assert.equal(e.checks[0].snapshot.sha256,sourceSummary.find(s=>s.id===source.id).sha256);}
    await collect('nonmatch',['AhrefsBot'],'8.8.8.8','not-listed');
    const relay=await collect('relay',['Googlebot'],'2a06:98c0:3600::103','unavailable');assert.equal(relay.address.state,'worker-subrequest');
    const missing=await collect('missing',['Googlebot'],'','unavailable');assert.equal(missing.address.state,'missing');
    const unmapped=await collect('unmapped',['ExaUser'],'8.8.8.8');assert.equal(unmapped.unmappedDeclarationCount,1);assert.equal(unmapped.checks.length,0);
    const none=await collect('no-declaration',[],'8.8.8.8');assert.equal(none.declarationCount,0);
    const ahrefs=VENDOR_IP_SOURCES[0];const address=JSON.parse(feeds.get(ahrefs.url).body).prefixes[0].ipv4Prefix.split('/')[0];await collect('compatible',['AhrefsBot','AhrefsSiteAudit'],address,'listed');
    const multiple=await collect('multiple',VENDOR_IP_SOURCES.flatMap(s=>s.declarations),'8.8.8.8','not-assessed');assert.equal(multiple.checks.filter(c=>c.reason==='request-budget').length,4);assert.equal(trials.at(-1).storedKind,'unresolved');assert.equal(trials.at(-1).storedName,null);
    const pending=[];const excluded=new Request('https://publication.example/privacy',{headers:{Referer:'https://traffic2cash.xyz/','User-Agent':'AhrefsBot/7.0','CF-Connecting-IP':'8.8.8.8'}});Object.defineProperty(excluded,'cf',{value:{asn:64512}});observePageResponse(excluded,new Response('fixture',{headers:{'Content-Type':'text/html'}}),'html',{DB:db,ANALYTICS_HASH_KEY:'local-only'},{waitUntil:p=>pending.push(p)});await Promise.all(pending);
    const controls=(await db.prepare(readFileSync('packages/blog/drafts/research/analytics-retrospective/vendor-ip-control-acceptance.sql','utf8')).bind('2000-01-01 00:00:00','2100-01-01 00:00:00').all()).results;assert.equal(controls.length,1);assert.equal(JSON.parse(controls[0].summary).notListed,true);assert.equal(controls[0].optionalCaptureAbsent,1);
    await db.prepare("INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,observed_at,vendor_ip_evidence) SELECT '/owner-fixture','11111111111111111111111111111111','bot','desktop',1,'seo-crawler','fixture',datetime('now'),vendor_ip_evidence FROM page_observations WHERE path='/ahrefs-crawlers'").run();
  }
  const report=await queryStats(db,{range:'7d',traffic:'all'});assert.equal(report.totals.views,trials.length+1);assert.equal(report.vendorNetwork.notRecordedViews,1);assert.equal(report.vendorNetwork.recordedViews,trials.length);
  if(mode!=='--timeout')assert.deepEqual(report.vendorNetwork,{recordedViews:15,notRecordedViews:1,configuredDeclarationViews:13,unmappedDeclarationViews:1,noDeclarationViews:1,listedViews:9,notListedViews:2,unavailableViews:2,notAssessedViews:1,addressUnavailableViews:2});
  const empty=await queryStats(db,{range:'7d',traffic:'all',path:'/absent'});assert.ok(Object.values(empty.vendorNetwork).every(v=>v===0));assert.equal(JSON.stringify(report).includes('publisherVersion'),false);
  for(const source of sourceSummary)assert.equal(JSON.stringify(report).includes(source.sha256),false);
  const sourceFiles=['packages/analytics/src/vendor-ip.ts','packages/analytics/src/vendor-ip-sources.ts','packages/analytics/src/index.ts','packages/analytics/src/stats.ts','packages/analytics/src/classify.ts','packages/analytics/src/versions.ts'];
  const receipt={at:new Date().toISOString(),runtime:process.version,mode:mode??'saved-feed-replay',conditions:'Synthetic addresses from saved public vendor ranges and negative controls; Node collector/crypto + actual workerd D1; intercepted saved-body/cache-directive/Age responses; original Date/Expires transport times are not replayed at the later test time and are tested separately; no vendor/operator authenticity or production claim',library:{version:'2.5.0',sourceCommit:'dc55282780d8702bac31ef012ca52e4a77fbca1f'},sources:sourceSummary,trials,fetches,report:report.vendorNetwork,checks:{nativeD1:true,migrationHistoryPreserved:true,emptyReport:true,optionalCaptureOff:true,ownerAndReferralExclusions:mode!=='--timeout',narrowProductionSql:mode!=='--timeout'},sourceSha256:Object.fromEntries(sourceFiles.map(p=>[p,createHash('sha256').update(readFileSync(p)).digest('hex')])),productionCalls:0};
  writeFileSync(output,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({trials:trials.length,fetches,checks:receipt.checks,productionCalls:0}));
}finally{globalThis.fetch=originalFetch;await mf.dispose()}

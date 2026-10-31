import assert from 'node:assert/strict';
import test from 'node:test';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {analyzeTraffic} from '../.test-dist/classify.js';
import {classifyReaderKind} from '../.test-dist/readerkind.js';
import {verifyVendorIp,createVendorIpCache} from '../.test-dist/vendor-ip.js';
import {vendorNetworkStateSql} from '../.test-dist/vendor-network-summary.js';
import {queryStats} from '../.test-dist/stats.js';

const now=new Date('2026-10-31T10:00:00Z');
function request(ip='66.249.66.1') {const r=new Request('https://fixture.invalid/',{headers:{'CF-Connecting-IP':ip}});Object.defineProperty(r,'cf',{value:{asn:64512}});return r;}
function feed(){return Response.json({prefixes:[{ipv4Prefix:'66.249.66.0/24'}]},{headers:{'Cache-Control':'max-age=300'}});}
function facts(userAgent){return {...analyzeTraffic(userAgent),userAgent,observationSource:'edge',asn:64512,secFetchMode:null,secFetchDest:null,secFetchSite:null,secFetchUser:null,acceptsHtml:1,hasAcceptLanguage:1,signature:{status:'absent'}};}

test('documented GoogleOther media aliases retain a generic crawler role and complete product facts',()=>{
 for(const userAgent of ['GoogleOther','GoogleOther-Image/1.0','GoogleOther-Video/1.0','Mozilla/5.0 (compatible; GoogleOther) Chrome/130.0.0.0 Safari/537.36']){
  const a=analyzeTraffic(userAgent);assert.equal(a.trafficClass,'bot');assert.equal(a.agentName,'GoogleOther');assert.equal(classifyReaderKind(facts(userAgent)).kind,'other-bot');
 }
 const a=analyzeTraffic('GoogleOther GoogleOther-Image/1.0 GoogleOther-Video/1.0');
 assert.equal(a.declarations.status,'single');assert.deepEqual(a.declarations.candidates,['GoogleOther']);assert.deepEqual(a.declarations.matchedProducts,['GoogleOther','GoogleOther-Image','GoogleOther-Video']);
 for(const ua of ['NotGoogleOther/1.0','GoogleOther-Evil/1.0','https://fixture.invalid/GoogleOther'])assert.equal(analyzeTraffic(ua).agentName,null);
 assert.equal(classifyReaderKind(facts('Googlebot/2.1 GoogleOther')).kind,'unresolved');
 assert.equal(classifyReaderKind(facts('GPTBot/1.0 GoogleOther')).kind,'unresolved');
});

test('GoogleOther and Googlebot share one fixed network check, with explicit outcomes and cache reuse',async()=>{
 const cache=createVendorIpCache();let fetches=0;
 const options={now,cache,fetcher:async(url,init)=>{fetches++;assert.equal(url,'https://developers.google.com/static/crawling/ipranges/common-crawlers.json');assert.equal(init.redirect,'manual');assert.equal(init.headers.has('CF-Connecting-IP'),false);return feed();}};
 const a=await verifyVendorIp(request(),['GoogleOther','Googlebot'],options);
 assert.equal(a.configuredDeclarationCount,2);assert.equal(a.checks.length,1);assert.equal(a.checks[0].outcome,'listed');
 const b=await verifyVendorIp(request('8.8.8.8'),['GoogleOther'],options);assert.equal(fetches,1);assert.equal(b.checks[0].outcome,'not-listed');assert.equal(b.checks[0].cache.access,'memory');
 const unavailable=await verifyVendorIp(request(),['GoogleOther'],{now,cache:createVendorIpCache(),fetcher:async()=>new Response(null,{status:503})});assert.equal(unavailable.checks[0].outcome,'unavailable');
 const unmapped=await verifyVendorIp(request(),['Google-Extended','Google-GeminiNotebook'],{now,cache:createVendorIpCache(),fetcher:async()=>assert.fail('unrelated products must not inherit common ranges')});assert.equal(unmapped.configuredDeclarationCount,0);
});

test('new shared-source count bounds admit both pairs without changing historical profile bounds',async t=>{
 const db=new DatabaseSync(':memory:');t.after(()=>db.close());
 const state=e=>db.prepare('SELECT '+vendorNetworkStateSql()+' AS state FROM (SELECT ? AS vendor_ip_evidence)').get(JSON.stringify(e)).state;
 const e=await verifyVendorIp(request(),['Googlebot','GoogleOther','AhrefsBot','AhrefsSiteAudit'],{now,cache:createVendorIpCache(),fetcher:async()=>feed()});
 assert.equal(e.checks.length,2);assert.equal(e.configuredDeclarationCount,4);assert.equal(state(e),'recognized');
 const old=structuredClone(e);old.profile='2026-10-30.1';assert.equal(state(old),'unrecognized');old.declarationCount=old.configuredDeclarationCount=3;assert.equal(state(old),'recognized');
 // Pin the original two-Google-declaration width; later profiles may add a third.
 const excess=structuredClone(e);excess.profile='2026-10-31.1';excess.declarationCount=excess.configuredDeclarationCount=5;assert.equal(state(excess),'unrecognized');
 const future=structuredClone(e);future.profile='future';assert.equal(state(future),'unrecognized');
 const noCache=structuredClone(e);delete noCache.checks[0].cache;assert.equal(state(noCache),'unrecognized');
});

test('old AI and new bot GoogleOther rows remain separate valid report groups with their cache history',async t=>{
 const sqlite=new DatabaseSync(':memory:');t.after(()=>sqlite.close());sqlite.exec(readFileSync(new URL('../schema.sql',import.meta.url),'utf8'));
 const db={prepare(sql){return{bind(...values){return{sql,values};}};},async batch(statements){return statements.map(s=>({success:true,results:sqlite.prepare(s.sql).all(...s.values)}));}};
 const e=await verifyVendorIp(request(),['GoogleOther'],{now,cache:createVendorIpCache(),fetcher:async()=>feed()});
 const old={...structuredClone(e),profile:'2026-10-30.1',configuredDeclarationCount:0,unmappedDeclarationCount:1,checks:[],summary:{listed:false,notListed:false,unavailable:false,notAssessed:false}};
 for(const [i,traffic,profile,network]of [[1,'ai','2026-10-29.3',old],[2,'bot','2026-10-31.1',e]])sqlite.prepare("INSERT INTO page_observations(path,daily_client_id,traffic_class,agent_name,device_type,is_owner,reader_kind,reader_reason,observed_at,classifier_version,vendor_ip_evidence) VALUES('/fixture',?,?,'GoogleOther','desktop',0,'other-bot','GoogleOther','2026-10-31 09:00:00',?,?)").run(String(i).padStart(32,'0'),traffic,profile,JSON.stringify(network));
 const report=await queryStats(db,{range:'all',traffic:'all',agent:'GoogleOther'},now);
 assert.equal(report.totals.views,2);assert.deepEqual(report.byAgent.map(r=>[r.agentName,r.trafficClass,r.views]).sort(),[['GoogleOther','ai',1],['GoogleOther','bot',1]]);
 assert.equal(report.vendorNetwork.recognizedViews,2);assert.equal(report.vendorNetwork.configuredDeclarationViews,1);assert.equal(report.vendorNetwork.unmappedDeclarationViews,1);assert.equal(report.vendorCache.records.recognizedViews,2);
 assert.deepEqual(sqlite.prepare('SELECT traffic_class,classifier_version FROM page_observations ORDER BY id').all().map(r=>[r.traffic_class,r.classifier_version]),[['ai','2026-10-29.3'],['bot','2026-10-31.1']]);
});

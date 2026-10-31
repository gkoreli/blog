import assert from 'node:assert/strict';
import test from 'node:test';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {analyzeTraffic} from '../.test-dist/classify.js';
import {agentReaderKind} from '../.test-dist/readerkind.js';
import {verifyVendorIp,createVendorIpCache} from '../.test-dist/vendor-ip.js';
import {vendorSignatureEvidence} from '../.test-dist/vendor-signatures.js';
import {vendorNetworkStateSql} from '../.test-dist/vendor-network-summary.js';
import {queryStats} from '../.test-dist/stats.js';

const name='Google-CloudVertexBot',now=new Date('2026-10-31T10:00:00Z');
function request(ip='66.249.66.1'){const r=new Request('https://fixture.invalid/',{headers:{'CF-Connecting-IP':ip}});Object.defineProperty(r,'cf',{value:{asn:64512}});return r;}
function feed(){return Response.json({prefixes:[{ipv4Prefix:'66.249.66.0/24'}]},{headers:{'Cache-Control':'max-age=300'}});}

test('documented CloudVertex UA keeps its broad crawler role without inheriting Google-Agent signing expectations',()=>{
 const full='Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.7559.132 Mobile Safari/537.36 (compatible; Google-CloudVertexBot; +https://cloud.google.com/enterprise-search)';
 for(const ua of [name,name+'/1.0',full]){const a=analyzeTraffic(ua);assert.equal(a.agentName,name);assert.equal(a.trafficClass,'ai');assert.equal(agentReaderKind(a.agentName),'ai-crawler');assert.equal(vendorSignatureEvidence(a.declarations.candidates,{status:'absent'}).status,'not-configured');}
 for(const ua of ['Not'+name,name+'-Evil','https://fixture.invalid/'+name])assert.equal(analyzeTraffic(ua).agentName,null);
 // Supplied verdict exercises the expectation mapper, not signature verification.
 assert.equal(vendorSignatureEvidence([name],{status:'verified',agent:'https://agent.bot.goog'}).status,'not-configured');
});

test('CloudVertex gains its documented common feed while Google-Agent retains its separate feed',async()=>{
 const urls=[],cache=createVendorIpCache();
 const options={now,cache,fetcher:async(url,init)=>{urls.push(url);assert.equal(init.redirect,'manual');assert.equal(init.headers.has('CF-Connecting-IP'),false);return feed();}};
 const e=await verifyVendorIp(request(),[name,'GoogleOther','Googlebot','Google-Agent'],options);
 assert.equal(e.configuredDeclarationCount,4);assert.deepEqual(e.checks.map(c=>c.source),['google-common','google-agent']);assert.ok(e.checks.every(c=>c.outcome==='listed'));
 assert.deepEqual(urls,['https://developers.google.com/static/crawling/ipranges/common-crawlers.json','https://developers.google.com/static/crawling/ipranges/user-triggered-agents.json']);
 const nonlisted=await verifyVendorIp(request('8.8.8.8'),[name],options);assert.equal(nonlisted.checks[0].outcome,'not-listed');assert.equal(nonlisted.checks[0].cache.access,'memory');assert.equal(urls.length,2);
 const failed=await verifyVendorIp(request(),[name],{now,cache:createVendorIpCache(),fetcher:async()=>new Response(null,{status:503})});assert.equal(failed.checks[0].outcome,'unavailable');
});

test('three common declarations and two Ahrefs declarations share two checks only under the new width bounds',async t=>{
 const db=new DatabaseSync(':memory:');t.after(()=>db.close());const state=e=>db.prepare('SELECT '+vendorNetworkStateSql()+' AS state FROM (SELECT ? AS vendor_ip_evidence)').get(JSON.stringify(e)).state;
 const e=await verifyVendorIp(request(),[name,'GoogleOther','Googlebot','AhrefsBot','AhrefsSiteAudit'],{now,cache:createVendorIpCache(),fetcher:async()=>feed()});
 assert.equal(e.checks.length,2);assert.equal(e.configuredDeclarationCount,5);assert.equal(state(e),'recognized');
 for(const [profile,count,expected]of [['2026-10-31.1',5,'unrecognized'],['2026-10-31.1',4,'recognized'],['2026-10-31.2',6,'unrecognized'],['2026-10-30.1',4,'unrecognized']]){const c=structuredClone(e);c.profile=profile;c.declarationCount=c.configuredDeclarationCount=count;assert.equal(state(c),expected);}
 const noCache=structuredClone(e);delete noCache.checks[0].cache;assert.equal(state(noCache),'unrecognized');
});

test('old unmapped CloudVertex and new mapped evidence remain distinct without changing role history',async t=>{
 const sqlite=new DatabaseSync(':memory:');t.after(()=>sqlite.close());sqlite.exec(readFileSync(new URL('../schema.sql',import.meta.url),'utf8'));
 const db={prepare(sql){return{bind(...values){return{sql,values};}};},async batch(s){return s.map(v=>({success:true,results:sqlite.prepare(v.sql).all(...v.values)}));}};
 const e=await verifyVendorIp(request(),[name],{now,cache:createVendorIpCache(),fetcher:async()=>feed()});const old={...structuredClone(e),profile:'2026-10-31.1',configuredDeclarationCount:0,unmappedDeclarationCount:1,checks:[],summary:{listed:false,notListed:false,unavailable:false,notAssessed:false}};
 for(const [i,network]of [[1,old],[2,e]])sqlite.prepare("INSERT INTO page_observations(path,daily_client_id,traffic_class,agent_name,device_type,is_owner,reader_kind,reader_reason,observed_at,classifier_version,vendor_ip_evidence) VALUES('/fixture',?,'ai',?,'desktop',0,'ai-crawler',?,'2026-10-31 09:00:00','2026-10-31.1',?)").run(String(i).padStart(32,'0'),name,name,JSON.stringify(network));
 const report=await queryStats(db,{range:'all',traffic:'all',agent:name},now);assert.equal(report.totals.views,2);assert.deepEqual(report.byAgent.map(r=>[r.agentName,r.trafficClass,r.views]),[[name,'ai',2]]);assert.equal(report.vendorNetwork.recognizedViews,2);assert.equal(report.vendorNetwork.unmappedDeclarationViews,1);assert.equal(report.vendorNetwork.configuredDeclarationViews,1);assert.equal(report.vendorCache.records.recognizedViews,2);
 assert.deepEqual(sqlite.prepare('SELECT reader_kind,classifier_version FROM page_observations').all().map(r=>[r.reader_kind,r.classifier_version]),[['ai-crawler','2026-10-31.1'],['ai-crawler','2026-10-31.1']]);
});

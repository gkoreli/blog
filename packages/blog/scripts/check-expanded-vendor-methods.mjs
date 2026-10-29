import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {dirname,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {VENDOR_IP_SOURCES} from '../../analytics/.test-dist/vendor-ip-sources.js';
import {vendorNetworkStateSql} from '../../analytics/.test-dist/vendor-network-summary.js';
import {queryStats} from '../../analytics/.test-dist/stats.js';
import {COLLECTION_VERSION,CLASSIFIER_VERSION} from '../../analytics/.test-dist/versions.js';

const [captures,output,privateOutput]=process.argv.slice(2);assert.ok(captures&&output&&privateOutput);
const baseline='c379c79';
const ids=['applebot','bingbot','amazonbot','amazon-search','amazon-user'];
const sources=VENDOR_IP_SOURCES.filter(source=>ids.includes(source.id));assert.equal(sources.length,5);
const bodies=Object.fromEntries(ids.map(id=>[id,readFileSync(resolve(captures,id+'.body'),'utf8')]));
const feedJson=id=>JSON.parse(readFileSync(resolve(captures,id.startsWith('amazon')?id+'-extracted.json':id+'.body'),'utf8'));
const counts=Object.fromEntries(ids.map(id=>[id,feedJson(id).prefixes.length]));
const addresses=Object.fromEntries(ids.map(id=>{const first=feedJson(id).prefixes[0];return [id,(first.ipv4Prefix??first.ipv6Prefix??first.ip_prefix).split('/')[0]];}));
const req=createRequire(resolve('package.json'));
const {Miniflare}=await import(pathToFileURL(req.resolve('miniflare',{paths:[dirname(req.resolve('wrangler/package.json'))]})));
async function runtime(prior=false){
 const contents=`
 import {verifyVendorIp,createVendorIpCache} from './packages/analytics/src/vendor-ip.ts';
 import {analyzeTraffic} from './packages/analytics/src/classify.ts';
 import {observePageResponse} from './packages/analytics/src/index.ts';
 const sources=${JSON.stringify(sources)},bodies=${JSON.stringify(bodies)};let active,log,calls=[];
 console.log=(event,data)=>{if(event==='analytics.observation_stored')log=data;};
 globalThis.fetch=(url,init)=>{
  const source=sources.find(source=>source.url===String(url));if(!source)throw Error('Unexpected fixture URL');
  const headers=new Headers(init.headers);for(const name of ['CF-Connecting-IP','CF-Connecting-IPv6','User-Agent','Cookie','Referer'])if(headers.has(name))throw Error('Reader data forwarded');
  calls.push(source.id);if(init.redirect!=='manual')throw Error('Redirect policy changed');
  const html=source.id.startsWith('amazon'),contentType=html?'text/html':'application/json';
  if(headers.get('Accept')!==(html?'text/html':'application/json'))throw Error('Wrong source Accept');
  if(active==='http-error')return new Response(null,{status:503});
  let body=bodies[source.id];
  if(active==='missing-block')body='<p>3.81.245.78</p>';
  if(active==='multiple-blocks')body='<pre><code>{"prefixes":[{"ipv4Prefix":"3.81.245.78"}]}</code></pre>'.repeat(2);
  if(active==='unclosed-block')body='<pre><code>{"prefixes":[{"ipv4Prefix":"3.81.245.78"}]}';
  if(active==='malformed')body=html?'<pre><code>{"prefixes":[{"ipv4Prefix":"private-canary"}]}</code></pre>':'{}';
  if(active==='oversize')body='x'.repeat(262145);
  if(active==='chunked'){
   const bytes=new TextEncoder().encode(body);let offset=0;
   return new Response(new ReadableStream({pull(controller){if(offset>=bytes.length){controller.close();return;}controller.enqueue(bytes.slice(offset,offset+4093));offset+=4093;}}),{headers:{'Content-Type':contentType}});
  }
  return new Response(body,{headers:{'Content-Type':active==='wrong-media'?'application/octet-stream':contentType,...active==='no-store'?{'Cache-Control':'no-store'}:{}}});
 };
 export default{async fetch(request,env){
  active=request.headers.get('X-Fixture-Mode')??'normal';calls=[];log=null;
  const copy=new Request(request);Object.defineProperty(copy,'cf',{value:{asn:64512}});
  const classification=analyzeTraffic(copy.headers.get('User-Agent')??'');
  if(request.headers.get('X-Fixture-Action')==='collect'){
   const waits=[];const environment={...env,...active==='owner'?{OWNER_IPS:copy.headers.get('CF-Connecting-IP')}: {}};
   observePageResponse(copy,new Response('local vendor fixture',{headers:{'Content-Type':'text/html'}}),'html',environment,{waitUntil(p){waits.push(p);},passThroughOnException(){}});
   await Promise.all(waits);return Response.json({log,calls});
  }
  const cache=createVendorIpCache();
  const evidence=await verifyVendorIp(copy,classification.declarations.candidates,{cache});
  const repeat=active==='no-store'?await verifyVendorIp(copy,classification.declarations.candidates,{cache}):null;
  return Response.json({evidence,repeat,declarations:classification.declarations,calls});
 }};`;
 const plugins=prior?[{name:'exact-prior-analytics',setup(plugin){plugin.onLoad({filter:/[/\\]analytics[/\\]src[/\\].*\.ts$/},args=>({contents:execFileSync('git',['show',baseline+':'+args.path.slice(resolve('.').length+1)],{encoding:'utf8'}),loader:'ts',resolveDir:dirname(args.path)}));}}]:[];
 const bundle=await build({stdin:{contents,resolveDir:process.cwd()},plugins,bundle:true,write:false,format:'esm',platform:'browser',logLevel:'silent'});
 return new Miniflare({modules:true,script:bundle.outputFiles[0].text,compatibilityDate:'2026-03-06',cf:{},d1Databases:{DB:prior?'previous-methods':'expanded-methods'},bindings:{ANALYTICS_HASH_KEY:'local-fixture-only'}});
}
const old=await runtime(true),current=await runtime();
try{
 const headersFor=(source,mode='normal',action='ip')=>({'User-Agent':source.declarations[0]+'/1.0','CF-Connecting-IP':mode==='not-listed'?'8.8.8.8':addresses[source.id],'X-Fixture-Mode':mode,'X-Fixture-Action':action,...mode==='relay'?{'CF-Worker':'fixture-relay.example'}:{},...mode==='referral'?{Referer:'https://traffic2cash.xyz/'}:{}});
 const before=[],checks=[];
 for(const source of sources){
  const earlier=await (await old.dispatchFetch('https://publication.example/privacy',{headers:headersFor(source)})).json();
  assert.equal(earlier.evidence.configuredDeclarationCount,0);assert.equal(earlier.evidence.unmappedDeclarationCount,1);assert.deepEqual(earlier.calls,[]);before.push({source:source.id,evidence:earlier.evidence});
  for(const mode of ['normal','not-listed','http-error','relay','malformed','chunked']){
   const response=await current.dispatchFetch('https://publication.example/privacy',{headers:headersFor(source,mode)});assert.equal(response.status,200);const value=await response.json();
   const check=value.evidence.checks[0];assert.equal(check.source,source.id);assert.equal(value.evidence.configuredDeclarationCount,1);
   const expected=['normal','chunked'].includes(mode)?'listed':mode==='not-listed'?'not-listed':'unavailable';assert.equal(check.outcome,expected,source.id+'/'+mode);
   assert.equal(value.calls.length,mode==='relay'?0:1);if(expected==='listed'){
    assert.equal(check.snapshot.prefixCount,counts[source.id]);assert.equal(check.snapshot.sha256,createHash('sha256').update(bodies[source.id]).digest('hex'));
    if(source.id.startsWith('amazon'))assert.equal(check.snapshot.publisherVersion,feedJson(source.id).creationTime.replace(/\+00:00$/,'Z'));
   }
   assert.equal(JSON.stringify(value.evidence).includes('private-canary'),false);
   checks.push({source:source.id,mode,outcome:check.outcome,reason:check.reason,prefixCount:check.snapshot?.prefixCount??null});
  }
 }
 const amazon=sources.find(source=>source.id==='amazonbot');
 for(const [mode,reason]of [['missing-block','invalid-feed'],['multiple-blocks','invalid-feed'],['unclosed-block','invalid-feed'],['oversize','body-limit'],['wrong-media','media-type']]){
  const value=await(await current.dispatchFetch('https://publication.example/privacy',{headers:headersFor(amazon,mode)})).json();assert.equal(value.evidence.checks[0].outcome,'unavailable');assert.equal(value.evidence.checks[0].reason,reason);
  checks.push({source:'amazonbot',mode,outcome:'unavailable',reason,prefixCount:null});
 }
 const noStore=await(await current.dispatchFetch('https://publication.example/privacy',{headers:headersFor(amazon,'no-store')})).json();
 assert.equal(noStore.evidence.checks[0].outcome,'listed');assert.equal(noStore.repeat.checks[0].outcome,'not-assessed');assert.equal(noStore.repeat.checks[0].reason,'refresh-cooldown');assert.equal(noStore.calls.length,1);
 checks.push({source:'amazonbot',mode:'no-store-repeat',outcome:'not-assessed',reason:'refresh-cooldown',prefixCount:null});
 const oldAds=await(await old.dispatchFetch('https://publication.example/privacy',{headers:{'User-Agent':'meta-externalads/1.1','CF-Connecting-IP':'8.8.8.8'}})).json();
 const newAds=await(await current.dispatchFetch('https://publication.example/privacy',{headers:{'User-Agent':'meta-externalads/1.1','CF-Connecting-IP':'8.8.8.8'}})).json();
 assert.deepEqual(oldAds.declarations.candidates,[]);assert.deepEqual(newAds.declarations.candidates,['Meta-ExternalAds']);assert.deepEqual(newAds.calls,[]);
 const mixedUa=sources.map(source=>source.declarations[0]+'/1.0').join(' ');
 const mixedHeaders={'User-Agent':mixedUa,'CF-Connecting-IP':addresses.amazonbot};
 const mixed=await(await current.dispatchFetch('https://publication.example/privacy',{headers:mixedHeaders})).json();
 assert.equal(mixed.evidence.configuredDeclarationCount,5);assert.equal(mixed.calls.length,4);assert.equal(mixed.evidence.checks.find(check=>check.source==='amazonbot').outcome,'listed');
 assert.equal(mixed.evidence.checks.find(check=>check.source==='amazon-user').reason,'request-budget');
 assert.ok(mixed.evidence.checks.slice(0,4).every(check=>['listed','not-listed'].includes(check.outcome)));
 const db=await current.getD1Database('DB');const schema=readFileSync('packages/analytics/schema.sql','utf8').replace(/^\s*--.*$/gm,'');await db.batch(schema.split(';').map(text=>text.trim()).filter(Boolean).map(text=>db.prepare(text)));
 const collector=[];const controlCases=sources.flatMap(source=>['normal','not-listed'].map(mode=>({source,mode})));
 controlCases.push({source:amazon,mode:'owner'},{source:amazon,mode:'referral'},{source:null,mode:'ads'},{source:null,mode:'mixed'});
 for(const item of controlCases){
  const headers=item.source?headersFor(item.source,item.mode,'collect'):{...item.mode==='mixed'?mixedHeaders:{'User-Agent':'meta-externalads/1.1','CF-Connecting-IP':'8.8.8.8'},'X-Fixture-Action':'collect','X-Fixture-Mode':item.mode};
  const response=await current.dispatchFetch('https://publication.example/privacy',{headers});assert.equal(response.status,200);const value=await response.json();assert.ok(value.log?.storage?.observationId);
  const row=await db.prepare('SELECT collection_version,classifier_version,reader_kind,signature_evidence,vendor_ip_evidence,request_evidence,is_owner,referrer_host FROM page_observations WHERE id=CAST(? AS INTEGER)').bind(value.log.storage.observationId).first();
  assert.equal(row.collection_version,COLLECTION_VERSION);assert.equal(row.classifier_version,CLASSIFIER_VERSION);assert.equal(row.request_evidence,null);
  const network=JSON.parse(row.vendor_ip_evidence),signature=JSON.parse(row.signature_evidence);assert.equal(signature.native.verifiedBot,null);assert.equal(signature.native.signedAgent,null);
  if(item.source){assert.equal(network.checks[0].source,item.source.id);assert.equal(network.checks[0].outcome,item.mode==='not-listed'?'not-listed':'listed');}
  else if(item.mode==='mixed'){assert.equal(row.reader_kind,'unresolved');assert.equal(network.configuredDeclarationCount,5);assert.equal(network.checks.length,5);assert.equal(value.log.receipt.declarations.status,'multiple');}
  else{assert.equal(row.reader_kind,'other-bot');assert.equal(network.configuredDeclarationCount,0);}
  assert.equal(value.log.receipt.classifierProfile,row.classifier_version);assert.equal(value.log.receipt.readerKind,row.reader_kind);
  assert.equal(value.log.receipt.declarations.candidateNames,item.source?.declarations[0]??(item.mode==='mixed'?sources.map(source=>source.declarations[0]).sort().join(','):'Meta-ExternalAds'));
  assert.equal(value.log.receipt.signature.status,signature.localStatus);
  collector.push({source:item.source?.id??(item.mode==='mixed'?'multiple':'Meta-ExternalAds'),mode:item.mode,storedKind:row.reader_kind,storedProfile:network.profile,storedReceiptReferenceMatched:true,networkAssessmentReadBack:true,networkAssessmentInReceipt:false});
 }
 const historical=before.find(row=>row.source==='applebot').evidence;
 await db.prepare("INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,agent_name,reader_kind,reader_reason,collection_version,classifier_version,vendor_ip_evidence) VALUES('/privacy','00000000000000000000000000000000','ai','desktop',0,'Applebot','ai-search','historical-fixture','2026-10-29.1','2026-10-27.5',?)").bind(JSON.stringify(historical)).run();
 const states=await db.prepare(`SELECT (${vendorNetworkStateSql()}) AS state,COUNT(*) AS views FROM page_observations GROUP BY state`).all();assert.deepEqual(states.results,[{state:'recognized',views:15}]);
 const report=await queryStats(db,{range:'7d',traffic:'all'},new Date());assert.equal(report.totals.views,13);assert.equal(report.vendorNetwork.recognizedViews,13);assert.equal(report.vendorNetwork.configuredDeclarationViews,11);assert.equal(report.vendorNetwork.listedViews,6);assert.equal(report.vendorNetwork.notListedViews,6);assert.equal(report.vendorNetwork.notAssessedViews,1);assert.equal(report.vendorNetwork.unmappedDeclarationViews,2);
 const oldRow=await db.prepare("SELECT vendor_ip_evidence,classifier_version FROM page_observations WHERE daily_client_id='00000000000000000000000000000000'").first();assert.equal(oldRow.vendor_ip_evidence,JSON.stringify(historical));assert.equal(oldRow.classifier_version,'2026-10-27.5');
 const exactSql=readFileSync('packages/blog/drafts/research/analytics-retrospective/documented-feed-readback.sql','utf8');
 const exactIds=['9007199254740992','9007199254740993'];
 for(const id of exactIds)await db.prepare("INSERT INTO page_observations(id,path,daily_client_id,traffic_class,device_type,is_owner) VALUES(CAST(? AS INTEGER),'/privacy','11111111111111111111111111111111','bot','desktop',0)").bind(id).run();
 const exact=await db.prepare(exactSql).bind(...exactIds).all();assert.deepEqual(exact.results.map(row=>row.privateReference),exactIds);
 const exactPlan=await db.prepare('EXPLAIN QUERY PLAN '+exactSql).bind(...exactIds).all();assert.ok(exactPlan.results.some(row=>row.detail.includes('INTEGER PRIMARY KEY')));
 const exactReferenceQuery={sha256:createHash('sha256').update(exactSql).digest('hex'),neighboringIdsAboveSafeInteger:true,primaryKeyPlan:true,reads:exact.meta.rows_read,writes:exact.meta.rows_written};assert.equal(exact.meta.rows_written,0);
 const receipt={checkedAt:new Date().toISOString(),baseline,method:'Actual local workerd/HTMLRewriter/collector/D1 with captured public bodies and in-process fetch interception; supplied edge metadata is not provider detection',beforeConfigured:0,afterConfigured:5,feedPrefixCounts:counts,feedSha256:Object.fromEntries(ids.map(id=>[id,createHash('sha256').update(bodies[id]).digest('hex')])),ipControls:checks,concurrentMixedDeclarations:{configured:5,fetches:4,skipped:1,kind:'unresolved'},oldMetaAdsCandidateCount:0,newMetaAdsCandidate:'Meta-ExternalAds',collectorControls:collector.length,collector,report:{total:report.totals.views,network:report.vendorNetwork},exactReferenceQuery,historicalPayloadUnchanged:true,rawRequestEvidenceAbsent:true,nativeBooleansUnavailable:true,externalRequests:0,productionRequests:0};
 writeFileSync(output,JSON.stringify(receipt,null,2)+'\n',{flag:'wx',mode:0o600});writeFileSync(privateOutput,JSON.stringify({before,states:states.results},null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify({ipControls:checks.length,collectorControls:collector.length,reportTotal:report.totals.views,productionRequests:0}));
}finally{await old.dispose();await current.dispose();}

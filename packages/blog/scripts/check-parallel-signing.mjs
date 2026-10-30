import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { ed25519JwkThumbprint } from '../../analytics/.test-dist/webbotauth.js';
import { queryStats } from '../../analytics/.test-dist/stats.js';
import { COLLECTION_VERSION, CLASSIFIER_VERSION } from '../../analytics/.test-dist/versions.js';
import { VENDOR_IP_PROFILE } from '../../analytics/.test-dist/vendor-ip.js';
import { vendorIpReceipt } from '../../analytics/.test-dist/vendor-ip-receipt.js';

// Intercepted generated keys at documented origins are fixtures, not vendor authentication.
const [output, privateOutput, captureRoot] = process.argv.slice(2);
assert.ok(output && privateOutput && captureRoot && !existsSync(output) && !existsSync(privateOutput));
const feed=JSON.parse(readFileSync(resolve(captureRoot,'shapbot-feed.json')));
const listedAddress=feed.prefixes[0].ipv4Prefix.split('/')[0];
const bot='https://shapbot.parallel.ai',user='https://shap-user.parallel.ai',impostor=bot+'.evil.example';
const keys=new Map();
for(const origin of [bot,user,impostor]){
  const pair=await crypto.subtle.generateKey('Ed25519',true,['sign','verify']);
  const jwk=await crypto.subtle.exportKey('jwk',pair.publicKey);
  keys.set(origin,{pair,jwk,kid:await ed25519JwkThumbprint(jwk)});
}
const directories=Object.fromEntries([...keys].map(([origin,key])=>[origin+'/.well-known/http-message-signatures-directory',{keys:[key.jwk]}]));
const bundle=await build({stdin:{resolveDir:process.cwd(),contents:`
  import {observePageResponse} from './packages/analytics/src/index.ts';
  import {verifyVendorIp,createVendorIpCache} from './packages/analytics/src/vendor-ip.ts';
  const directories=${JSON.stringify(directories)},feed=${JSON.stringify(feed)},logs=[],calls=[];
  console.log=(event,fields)=>logs.push({event,...fields});
  console.warn=(event,fields)=>logs.push({event,...fields});
  globalThis.fetch=async(url,options)=>{
    const text=String(url);calls.push(text);
    const headers=new Headers(options?.headers);
    if(headers.has('CF-Connecting-IP')||headers.has('User-Agent'))throw Error('Reader data forwarded');
    if(text==='https://docs.parallel.ai/resources/shapbot.json')return Response.json(feed,{headers:{'Content-Type':'application/json'}});
    if(!(text in directories))throw Error('Unexpected fixture lookup');
    return Response.json(directories[text],{headers:{'Content-Type':'application/http-message-signatures-directory+json'}});
  };
  export default{async fetch(request,env,ctx){
    const pending=[],start=logs.length,copy=new Request(request);
    Object.defineProperty(copy,'cf',{value:{asn:64512}});
    if(request.headers.get('X-Fixture-Mode')==='ip-check'){
      const mode=request.headers.get('X-Fixture-IP-Mode');
      const names=mode==='unmapped-user'?['Shap-User']:['ShapBot'];
      const fetcher=mode==='http-failed'?async()=>new Response(null,{status:503}):mode==='bad-feed'?async()=>Response.json({prefixes:[{ipv4Prefix:'invalid'}]}):fetch;
      const before=calls.length;
      return Response.json({evidence:await verifyVendorIp(copy,names,{cache:createVendorIpCache(),fetcher}),calls:calls.slice(before)});
    }
    const environment={...env,...request.headers.get('X-Fixture-Mode')==='owner'?{OWNER_IPS:'8.8.8.8'}:{}};
    observePageResponse(copy,new Response('Local fixture',{headers:{'Content-Type':'text/html'}}),'html',environment,{waitUntil(p){pending.push(p);ctx.waitUntil(p);}});
    return Response.json({settlements:(await Promise.allSettled(pending)).map(r=>r.status),logs:logs.slice(start),calls});
  }};
`},bundle:true,write:false,format:'esm',platform:'browser',logLevel:'silent'});
const req=createRequire(resolve('package.json'));
const {Miniflare}=await import(pathToFileURL(req.resolve('miniflare',{paths:[dirname(req.resolve('wrangler/package.json'))]})));
const mf=new Miniflare({modules:true,script:bundle.outputFiles[0].text,compatibilityDate:'2026-03-06',cf:{},d1Databases:{DB:'parallel-signing'},bindings:{ANALYTICS_HASH_KEY:'local-fixture-only'}});
try{
  const db=await mf.getD1Database('DB');
  const schema=readFileSync('packages/analytics/schema.sql','utf8').replace(/^\s*--.*$/gm,'');
  await db.batch(schema.split(';').map(s=>s.trim()).filter(Boolean).map(s=>db.prepare(s)));
  const ipControls=[];
  for(const mode of ['listed','not-listed','http-failed','bad-feed','relay','unmapped-user']){
    const headers={'CF-Connecting-IP':mode==='not-listed'?'8.8.8.8':listedAddress,'X-Fixture-Mode':'ip-check','X-Fixture-IP-Mode':mode};
    if(mode==='relay')headers['CF-Worker']='fixture-relay.example';
    const result=await(await mf.dispatchFetch('https://publication.example/parallel-ip-fixture',{headers})).json();
    assert.equal(result.evidence.profile,VENDOR_IP_PROFILE);
    if(mode==='unmapped-user'){assert.equal(result.evidence.configuredDeclarationCount,0);assert.equal(result.calls.length,0);}
    else{const check=result.evidence.checks[0];assert.equal(check.source,'parallel-shapbot');
      assert.equal(check.outcome,['listed','not-listed'].includes(mode)?mode:'unavailable');
      if(check.snapshot)assert.equal(check.snapshot.prefixCount,10);
      if(mode==='relay')assert.equal(result.calls.length,0);
    }
    ipControls.push({mode,receipt:vendorIpReceipt(result.evidence)});
  }
  const cases=[
    {label:'bot-unsigned',ua:'ShapBot/0.1.0',kind:'ai-search',vendor:'not-verified',publisher:'not-verified'},
    {label:'user-unsigned',ua:'Shap-User/0.1.0',kind:'ai-assistant',vendor:'not-verified',publisher:'not-verified'},
    {label:'bot-match',ua:'ShapBot/0.1.0',origin:bot,kind:'ai-search',vendor:'matching-origin',publisher:'matching-publisher'},
    {label:'user-match',ua:'Shap-User/0.1.0',origin:user,kind:'ai-assistant',vendor:'matching-origin',publisher:'matching-publisher'},
    {label:'bot-cross',ua:'ShapBot/0.1.0',origin:user,kind:'ai-search',vendor:'different-origin',publisher:'different-publisher'},
    {label:'user-cross',ua:'Shap-User/0.1.0',origin:bot,kind:'ai-assistant',vendor:'different-origin',publisher:'different-publisher'},
    {label:'bot-impostor',ua:'ShapBot/0.1.0',origin:impostor,kind:'ai-search',vendor:'different-origin',publisher:'different-publisher'},
    {label:'mixed-bot',ua:'ShapBot/0.1.0 Shap-User/0.1.0',origin:bot,kind:'unresolved',vendor:'conflicting-origins',publisher:'conflicting-publishers'},
    {label:'mixed-user',ua:'Shap-User/0.1.0 ShapBot/0.1.0',origin:user,kind:'unresolved',vendor:'conflicting-origins',publisher:'conflicting-publishers'},
    {label:'partial',ua:'ShapBot/0.1.0 Bytespider/1.0',origin:bot,kind:'unresolved',vendor:'matching-origin',publisher:'partial-mapping'},
    {label:'covered-ua',ua:'ShapBot/0.1.0',origin:bot,kind:'ai-search',vendor:'matching-origin',publisher:'matching-publisher',coverUa:true},
    {label:'tampered',ua:'ShapBot/0.1.0',origin:bot,kind:'ai-search',vendor:'not-verified',publisher:'not-verified',tamper:true},
    {label:'owner',ua:'ShapBot/0.1.0',origin:bot,kind:'ai-search',vendor:'matching-origin',publisher:'matching-publisher'},
    {label:'referral',ua:'Shap-User/0.1.0',origin:user,kind:'ai-assistant',vendor:'matching-origin',publisher:'matching-publisher'},
  ];
  const controls=[],privateRows=[];
  for(const entry of cases){
    const headers={'User-Agent':entry.ua,Accept:'text/html','CF-Connecting-IP':'8.8.8.8','X-Fixture-Mode':entry.label};
    if(entry.label==='referral')headers.Referer='https://traffic2cash.xyz/';
    if(entry.origin){
      const key=keys.get(entry.origin),epoch=Math.floor(Date.now()/1000);
      const input=`("@authority" "signature-agent";key="g"${entry.coverUa?' "user-agent"':''});created=${epoch};expires=${epoch+300};keyid="${key.kid}";alg="ed25519";tag="web-bot-auth"`;
      // Independent construction: do not call the application base builder.
      const base=`"@authority": ${entry.tamper?'different.example':'publication.example'}\n"signature-agent";key="g": ${JSON.stringify(entry.origin)}\n${entry.coverUa?'"user-agent": '+entry.ua+'\n':''}"@signature-params": ${input}`;
      headers['Signature-Agent']='g='+JSON.stringify(entry.origin);headers['Signature-Input']='g='+input;
      headers.Signature='g=:'+Buffer.from(await crypto.subtle.sign('Ed25519',key.pair.privateKey,new TextEncoder().encode(base))).toString('base64')+':';
    }
    const path='/parallel-fixture/'+entry.label;
    const capture=await(await mf.dispatchFetch('https://publication.example'+path,{headers})).json();
    assert.deepEqual(capture.settlements,['fulfilled'],entry.label);
    const row=await db.prepare('SELECT * FROM page_observations WHERE path=?').bind(path).first();assert.ok(row);
    const e=JSON.parse(row.signature_evidence),receipt=capture.logs.find(l=>l.event==='analytics.observation_stored')?.receipt;assert.ok(receipt);
    assert.equal(row.collection_version,COLLECTION_VERSION);assert.equal(row.classifier_version,CLASSIFIER_VERSION);assert.equal(row.reader_kind,entry.kind);
    assert.equal(e.vendor.profile,'2026-10-29.1');assert.equal(e.directoryPublication.profile,'2026-10-29.1');
    assert.equal(e.vendor.status,entry.vendor,JSON.stringify({label:entry.label,status:e.localStatus,reason:e.localReason,calls:capture.calls}));assert.equal(e.directoryPublication.status,entry.publisher);
    assert.equal(e.localStatus,entry.tamper?'unverified':entry.origin?'verified':'absent');
    if(entry.tamper)assert.equal(e.localReasons[0],'signature-invalid');
    if(entry.origin&&!entry.tamper){assert.equal(e.coverage.covered.userAgent,entry.coverUa===true);assert.equal(receipt.signature.signer,'Other');}
    assert.equal(receipt.signature.documentedVendorStatus,entry.vendor);assert.deepEqual(receipt.directoryPublication,e.directoryPublication);
    assert.deepEqual(receipt.vendorNetwork,vendorIpReceipt(JSON.parse(row.vendor_ip_evidence)));
    assert.equal(row.is_owner,entry.label==='owner'?1:0);
    controls.push({label:entry.label,kind:row.reader_kind,vendor:e.vendor,publisher:e.directoryPublication,network:receipt.vendorNetwork,localStatus:e.localStatus,userAgentCovered:e.coverage?.covered.userAgent??null,receiptMatches:true});
    privateRows.push({entry,row,capture,headers});
  }
  // Two old-profile assessments stay not-configured after today's registry expansion.
  for(const label of ['bot-unsigned','bot-match']){
    const row=privateRows.find(r=>r.entry.label===label).row,e=JSON.parse(row.signature_evidence);
    e.vendor={...e.vendor,profile:'2026-10-28.1',status:'not-configured',documentedDeclarationCount:0,unmappedDeclarationCount:1,expectedOriginCount:0,matchingDeclarationCount:null,differentOriginDeclarationCount:null};
    e.directoryPublication={...e.directoryPublication,profile:'2026-10-28.1',reviewedOn:'2026-10-28',status:'not-configured',configuredDeclarationCount:0,unmappedDeclarationCount:1};
    await db.prepare("INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,agent_name,reader_kind,reader_reason,collection_version,classifier_version,signature_status,signature_evidence) VALUES('/legacy','00000000000000000000000000000000','ai','desktop',0,'ShapBot','ai-search','fixture','2026-10-29.4','2026-10-29.2',?,?)").bind(row.signature_status,JSON.stringify(e)).run();
  }
  let meters;
  const tap={prepare:sql=>({bind:(...values)=>db.prepare(sql).bind(...values)}),async batch(statements){const result=await db.batch(statements);meters=result.map(r=>r.meta);return result;}};
  const selection={range:'7d',traffic:'all'},now=new Date(),report=await queryStats(tap,selection,now);
  assert.equal(report.totals.views,14);assert.equal(report.referralPolicy.excludedViews,1);
  const v=report.verification;assert.equal(v.vendorCheckRecognizedViews,14);assert.equal(v.vendorCheckUnrecognizedViews,0);
  assert.equal(v.vendorMatchingOriginViews,4);assert.equal(v.vendorDifferentOriginViews,3);assert.equal(v.vendorOriginConflictViews,2);
  assert.equal(v.vendorConflictWithMatchingOriginViews,2);assert.equal(v.vendorNotVerifiedViews,3);assert.equal(v.vendorUserAgentBoundViews,1);
  assert.equal(report.byDirectoryPublication.find(r=>r.basis==='not-configured').views,2);
  assert.equal(report.vendorNetwork.recognizedViews,12);assert.equal(report.vendorNetwork.unrecognizedViews,0);
  assert.equal(report.vendorNetwork.notListedViews,9);
  const reportReads=meters.reduce((n,m)=>n+m.rows_read,0);
  for(const [agent,kind,traffic,views]of [['ShapBot','ai-search','crawlers',8],['Shap-User','ai-assistant','agents',3]]){
    const filtered=await queryStats(tap,{...selection,agent,kind,traffic},now);assert.equal(filtered.totals.views,views);
  }
  const evidence={checkedAt:new Date().toISOString(),collectionVersion:COLLECTION_VERSION,classifierVersion:CLASSIFIER_VERSION,controls,ipControls,
    nativeCollectorControls:14,legacyProfileRows:2,report:{included:14,ownerExcluded:1,referralExcluded:1,reads:reportReads,diagnosticWrites:0,verification:v,network:report.vendorNetwork,directoryDistribution:report.byDirectoryPublication},
    filteredReports:2,unexpectedFetches:0,productionRequests:0,vendorRequests:0,humanLabels:0,
    limits:['Generated keys and intercepted directories are fixtures, not vendor authentication.','Covered UA fixtures prove the binding mechanism, not actual Parallel coverage.','Old profiles are read as recorded; no historical row is reclassified.','Roles, signing evidence and human triggers remain separate.']};
  writeFileSync(output,JSON.stringify(evidence,null,2)+'\n',{flag:'wx',mode:0o600});
  writeFileSync(privateOutput,JSON.stringify({privateRows,report},null,2)+'\n',{flag:'wx',mode:0o600});
  console.log(JSON.stringify({controls:14,legacyRows:2,included:14,reportReads}));
}finally{await mf.dispose()}

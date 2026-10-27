import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { observePageResponse } from '../../../../analytics/.test-dist/index.js';
import { queryStats } from '../../../../analytics/.test-dist/stats.js';
import { buildSignatureBase, ed25519JwkThumbprint } from '../../../../analytics/.test-dist/webbotauth.js';

const require = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] })));
const mf = new Miniflare({ modules: true, script: 'export default {fetch(){return new Response("fixture")}}', compatibilityDate: '2026-03-06', d1Databases: { DB: 'webbotauth-observability' } });
const output = process.argv[2];
if (!output) throw new Error('Provide a new output JSON path');
const originalFetch = globalThis.fetch;
try {
  const db = await mf.getD1Database('DB');
  const oldSchema = readFileSync('packages/analytics/schema.sql','utf8').split('\n').filter(line => !line.trim().startsWith('signature_evidence ')).join('\n').replace(/^--.*$/gm,'');
  await db.batch(oldSchema.split(';').map(sql => sql.trim()).filter(Boolean).map(sql => db.prepare(sql)));
  await db.prepare("INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,observed_at) VALUES('/historical','00000000000000000000000000000000','browser','desktop',0,'browser','fixture',datetime('now'))").run();
  await db.prepare(readFileSync('packages/analytics/migrations/0012_signature_evidence.sql','utf8').replace(/^--.*$/gm,'')).run();
  assert.equal((await db.prepare('SELECT signature_evidence FROM page_observations').first()).signature_evidence,null);
  const pair = await crypto.subtle.generateKey('Ed25519',true,['sign','verify']);
  const jwk = await crypto.subtle.exportKey('jwk',pair.publicKey);
  const kid = await ed25519JwkThumbprint(jwk);
  let directoryCalls = 0;
  globalThis.fetch = async url => {
    assert.equal(String(url),'https://protocol-fixture.example/.well-known/http-message-signatures-directory');
    directoryCalls++;
    return Response.json({keys:[jwk]},{headers:{'Content-Type':'application/http-message-signatures-directory+json','Cache-Control':'max-age=300'}});
  };
  const rows=[];
  for (const mode of ['minimal','bound','tampered','unsigned']) {
    const epoch=Math.floor(Date.now()/1000);
    const components=mode==='minimal'?'"@authority" "signature-agent";key="sig"':'"@authority" "@method" "@path" "user-agent" "signature-agent";key="sig"';
    const headers={'User-Agent':'SyntheticClient/1.0',Accept:'text/html','Accept-Language':'en','Sec-Fetch-Mode':'navigate','Sec-Fetch-Dest':'document'};
    if(mode!=='unsigned'){
      headers['Signature-Agent']='sig="https://protocol-fixture.example";type=directory';
      headers['Signature-Input']=`sig=(${components});created=${epoch};expires=${epoch+300};keyid="${kid}";alg="ed25519";tag="web-bot-auth"`;
      const base=buildSignatureBase(new Request(`https://publication.example/${mode}`,{headers}),'sig');assert.notEqual(base,null);
      headers.Signature=`sig=:${Buffer.from(await crypto.subtle.sign('Ed25519',pair.privateKey,new TextEncoder().encode(base))).toString('base64')}:`;
      if(mode==='tampered')headers['User-Agent']='ChangedClaim/1.0';
    }
    const request=new Request(`https://publication.example/${mode}`,{headers});
    Object.defineProperty(request,'cf',{value:{asn:64512,botManagement:{verifiedBot:false,signedAgent:false}}});
    const pending=[];
    observePageResponse(request,new Response('fixture',{headers:{'Content-Type':'text/html'}}),'html',{DB:db,ANALYTICS_HASH_KEY:'local-only'},{waitUntil:p=>pending.push(p)});
    await Promise.all(pending);
    const row=await db.prepare('SELECT signature_status,signature_evidence FROM page_observations WHERE path=?').bind(`/${mode}`).first();
    const evidence=JSON.parse(row.signature_evidence);
    assert.equal(evidence.localStatus,mode==='unsigned'?'absent':mode==='tampered'?'unverified':'verified');
    assert.equal(evidence.source,'local-webbotauth');
    assert.equal(evidence.coverage?.covered.userAgent??null,mode==='minimal'?false:mode==='bound'?true:null);
    assert.deepEqual(evidence.native,{verifiedBot:false,signedAgent:false});
    rows.push({mode,status:evidence.localStatus,coverage:evidence.coverage});
  }
  assert.equal(directoryCalls,1);
  const stats=await queryStats(db,{range:'7d',traffic:'all'});
  assert.equal(stats.totals.views,5);assert.equal(stats.verification.recordedViews,4);assert.equal(stats.verification.notRecordedViews,1);
  assert.equal(stats.verification.localVerifiedViews,2);assert.equal(stats.verification.localUnverifiedViews,1);assert.equal(stats.verification.localAbsentViews,1);
  assert.equal(stats.verification.localVerifiedNativeNotVerifiedViews,2);assert.equal(stats.verification.authorityOnlyViews,1);assert.equal(stats.verification.userAgentBoundViews,1);
  assert.equal(JSON.stringify(stats).includes('SyntheticClient'),false);
  const prospectiveSql = readFileSync('packages/blog/drafts/research/analytics-retrospective/webbotauth-prospective-acceptance.sql', 'utf8');
  const prospective = await db.prepare(prospectiveSql).first();
  assert.equal(prospective.inspectedRecentRows, 5); assert.equal(prospective.prospectiveViews, 4);
  assert.equal(prospective.evidenceRecordedViews, 4); assert.equal(prospective.localVerifierSourceViews, 4);
  assert.equal(prospective.verifiedViews, 2); assert.equal(prospective.unverifiedViews, 1); assert.equal(prospective.absentViews, 1);
  assert.equal(prospective.optionalStructuredCaptures, 0);
  let captured;
  const tapped={prepare(sql){return{bind(...values){captured={sql,values};return db.prepare(sql).bind(...values);}}},batch(statements){return db.batch(statements);}};
  const query={range:'7d',traffic:'agents',kind:'signed-agent'};
  const selected=await queryStats(tapped,query);assert.equal(selected.totals.views,2);
  let position=0;
  const literal=captured.sql.replace(/\?/g,()=>{
    const value=captured.values[position++];
    if(value===null)return'NULL';if(typeof value==='number')return String(value);
    assert.equal(typeof value,'string');return "'"+value.replaceAll("'","''")+"'";
  });
  assert.equal(position,captured.values.length);
  const replay=(await db.prepare(literal).all()).results;
  assert.equal(JSON.parse(replay.find(row=>row.section==='verification').payload)[0].coverageRecordedViews,2);
  const sql=literal+';\n';
  assert.ok(Buffer.byteLength(sql)<100000);
  const artifactPrefix = resolve(output).replace(/\.json$/, '');
  writeFileSync(`${artifactPrefix}-production.sql`,sql,{flag:'wx'});
  writeFileSync(`${artifactPrefix}-production-plan.json`,JSON.stringify({query,start:selected.period.start,end:selected.period.end,sqlSha256:createHash('sha256').update(sql).digest('hex'),sqlBytes:Buffer.byteLength(sql),directSelectReadCeiling:50000,productionCalls:0},null,2)+'\n',{flag:'wx'});
  const controlPending = [];
  observePageResponse(new Request('https://publication.example/privacy', { headers: { Referer: 'https://traffic2cash.xyz/' } }), new Response('fixture', { headers: { 'Content-Type': 'text/html' } }), 'html', { DB: db, ANALYTICS_HASH_KEY: 'local-only' }, { waitUntil: p => controlPending.push(p) });
  await Promise.all(controlPending);
  await db.prepare("UPDATE page_observations SET observed_at='2026-10-27 15:03:17' WHERE path='/privacy'").run();
  const controlAcceptance = await db.prepare(readFileSync('packages/blog/drafts/research/analytics-retrospective/webbotauth-control-acceptance.sql', 'utf8')).first();
  assert.equal(controlAcceptance.controlViews, 1); assert.equal(controlAcceptance.evidenceRecordedViews, 1);
  assert.equal(controlAcceptance.absentViews, 1); assert.equal(controlAcceptance.localVerifierSourceViews, 1);
  assert.equal(controlAcceptance.optionalStructuredCaptures, 0); assert.equal(controlAcceptance.nativeAvailableViews, 0);
  const receipt={checkedAt:new Date().toISOString(),runtime:'Miniflare/workerd native local D1; actual collector, verifier, persistence and report code',migration:'0012_signature_evidence.sql',historicalEvidenceRemainsNull:true,rows,directoryCalls,verification:stats.verification,preparedProductionSelectAccepted:true,prospectiveSelectAccepted:prospective,controlSelectAccepted:controlAcceptance,productionCalls:0,limits:['Synthetic signatures and injected directory responses, not real-vendor or native-provider verification.','Native booleans are labelled fixture inputs; no Cloudflare verdict is simulated as observed production evidence.']};
  writeFileSync(output,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify(receipt));
} finally {globalThis.fetch=originalFetch;await mf.dispose();}

import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { KNOWN_AGENT_NAMES, KNOWN_CLIENT_PRODUCTS } from '../../analytics/.test-dist/classify.js';
import { retainedDeclaredCategories } from '../../analytics/.test-dist/classification-evidence.js';
import { queryStats } from '../../analytics/.test-dist/stats.js';
import { ed25519JwkThumbprint } from '../../analytics/.test-dist/webbotauth.js';
import { COLLECTION_VERSION, CLASSIFIER_VERSION } from '../../analytics/.test-dist/versions.js';

// Fully local generated key/directory. No vendor authentication or production traffic.
const [output] = process.argv.slice(2);
assert.ok(output && !existsSync(output));
const pair = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
const kid = await ed25519JwkThumbprint(jwk);
const bundle = await build({ stdin: { resolveDir: process.cwd(), contents: `
  import {observePageResponse} from './packages/analytics/src/index.ts';
  const calls=[];
  globalThis.fetch=async(url)=>{
    calls.push(String(url));
    if(String(url)!=='https://fixture.example/.well-known/http-message-signatures-directory') throw Error('Unexpected fixture lookup');
    return Response.json({keys:[${JSON.stringify(jwk)}]},{headers:{'Content-Type':'application/http-message-signatures-directory+json'}});
  };
  export default {async fetch(request,env,ctx){
    const pending=[],copy=new Request(request);
    Object.defineProperty(copy,'cf',{value:{asn:64512}});
    observePageResponse(copy,new Response('Fixture',{headers:{'Content-Type':'text/html'}}),'html',env,{waitUntil(p){pending.push(p);ctx.waitUntil(p);}});
    return Response.json({settlements:(await Promise.allSettled(pending)).map(r=>r.status),calls});
  }};
` }, bundle: true, write: false, format: 'esm', platform: 'browser', logLevel: 'silent' });
const req = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(req.resolve('miniflare', { paths: [dirname(req.resolve('wrangler/package.json'))] })));
const mf = new Miniflare({ modules: true, script: bundle.outputFiles[0].text, compatibilityDate: '2026-03-06',
  cf: {}, d1Databases: { DB: 'parallel-declarations' }, bindings: { ANALYTICS_HASH_KEY: 'local-fixture-only' } });
try {
  const db = await mf.getD1Database('DB');
  const schema = readFileSync('packages/analytics/schema.sql', 'utf8').replace(/^\s*--.*$/gm, '');
  await db.batch(schema.split(';').map(s=>s.trim()).filter(Boolean).map(s=>db.prepare(s)));
  const cases = [
    {path:'search',ua:'ShapBot/0.1.0',kind:'ai-search',name:'ShapBot'},
    {path:'retrieval',ua:'Shap-User/0.1.0',kind:'ai-assistant',name:'Shap-User'},
    {path:'search-signed',ua:'ShapBot/0.1.0',kind:'ai-search',name:'ShapBot',signed:true},
    {path:'retrieval-signed',ua:'Shap-User/0.1.0',kind:'ai-assistant',name:'Shap-User',signed:true},
    {path:'conflict',ua:'ShapBot/0.1.0 Shap-User/0.1.0',kind:'unresolved',name:null},
    {path:'impostor',ua:'NotShapBot/0.1.0',kind:'other-bot',name:null},
    {path:'all-products',ua:[...KNOWN_CLIENT_PRODUCTS].join(' '),kind:'unresolved',name:null},
  ];
  const controls=[];
  for(const entry of cases){
    const headers={'User-Agent':entry.ua,Accept:'text/html','CF-Connecting-IP':'203.0.113.7'};
    if(entry.signed){
      const epoch=Math.floor(Date.now()/1000);
      const input=`("@authority" "signature-agent";key="g");created=${epoch};expires=${epoch+300};keyid="${kid}";alg="ed25519";tag="web-bot-auth"`;
      const base=`"@authority": publication.example\n"signature-agent";key="g": "https://fixture.example"\n"@signature-params": ${input}`;
      headers['Signature-Agent']='g="https://fixture.example"';
      headers['Signature-Input']=`g=${input}`;
      headers.Signature=`g=:${Buffer.from(await crypto.subtle.sign('Ed25519',pair.privateKey,new TextEncoder().encode(base))).toString('base64')}:`;
    }
    const result=await(await mf.dispatchFetch('https://publication.example/'+entry.path,{headers})).json();
    assert.deepEqual(result.settlements,['fulfilled']);
    const row=await db.prepare('SELECT * FROM page_observations WHERE path=?').bind('/'+entry.path).first();assert.ok(row);
    assert.equal(row.reader_kind,entry.kind);assert.equal(row.agent_name,entry.name);
    assert.equal(row.collection_version,COLLECTION_VERSION);assert.equal(row.classifier_version,CLASSIFIER_VERSION);
    const classification=JSON.parse(row.classification_evidence),signature=JSON.parse(row.signature_evidence);
    assert.equal(classification.version,'2026-10-29.1');assert.ok(retainedDeclaredCategories(classification));
    assert.equal(signature.localStatus,entry.signed?'verified':'absent');
    assert.equal(signature.vendor.status,entry.path==='impostor'?'no-declaration':entry.path==='all-products'?'conflicting-origins':'not-configured');
    assert.ok(Buffer.byteLength(row.classification_evidence)<=2048);
    if(entry.path==='all-products'){
      assert.deepEqual(classification.declarations.candidates,[...KNOWN_AGENT_NAMES].sort());
      assert.deepEqual(classification.declarations.matchedProducts,[...KNOWN_CLIENT_PRODUCTS].sort());
    }
    controls.push({fixture:entry.path,kind:row.reader_kind,name:row.agent_name,signature:signature.localStatus,
      vendorMethod:signature.vendor.status,evidenceBytes:Buffer.byteLength(row.classification_evidence),categories:retainedDeclaredCategories(classification)});
  }
  const tap={prepare:sql=>({bind:(...values)=>db.prepare(sql).bind(...values)}),batch:statements=>db.batch(statements)};
  const selection={range:'7d',traffic:'all'},now=new Date();
  const all=await queryStats(tap,selection,now);assert.equal(all.totals.views,7);
  const filtered=[];
  for(const [agent,kind,traffic] of [['ShapBot','ai-search','crawlers'],['Shap-User','ai-assistant','agents']]){
    const report=await queryStats(tap,{...selection,traffic,kind,agent},now);
    assert.equal(report.totals.views,2);filtered.push({agent,kind,traffic,views:report.totals.views});
  }
  writeFileSync(output,JSON.stringify({checkedAt:new Date().toISOString(),collectionVersion:COLLECTION_VERSION,classifierVersion:CLASSIFIER_VERSION,
    controls,filtered,allViews:all.totals.views,knownNames:KNOWN_AGENT_NAMES.size,knownProducts:KNOWN_CLIENT_PRODUCTS.size,
    oldEvidenceReadable:retainedDeclaredCategories({version:'2026-10-27.2',declaredCategories:['ai-search']})?.[0]==='ai-search',
    productionRequests:0,vendorRequests:0,humanLabels:0,
    limits:['Generated signing key at a fixture origin is not Parallel authentication.','Declared roles do not establish actual use or a human trigger.','Historical stored evidence is not rewritten.']},null,2)+'\n',{flag:'wx',mode:0o600});
  console.log(JSON.stringify({controls:controls.length,filtered,allViews:all.totals.views}));
}finally{await mf.dispose();}

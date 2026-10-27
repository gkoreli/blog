import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { observePageResponse } from '../../../../analytics/.test-dist/index.js';
import { queryStats } from '../../../../analytics/.test-dist/stats.js';
import { buildSignatureBase, ed25519JwkThumbprint } from '../../../../analytics/.test-dist/webbotauth.js';

// No production requests. Ephemeral keys at intercepted URLs test the method,
// never whether an actual vendor holds those keys. D1 runs in workerd; collector
// and crypto run in the pinned Node runtime, not the production Worker runtime.
const output = process.argv[2];
if (!output) throw new Error('Provide a new output JSON path');
const require = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] })));
const mf = new Miniflare({ modules: true, script: 'export default {fetch(){return new Response("fixture")}}', compatibilityDate: '2026-03-06', d1Databases: { DB: 'verification-outcomes' } });
const originalFetch = globalThis.fetch;
try {
  const db = await mf.getD1Database('DB');
  const schema = readFileSync('packages/analytics/schema.sql', 'utf8').replace(/^--.*$/gm, '');
  await db.batch(schema.split(';').map(s => s.trim()).filter(Boolean).map(s => db.prepare(s)));
  await db.prepare("INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,observed_at) VALUES('/historical','00000000000000000000000000000000','browser','desktop',0,'browser','fixture',datetime('now'))").run();
  const pair = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
  const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey); const kid = await ed25519JwkThumbprint(jwk);
  const cases = [
    ['minimal', 'verified', 'matching-origin'], ['bound', 'verified', 'matching-origin'],
    ['different-origin', 'verified', 'different-origin'], ['tampered', 'invalid', 'not-verified'],
    ['unsupported', 'unsupported', 'not-verified'], ['unavailable', 'unavailable', 'not-verified'],
    ['expired', 'policy-rejected', 'not-verified'], ['unsigned', 'absent', 'not-verified'],
    ['non-webbotauth', 'not-applicable', 'not-verified'], ['unmapped', 'absent', 'not-configured'],
    ['mixed', 'indeterminate', 'not-verified'], ['injected', 'test-injected', 'test-injected'],
  ];
  const trials = []; let directoryCalls = 0;
  for (const [mode, outcome, vendor] of cases) {
    const origin = ['minimal','bound','tampered','unsupported','expired','mixed'].includes(mode) ? 'https://crawler.exa.ai' : `https://${mode}.example`;
    const epoch = Math.floor(Date.now() / 1000);
    const headers = { 'User-Agent': mode === 'unmapped' ? 'GPTBot/1.4' : 'ExaUser/1.0', Accept: 'text/html' };
    const url = `https://publication.example/${mode}`;
    if (!['unsigned','unmapped','injected'].includes(mode)) {
      const fields = mode === 'bound' ? '"@authority" "@method" "@path" "user-agent" "signature-agent"' : '"@authority" "signature-agent"';
      headers['Signature-Agent'] = `"${origin}"`;
      const created = mode === 'expired' ? epoch - 1000 : epoch;
      headers['Signature-Input'] = `sig=(${fields});created=${created};expires=${created + 300};keyid="${kid}";alg="ed25519";tag="web-bot-auth"`;
      const base = buildSignatureBase(new Request(url, { headers }), 'sig'); assert.notEqual(base, null);
      const signature = Buffer.from(await crypto.subtle.sign('Ed25519', pair.privateKey, new TextEncoder().encode(base))).toString('base64');
      headers.Signature = `sig=:${signature}:`;
      if (mode === 'tampered' || mode === 'mixed') headers['Signature-Agent'] = '"https://tampered.example"';
      if (mode === 'unsupported') headers['Signature-Input'] = headers['Signature-Input'].replace('alg="ed25519"', 'alg="rsa-pss-sha512"');
      if (mode === 'non-webbotauth') headers['Signature-Input'] = headers['Signature-Input'].replace('tag="web-bot-auth"','tag="other-profile"');
      if (mode === 'mixed') {
        headers['Signature-Input'] += ', ' + headers['Signature-Input'].replace(/^sig=/, 'other=').replace('alg="ed25519"', 'alg="rsa-pss-sha512"');
        headers.Signature += `, other=:${signature}:`;
      }
    }
    globalThis.fetch = async url => {
      assert.ok(String(url).endsWith('/.well-known/http-message-signatures-directory'));
      directoryCalls++;
      return mode === 'unavailable' ? new Response(null, { status: 503 }) : Response.json({ keys: [jwk] }, { headers: { 'Content-Type': 'application/http-message-signatures-directory+json' } });
    };
    if (mode === 'injected') headers.Signature = 'test-header';
    const request = new Request(url, { headers }); const pending = [];
    observePageResponse(request, new Response('fixture', { headers: { 'Content-Type': 'text/html' } }), 'html', { DB: db, ANALYTICS_HASH_KEY: 'local-only' }, { waitUntil: p => pending.push(p) }, mode === 'injected' ? { verifySignature: async () => ({ status: 'verified', agent: 'https://crawler.exa.ai' }) } : {});
    await Promise.all(pending);
    const row = await db.prepare('SELECT signature_evidence,request_evidence,collection_version,classifier_version FROM page_observations WHERE path=?').bind(`/${mode}`).first();
    const evidence = JSON.parse(row.signature_evidence);
    assert.equal(evidence.localOutcome, outcome); assert.equal(evidence.vendor.status, vendor);
    assert.equal(row.request_evidence, null); assert.equal(row.collection_version, '2026-10-27.3'); assert.equal(row.classifier_version, '2026-10-27.2');
    assert.ok(Buffer.byteLength(row.signature_evidence) <= 2048);
    assert.deepEqual(evidence.native, { verifiedBot: null, signedAgent: null });
    trials.push({ label: mode, outcome, vendorStatus: vendor, source: evidence.source, userAgentCovered: evidence.vendor.userAgentCovered, bytes: Buffer.byteLength(row.signature_evidence) });
  }
  const addExcluded = async (path, headers, env) => {
    const pending=[]; observePageResponse(new Request(`https://publication.example${path}`, { headers }),new Response('fixture',{headers:{'Content-Type':'text/html'}}),'html',{DB:db,ANALYTICS_HASH_KEY:'local-only',...env},{waitUntil:p=>pending.push(p)}); await Promise.all(pending);
  };
  await addExcluded('/privacy', { 'User-Agent':'ExaUser/1.0', Signature:'invalid', Referer:'https://traffic2cash.xyz/' }, {});
  await addExcluded('/owner', {}, {}); // Ineligible; no new observation.
  await db.prepare("INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,observed_at,signature_evidence) SELECT '/owner-fixture','11111111111111111111111111111111','ai','desktop',1,'ai-assistant','fixture',datetime('now'),signature_evidence FROM page_observations WHERE path='/minimal'").run();
  let captured;
  const tapped={prepare(sql){return{bind(...values){captured={sql,values};return db.prepare(sql).bind(...values);}}},batch(statements){return db.batch(statements);}};
  const report = await queryStats(tapped, { range: '7d', traffic: 'all' });
  assert.equal(report.totals.views, 13); assert.equal(report.referralPolicy.excludedViews, 1);
  const expected = {localVerifiedViews:3,localUnverifiedViews:6,localAbsentViews:2,testVerdictViews:1,localInvalidViews:1,localUnsupportedViews:1,localUnavailableViews:1,localPolicyRejectedViews:1,localNotApplicableViews:1,localIndeterminateViews:1,unverifiedOutcomeNotRecordedViews:0,vendorDocumentedViews:10,vendorMatchingOriginViews:2,vendorDifferentOriginViews:1,vendorNotVerifiedViews:7,vendorUnmappedDeclarationViews:1,vendorUserAgentBoundViews:1,vendorCheckNotRecordedViews:1};
  for(const [key,value] of Object.entries(expected))assert.equal(report.verification[key],value,key);
  const literalize = statement => {let i=0;const sql=statement.sql.replace(/\?/g,()=>{const v=statement.values[i++];if(v===null)return'NULL';if(typeof v==='number')return String(v);assert.equal(typeof v,'string');return "'"+v.replaceAll("'","''")+"'";});assert.equal(i,statement.values.length);return sql+';\n';};
  const reportSql = literalize(captured); await db.prepare(reportSql).all();
  const empty = await queryStats(db,{range:'7d',traffic:'all',path:'/missing'});
  assert.ok(Object.values(empty.verification).every(n=>n===0));
  const controlSql = readFileSync('packages/blog/drafts/research/analytics-retrospective/verification-outcomes-control-acceptance.sql','utf8');
  const controls=(await db.prepare(controlSql).bind('2000-01-01 00:00:00','2100-01-01 00:00:00').all()).results;
  assert.equal(controls.length,1); assert.equal(controls[0].localOutcome,'invalid'); assert.equal(controls[0].vendorStatus,'not-verified'); assert.equal(controls[0].optionalCaptureAbsent,1);
  const prefix=resolve(output).replace(/\.json$/,'');
  writeFileSync(prefix+'-production.sql',reportSql,{flag:'wx'});
  writeFileSync(prefix+'-production-plan.json',JSON.stringify({query:{range:'7d',traffic:'all'},start:report.period.start,end:report.period.end,sqlSha256:createHash('sha256').update(reportSql).digest('hex'),directSelectReadCeiling:50000,productionCalls:0},null,2)+'\n',{flag:'wx'});
  const files=['packages/analytics/src/webbotauth.ts','packages/analytics/src/signature-evidence.ts','packages/analytics/src/vendor-signatures.ts','packages/analytics/src/stats.ts'];
  const receipt={at:new Date().toISOString(),runtime:process.version,conditions:'Node collector/crypto with actual workerd D1, ephemeral keys and intercepted public-directory fetches; no vendor or production authenticity claim',trials,directoryCalls,verification:report.verification,checks:{nativeD1:true,historyPreserved:true,ownerAndReferralExclusion:true,emptyReport:true,literalizedProductionSql:true,optionalCaptureOff:true,narrowControlSql:true},sourceSha256:Object.fromEntries(files.map(f=>[f,createHash('sha256').update(readFileSync(f)).digest('hex')])),productionCalls:0};
  writeFileSync(output,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'}); console.log(JSON.stringify({trials:trials.length,checks:receipt.checks,productionCalls:0}));
} finally { globalThis.fetch=originalFetch; await mf.dispose(); }

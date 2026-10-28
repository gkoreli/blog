import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { ed25519JwkThumbprint } from '../../analytics/.test-dist/webbotauth.js';
import { COLLECTION_VERSION } from '../../analytics/.test-dist/versions.js';
import { queryStats } from '../../analytics/.test-dist/stats.js';

// Uses saved public feeds and intercepted test keys. Never contacts a vendor or production.
const [captureDirectory, output, privateOutput] = process.argv.slice(2);
assert.ok(captureDirectory && output && privateOutput && !existsSync(output) && !existsSync(privateOutput));
const feeds = Object.fromEntries(['duckduckbot', 'google-agent'].map(name => [name,
  readFileSync(resolve(captureDirectory, name + '-feed.json'), 'utf8')]));
const addresses = Object.fromEntries(Object.entries(feeds).map(([name, text]) => {
  const first = JSON.parse(text).prefixes[0];
  return [name, (first.ipv4Prefix ?? first.ipv6Prefix).split('/')[0]];
}));
const baselineCommit = '96fab49';
async function priorModule(file) {
  const source = execFileSync('git', ['show', baselineCommit + ':' + file], { encoding: 'utf8' });
  const bundle = await build({ stdin: { contents: source, resolveDir: resolve(dirname(file)), loader: 'ts' }, bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent' });
  return { source, module: await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].contents).toString('base64')) };
}
const oldVendor = await priorModule('packages/analytics/src/vendor-signatures.ts');
const oldStats = await priorModule('packages/analytics/src/stats.ts');
assert.equal(oldVendor.module.vendorSignatureEvidence(['Google-Agent'], { status: 'verified', agent: 'https://agent.bot.goog' }).status, 'not-configured');
assert.equal(oldVendor.module.vendorSignatureEvidence(['ExaUser', 'Google-Agent'], { status: 'verified', agent: 'https://crawler.exa.ai' }).status, 'matching-origin');
const pair = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey), kid = await ed25519JwkThumbprint(jwk);
const bundle = await build({ stdin: { resolveDir: process.cwd(), contents: `
  import {observePageResponse} from './packages/analytics/src/index.ts';
  import {verifyVendorIp,createVendorIpCache} from './packages/analytics/src/vendor-ip.ts';
  const feeds=${JSON.stringify(feeds)}, logs=[]; let calls=[];
  console.log=(event,fields)=>logs.push({event,...fields});
  console.warn=(event,fields)=>logs.push({event,...fields});
  const feedFor=url=>url==='https://duckduckgo.com/duckduckbot.json'?'duckduckbot'
    :url==='https://developers.google.com/static/crawling/ipranges/user-triggered-agents.json'?'google-agent':null;
  globalThis.fetch=async(url,init)=>{
    const text=String(url); calls.push(text);
    const name=feedFor(text);
    if(name){if(init.headers.has('CF-Connecting-IP')||init.headers.has('User-Agent'))throw Error('Reader data forwarded');
      return new Response(feeds[name],{headers:{'Content-Type':'application/json','Cache-Control':'max-age=300'}});}
    if(['https://agent.bot.goog','https://crawler.exa.ai','https://fixture.example'].some(origin=>text===origin+'/.well-known/http-message-signatures-directory'))
      return Response.json({keys:[${JSON.stringify(jwk)}]},{headers:{'Content-Type':'application/http-message-signatures-directory+json'}});
    throw Error('Unexpected fixture discovery');
  };
  export default {async fetch(request,env,ctx){
    const mode=request.headers.get('X-Fixture-Mode'), pending=[], start=logs.length; calls=[];
    const copy=new Request(request); Object.defineProperty(copy,'cf',{value:{asn:64512}});
    if(mode==='ip-check'){
      const names=request.headers.get('X-Fixture-Names').split(',');
      const evidence=await verifyVendorIp(copy,names,{cache:createVendorIpCache(),fetcher:request.headers.has('X-Fixture-Failure')?async()=>new Response(null,{status:503}):fetch});
      return Response.json({evidence,calls});
    }
    const environment={...env,...mode==='owner-excluded'?{OWNER_IPS:request.headers.get('CF-Connecting-IP')}: {}};
    observePageResponse(copy,new Response('Local documented-method fixture',{headers:{'Content-Type':'text/html'}}),'html',environment,{waitUntil(p){pending.push(p);ctx.waitUntil(p);}});
    const settled=await Promise.allSettled(pending);
    return Response.json({logs:logs.slice(start),settlements:settled.map(r=>r.status),calls});
  }};
` }, bundle: true, write: false, format: 'esm', platform: 'browser', logLevel: 'silent' });
const req = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(req.resolve('miniflare', { paths: [dirname(req.resolve('wrangler/package.json'))] })));
const mf = new Miniflare({ modules: true, script: bundle.outputFiles[0].text, compatibilityDate: '2026-03-06', d1Databases: { DB: 'documented-methods' }, bindings: { ANALYTICS_HASH_KEY: 'local-fixture-only' } });
try {
  const db = await mf.getD1Database('DB');
  const schema = readFileSync('packages/analytics/schema.sql', 'utf8').replace(/^\s*--.*$/gm, '');
  await db.batch(schema.split(';').map(s => s.trim()).filter(Boolean).map(s => db.prepare(s)));
  const ipChecks = [];
  for (const [name, source] of [['DuckDuckBot', 'duckduckbot'], ['Google-Agent', 'google-agent']]) {
    for (const mode of ['listed', 'not-listed', 'unavailable', 'relay']) {
      const headers = { 'X-Fixture-Mode': 'ip-check', 'X-Fixture-Names': name, 'CF-Connecting-IP': mode === 'not-listed' ? '8.8.8.8' : addresses[source] };
      if (mode === 'unavailable') headers['X-Fixture-Failure'] = 'true';
      if (mode === 'relay') headers['CF-Worker'] = 'local-relay.example';
      const result = await (await mf.dispatchFetch('https://publication.example/check', { headers })).json();
      assert.equal(result.evidence.checks[0].source, source);
      assert.equal(result.evidence.checks[0].outcome, mode === 'relay' ? 'unavailable' : mode);
      if (mode === 'relay') assert.equal(result.calls.length, 0);
      if (mode === 'listed') assert.equal(result.evidence.checks[0].snapshot.prefixCount, JSON.parse(feeds[source]).prefixes.length);
      ipChecks.push({ name, mode, outcome: result.evidence.checks[0].outcome, reason: result.evidence.checks[0].reason });
    }
  }
  const cases = [
    { mode: 'duck-listed', ua: 'DuckDuckBot/1.1', source: 'duckduckbot', ip: 'listed', vendor: 'not-configured' },
    { mode: 'duck-not-listed', ua: 'DuckDuckBot/1.1', source: 'duckduckbot', ip: 'not-listed', vendor: 'not-configured' },
    { mode: 'google-unsigned', ua: 'Google-Agent', source: 'google-agent', ip: 'listed', vendor: 'not-verified' },
    { mode: 'google-signed', ua: 'Google-Agent', source: 'google-agent', ip: 'listed', origin: 'https://agent.bot.goog', vendor: 'matching-origin' },
    { mode: 'google-other-origin', ua: 'Google-Agent', source: 'google-agent', ip: 'listed', origin: 'https://crawler.exa.ai', vendor: 'different-origin' },
    { mode: 'mixed-google', ua: 'ExaUser/1.0 Google-Agent', source: 'google-agent', ip: 'listed', origin: 'https://agent.bot.goog', vendor: 'conflicting-origins', matching: 1 },
    { mode: 'mixed-exa', ua: 'Google-Agent ExaUser/1.0', source: 'google-agent', ip: 'listed', origin: 'https://crawler.exa.ai', vendor: 'conflicting-origins', matching: 1 },
    { mode: 'mixed-unsigned', ua: 'Google-Agent ExaUser/1.0', source: 'google-agent', ip: 'listed', vendor: 'conflicting-origins', matching: null },
    { mode: 'mixed-other', ua: 'Google-Agent ExaUser/1.0', source: 'google-agent', ip: 'listed', origin: 'https://fixture.example', vendor: 'conflicting-origins', matching: 0 },
    { mode: 'related-unmapped', ua: 'DuckAssistBot/1.0 Google-GeminiNotebook', vendor: 'not-configured' },
    { mode: 'owner-excluded', ua: 'Google-Agent', source: 'google-agent', ip: 'listed', origin: 'https://agent.bot.goog', vendor: 'matching-origin' },
    { mode: 'referral-excluded', ua: 'Google-Agent', source: 'google-agent', ip: 'listed', origin: 'https://agent.bot.goog', vendor: 'matching-origin' },
  ];
  const controls = [], captures = [];
  for (const entry of cases) {
    const headers = { 'User-Agent': entry.ua, Accept: 'text/html', 'X-Fixture-Mode': entry.mode,
      'CF-Connecting-IP': entry.ip === 'not-listed' || !entry.source ? '8.8.8.8' : addresses[entry.source] };
    if (entry.mode === 'referral-excluded') headers.Referer = 'https://traffic2cash.xyz/';
    if (entry.origin) {
      const epoch = Math.floor(Date.now() / 1000), agent = `g=${JSON.stringify(entry.origin)}`;
      const input = `("@authority" "signature-agent";key="g");created=${epoch};expires=${epoch + 300};keyid="${kid}";alg="ed25519";tag="web-bot-auth"`;
      // Independent byte construction, no application signature-base builder.
      const base = `"@authority": publication.example\n"signature-agent";key="g": ${JSON.stringify(entry.origin)}\n"@signature-params": ${input}`;
      headers['Signature-Agent'] = agent; headers['Signature-Input'] = `g=${input}`;
      headers.Signature = `g=:${Buffer.from(await crypto.subtle.sign('Ed25519', pair.privateKey, new TextEncoder().encode(base))).toString('base64')}:`;
    }
    const capture = await (await mf.dispatchFetch('https://publication.example/' + entry.mode, { headers })).json();
    assert.deepEqual(capture.settlements, ['fulfilled']);
    const row = await db.prepare('SELECT * FROM page_observations WHERE path=?').bind('/' + entry.mode).first(); assert.ok(row);
    const evidence = JSON.parse(row.signature_evidence), ip = JSON.parse(row.vendor_ip_evidence);
    const receipt = capture.logs.find(log => log.event === 'analytics.observation_stored')?.receipt; assert.ok(receipt);
    assert.equal(row.collection_version, COLLECTION_VERSION); assert.equal(evidence.vendor.profile, '2026-10-28.1');
    assert.equal(evidence.vendor.status, entry.vendor, JSON.stringify({mode: entry.mode, outcome: evidence.localOutcome, reasons: evidence.localReasons, calls: capture.calls}));
    assert.equal(receipt.signature.documentedVendorStatus, entry.vendor);
    assert.equal(evidence.localStatus, entry.origin ? 'verified' : 'absent');
    if ('matching' in entry) assert.equal(evidence.vendor.matchingDeclarationCount, entry.matching);
    if (entry.source) assert.equal(ip.checks.find(c => c.source === entry.source)?.outcome, entry.ip);
    else { assert.equal(ip.configuredDeclarationCount, 0); assert.equal(ip.unmappedDeclarationCount, 2); }
    assert.equal(row.is_owner, entry.mode === 'owner-excluded' ? 1 : 0);
    assert.equal(evidence.vendor.userAgentCovered, entry.origin ? false : null);
    controls.push({ mode: entry.mode, signatureStatus: evidence.localStatus, vendor: evidence.vendor,
      ipOutcomes: ip.checks.map(c => ({ source: c.source, outcome: c.outcome })), receiptMatchesStoredStatus: true });
    captures.push({ entry, headers, capture, row });
  }
  let lastMeta;
  const tap = { prepare: sql => ({ bind: (...values) => db.prepare(sql).bind(...values) }), async batch(statements) {
    const results = await db.batch(statements); lastMeta = results.map(r => r.meta); return results;
  } };
  const selection = { range: '7d', traffic: 'all' }, now = new Date();
  const before = await oldStats.module.queryStats(tap, selection, now), beforeReads = lastMeta.reduce((n, m) => n + m.rows_read, 0);
  const after = await queryStats(tap, selection, now), afterReads = lastMeta.reduce((n, m) => n + m.rows_read, 0);
  const { vendorOriginConflictViews, vendorConflictWithMatchingOriginViews, ...commonVerification } = after.verification;
  assert.deepEqual({ ...after, verification: commonVerification }, before);
  assert.equal(after.totals.views, 10); assert.equal(after.referralPolicy.excludedViews, 1);
  assert.equal(vendorOriginConflictViews, 4); assert.equal(vendorConflictWithMatchingOriginViews, 2);
  assert.equal(after.verification.vendorMatchingOriginViews, 1); assert.equal(after.verification.vendorDifferentOriginViews, 1);
  assert.equal(after.verification.vendorUserAgentBoundViews, 0);
  const empty = await queryStats(tap, { ...selection, path: '/absent' }, now);
  assert.equal(empty.verification.vendorOriginConflictViews, 0);
  const googleOnly = await queryStats(tap, { ...selection, path: '/google-signed' }, now);
  assert.equal(googleOnly.totals.views, 1); assert.equal(googleOnly.verification.vendorMatchingOriginViews, 1);
  const evidence = { checkedAt: new Date().toISOString(), baselineCommit,
    method: 'Native workerd collector + local D1 with saved public IP feeds, intercepted generated keys, independently constructed g-labelled signature bytes. No authentic Google action, production request or vendor fetch.',
    baseline: { googleDeclarationWasUnmapped: true, mixedExaGoogleWasGlobalMatch: true },
    ipChecks, collectorControls: controls,
    report: { includedViews: after.totals.views, ownerExcluded: 1, referralExcluded: 1,
      conflictingOrigins: vendorOriginConflictViews, conflictWithSelectedMatch: vendorConflictWithMatchingOriginViews,
      otherCommonOutputUnchanged: true, beforeReads, afterReads, deltaReads: afterReads - beforeReads, diagnosticWrites: 0, scopedAndEmpty: true },
    feedSha256: Object.fromEntries(Object.entries(feeds).map(([name, body]) => [name, createHash('sha256').update(body).digest('hex')])),
    baselineSourceSha256: { vendor: createHash('sha256').update(oldVendor.source).digest('hex'), stats: createHash('sha256').update(oldStats.source).digest('hex') },
    productionRequests: 0, externalRequests: 0, humanLabels: 0,
    limits: ['Selected fixtures are not population accuracy.', 'Listed IP ranges support network attribution, not purpose.', 'Generated keys substituted at a vendor origin are fixtures, not vendor authentication.', 'Stored historical profiles are not rewritten.'] };
  writeFileSync(output, JSON.stringify(evidence, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  writeFileSync(privateOutput, JSON.stringify({ captures, after }, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify({ nativeIpControls: ipChecks.length, collectorControls: controls.length, report: evidence.report }));
} finally { await mf.dispose(); }

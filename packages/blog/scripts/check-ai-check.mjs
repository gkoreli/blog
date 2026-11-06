import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const require = createRequire(new URL('../../../package.json', import.meta.url));
const { Miniflare, Log, LogLevel } = await import(pathToFileURL(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] })));
const entry = fileURLToPath(new URL('../src/worker/ai-check.ts', import.meta.url));
const quotaEntry = fileURLToPath(new URL('../src/worker/ai-check-quota.ts', import.meta.url));
const fixture = {
  version: '2026-11-06.1', checkedAt: '2026-11-06T12:00:00.000Z', target: 'https://public.site/article', complete: true,
  resources: [], page: { title: '<script>private-attack()</script>', description: null, canonical: null, language: null, textCharacters: 123, headings: 1, links: 2, scriptElements: 0, metaRobots: [], structuredDataTypes: [], structuredDataBlocks: 0, invalidStructuredDataBlocks: 0, alternateLinks: [], parseState: 'parsed' },
  robots: { state: 'missing', groups: 0, rules: 0, sitemaps: [], bots: [] }, discovery: { llms: 'missing', llmsLinks: 0, sitemap: 'missing', markdown: 'not-negotiated' }, findings: [], limits: ['Bounded fixture'],
};
const bundle = await build({ stdin: { contents: `import {handleAiCheck} from ${JSON.stringify(entry)};
import {quotaCallerKey,admitCheck,d1QuotaStore} from ${JSON.stringify(quotaEntry)};
const fixture=${JSON.stringify(fixture)};
export default {async fetch(request,env){
  if(new URL(request.url).pathname==='/native-quota') {
    const now=new Date('2026-11-06T12:00:00Z');
    const key=await quotaCallerKey(env.ANALYTICS_HASH_KEY,'native-concurrent',now.toISOString().slice(0,10));
    return Response.json(await Promise.all(Array.from({length:30},()=>admitCheck(d1QuotaStore(env.DB),key,now))));
  }
  const headers=new Headers(request.headers);
  const day=headers.get('X-Fixture-Day')??'2026-11-06';
  const testRequest=new Request(request,{headers,cf:{asn:13335}});
  return handleAiCheck(testRequest,{
    ...env,
    ...(headers.get('X-Fixture-Store')==='fail'?{DB:{prepare(){throw new Error('private-store-error')}}}:{}),
    ...(headers.get('X-Fixture-Config')==='missing'?{ANALYTICS_HASH_KEY:''}:{}),
    AI_CHECK_RATE_LIMITER:{limit:async()=>({success:headers.get('X-Fixture-Burst')!=='deny'})},
    AI_CHECK_GLOBAL_LIMITER:{limit:async()=>({success:true})},
    ASSETS:{fetch:async()=>new Response('<!doctype html><html><main><h1>AI site check</h1><div id="ai-check-server-result"></div></main></html>',{headers:{'Content-Type':'text/html'}})},
  },{audit:async target=>({...fixture,target}),now:()=>new Date(day+'T12:00:00Z')});
}};`, resolveDir: dirname(entry) }, bundle: true, format: 'esm', platform: 'browser', write: false });
let outbound = 0;
const runtime = new Miniflare({ modules: true, script: bundle.outputFiles[0].text, compatibilityDate: '2026-03-06', compatibilityFlags: ['global_fetch_strictly_public'],
  d1Databases: { DB: 'ai-check-test' }, bindings: { ANALYTICS_HASH_KEY: 'private-test-purpose-separated-hash-key' },
  outboundService() { outbound++; throw new Error('External network disabled'); }, log: new Log(LogLevel.ERROR),
});
let count = 0;
async function visit(path = '/api/ai-check', init = {}, ip = '8.8.8.8') {
  count++;
  return runtime.dispatchFetch(`https://publication.site${path}`, { method: 'POST', body: JSON.stringify({ url: 'https://public.site/article' }), ...init,
    headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': ip, ...init.headers } });
}
try {
  const db = await runtime.getD1Database('DB');
  const schema = readFileSync(new URL('../migrations/0001_ai_check_quota.sql', import.meta.url), 'utf8');
  for (const statement of schema.split(';').map(value => value.trim()).filter(Boolean)) await db.prepare(statement).run();
  const native = await (await visit('/native-quota')).json();
  assert.equal(native.filter(row => row.allowed).length, 10);
  assert.deepEqual(native.filter(row => row.allowed).map(row => row.quota.remaining).sort((a, b) => a - b), [0,1,2,3,4,5,6,7,8,9]);
  const first = await visit();
  assert.equal(first.status, 200);
  assert.equal(first.headers.get('X-RateLimit-Remaining'), '9');
  assert.equal(first.headers.get('Cache-Control'), 'no-store');
  assert.equal((await first.json()).quota.resetAt, '2026-11-07T00:00:00.000Z');
  const attempts = await Promise.all(Array.from({ length: 20 }, () => visit()));
  assert.equal(attempts.filter(response => response.status === 200).length, 9);
  assert.equal(attempts.filter(response => response.status === 429).length, 11);
  const exhausted = await visit();
  assert.equal(exhausted.status, 429);
  assert.equal(exhausted.headers.get('Retry-After'), '43200');
  assert.equal((await visit('/api/ai-check', { headers: { 'X-Fixture-Day': '2026-11-07' } })).status, 200);
  const alternate = await visit('/api/ai-check', {}, '1.1.1.1');
  assert.equal(alternate.status, 200);
  const nojs = await visit('/ai-check', { body: new URLSearchParams({ url: 'https://public.site/article' }).toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }, '9.9.9.9');
  assert.equal(nojs.status, 200);
  const rendered = await nojs.text();
  assert.match(rendered, /&lt;script&gt;private-attack\(\)&lt;\/script&gt;/);
  assert.doesNotMatch(rendered, /<script>private-attack/);
  assert.match(rendered, /Page and discovery evidence/);
  assert.equal(nojs.headers.get('X-Robots-Tag'), 'noindex');
  for (const [init, status] of [
    [{ method: 'GET', body: undefined }, 405],
    [{ body: 'not json' }, 400],
    [{ body: JSON.stringify({ url: 'https://127.0.0.1/' }) }, 400],
    [{ body: JSON.stringify({ url: 'https://public.site/?secret=private' }) }, 400],
    [{ body: JSON.stringify({ url: 'https://public.site/', headers: { Authorization: 'private' } }) }, 400],
    [{ body: ' '.repeat(4097) }, 413],
    [{ headers: { 'Content-Type': 'text/plain' } }, 415],
    [{ headers: { Origin: 'https://attacker.site' } }, 403],
    [{ headers: { 'Sec-Fetch-Site': 'cross-site' } }, 403],
    [{ headers: { 'X-Fixture-Burst': 'deny' } }, 429],
    [{ headers: { 'CF-Worker': 'attacker.site' } }, 503],
    [{ headers: { 'X-Fixture-Store': 'fail' } }, 503],
    [{ headers: { 'X-Fixture-Config': 'missing' } }, 503],
  ]) assert.equal((await visit('/api/ai-check', init, '4.2.2.2')).status, status);
  const streamed = await visit('/api/ai-check', {body:new ReadableStream({start(controller){controller.enqueue(new TextEncoder().encode(' '.repeat(4097)));controller.close();}}), duplex:'half'}, '4.2.2.2');
  assert.equal(streamed.status,413);
  const stalled = await visit('/api/ai-check', {body:new ReadableStream({start(controller){controller.enqueue(new TextEncoder().encode('{'));}}),duplex:'half'}, '4.2.2.2');
  assert.equal(stalled.status,408);
  const requestCheck = await visit('/api/request-check', { method: 'GET', body: undefined, headers: { 'User-Agent': 'Mozilla/5.0 Chrome/130.0.0.0 Safari/537.36 private-secret@example.invalid', 'CF-Verified-Bot': 'true', 'Sec-Fetch-Mode': 'cors', 'Sec-Fetch-Dest': 'empty' } }, '208.67.222.222');
  assert.equal(requestCheck.status, 200);
  const requestEvidence = await requestCheck.json();
  assert.equal(requestEvidence.request.provenance, 'incoming-request');
  assert.equal(requestEvidence.request.signature.localOutcome, 'absent');
  assert.equal(requestEvidence.request.signature.native.verifiedBot, null);
  assert.equal(requestEvidence.request.classification.readerKind, 'http-client');
  assert.doesNotMatch(JSON.stringify(requestEvidence), /private-secret|example.invalid|208\.67\.222\.222/);
  const apiSchema = await visit('/api/ai-check/schema', { method: 'GET', body: undefined });
  assert.equal(apiSchema.status, 200);
  assert.equal((await apiSchema.json()).openapi, '3.1.0');
  const stored = (await db.prepare('SELECT * FROM ai_check_daily_quota').all()).results;
  assert.ok(stored.every(row => /^[a-f0-9]{64}$/.test(row.caller_key) && row.used <= 10));
  assert.equal(stored.length, 6); // Native, caller/two days, independent caller, no-JS, request assessment.
  assert.doesNotMatch(JSON.stringify(stored), /public.site|8\.8\.8\.8|private-test|private-secret/);
  assert.equal(outbound, 0);
  console.log(JSON.stringify({ result: 'passed', httpRequests: count, nativeConcurrentAdmissions: 10, rejectedNativeAdmissions: 20, quotaRows: stored.length, externalRequests: outbound, noJavaScriptHtml: 'passed', escapedRemoteHtml: 'passed', inputAndOriginBoundaries: 'passed', requestEvidence: 'passed' }));
} finally { await runtime.dispose(); }

import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { validateOpenApiValue } from '../test/fixtures/validate-openapi.mjs';
import { RETAINED_CLIENT_PRODUCTS_20261106, retainedMatchedProducts, encodeMatchedProducts } from '../../analytics/src/retained-client-products.ts';

const require = createRequire(new URL('../../../package.json', import.meta.url));
const { Miniflare, Log, LogLevel } = await import(pathToFileURL(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] })));
const entry = fileURLToPath(new URL('../src/worker/ai-check.ts', import.meta.url));
const assessmentEntry = fileURLToPath(new URL('../../analytics/src/request-assessment.ts', import.meta.url));
const vendorEntry = fileURLToPath(new URL('../../analytics/src/vendor-ip.ts', import.meta.url));
const quotaEntry = fileURLToPath(new URL('../src/worker/ai-check-quota.ts', import.meta.url));
const fixture = {
  version: '2026-11-06.1', checkedAt: '2026-11-06T12:00:00.000Z', target: 'https://public.site/article', complete: true,
  resources: [{ kind: 'markdown', requestedUrl: 'https://public.site/article', finalUrl: 'https://public.site/article', outcome: 'received', status: 200, contentType: 'text/html', bytes: 123, elapsedMs: 1, redirects: 0, probeAgent: null, headersOmitted: [], headers: { robots: null, link: null, contentLocation: null, vary: null } }], page: { title: '<script>private-attack()</script>', description: null, canonical: null, language: null, textCharacters: 123, headings: 1, links: 2, scriptElements: 0, metaRobots: [], structuredDataTypes: [], structuredDataBlocks: 0, invalidStructuredDataBlocks: 0, alternateLinks: [], parseState: 'parsed' },
  robots: { state: 'missing', groups: 0, rules: 0, sitemaps: [], bots: [] }, discovery: { llms: 'missing', llmsLinks: 0, sitemap: 'missing', markdown: 'not-negotiated' }, findings: [], limits: ['Bounded fixture'],
};
const formShell = '<!doctype html><html><main><h1>AI site check</h1><form action="/ai-check" method="post" novalidate><label for="ai-check-url">Your public page URL</label><input id="ai-check-url" name="url" type="text" inputmode="url" aria-describedby="ai-check-input-help ai-check-url-error"><p id="ai-check-input-help">A public domain or HTTPS URL.</p><p id="ai-check-url-error" data-audit-field-error role="alert" hidden></p><button>Check this page</button></form><div id="ai-check-server-result"></div></main></html>';
const bundle = await build({ stdin: { contents: `import {handleAiCheck} from ${JSON.stringify(entry)};
import {assessRequest} from ${JSON.stringify(assessmentEntry)};
import {verifyVendorIp} from ${JSON.stringify(vendorEntry)};
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
    ASSETS:{fetch:async assetRequest=>new URL(assetRequest.url).pathname==='/ai-check-example.json'?Response.json({report:fixture}):new Response(${JSON.stringify(formShell)},{headers:{'Content-Type':'text/html'}})},
  },{audit:async target=>({...fixture,target}),
    // Explicit missing-edge-address fixture: actual parser/signature, no vendor feed I/O.
    requestAssessment:input=>assessRequest(input,{verifyNetwork:(_request,names)=>verifyVendorIp(new Request(input.url),names)}),now:()=>new Date(day+'T12:00:00Z')});
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
  assert.match(rendered, /<div id="ai-check-server-result" tabindex="-1" autofocus><section id="access-report"/, 'A completed native POST focuses its replaceable result container');
  assert.match(rendered, /class="access-optional-state">HTML returned; Markdown optional<\/(?:p|span)>/);
  assert.equal(nojs.headers.get('X-Robots-Tag'), 'noindex');
  assert.match(rendered, /<input[^>]*value="https:\/\/public.site\/article"/);
  const nojsBare = await visit('/ai-check', { body: new URLSearchParams({ url: '  reddit.com/r/programming  ' }).toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }, '9.9.9.9');
  assert.equal(nojsBare.status, 200);
  const bareHtml = await nojsBare.text();
  assert.match(bareHtml, /<input[^>]*value="https:\/\/reddit.com\/r\/programming"/);
  assert.match(bareHtml, /https:\/\/reddit.com\/r\/programming/);
  const bareApi = await visit('/api/ai-check', { body: JSON.stringify({ url: 'reddit.com' }) }, '9.9.9.9');
  assert.equal(bareApi.status, 200);
  assert.equal((await bareApi.json()).report.target, 'https://reddit.com/');
  const quotaBeforeInvalid = await db.prepare('SELECT SUM(used) AS used, COUNT(*) AS rows FROM ai_check_daily_quota').first();
  for (const url of ['', 'http://reddit.com', 'https://reddit.com/?q=secret', 'https://127.0.0.1/', 'https://public.site/" onfocus="attack']) {
    const invalidForm = await visit('/ai-check', { body: new URLSearchParams({ url }).toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }, '9.9.9.9');
    assert.equal(invalidForm.status, 400);
    assert.equal(invalidForm.headers.get('X-RateLimit-Remaining'), null);
    const invalidHtml = await invalidForm.text();
    assert.match(invalidHtml, /<form[^>]*action="\/ai-check"[^>]*novalidate/);
    assert.match(invalidHtml, /<input[^>]*aria-invalid="true"[^>]*autofocus/);
    assert.match(invalidHtml, /<p id="ai-check-url-error"[^>]*role="alert">[^<]+<\/p>/);
    assert.doesNotMatch(invalidHtml, /<input[^>]* onfocus="attack/);
    if (url.includes('onfocus')) assert.match(invalidHtml, /value="https:\/\/public.site\/&quot; onfocus=&quot;attack"/);
  }
  const strictApi = await visit('/api/ai-check', { body: JSON.stringify({ url: ' reddit.com ' }) }, '9.9.9.9');
  assert.equal(strictApi.status, 400);
  assert.deepEqual(await db.prepare('SELECT SUM(used) AS used, COUNT(*) AS rows FROM ai_check_daily_quota').first(), quotaBeforeInvalid);
  const nojsQuota = await visit('/ai-check', { body: new URLSearchParams({ url: 'reddit.com' }).toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }, '8.8.8.8');
  assert.equal(nojsQuota.status, 429);
  const quotaHtml = await nojsQuota.text();
  assert.match(quotaHtml, /<input[^>]*value="https:\/\/reddit.com\/"/);
  assert.doesNotMatch(quotaHtml, /aria-invalid="true"/);
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
  for(const method of ['GET','HEAD']) {
    const sample=await visit('/ai-check/example',{method,body:undefined},'8.8.8.8');
    assert.equal(sample.status,200);
    const text=await sample.text();
    assert.equal(sample.headers.get('X-RateLimit-Remaining'),null);
    if(method==='GET'){assert.match(text,/Saved example/);assert.match(text,/Technical access score/);assert.doesNotMatch(text,/checks remaining/);}
    else assert.equal(text,'');
  }
  const apiSchema = await visit('/api/ai-check/schema', { method: 'GET', body: undefined });
  assert.equal(apiSchema.status, 200);
  const contract = await apiSchema.json();
  assert.equal(contract.openapi, '3.1.0');
  const responseSchema = contract.paths['/api/request-check'].get.responses['200'].content['application/json'].schema;
  validateOpenApiValue(contract, responseSchema, requestEvidence);
  assert.equal(requestEvidence.request.version, '2026-11-11.1');
  assert.deepEqual(requestEvidence.request.context, { referrerState: 'absent', fetchSite: null });
  for (const [fetchSite, expectedKind] of [['cross-site','http-client'],['none','http-client'],['same-origin','unresolved']]) {
    const response = await visit('/api/request-check', { method: 'GET', body: undefined, headers: {
      'User-Agent': 'Mozilla/5.0 Chrome/130.0.0.0 Safari/537.36', Accept: 'text/html', 'Accept-Language': 'en',
      Referer: 'https://www.google.com/search?q=private-fixture', 'Sec-Fetch-Mode': 'navigate', 'Sec-Fetch-Dest': 'document', 'Sec-Fetch-Site': fetchSite, 'Sec-Fetch-User': '?1',
    } }, '8.26.56.26');
    if (fetchSite === 'cross-site') {
      assert.equal(response.status,403);
      assert.equal(response.headers.get('X-RateLimit-Remaining'),null);
      continue;
    }
    assert.equal(response.status,200); const value=await response.json();
    validateOpenApiValue(contract,responseSchema,value);
    assert.deepEqual(value.request.context,{referrerState:'external',fetchSite});
    // dispatchFetch emits mode=cors; retain the received context rather than
    // pretending this transport produced the navigation used in domain fixtures.
    assert.equal(value.request.classification.readerKind,expectedKind);
    assert.equal(value.request.evidence.navigationShaped,false);
    assert.doesNotMatch(JSON.stringify(value),/google\.com|private-fixture/);
  }
  const catalogueResponse = await visit('/api/request-check', { method: 'GET', body: undefined, headers: {
    'User-Agent': RETAINED_CLIENT_PRODUCTS_20261106.map(product => `${product}/1.0`).join(' '),
  } }, '208.67.222.222');
  assert.equal(catalogueResponse.status, 200);
  const catalogue = await catalogueResponse.json();
  validateOpenApiValue(contract, responseSchema, catalogue);
  assert.deepEqual(retainedMatchedProducts(catalogue.request.evidence), [...RETAINED_CLIENT_PRODUCTS_20261106].sort());
  assert.equal(catalogue.request.evidence.declarations.matchedProductBits, '3ffffffffffffffffff');
  // Zero, every individual bit and full budget agree between the public schema
  // and the independently frozen decoder; no live registry order is inferred.
  for (const products of [[], ...RETAINED_CLIENT_PRODUCTS_20261106.map(product => [product])]) {
    const encoded = structuredClone(catalogue);
    Object.assign(encoded.request.evidence.declarations, encodeMatchedProducts(products));
    validateOpenApiValue(contract, responseSchema, encoded);
    assert.deepEqual(retainedMatchedProducts(encoded.request.evidence), products);
  }
  const invalidDeclarations = [
    declarations => { declarations.matchedProducts = []; },
    declarations => { delete declarations.productProfile; },
    declarations => { delete declarations.matchedProductBits; },
    declarations => { declarations.productProfile = 'future'; },
    declarations => { declarations.matchedProductBits = '4000000000000000000'; },
    declarations => { declarations.matchedProductBits = '00'; },
    declarations => { declarations.matchedProductBits = 'a'.repeat(20); },
    declarations => { declarations.matchedProductBits = 'A'; },
    declarations => { declarations.unknown = true; },
  ];
  for (const mutate of invalidDeclarations) {
    const invalid = structuredClone(catalogue);
    mutate(invalid.request.evidence.declarations);
    assert.throws(() => validateOpenApiValue(contract, responseSchema, invalid));
  }
  for (const version of ['2026-10-29.2', 'future']) {
    const invalid = structuredClone(catalogue);
    invalid.request.evidence.version = version;
    assert.throws(() => validateOpenApiValue(contract, responseSchema, invalid));
  }
  const obsoleteEnvelope = structuredClone(catalogue);
  obsoleteEnvelope.request.version = '2026-11-06.1';
  assert.throws(() => validateOpenApiValue(contract, responseSchema, obsoleteEnvelope));
  const stored = (await db.prepare('SELECT * FROM ai_check_daily_quota').all()).results;
  assert.ok(stored.every(row => /^[a-f0-9]{64}$/.test(row.caller_key) && row.used <= 10));
  assert.equal(stored.length, 7); // Native, caller/two days, independent caller, no-JS, request assessment/two callers.
  assert.doesNotMatch(JSON.stringify(stored), /public.site|8\.8\.8\.8|private-test|private-secret/);
  assert.equal(outbound, 0);
  console.log(JSON.stringify({ result: 'passed', httpRequests: count, nativeConcurrentAdmissions: 10, rejectedNativeAdmissions: 20, quotaRows: stored.length, externalRequests: outbound, noJavaScriptHtml: 'passed', noJavaScriptBareDomain: 'normalized', invalidFormQuotaUse: 0, retainedEscapedInput: 'passed', escapedRemoteHtml: 'passed', inputAndOriginBoundaries: 'passed', requestEvidence: 'passed', actualResponsesMatchOpenApi: 4, compactAliasRoundtrip: RETAINED_CLIENT_PRODUCTS_20261106.length, additionalCodecSchemaCases: 75, malformedSchemaRejections: 12, networkFixture: 'missing-edge-address'  }));
} finally { await runtime.dispose(); }

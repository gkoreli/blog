import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { assessUserAgent } from '../src/user-agent-assessment.ts';
import { extractRequestEvidence } from '../src/request-evidence.ts';

const blogRequire = createRequire(new URL('../../blog/package.json', import.meta.url));
const { build } = await import(pathToFileURL(blogRequire.resolve('esbuild')));
const require = createRequire(new URL('../../../package.json', import.meta.url));
const { Miniflare, Log, LogLevel } = await import(pathToFileURL(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] })));
const base = JSON.parse(readFileSync(new URL('../../blog/tools/user-agent-check/cases.json', import.meta.url), 'utf8'));
const inputs = base.map(row => ({ id: row.id, userAgent: row.userAgent }));
inputs.push(
  { id: 'missing', userAgent: null }, { id: 'empty', userAgent: '' },
  { id: 'mobile-preference', userAgent: 'Chrome/150.0', mobileHint: '?1' },
  { id: 'invalid-mobile-hint', userAgent: 'Chrome/150.0', mobileHint: 'true' },
  { id: 'browser-vendors', userAgent: 'Chrome/150.0 Edg/150.0 OPR/120.0' },
  { id: 'browser-vendors-reversed', userAgent: 'OPR/120.0 Edg/150.0 Chrome/150.0' },
  { id: 'platforms', userAgent: '(Linux; Android 14; Windows NT 10.0) Chrome/150.0' },
  { id: 'platform-versions', userAgent: '(Windows NT 10.0; Windows NT 11.0) Chrome/150.0' },
  { id: 'ios-versions', userAgent: '(CPU iPhone OS 16_3; CPU iPhone OS 17_0) AppleWebKit/605.1.15 Version/17.0 Safari/604.1' },
  { id: 'reduced-android', userAgent: '(Linux; Android 10; K) Chrome/150.0.0.0 Mobile Safari/537.36' },
  { id: 'frozen-ios', userAgent: '(iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 Version/26.0 Mobile/15E148 Safari/604.1' },
  { id: 'desktop-shaped', userAgent: '(X11; Linux x86_64) Chrome/150.0.0.0 Safari/537.36', mobileHint: '?0' },
  { id: 'policy-token', userAgent: 'Google-Extended/1.0' },
  { id: 'three-digit', userAgent: 'Chrome/100.0' },
  { id: 'four-digit', userAgent: 'Chrome/1000.0' },
  { id: 'malformed-os', userAgent: '(Windows NT nope) Chrome/150.0' },
  { id: 'duplicate-malformed-os', userAgent: '(Windows NT 10.0; Windows NT nope) Chrome/150.0' },
  { id: 'hint-http-whitespace', userAgent: 'Chrome/150.0', mobileHint: ' \t?1\t ' },
  { id: 'hint-nbsp-not-whitespace', userAgent: 'Chrome/150.0', mobileHint: '\u00a0?1\u00a0' },
);
const assessment = fileURLToPath(new URL('../src/user-agent-assessment.ts', import.meta.url));
const evidence = fileURLToPath(new URL('../src/request-evidence.ts', import.meta.url));
const bundle = await build({ stdin: { contents: `import {assessUserAgent} from ${JSON.stringify(assessment)};
import {extractRequestEvidence} from ${JSON.stringify(evidence)};
export default {async fetch(request,env) {
  const input=await request.json(), headers=new Headers();
  if(input.userAgent!==null)headers.set('User-Agent',input.userAgent);
  if(input.mobileHint!==undefined)headers.set('Sec-CH-UA-Mobile',input.mobileHint);
  const diagnostic=extractRequestEvidence(new Request('https://fixture.example/',{headers}),new Response('page'));
  const result={assessment:assessUserAgent(headers.get('User-Agent'),headers.get('Sec-CH-UA-Mobile')),diagnostic};
  await env.DB.prepare('INSERT INTO evidence(id,value) VALUES (?,?)').bind(input.id,JSON.stringify(result)).run();
  const row=await env.DB.prepare('SELECT value FROM evidence WHERE id=?').bind(input.id).first();
  return new Response(row.value,{headers:{'Content-Type':'application/json'}});
}};`, resolveDir: dirname(assessment) }, bundle: true, format: 'esm', platform: 'browser', write: false });
let outbound = 0;
const runtime = new Miniflare({ modules: true, script: bundle.outputFiles[0].text, compatibilityDate: '2026-03-01', cf: {},
  d1Databases: { DB: 'user-agent-claims-check' }, log: new Log(LogLevel.ERROR),
  outboundService() { outbound++; throw Error('External transport disabled'); } });
try {
  const db = await runtime.getD1Database('DB');
  await db.prepare('CREATE TABLE evidence(id TEXT PRIMARY KEY,value TEXT NOT NULL)').run();
  const rows = [];
  for (const input of inputs) {
    const headers = new Headers(input.userAgent === null ? {} : { 'User-Agent': input.userAgent });
    if (input.mobileHint !== undefined) headers.set('Sec-CH-UA-Mobile', input.mobileHint);
    const expected = { assessment: assessUserAgent(headers.get('User-Agent'), headers.get('Sec-CH-UA-Mobile')),
      diagnostic: extractRequestEvidence(new Request('https://fixture.example/', { headers }), new Response('page')) };
    const response = await runtime.dispatchFetch('https://native.example/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
    assert.equal(response.status, 200, input.id);
    const actual = await response.json();
    assert.deepEqual(actual, expected, input.id);
    rows.push({ id: input.id, matched: true, browser: actual.assessment.browser.state, platform: actual.assessment.platform.state });
  }
  assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM evidence').first()).n, inputs.length);
  assert.equal(outbound, 0);
  console.log(JSON.stringify({ version: 1, cases: inputs.length, exactNodeNativeMatches: rows.length,
    nativeD1StoredAndReadBack: rows.length, bundleSha256: createHash('sha256').update(bundle.outputFiles[0].contents).digest('hex'),
    externalRequests: outbound, productionRequests: 0, humanLabels: 0,
    limits: 'Synthetic supplied-header values in local workerd and a fixture D1 table; not collector acceptance, browser fidelity or population accuracy.', rows }, null, 2));
} finally { await runtime.dispose(); }

import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const require = createRequire(new URL('../../../package.json', import.meta.url));
const { build } = await import(pathToFileURL(require.resolve('esbuild', { paths: [dirname(require.resolve('wrangler/package.json'))] })));
const { Miniflare, Log, LogLevel } = await import(pathToFileURL(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] })));
const entry = fileURLToPath(new URL('../src/index.ts', import.meta.url));
const bundle = await build({ stdin: { contents: `import {analyzeSite} from ${JSON.stringify(entry)}; export default {async fetch(request){if(new URL(request.url).pathname==='/unsupported-redirect'){try{await fetch('https://cloudflare-dns.com/dns-query?name=public.site&type=A',{redirect:'error'});return Response.json({rejected:false});}catch(error){return Response.json({rejected:true,name:error.name,message:error.message});}}return Response.json(await analyzeSite(new URL(request.url).pathname==='/dns-redirect'?'https://redirect-dns.site/article':'https://public.site/article'));}};`, resolveDir: dirname(entry) }, bundle: true, format: 'esm', platform: 'browser', write: false });
const requests = [];
const runtime = new Miniflare({ modules: true, script: bundle.outputFiles[0].text, compatibilityDate: '2026-03-06', compatibilityFlags: ['global_fetch_strictly_public'],
  outboundService(request) {
    const url = new URL(request.url);
    requests.push({url: request.url, agent: request.headers.get('User-Agent'), accept: request.headers.get('Accept')});
    if (url.hostname === 'cloudflare-dns.com' && url.searchParams.get('name') === 'redirect-dns.site') return new Response('', {status:302,headers:{Location:'https://127.0.0.1/private'}});
    if (url.hostname === 'cloudflare-dns.com') return Response.json({ Status: 0, Answer: url.searchParams.get('type') === 'A' ? [{ type: 1, data: '93.184.216.34' }] : [] });
    assert.equal(url.hostname, 'public.site');
    if (url.pathname === '/robots.txt') return new Response('User-agent: *\nAllow: /\nUser-agent: ExaSearchBot\nAllow: /', { headers: { 'Content-Type': 'text/plain' } });
    if (url.pathname === '/llms.txt') return new Response('# Public site\n- [Article](https://public.site/article)', { headers: { 'Content-Type': 'text/markdown' } });
    if (url.pathname === '/sitemap.xml') return new Response('<urlset><url><loc>https://public.site/article</loc></url></urlset>', { headers: { 'Content-Type': 'application/xml' } });
    if (request.headers.get('Accept') === 'text/markdown') return new Response('# Article\nA useful answer', { headers: { 'Content-Type': 'text/markdown' } });
    return new Response('<html lang="en"><head><title>Native transport</title></head><body><h1>Article</h1><p>Useful answer in source.</p></body></html>', { headers: { 'Content-Type': 'text/html' } });
  }, log: new Log(LogLevel.ERROR),
});
try {
  // Historical failure: Workers rejects redirect:error before any outbound I/O.
  const unsupported = await (await runtime.dispatchFetch('https://publication.site/unsupported-redirect')).json();
  assert.equal(unsupported.rejected,true);
  assert.equal(unsupported.name,'TypeError');
  assert.match(unsupported.message,/Invalid redirect value/);
  assert.equal(requests.length,0);
  const response = await runtime.dispatchFetch('https://publication.site/native');
  const report = await response.json();
  console.log(JSON.stringify({states:report.resources.map(resource=>({kind:resource.kind,outcome:resource.outcome,status:resource.status})),outboundRequests:requests.length}));
  assert.equal(response.status,200);
  assert.equal(report.complete,true);
  assert.equal(report.resources.length,8);
  assert.ok(report.resources.every(resource=>resource.outcome==='received' && resource.status===200));
  assert.equal(report.page.title,'Native transport');
  assert.equal(report.discovery.markdown,'negotiated');
  assert.equal(requests.filter(request=>new URL(request.url).hostname==='cloudflare-dns.com').length,16);
  assert.equal(requests.filter(request=>new URL(request.url).hostname==='public.site').length,8);
  const beforeRedirect = requests.length;
  const redirectedDns = await (await runtime.dispatchFetch('https://publication.site/dns-redirect')).json();
  assert.ok(redirectedDns.resources.every(resource=>resource.outcome==='dns-error'));
  assert.ok(requests.slice(beforeRedirect).every(request=>new URL(request.url).hostname==='cloudflare-dns.com'));
  assert.equal(requests.length-beforeRedirect,16);
  console.log('Native default Workers transport passed: 8 target GETs, 16 DNS queries; unsupported redirect counterexample and DNS redirect refusal verified.');
} finally { await runtime.dispose(); }

import assert from 'node:assert/strict';
import test from 'node:test';
import { createVendorIpCache, parseVendorIpFeed, strictIp, verifyVendorIp, VENDOR_IP_FETCH_DEADLINE_MS, VENDOR_IP_MAX_BODY_BYTES } from '../.test-dist/vendor-ip.js';
import { VENDOR_IP_SOURCES } from '../.test-dist/vendor-ip-sources.js';
import { analyzeTraffic } from '../.test-dist/classify.js';
import { classifyReaderKind } from '../.test-dist/readerkind.js';

const now = new Date('2026-10-27T17:00:00Z');
function request(ip = '66.249.66.1', headers = {}, cf = true) { const r = new Request('https://publication.example/', { headers: { 'CF-Connecting-IP': ip, ...headers } }); if (cf) Object.defineProperty(r, 'cf', { value: { asn: 64512 } }); return r; }
function feed(prefixes = [{ ipv4Prefix: '66.249.66.0/24' }], headers = {}) { return Response.json({ creationTime: '2026-10-27T00:00:00', prefixes }, { headers: { 'Cache-Control': 'max-age=300', ...headers } }); }
const options = (fetcher, cache = createVendorIpCache(), at = now) => ({ now: at, cache, fetcher });

test('strict address grammar rejects library-compatible ambiguous encodings and scoped/list inputs', () => {
  for (const value of ['001.2.3.4','0x7f000001','127.1','2130706433','1.2.3.256','1.2.3.4,5.6.7.8','1.2.3.4:80','[2001:4860::1]','fe80::1%eth0','::ffff:001.2.3.4',' 1.2.3.4','2001::1::2','']) assert.equal(strictIp(value), null, value);
  assert.equal(strictIp('::ffff:66.249.66.1').toString(), '66.249.66.1');
  assert.equal(strictIp('2001:4860:4801:10::1').kind(), 'ipv6');
});

test('whole-feed validation rejects malformed families, host bits, private ranges and oversized collections', () => {
  for (const prefixes of [[],[{}],[{ ipv4Prefix:'66.249.66.1/24' }],[{ ipv4Prefix:'66.249.66.0/024' }],[{ ipv4Prefix:'66.249.66.0/33' }],[{ ipv4Prefix:'2001:4860::/32' }],[{ ipv6Prefix:'66.249.66.0/24' }],[{ ipv4Prefix:'10.0.0.0/8' }],[{ ipv4Prefix:'66.249.66.0/24', extra:'private-canary' }],[{ ipv6Prefix:'2001:4860::/129' }],Array.from({length:4097},()=>({ipv4Prefix:'66.249.66.0/24'}))]) assert.equal(parseVendorIpFeed({prefixes}),null);
  const valid=parseVendorIpFeed({prefixes:[{ipv4Prefix:'66.249.66.0/24'},{ipv6Prefix:'2001:4860:4801:10::/64'}],creationTime:'2026-10-27T00:00:00'});
  assert.equal(valid.prefixes.length,2);assert.equal(valid.publisherVersion,'2026-10-27T00:00:00');
  assert.equal(parseVendorIpFeed({prefixes:[{ipv4Prefix:'66.249.66.0/24'}],creationTime:'private-canary'}).publisherVersion,null);
});

test('address provenance abstains for unavailable, malformed, private and Worker relay inputs without fetching', async () => {
  const cases=[[request('',{},true),'missing'],[request('bad'),'invalid'],[request('203.0.113.2'),'special-range'],[request('10.0.0.1'),'special-range'],[request('2001:db8::1'),'special-range'],[request('66.249.66.1',{},false),'edge-context-unavailable'],[request('2a06:98c0:3600::103'),'worker-subrequest'],[request('66.249.66.1',{'CF-Worker':'worker.example'}),'worker-subrequest']];
  for(const [r,state] of cases){const e=await verifyVendorIp(r,['Googlebot'],options(async()=>{throw new Error('must not fetch')}));assert.equal(e.address.state,state);assert.equal(e.checks[0].outcome,'unavailable');assert.equal(e.checks[0].reason,'address-unavailable');assert.equal(JSON.stringify(e).includes(r.headers.get('CF-Connecting-IP')||'private-canary'),false);}
});

test('IPv4, IPv6, mapped IPv4 and pseudo-IPv4 original IPv6 use family-correct CIDR membership', async () => {
  const prefixes=[{ipv4Prefix:'66.249.66.0/24'},{ipv6Prefix:'2001:4860:4801:10::/64'}];
  for(const [r,expected] of [[request(),'listed'],[request('66.249.67.1'),'not-listed'],[request('::ffff:66.249.66.1'),'listed'],[request('2001:4860:4801:10::1'),'listed'],[request('240.0.0.1',{'CF-Connecting-IPv6':'2001:4860:4801:10::2'}),'listed']]){
    const e=await verifyVendorIp(r,['Googlebot'],options(async(url,init)=>{assert.equal(url,VENDOR_IP_SOURCES.find(s=>s.id==='google-common').url);assert.equal(init.redirect,'manual');assert.equal(JSON.stringify(init).includes('66.249.66.1'),false);return feed(prefixes)}));
    assert.equal(e.checks[0].outcome,expected);assert.match(e.checks[0].snapshot.sha256,/^[a-f0-9]{64}$/);assert.equal(e.checks[0].snapshot.prefixCount,2);assert.equal(JSON.stringify(e).includes('66.249.66.1'),false);
    if(r.headers.has('CF-Connecting-IPv6'))assert.equal(e.address.header,'cf-connecting-ipv6');
  }
});

test('source selection deduplicates shared feeds, bounds fanout and retains unmapped declarations', async () => {
  const names=VENDOR_IP_SOURCES.flatMap(s=>s.declarations);let fetches=0;
  const e=await verifyVendorIp(request(),[...names,'ExaUser'],options(async()=>{fetches++;return feed()}));
  assert.equal(fetches,4);assert.equal(e.checks.length,10);assert.equal(e.configuredDeclarationCount,11);assert.equal(e.unmappedDeclarationCount,1);assert.equal(e.checks.filter(c=>c.reason==='request-budget').length,6);assert.ok(Buffer.byteLength(JSON.stringify(e))<=4096);
  const single=await verifyVendorIp(request(),['AhrefsBot','AhrefsSiteAudit'],options(async()=>feed()));assert.equal(single.checks.length,1);assert.equal(single.configuredDeclarationCount,2);
  const none=await verifyVendorIp(request(),[],options(async()=>{throw new Error('must not fetch')}));assert.equal(none.checks.length,0);assert.equal(none.declarationCount,0);
});

test('DuckDuckBot and Google-Agent methods use dedicated fixed feeds without expanding to related products', async () => {
  for (const [name, source, url] of [
    ['DuckDuckBot', 'duckduckbot', 'https://duckduckgo.com/duckduckbot.json'],
    ['Google-Agent', 'google-agent', 'https://developers.google.com/static/crawling/ipranges/user-triggered-agents.json'],
  ]) {
    for (const [r, outcome] of [[request(), 'listed'], [request('8.8.8.8'), 'not-listed']]) {
      let calls = 0;
      const evidence = await verifyVendorIp(r, [name], options(async (actual, init) => {
        assert.equal(actual, url); assert.equal(init.redirect, 'manual');
        assert.equal(init.headers.has('CF-Connecting-IP'), false); calls++; return feed();
      }));
      assert.equal(calls, 1); assert.equal(evidence.profile, '2026-10-28.1');
      assert.equal(evidence.configuredDeclarationCount, 1); assert.equal(evidence.checks[0].source, source);
      assert.equal(evidence.checks[0].outcome, outcome);
    }
    const unavailable = await verifyVendorIp(request(), [name], options(async () => new Response(null, { status: 503 })));
    assert.equal(unavailable.checks[0].outcome, 'unavailable'); assert.equal(unavailable.checks[0].reason, 'http-status');
    const relay = await verifyVendorIp(request('66.249.66.1', { 'CF-Worker': 'relay.example' }), [name], options(async () => { assert.fail('relay must not fetch'); }));
    assert.equal(relay.address.state, 'worker-subrequest'); assert.equal(relay.checks[0].outcome, 'unavailable');
  }
  const unmapped = await verifyVendorIp(request(), ['DuckAssistBot', 'Google-GeminiNotebook'], options(async () => { assert.fail('related products must not inherit feeds'); }));
  assert.equal(unmapped.configuredDeclarationCount, 0); assert.equal(unmapped.unmappedDeclarationCount, 2); assert.deepEqual(unmapped.checks, []);
});

test('cache respects max-age/Age, per-source coalescing, expiry, validation and no stale fallback', async () => {
  const cache=createVendorIpCache();let calls=0;const fetcher=async(url,init)=>{calls++;return calls===1?feed(undefined,{'Cache-Control':'max-age=300',Age:'100',ETag:'"v1"'}):new Response(null,{status:503})};
  const a=await verifyVendorIp(request(),['Googlebot'],options(fetcher,cache));const b=await verifyVendorIp(request('66.249.67.1'),['Googlebot'],options(fetcher,cache,new Date(now.getTime()+199000)));
  assert.equal(a.checks[0].outcome,'listed');assert.equal(b.checks[0].outcome,'not-listed');assert.equal(calls,1);
  const expired=await verifyVendorIp(request(),['Googlebot'],options(fetcher,cache,new Date(now.getTime()+201000)));assert.equal(expired.checks[0].outcome,'unavailable');assert.equal(expired.checks[0].snapshot,null);assert.equal(calls,2);
  const cooldown=await verifyVendorIp(request(),['Googlebot'],options(fetcher,cache,new Date(now.getTime()+202000)));assert.equal(cooldown.checks[0].reason,'refresh-cooldown');assert.equal(cooldown.checks[0].outcome,'not-assessed');
  const parallelCache=createVendorIpCache();let release;let parallelCalls=0;const wait=new Promise(r=>release=r);const shared=async()=>{parallelCalls++;await wait;return feed()};
  const first=verifyVendorIp(request(),['Googlebot'],options(shared,parallelCache));const second=verifyVendorIp(request('66.249.67.1'),['Googlebot'],options(shared,parallelCache));release();const results=await Promise.all([first,second]);assert.equal(parallelCalls,1);assert.deepEqual(results.map(r=>r.checks[0].outcome),['listed','not-listed']);
});

test('no-cache revalidates conditionally after bounded cooldown; 304 inherits policy, no-store retains no feed', async () => {
  const cache=createVendorIpCache();let calls=0;const fetcher=async(url,init)=>{calls++;if(calls===1)return feed(undefined,{'Cache-Control':'no-cache',ETag:'"v1"'});assert.equal(init.headers.get('If-None-Match'),'"v1"');return new Response(null,{status:304})};
  const first=await verifyVendorIp(request(),['Googlebot'],options(fetcher,cache));const limited=await verifyVendorIp(request(),['Googlebot'],options(fetcher,cache,new Date(now.getTime()+1000)));assert.equal(limited.checks[0].outcome,'not-assessed');
  const fresh=await verifyVendorIp(request(),['Googlebot'],options(fetcher,cache,new Date(now.getTime()+31000)));assert.equal(fresh.checks[0].snapshot.sha256,first.checks[0].snapshot.sha256);assert.equal(fresh.checks[0].snapshot.fetchedAt,first.checks[0].snapshot.fetchedAt);assert.equal(fresh.checks[0].snapshot.validatedAt,new Date(now.getTime()+31000).toISOString());assert.equal(fresh.checks[0].snapshot.freshUntil,new Date(now.getTime()+31000).toISOString());assert.equal(calls,2);
  const noStore=createVendorIpCache();await verifyVendorIp(request(),['Googlebot'],options(async()=>feed(undefined,{'Cache-Control':'no-store'}),noStore));assert.equal(noStore.feeds.size,0);
});

test('HTTP redirects, invalid media/JSON, invalid UTF-8, body limits, fetch errors and deadline remain unavailable', async () => {
  const cases=[['http-status',()=>new Response(null,{status:302,headers:{Location:'https://private-canary.example'}})],['media-type',()=>new Response('{}',{headers:{'Content-Type':'text/html'}})],['invalid-feed',()=>new Response('broken',{headers:{'Content-Type':'application/json'}})],['invalid-feed',()=>new Response(new Uint8Array([0xff]),{headers:{'Content-Type':'application/json'}})],['body-limit',()=>new Response('x'.repeat(VENDOR_IP_MAX_BODY_BYTES+1),{headers:{'Content-Type':'application/json'}})],['invalid-feed',()=>feed([{ipv4Prefix:'bad'}])],['fetch-failed',()=>{throw new Error('private-canary')}]];
  for(const [reason,response] of cases){const e=await verifyVendorIp(request(),['Googlebot'],options(async()=>response()));assert.equal(e.checks[0].outcome,'unavailable');assert.equal(e.checks[0].reason,reason);assert.equal(JSON.stringify(e).includes('private-canary'),false);}
  const start=performance.now();const e=await verifyVendorIp(request(),['Googlebot'],options(async()=>new Promise(()=>{})));assert.equal(e.checks[0].reason,'fetch-timeout');assert.ok(performance.now()-start<VENDOR_IP_FETCH_DEADLINE_MS+800);
});

test('documented ad validation declaration remains other-bot, not an AI training role', () => {
  const c=analyzeTraffic('Mozilla/5.0 (compatible; OAI-AdsBot/1.0; +https://openai.com/adsbot)');assert.equal(c.agentName,'OAI-AdsBot');assert.equal(c.trafficClass,'bot');
  assert.equal(classifyReaderKind({trafficClass:c.trafficClass,agentName:c.agentName,observationSource:'edge',declarations:c.declarations,signature:{status:'absent'},asn:null}).kind,'other-bot');
});

test('HTTP apparent age, Expires, malformed/duplicate max-age and private responses never extend freshness', async () => {
  for(const headers of [
    {'Cache-Control':'max-age=300',Date:new Date(now.getTime()-400000).toUTCString()},
    {'Cache-Control':'max-age=300junk'},
    {'Cache-Control':'max-age=300, max-age=600'},
    {'Cache-Control':'private, max-age=300'},
    {'Cache-Control':'',Expires:new Date(now.getTime()-1000).toUTCString()},
    {'Cache-Control':'',Expires:'bad'},
    {'Cache-Control':'max-age=300',Age:'bad'},
  ]) {
    const cache=createVendorIpCache();const e=await verifyVendorIp(request(),['Googlebot'],options(async()=>feed(undefined,headers),cache));assert.equal(e.checks[0].snapshot.freshUntil,now.toISOString());
    const next=await verifyVendorIp(request(),['Googlebot'],options(async()=>{throw new Error('cooldown must prevent fetch')},cache,new Date(now.getTime()+1000)));assert.equal(next.checks[0].outcome,'not-assessed');
  }
  const positive=await verifyVendorIp(request(),['Googlebot'],options(async()=>feed(undefined,{'Cache-Control':'',Date:now.toUTCString(),Expires:new Date(now.getTime()+200000).toUTCString()})));assert.equal(positive.checks[0].snapshot.freshUntil,new Date(now.getTime()+200000).toISOString());
});

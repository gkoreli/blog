import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTarget, TargetValidationError, isPublicAddress } from '../.test-dist/target.js';
import { createWorkersTransport, MAX_RESOURCE_BYTES, MAX_TARGET_REQUESTS } from '../.test-dist/transport.js';
const publicDns = async () => ['93.184.216.34', '2606:4700:4700::1111'];
const request = { kind: 'page', url: 'https://public-site.com/article' };
test('target rejects local, special, numeric, IPv6, credentials, ambiguous syntax and custom ports', () => {
  for (const value of ['http://public-site.com', 'https://127.0.0.1', 'https://2130706433', 'https://0x7f000001', 'https://[::1]', 'https://localhost', 'https://foo.internal', 'https://foo.local', 'https://host.test', 'https://a.b:8443', 'https://user:pass@public-site.com', 'https://public-site.com/?secret=x', 'https://public-site.com/#secret', 'https://public-site.com\\@127.0.0.1', ' https://public-site.com', 'https://public-site.com.']) {
    assert.throws(() => normalizeTarget(value), TargetValidationError, value);
  }
  assert.equal(normalizeTarget('public-site.com/docs').href, 'https://public-site.com/docs');
});
test('only ordinary public unicast addresses pass', () => {
  for (const address of ['127.0.0.1', '10.0.0.1', '172.16.1.1', '192.168.0.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '224.0.0.1', '192.0.2.1', '198.51.100.1', '203.0.113.1', '::', '::1', 'fe80::1', 'fc00::1', '::ffff:127.0.0.1', '2001:db8::1']) assert.equal(isPublicAddress(address), false, address);
  assert.equal(isPublicAddress('93.184.216.34'), true);
  assert.equal(isPublicAddress('2606:4700:4700::1111'), true);
});
test('mixed private DNS answers prevent target fetch', async () => {
  let calls = 0;
  const transport = createWorkersTransport({ resolve: async () => ['93.184.216.34', '10.0.0.1'], fetch: async () => { calls++; return new Response('no'); } });
  const result = await transport.retrieve(request);
  assert.equal(result.evidence.outcome, 'blocked-target');
  assert.equal(calls, 0);
});
test('redirect destinations are validated and re-resolved without forwarding credentials', async () => {
  const seen = [];
  const hosts = [];
  const transport = createWorkersTransport({ resolve: async hostname => { hosts.push(hostname); return publicDns(); }, fetch: async (url, init) => {
    seen.push({ url, init });
    return url.endsWith('/article') ? new Response('', { status: 302, headers: { Location: '/final' } }) : new Response('ok', { headers: { 'Content-Type': 'text/html' } });
  } });
  const result = await transport.retrieve(request);
  assert.equal(result.evidence.outcome, 'received');
  assert.equal(result.evidence.redirects, 1);
  assert.equal(result.evidence.finalUrl, 'https://public-site.com/final');
  assert.equal(hosts.length, 2);
  assert.equal(seen[0].init.redirect, 'manual');
  assert.equal(new Headers(seen[0].init.headers).has('Cookie'), false);
  assert.equal(new Headers(seen[0].init.headers).has('Authorization'), false);
  const hostile = createWorkersTransport({ resolve: publicDns, fetch: async () => new Response('', { status: 302, headers: { Location: 'https://127.0.0.1/' } }) });
  assert.equal((await hostile.retrieve(request)).evidence.outcome, 'blocked-target');
});
test('redirect DNS private destination and redirect limits stay explicit', async () => {
  const transport = createWorkersTransport({ resolve: async host => host === 'public-site.com' ? publicDns() : ['10.0.0.1'], fetch: async () => new Response('', { status: 302, headers: { Location: 'https://other-site.com/' } }) });
  assert.equal((await transport.retrieve(request)).evidence.outcome, 'blocked-target');
  const loop = createWorkersTransport({ resolve: publicDns, fetch: async () => new Response('', { status: 302, headers: { Location: '/loop' } }) });
  assert.equal((await loop.retrieve(request)).evidence.outcome, 'redirect-limit');
});
test('body is bounded whether Content-Length is advertised or streamed', async () => {
  const advertised = createWorkersTransport({ resolve: publicDns, fetch: async () => new Response('small', { headers: { 'Content-Length': String(MAX_RESOURCE_BYTES + 1) } }) });
  assert.equal((await advertised.retrieve(request)).evidence.outcome, 'too-large');
  const streamed = createWorkersTransport({ resolve: publicDns, fetch: async () => new Response('x'.repeat(MAX_RESOURCE_BYTES + 1)) });
  assert.equal((await streamed.retrieve(request)).evidence.outcome, 'too-large');
});
test('shared target budget includes every resource', async () => {
  let calls = 0;
  const transport = createWorkersTransport({ resolve: publicDns, fetch: async () => { calls++; return new Response('ok'); } });
  const results = await Promise.all(Array.from({ length: 13 }, () => transport.retrieve(request)));
  assert.equal(calls, MAX_TARGET_REQUESTS);
  assert.equal(results.filter(result => result.evidence.outcome === 'budget-exhausted').length, 1);
});
test('deadline rejects before network work after audit time expires', async () => {
  let time = 0;
  const transport = createWorkersTransport({ now: () => time, resolve: publicDns, fetch: async () => new Response('ok') });
  time = 30_000;
  assert.equal((await transport.retrieve(request)).evidence.outcome, 'timeout');
});
test('fixed DoH transport handles valid A/AAAA and rejects malformed/mixed responses', async () => {
  const calls = [];
  const transport = createWorkersTransport({ fetch: async (url, init) => {
    calls.push(url);
    if (url.startsWith('https://cloudflare-dns.com/dns-query?')) return Response.json({ Status: 0, Answer: url.endsWith('type=A') ? [{ type: 1, data: '93.184.216.34' }] : [] });
    return new Response('ok');
  } });
  assert.equal((await transport.retrieve(request)).evidence.outcome, 'received');
  assert.equal(calls.length, 3);
  const bad = createWorkersTransport({ fetch: async () => Response.json({ Status: 0, Answer: [{ type: 1, data: '10.0.0.1' }] }) });
  assert.equal((await bad.retrieve(request)).evidence.outcome, 'blocked-target');
});
test('stalled body and ignored abort fetch both return within resource deadline', async () => {
  const stalled = createWorkersTransport({ resolve: publicDns, fetch: async () => new Response(new ReadableStream({ start() {} })) });
  const ignored = createWorkersTransport({ resolve: publicDns, fetch: () => new Promise(() => {}) });
  const results = await Promise.all([stalled.retrieve(request), ignored.retrieve(request)]);
  assert.deepEqual(results.map(result => result.evidence.outcome), ['timeout', 'timeout']);
});
test('oversized headers are omitted rather than presented as complete values', async () => {
  const transport = createWorkersTransport({ resolve: publicDns, fetch: async () => new Response('ok', { headers: { 'X-Robots-Tag': 'x'.repeat(2049) } }) });
  assert.equal((await transport.retrieve(request)).evidence.headers.robots, null);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { createStatsHandler, STATS_EDGE_TTL_SECONDS, type StatsCacheStore } from '../src/worker/stats-cache.ts';

function memoryCache(): StatsCacheStore & { entries: Map<string, Response>; keys: string[] } {
  const entries = new Map<string, Response>();
  const keys: string[] = [];
  return {
    entries, keys,
    async match(request) { keys.push(request.url); return entries.get(request.url)?.clone(); },
    async put(request, response) { entries.set(request.url, response.clone()); },
  };
}

function request(query = '', headers: HeadersInit = {}): Request {
  return new Request(`https://gkoreli.com/api/stats${query ? `?${query}` : ''}`, { headers });
}

test('canonical public states reuse a completed report despite irrelevant parameters and bypass headers', async () => {
  const cache = memoryCache();
  let generations = 0;
  const now = Date.parse('2026-09-07T05:00:00Z');
  const serve = createStatsHandler(cache, async () => Response.json({ generation: ++generations }), { now: () => now });
  const first = await serve(request(), {});
  const second = await serve(request('nonce=second&traffic=browser&range=30d&path=', {
    'Cache-Control': 'no-cache', Cookie: 'private=value', 'If-None-Match': 'different',
  }), {});
  assert.equal(generations, 1);
  assert.equal(first.headers.get('X-Stats-Cache'), 'MISS');
  assert.equal(second.headers.get('X-Stats-Cache'), 'HIT');
  assert.deepEqual(await second.json(), await first.json());
  assert.equal(cache.keys[0], cache.keys[1]);
  assert.equal(cache.entries.size, 1);
  assert.equal(cache.entries.values().next().value?.headers.get('Cache-Control'), `public, max-age=${STATS_EDGE_TTL_SECONDS}`);
  assert.equal(second.headers.get('Cache-Control'), 'public, max-age=60');
});

test('every supported filter changes the cache key while implicit scoped defaults coalesce', async () => {
  const cache = memoryCache();
  let generations = 0;
  const serve = createStatsHandler(cache, async () => Response.json({ generation: ++generations }));
  for (const query of ['', 'range=7d', 'traffic=all', 'path=%2Fpost', 'agent=GPTBot', 'kind=search-crawler']) {
    assert.equal((await serve(request(query), {})).status, 200);
  }
  assert.equal(generations, 6);
  assert.equal((await serve(request('traffic=all&range=30d&agent=GPTBot'), {})).headers.get('X-Stats-Cache'), 'HIT');
  assert.equal(generations, 6);
});

test('invalid states fail before cache lookup or report generation', async () => {
  const cache = memoryCache();
  let generations = 0;
  const serve = createStatsHandler(cache, async () => Response.json({ generation: ++generations }));
  for (const query of ['range=year', 'traffic=people', 'agent=unknown', 'kind=unknown', 'traffic=browser&agent=GPTBot']) {
    const response = await serve(request(query), {});
    assert.equal(response.status, 400);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
  }
  assert.equal(cache.keys.length, 0);
  assert.equal(generations, 0);
});

test('policy and report versions invalidate completed entries', async () => {
  const cache = memoryCache();
  let generations = 0;
  const load = async () => Response.json({ generation: ++generations });
  const now = () => Date.parse('2026-09-07T05:00:00Z');
  for (const options of [
    { policyHash: 'policy-a', reportVersion: 'report-a' },
    { policyHash: 'policy-b', reportVersion: 'report-a' },
    { policyHash: 'policy-b', reportVersion: 'report-b' },
  ]) {
    await createStatsHandler(cache, load, { ...options, now })(request(), {});
  }
  assert.equal(generations, 3);
  assert.equal(cache.entries.size, 3);
});

test('expiry and UTC rollover prevent old windows from surviving in edge or browser caches', async () => {
  const cache = memoryCache();
  let generations = 0;
  let now = Date.parse('2026-09-07T05:00:00Z');
  const serve = createStatsHandler(cache, async () => Response.json({ generation: ++generations }), { now: () => now });
  await serve(request(), {});
  now += STATS_EDGE_TTL_SECONDS * 1000;
  assert.equal((await serve(request(), {})).headers.get('X-Stats-Cache'), 'MISS');
  now = Date.parse('2026-09-07T23:59:58Z');
  const beforeMidnight = await serve(request(), {});
  assert.equal(beforeMidnight.headers.get('Cache-Control'), 'public, max-age=2');
  assert.equal(beforeMidnight.headers.get('Expires'), 'Tue, 08 Sep 2026 00:00:00 GMT');
  now += 2000;
  assert.equal((await serve(request(), {})).headers.get('X-Stats-Cache'), 'MISS');
  assert.equal(generations, 4);
  assert.ok(cache.keys.at(-1)?.includes('/2026-09-08?'));
});

test('simultaneous equivalent cold requests share one report generation and independent response bodies', async () => {
  const cache = memoryCache();
  const gate = Promise.withResolvers<void>();
  let generations = 0;
  const serve = createStatsHandler(cache, async () => { generations++; await gate.promise; return Response.json({ views: 937 }); });
  const first = serve(request(), {});
  const second = serve(request('range=30d'), {});
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(generations, 1);
  gate.resolve();
  const [a, b] = await Promise.all([first, second]);
  assert.equal(a.headers.get('X-Stats-Cache'), 'MISS');
  assert.equal(b.headers.get('X-Stats-Cache'), 'COALESCED');
  assert.deepEqual(await a.json(), { views: 937 });
  assert.deepEqual(await b.json(), { views: 937 });
});

test('failed and cookie-bearing responses are never cached; the next request can recover', async () => {
  const cache = memoryCache();
  let generation = 0;
  const serve = createStatsHandler(cache, async () => {
    generation++;
    if (generation === 1) return Response.json({ error: 'unavailable' }, { status: 500 });
    if (generation === 2) return Response.json({ private: true }, { headers: { 'Set-Cookie': 'session=value' } });
    return Response.json({ views: 1 });
  });
  for (let i = 0; i < 2; i++) {
    assert.equal((await serve(request(), {})).headers.get('Cache-Control'), 'no-store');
    assert.equal(cache.entries.size, 0);
  }
  await serve(request(), {});
  assert.equal((await serve(request(), {})).headers.get('X-Stats-Cache'), 'HIT');
  assert.equal(generation, 3);
});

test('expired entries and cache failures do not become stale success responses', async () => {
  let generations = 0;
  const broken: StatsCacheStore = {
    async match() { throw new Error('cache unavailable'); },
    async put() { throw new Error('cache unavailable'); },
  };
  const serve = createStatsHandler(broken, async () => Response.json({ generation: ++generations }));
  assert.equal((await serve(request(), {})).status, 200);
  assert.equal((await serve(request(), {})).status, 200);
  assert.equal(generations, 2);
});

test('database failures return an uncached retryable error and release the in-flight slot', async () => {
  const cache = memoryCache();
  let generations = 0;
  const serve = createStatsHandler(cache, async () => {
    if (++generations === 1) throw new Error('database limit reached');
    return Response.json({ views: 1 });
  });
  const failed = await serve(request(), {});
  assert.equal(failed.status, 503);
  assert.equal(failed.headers.get('Cache-Control'), 'no-store');
  assert.equal(failed.headers.get('Retry-After'), '60');
  assert.equal(cache.entries.size, 0);
  assert.equal((await serve(request(), {})).status, 200);
});

test('distinct cold fills are bounded per isolate without blocking a coalesced request', async () => {
  const gate = Promise.withResolvers<void>();
  const cache = memoryCache();
  let generations = 0;
  const serve = createStatsHandler(cache, async () => { generations++; await gate.promise; return Response.json({ views: 1 }); });
  const requests = Array.from({ length: 8 }, (_, i) => serve(request(`path=/post-${i}`), {}));
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(generations, 8);
  assert.equal((await serve(request('path=/overflow'), {})).status, 503);
  const same = serve(request('path=/post-0'), {});
  gate.resolve();
  await Promise.all(requests);
  assert.equal((await same).status, 200);
  assert.equal(generations, 8);
});

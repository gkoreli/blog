/** Deterministic cancellation schedules, executed with real crypto in Node/workerd. */
export async function keyRequestOwnershipTrials(fixture, api) {
  const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
  const tick = async () => { for (let i = 0; i < 40; i++) await Promise.resolve(); };
  const request = (index = 0) => new Request(fixture.requests[index].url, { headers: fixture.requests[index].headers });
  const directory = (indices = [0], control = 'max-age=300') => new Response(JSON.stringify({ keys: indices.map(i => fixture.keys[i].jwk) }), {
    headers: { 'Content-Type': 'application/http-message-signatures-directory+json', 'Cache-Control': control },
  });
  const closed = result => ({ status: result.status, reason: result.status === 'unverified' ? result.reason : null });
  const rows = [];
  const run = (cache, controller, fetcher, index = 0) => api.verifyWebBotAuth(request(index), { cache, now: new Date(fixture.now), signal: controller.signal,
    fetcher: (url, init) => { if (String(url) !== fixture.url) throw Error('Unexpected fixture origin'); return fetcher(url, init); },
  });
  {
    const cache = api.createWebBotAuthCache(), controller = new AbortController(); let fetches = 0;
    controller.abort(); const result = await run(cache, controller, async () => { fetches++; return directory(); });
    rows.push({ condition: 'pre-aborted', results: [closed(result)], fetches, pending: cache.pendingDirectories.size, keys: cache.keys.size });
  }
  {
    const cache = api.createWebBotAuthCache(), controller = new AbortController(); let fetches = 0;
    const result = await run(cache, controller, async () => { fetches++; controller.abort(); return directory(); });
    rows.push({ condition: 'transport-synchronous-abort', results: [closed(result)], fetches, pending: cache.pendingDirectories.size, keys: cache.keys.size, directories: cache.directories.size });
  }
  {
    const cache = api.createWebBotAuthCache(), owner = new AbortController(), started = deferred(), release = deferred(); let fetches = 0, active = 0;
    const fetcher = async () => { fetches++; active++; try { if (fetches === 1) { started.resolve(); await release.promise; return directory([1]); } return directory(); } finally { active--; } };
    const first = run(cache, owner, fetcher); await started.promise;
    const waiters = Array.from({ length: 5 }, () => run(cache, new AbortController(), fetcher)); await tick(); owner.abort();
    const results = await Promise.all([first, ...waiters]);
    const replacement = cache.directories.get(fixture.url);
    release.resolve(); await tick();
    const lateKeptReplacement = cache.directories.get(fixture.url) === replacement;
    const probe = await run(cache, new AbortController(), fetcher);
    rows.push({ condition: 'five-waiters-late-ignored-abort', results: [...results, probe].map(closed), fetches, active, pending: cache.pendingDirectories.size, keys: cache.keys.size, lateKeptReplacement });
  }
  for (const kind of ['http-status', 'malformed-json']) {
    const cache = api.createWebBotAuthCache(), owner = new AbortController(), waiter = new AbortController(), started = deferred(), release = deferred(); let fetches = 0;
    const fetcher = async () => { fetches++; started.resolve(); await release.promise; return kind === 'http-status' ? new Response('', { status: 503 })
      : new Response('{broken', { headers: { 'Content-Type': 'application/http-message-signatures-directory+json' } }); };
    const first = run(cache, owner, fetcher).finally(() => owner.abort()); await started.promise;
    const second = run(cache, waiter, fetcher); await tick(); release.resolve();
    rows.push({ condition: 'ordinary-' + kind, results: (await Promise.all([first, second])).map(closed), fetches, pending: cache.pendingDirectories.size, keys: cache.keys.size });
  }
  {
    const cache = api.createWebBotAuthCache(), controller = new AbortController(), entered = deferred(), release = deferred(); let fetches = 0, blocked = false;
    const original = crypto.subtle.importKey;
    crypto.subtle.importKey = async function(...args) {
      if (!blocked && args[1]?.x === fixture.keys[0].jwk.x) { blocked = true; entered.resolve(); await release.promise; }
      return original.apply(this, args);
    };
    try {
      const task = run(cache, controller, async () => { fetches++; return directory(); }); await entered.promise; controller.abort(); release.resolve();
      const result = await task, canceledKeys = cache.keys.size;
      const recovery = await run(cache, new AbortController(), async () => { fetches++; return directory(); });
      rows.push({ condition: 'abort-during-key-import', results: [result, recovery].map(closed), fetches, pending: cache.pendingDirectories.size, canceledKeys, keys: cache.keys.size });
    } finally { release.resolve(); crypto.subtle.importKey = original; }
  }
  {
    const cache = api.createWebBotAuthCache(), controller = new AbortController(), entered = deferred(), release = deferred(); let fetches = 0, blocked = false;
    const fetcher = async () => { fetches++; return directory(); };
    await run(cache, new AbortController(), fetcher); const source = cache.directories.get(fixture.url);
    const original = crypto.subtle.digest;
    crypto.subtle.digest = async function(...args) {
      if (!blocked) { blocked = true; entered.resolve(); await release.promise; }
      return original.apply(this, args);
    };
    try {
      const task = run(cache, controller, fetcher, 1); await entered.promise; controller.abort(); release.resolve();
      const result = await task;
      rows.push({ condition: 'abort-during-warm-missing-key-hash', results: [closed(result)], fetches, pending: cache.pendingDirectories.size,
        sourcePreserved: cache.directories.get(fixture.url) === source, forcedRefreshes: cache.forcedRefreshes.size, keys: cache.keys.size });
    } finally { release.resolve(); crypto.subtle.digest = original; }
  }
  {
    const cache = api.createWebBotAuthCache(); let fetches = 0;
    const fetcher = async () => { fetches++; return directory([0], 'no-cache'); };
    const first = await run(cache, new AbortController(), fetcher), second = await run(cache, new AbortController(), fetcher);
    rows.push({ condition: 'noncacheable-sequential', results: [first, second].map(closed), fetches, pending: cache.pendingDirectories.size, keys: cache.keys.size });
  }
  {
    const cache = api.createWebBotAuthCache(), a = new AbortController(), c = new AbortController();
    const starts = [deferred(), deferred()], releases = [deferred(), deferred()]; let fetches = 0, active = 0;
    const fetcher = async () => { const index = fetches++; active++; try { if (index < 2) { starts[index].resolve(); await releases[index].promise; } return directory(); } finally { active--; } };
    const first = run(cache, a, fetcher); await starts[0].promise;
    const survivor = run(cache, new AbortController(), fetcher); await tick(); a.abort();
    // This caller synchronously claims the replacement before the survivor resumes.
    const replacementOwner = run(cache, c, fetcher); await starts[1].promise; await tick();
    c.abort(); const results = await Promise.all([first, survivor, replacementOwner]);
    const beforeProbe = fetches; releases.forEach(item => item.resolve()); await tick();
    const recovery = await run(cache, new AbortController(), fetcher);
    rows.push({ condition: 'one-recovery-allowance', results: [...results, recovery].map(closed), fetchesBeforeProbe: beforeProbe, fetches, active, pending: cache.pendingDirectories.size, keys: cache.keys.size });
  }
  return rows;
}

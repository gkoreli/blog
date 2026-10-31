import { generateKeyPairSync, createHash, sign, verify } from 'node:crypto';
import assert from 'node:assert/strict';

/** Two independently signed keys at one synthetic directory, no local base builder. */
export function keyLifecycleFixture() {
  const now = new Date('2026-10-30T23:50:00Z'), epoch = now.getTime() / 1000;
  const origin = 'https://rotation.fixture.example', url = origin + '/.well-known/http-message-signatures-directory';
  const keys = [], requests = [];
  for (let index = 0; index < 2; index++) {
    const { publicKey, privateKey } = generateKeyPairSync('ed25519');
    const jwk = publicKey.export({ format: 'jwk' });
    const kid = createHash('sha256').update(JSON.stringify({ crv: jwk.crv, kty: jwk.kty, x: jwk.x })).digest('base64url');
    const params = `("@authority" "signature-agent");created=${epoch};expires=${epoch + 600};keyid="${kid}";alg="ed25519";tag="web-bot-auth"`;
    const base = `"@authority": publication.example\n"signature-agent": "${origin}"\n"@signature-params": ${params}`;
    const signature = sign(null, Buffer.from(base), privateKey);
    assert.equal(verify(null, Buffer.from(base), publicKey, signature), true);
    keys.push({ jwk, kid });
    requests.push({ url: 'https://publication.example/article', headers: {
      'Signature-Agent': `"${origin}"`, 'Signature-Input': `proof=${params}`, Signature: `proof=:${signature.toString('base64')}:`,
    } });
  }
  return { now: now.toISOString(), url, keys, requests };
}

/** Runs unchanged in Node and a bundled local Worker. Counter/crypto barriers
 * control completion order; they do not replace crypto or fabricate verdicts.
 */
export async function keyLifecycleTrials(fixture, api) {
  const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
  const request = index => new Request(fixture.requests[index].url, { headers: fixture.requests[index].headers });
  const directory = indices => new Response(JSON.stringify({ keys: indices.map(index => fixture.keys[index].jwk) }), {
    headers: { 'Content-Type': 'application/http-message-signatures-directory+json', 'Cache-Control': 'max-age=300' },
  });
  const run = (index, cache, fetcher) => api.verifyWebBotAuth(request(index), { cache, now: new Date(fixture.now),
    fetcher: (url, init) => {
      if (String(url) !== fixture.url) throw Error('Unexpected fixture origin');
      return fetcher(url, init);
    },
  });
  const closed = result => ({ status: result.status, reason: result.status === 'unverified' ? result.reason : null });
  const rows = [];
  {
    const cache = api.createWebBotAuthCache(); let fetches = 0;
    const fetcher = async () => { fetches++; return directory([0]); };
    const cold = await run(0, cache, fetcher), warm = await run(0, cache, fetcher);
    rows.push({ condition: 'sequential-cold-warm', results: [closed(cold), closed(warm)], fetches, pending: cache.pendingDirectories.size });
  }
  {
    const cache = api.createWebBotAuthCache(), started = deferred(), release = deferred(); let fetches = 0;
    const fetcher = async () => { fetches++; started.resolve(); await release.promise; return directory([0]); };
    const first = run(0, cache, fetcher); await started.promise;
    const second = run(0, cache, fetcher); release.resolve();
    rows.push({ condition: 'parallel-cold', results: (await Promise.all([first, second])).map(closed), fetches, pending: cache.pendingDirectories.size });
  }
  {
    const cache = api.createWebBotAuthCache(), entered = deferred(), release = deferred(); let fetches = 0, blocked = false;
    const fetcher = async () => { fetches++; return directory(fetches === 1 ? [0] : [1]); };
    const original = crypto.subtle.importKey;
    crypto.subtle.importKey = async function(...args) {
      if (!blocked && args[1]?.x === fixture.keys[0].jwk.x) { blocked = true; entered.resolve(); await release.promise; }
      return original.apply(this, args);
    };
    try {
      const old = run(0, cache, fetcher); await entered.promise;
      const fresh = await run(1, cache, fetcher);
      const newDirectoryPublished = cache.directories.get(fixture.url)?.keys.every(key => key.jwk.x !== fixture.keys[0].jwk.x);
      release.resolve(); const oldResult = await old;
      const resurrectedBeforeProbe = cache.keys.has(fixture.url + '\n' + fixture.keys[0].kid);
      const probe = await run(0, cache, fetcher);
      rows.push({ condition: 'late-old-import', results: [closed(oldResult), closed(fresh), closed(probe)], fetches,
        newDirectoryPublished, resurrectedBeforeProbe, pending: cache.pendingDirectories.size });
    } finally { release.resolve(); crypto.subtle.importKey = original; }
  }
  {
    const cache = api.createWebBotAuthCache(), started = deferred(), release = deferred(); let fetches = 0;
    const fetcher = async () => { fetches++; if (fetches === 1) return directory([0]); started.resolve(); await release.promise; return directory([1]); };
    await run(0, cache, fetcher);
    const first = run(1, cache, fetcher), second = run(1, cache, fetcher);
    await started.promise; release.resolve();
    rows.push({ condition: 'parallel-warm-rotation', results: (await Promise.all([first, second])).map(closed), fetches, pending: cache.pendingDirectories.size });
  }
  return rows;
}

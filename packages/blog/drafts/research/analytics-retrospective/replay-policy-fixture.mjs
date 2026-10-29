// Independent signing construction for offline policy counterexamples.
// Ephemeral private keys remain in memory and are never exported.
export async function replayPolicyFixture() {
  const now = '2026-10-29T04:00:00Z', epoch = Date.parse(now) / 1000;
  const pairs = await Promise.all([0, 1].map(() => crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify'])));
  const keys = await Promise.all(pairs.map(pair => crypto.subtle.exportKey('jwk', pair.publicKey)));
  keys.push({ ...keys[0], x: keys[0].x + '=' });
  const ids = await Promise.all(keys.map(async key => Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify({ crv: key.crv, kty: key.kty, x: key.x })))).toString('base64url')));
  async function sign({ key = 0, identity = key, origin = 'https://fixture.example', lifetime = 60, nonce = 'same-fixture-nonce', path = '/original' } = {}) {
    const input = `("@authority" "signature-agent";key="agent");created=${epoch};expires=${epoch + lifetime}${nonce === null ? '' : `;nonce=${JSON.stringify(nonce)}`};keyid="${ids[identity]}";alg="ed25519";tag="web-bot-auth"`;
    const base = `"@authority": publication.example\n"signature-agent";key="agent": ${JSON.stringify(origin)}\n"@signature-params": ${input}`;
    const signature = Buffer.from(await crypto.subtle.sign('Ed25519', pairs[key].privateKey, new TextEncoder().encode(base))).toString('base64');
    return { now, method: 'GET', url: `https://publication.example${path}`, headers: { 'User-Agent': 'OfflinePolicyFixture/1.0', 'Signature-Agent': `agent=${JSON.stringify(origin)}`, 'Signature-Input': `proof=${input}`, Signature: `proof=:${signature}:` }, directory: { keys } };
  }
  return { epoch, records: { original: await sign(), longer: await sign({ lifetime: 180 }), otherKey: await sign({ key: 1 }),
    otherPublisher: await sign({ origin: 'https://second.example' }), alias: await sign({ identity: 2 }),
    absentNonce: await sign({ nonce: null }), emptyNonce: await sign({ nonce: '' }) } };
}

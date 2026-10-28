/** Independently constructed signing bytes; no production/vendor credentials. */
export async function signatureReuseFixture() {
  const at = '2026-10-28T04:00:00Z', epoch = Date.parse(at) / 1000;
  const pairs = await Promise.all([0, 1].map(() => crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify'])));
  const keys = await Promise.all(pairs.map(pair => crypto.subtle.exportKey('jwk', pair.publicKey)));
  keys.push({ ...keys[0], x: keys[0].x + '=' });
  const kids = await Promise.all(keys.map(async key => {
    const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify({ crv: key.crv, kty: key.kty, x: key.x })));
    return Buffer.from(bytes).toString('base64url');
  }));
  async function sign({ path = '/a', nonce = 'fixture-reuse-nonce', origin = 'https://fixture.example', key = 0, keyIdentity = key, bound = false } = {}) {
    const components = ['"@authority"', ...(bound ? ['"@path"'] : []), '"signature-agent";key="agent"'];
    const params = `(${components.join(' ')});created=${epoch};expires=${epoch + 60}${nonce === null ? '' : `;nonce=${JSON.stringify(nonce)}`};keyid="${kids[keyIdentity]}";alg="ed25519";tag="web-bot-auth"`;
    const values = { '"@authority"': 'publication.example', '"@path"': path, '"signature-agent";key="agent"': JSON.stringify(origin) };
    const base = [...components.map(component => `${component}: ${values[component]}`), `"@signature-params": ${params}`].join('\n');
    const signature = await crypto.subtle.sign('Ed25519', pairs[key].privateKey, new TextEncoder().encode(base));
    return { url: `https://publication.example${path}`, method: 'GET', observedAt: at, headers: {
      'User-Agent': 'FixtureCrawler/1.0', 'Signature-Agent': `agent=${JSON.stringify(origin)}`,
      'Signature-Input': `proof=${params}`, Signature: `proof=:${Buffer.from(signature).toString('base64')}:`,
    } };
  }
  const original = await sign();
  const relabelled = { ...original, url: 'https://publication.example/unsigned-change', headers: { ...original.headers, 'User-Agent': 'OtherFixtureRole/1.0',
    'Signature-Input': original.headers['Signature-Input'].replace(/^proof=/, 'renamed='), Signature: original.headers.Signature.replace(/^proof=/, 'renamed=') } };
  const invalid = { ...original, url: 'https://different.example/a' };
  const records = { original, relabelled, invalid, otherProofSameNonce: await sign({ bound: true, path: '/b' }),
    otherNonce: await sign({ nonce: 'other-fixture-nonce' }), otherPublisher: await sign({ origin: 'https://second.example' }),
    otherKey: await sign({ key: 1 }), otherEncoding: await sign({ keyIdentity: 2 }), absentNonce: await sign({ nonce: null }) };
  const multi = { ...original, headers: { ...original.headers,
    'Signature-Input': `${original.headers['Signature-Input']}, ${records.otherNonce.headers['Signature-Input'].replace(/^proof=/, 'second=')}`,
    Signature: `${original.headers.Signature}, ${records.otherNonce.headers.Signature.replace(/^proof=/, 'second=')}` } };
  records.multi = multi;
  const directories = Object.fromEntries(['fixture.example', 'second.example'].map(host => [`https://${host}/.well-known/http-message-signatures-directory`, { keys }]));
  const row = (name, reference) => ({ ...records[name], reference });
  return { directories, records, cohorts: [
    { name: 'same-proof-different-request-label-and-context', rows: [row('original', 'one'), row('relabelled', 'two')] },
    { name: 'different-proofs-same-publisher-key-nonce', rows: [row('original', 'one'), row('otherProofSameNonce', 'two')] },
    { name: 'same-nonce-different-publisher-or-key', rows: [row('original', 'one'), row('otherPublisher', 'two'), row('otherKey', 'three')] },
    { name: 'same-key-bytes-different-jwk-encoding', rows: [row('original', 'one'), row('otherEncoding', 'two')] },
    { name: 'duplicate-export-reference', rows: [row('original', 'same'), row('original', 'same')] },
    { name: 'invalid-signature-does-not-add-reuse', rows: [row('original', 'one'), row('invalid', 'two')] },
    { name: 'missing-nonce-is-not-a-duplicate-nonce', rows: [row('absentNonce', 'one'), row('absentNonce', 'two')] },
    { name: 'different-nonces', rows: [row('original', 'one'), row('otherNonce', 'two')] },
    { name: 'two-proofs-in-one-observation', rows: [row('multi', 'one')] },
  ] };
}

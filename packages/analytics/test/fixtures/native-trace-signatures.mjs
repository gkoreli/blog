/** Synthetic native trace controls. Canonical bytes are independent of the verifier. */
export async function nativeTraceSignatureFixture() {
  const now = '2026-10-29T05:00:00Z', epoch = Date.parse(now) / 1000;
  const pair = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
  const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
  const kid = Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify({ crv: jwk.crv, kty: jwk.kty, x: jwk.x })))).toString('base64url');
  const agent = 'https://trace-fixture.example', longId = '0123456789abcdef0123456789abcdef';
  async function sign(name, { covered = [], headers = {}, path = '/fixture', query = '', invalid = false } = {}) {
    const url = `https://publication.example${path}${query}`, target = new URL(url);
    const names = ['@authority', 'signature-agent', ...covered];
    const params = `(${names.map(JSON.stringify).join(' ')});created=${epoch};expires=${epoch + 300};keyid="${kid}";alg="ed25519";tag="web-bot-auth"`;
    const values = { '@authority': target.host, '@target-uri': url, '@path': target.pathname, '@query': target.search || '?', 'signature-agent': JSON.stringify(agent), ...headers };
    const base = [...names.map(n => `${JSON.stringify(n)}: ${values[n]}`), `"@signature-params": ${params}`].join('\n');
    const bytes = new Uint8Array(await crypto.subtle.sign('Ed25519', pair.privateKey, new TextEncoder().encode(base)));
    if (invalid) bytes[0] ^= 1;
    return { name, now, method: 'GET', url, directory: { keys: [jwk] }, headers: { ...headers, 'Signature-Agent': JSON.stringify(agent),
      'Signature-Input': `proof=${params}`, Signature: `proof=:${Buffer.from(bytes).toString('base64')}:` },
      expected: { producerVerified: !invalid, defaultTraceVerified: !invalid && !['covered-cookie', 'covered-benign-key-name', 'covered-target-uri', 'covered-path', 'covered-query'].includes(name) } };
  }
  return { trials: await Promise.all([
    sign('covered-cookie', { covered: ['cookie'], headers: { cookie: 'synthetic-session=not-a-real-secret' } }),
    sign('literal-cookie-marker', { covered: ['cookie'], headers: { cookie: 'REDACTED' } }),
    sign('unsigned-cookie', { headers: { cookie: 'synthetic-session=not-a-real-secret' } }),
    sign('covered-benign-key-name', { covered: ['x-monkey'], headers: { 'x-monkey': 'banana' } }),
    sign('covered-target-uri', { covered: ['@target-uri'], path: `/fixture/${longId}` }),
    sign('covered-path', { covered: ['@path'], path: `/fixture/${longId}` }),
    sign('covered-query', { covered: ['@query'], query: `?item=${longId}` }),
    sign('literal-url-marker', { covered: ['@target-uri'], path: '/fixture/REDACTED' }),
    sign('unsigned-url', { path: `/fixture/${longId}` }),
    sign('signed-user-agent', { covered: ['user-agent'], headers: { 'user-agent': 'SyntheticBrowser/1.0' } }),
    sign('unsigned-authorization', { headers: { authorization: 'Bearer synthetic-no-real-credential' } }),
    sign('baseline'), sign('invalid-proof', { invalid: true }),
  ]) };
}

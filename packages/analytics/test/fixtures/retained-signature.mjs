/** Synthetic secrets, independent signing bytes and recorded clocks only. */
export async function retainedSignatureFixture() {
  const now = '2026-10-29T05:00:00Z', epoch = Date.parse(now) / 1000;
  const pair = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
  const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
  const kid = Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify({ crv: jwk.crv, kty: jwk.kty, x: jwk.x })))).toString('base64url');
  const agent = 'https://retained-fixture.example';
  async function sign(value, covered = 'cookie') {
    const names = ['@authority', 'signature-agent', covered];
    const params = `(${names.map(JSON.stringify).join(' ')});created=${epoch};expires=${epoch + 300};keyid="${kid}";alg="ed25519";tag="web-bot-auth"`;
    const values = { '@authority': 'publication.example', 'signature-agent': JSON.stringify(agent), [covered]: value };
    const base = [...names.map(name => `${JSON.stringify(name)}: ${values[name]}`), `"@signature-params": ${params}`].join('\n');
    const signature = Buffer.from(await crypto.subtle.sign('Ed25519', pair.privateKey, new TextEncoder().encode(base))).toString('base64');
    return { now, url: 'https://publication.example/fixture', method: 'GET', directory: { keys: [jwk] }, headers: {
      'Signature-Agent': JSON.stringify(agent), 'Signature-Input': `proof=${params}`, Signature: `proof=:${signature}:`, [covered]: value,
    } };
  }
  const original = await sign('synthetic-session=private-canary'), literal = await sign('REDACTED');
  const missing = structuredClone(original); delete missing.headers.cookie;
  const invalid = structuredClone(original);
  const bytes = Buffer.from(invalid.headers.Signature.split(':')[1], 'base64'); bytes[0] ^= 1;
  invalid.headers.Signature = `proof=:${bytes.toString('base64')}:`;
  const second = await sign('synthetic-browser-canary', 'user-agent');
  const mixed = { ...original, headers: { ...original.headers, ...{ 'user-agent': second.headers['user-agent'] }, cookie: 'REDACTED',
    'Signature-Input': `${original.headers['Signature-Input']}, ${second.headers['Signature-Input'].replace(/^proof=/, 'second=')}`,
    Signature: `${original.headers.Signature}, ${second.headers.Signature.replace(/^proof=/, 'second=')}` } };
  return { records: { original, redacted: { ...original, headers: { ...original.headers, cookie: 'REDACTED' } }, missing, invalid, literal,
    unsignedMarker: { ...second, headers: { ...second.headers, cookie: 'REDACTED' } }, mixed } };
}

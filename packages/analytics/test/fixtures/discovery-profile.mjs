/** Synthetic incoming-request profile migration controls; no network or production keys. */
export async function discoveryProfileFixture() {
  const now = '2026-10-31T19:49:00Z', epoch = Date.parse(now) / 1000;
  async function key() {
    const pair = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
    const { crv, kty, x } = await crypto.subtle.exportKey('jwk', pair.publicKey);
    const jwk = { crv, kty, x };
    const kid = Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(jwk)))).toString('base64url');
    return { privateKey: pair.privateKey, jwk, kid };
  }
  const main = await key(), root = await key();
  const wellKnown = 'https://keys.example/.well-known/http-message-signatures-directory';
  async function signed(name, uri, { legacy = false, memberParameter = '', signingKey = main, corrupt = false } = {}) {
    const member = JSON.stringify(uri) + memberParameter;
    const component = legacy ? '"signature-agent"' : '"signature-agent";key="proof"';
    const params = `("@authority" ${component});created=${epoch};expires=${epoch + 300};keyid="${signingKey.kid}";alg="ed25519";tag="web-bot-auth"`;
    // Canonical bytes are independently constructed; no verifier helper signs its own output.
    const base = `"@authority": publication.example\n${component}: ${member}\n"@signature-params": ${params}`;
    const bytes = new Uint8Array(await crypto.subtle.sign('Ed25519', signingKey.privateKey, new TextEncoder().encode(base)));
    if (corrupt) bytes[0] ^= 1;
    return { name, now, url: 'https://publication.example/fixture', method: 'GET', oracleBase: base,
      publicKey: signingKey.jwk, expectedCrypto: !corrupt,
      headers: { 'Signature-Agent': legacy ? member : `proof=${member}`, 'Signature-Input': `proof=${params}`,
        Signature: `proof=:${Buffer.from(bytes).toString('base64')}:` } };
  }
  const rows = await Promise.all([
    signed('legacy-origin', 'https://keys.example', { legacy: true }),
    signed('dictionary-origin', 'https://keys.example'),
    signed('legacy-directory-parameter', 'https://keys.example', { memberParameter: ';type=directory' }),
    signed('explicit-well-known', wellKnown),
    signed('explicit-tenant-a', 'https://keys.example/tenant-a/jwks.json'),
    signed('explicit-tenant-b', 'https://keys.example/tenant-b/jwks.json'),
    signed('explicit-query', 'https://keys.example/tenant-a/jwks.json?version=one'),
    signed('explicit-fragment', 'https://keys.example/tenant-a/jwks.json#key'),
    signed('origin-query', 'https://keys.example/?version=one'),
    signed('origin-fragment', 'https://keys.example/#key'),
    signed('root-resource-key', 'https://keys.example', { signingKey: root }),
    signed('invalid-origin-proof', 'https://keys.example', { corrupt: true }),
    signed('invalid-explicit-proof', wellKnown, { corrupt: true }),
    signed('non-https-explicit', 'http://keys.example/keys'),
    signed('credentials-explicit', 'https://user:password@keys.example/keys'),
    signed('ip-explicit', 'https://127.0.0.1/keys'),
    signed('local-explicit', 'https://service.local/keys'),
    signed('malformed-uri', 'not a URL'),
    signed('explicit-legacy-parameter', wellKnown, { memberParameter: ';type=directory' }),
    signed('unsupported-type', 'https://keys.example', { memberParameter: ';type=cimd' }),
  ]);
  return { version: 1, now, scope: 'Incoming synthetic request discovery; no directory-response proofs',
    directories: { [wellKnown]: { keys: [{ ...main.jwk, kid: main.kid }] },
      'https://keys.example/': { keys: [{ ...root.jwk, kid: root.kid }] },
      'https://keys.example/tenant-a/jwks.json': { keys: [{ ...main.jwk, kid: main.kid }] },
      'https://keys.example/tenant-b/jwks.json': { keys: [{ ...main.jwk, kid: main.kid }] } }, rows };
}

import assert from 'node:assert/strict';

/** Independent signing bytes and key IDs. No local base builder or vendor key. */
export async function signatureSelectionFixture() {
  const now = new Date(), epoch = Math.floor(now.getTime() / 1000);
  const keys = [];
  for (const origin of ['https://one.fixture.example', 'https://two.fixture.example']) {
    const pair = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
    const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
    const canonical = JSON.stringify({ crv: 'Ed25519', kty: 'OKP', x: jwk.x });
    const kid = Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical))).toString('base64url');
    keys.push({ origin, pair, jwk, kid });
  }
  async function proof(index, tag = 'web-bot-auth') {
    const key = keys[index], label = index === 0 ? 'one' : 'two';
    const components = `("@authority" "signature-agent";key="${label}")`;
    const params = `${components};created=${epoch};expires=${epoch + 300};keyid="${key.kid}";alg="ed25519";tag="${tag}"`;
    const base = `"@authority": publication.example\n"signature-agent";key="${label}": "${key.origin}"\n"@signature-params": ${params}`;
    const signature = new Uint8Array(await crypto.subtle.sign('Ed25519', key.pair.privateKey, new TextEncoder().encode(base)));
    assert.equal(await crypto.subtle.verify('Ed25519', key.pair.publicKey, signature, new TextEncoder().encode(base)), true);
    const invalid = signature.slice(); invalid[0] ^= 1;
    assert.equal(await crypto.subtle.verify('Ed25519', key.pair.publicKey, invalid, new TextEncoder().encode(base)), false);
    return { label, input: `${label}=${params}`, signature: `${label}=:${Buffer.from(signature).toString('base64')}:`, invalid: `${label}=:${Buffer.from(invalid).toString('base64')}:` };
  }
  const one = await proof(0), two = await proof(1), other = await proof(1, 'unrelated-protocol');
  function headers(inputs, signatures) {
    return { 'User-Agent': 'ExaSearchBot/1.0', Accept: 'text/html',
      'Signature-Agent': keys.map((key, index) => `${index === 0 ? 'one' : 'two'}="${key.origin}"`).join(', '),
      'Signature-Input': inputs.join(', '), Signature: signatures.join(', ') };
  }
  const cases = [
    { name: 'single', headers: headers([one.input], [one.signature]), selectedOrigin: keys[0].origin, counts: [1, 1, 1, 0] },
    { name: 'both-valid', headers: headers([one.input, two.input], [one.signature, two.signature]), selectedOrigin: keys[0].origin, counts: [2, 2, 1, 1] },
    { name: 'both-valid-reversed-input', headers: headers([two.input, one.input], [one.signature, two.signature]), selectedOrigin: keys[1].origin, counts: [2, 2, 1, 1] },
    { name: 'first-invalid', headers: headers([one.input, two.input], [one.invalid, two.signature]), selectedOrigin: keys[1].origin, counts: [2, 2, 2, 0] },
    { name: 'later-invalid-unassessed', headers: headers([one.input, two.input], [one.signature, two.invalid]), selectedOrigin: keys[0].origin, counts: [2, 2, 1, 1] },
    { name: 'unrelated-tag', headers: headers([one.input, other.input], [one.signature, other.signature]), selectedOrigin: keys[0].origin, counts: [2, 1, 1, 0] },
    { name: 'unpaired-input', headers: headers([one.input, two.input], [one.signature]), selectedOrigin: keys[0].origin, counts: [1, 1, 1, 0] },
    { name: 'unpaired-signature', headers: headers([one.input], [one.signature, two.signature]), selectedOrigin: keys[0].origin, counts: [1, 1, 1, 0] },
  ];
  return { now, cases, directories: Object.fromEntries(keys.map(key => [key.origin + '/.well-known/http-message-signatures-directory', { keys: [key.jwk] }])) };
}

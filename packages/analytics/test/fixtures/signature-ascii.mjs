/** Independent fixed-layout signer: does not call the application's base builder. */
export async function signatureAsciiFixture() {
  const pair = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
  const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
  const canonicalJwk = JSON.stringify({ crv: 'Ed25519', kty: 'OKP', x: jwk.x });
  const kid = Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalJwk))).toString('base64url');
  const created = Math.floor(Date.now() / 1000);
  const parameters = `("@authority" "user-agent" "signature-agent";key="sig");created=${created};expires=${created + 300};keyid="${kid}";alg="ed25519";tag="web-bot-auth"`;
  const base = value => `"@authority": publication.example\n"user-agent": ${value}\n"signature-agent";key="sig": "https://fixture.example";type=directory\n"@signature-params": ${parameters}`;
  return {
    jwk,
    async headers(signed = 'SyntheticClient/1.0', received = signed) {
      const bytes = await crypto.subtle.sign('Ed25519', pair.privateKey, new TextEncoder().encode(base(signed)));
      const mathematicalValidity = await crypto.subtle.verify('Ed25519', pair.publicKey, bytes, new TextEncoder().encode(base(signed)));
      if (!mathematicalValidity) throw Error('Independent signer control failed');
      return { 'User-Agent': received, 'Signature-Agent': 'sig="https://fixture.example";type=directory',
        'Signature-Input': 'sig=' + parameters, Signature: 'sig=:' + Buffer.from(bytes).toString('base64') + ':' };
    },
  };
}

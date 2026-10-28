export function keyMetadataCases() {
  return [
    { name: 'minimal-public', patch: {}, accepted: true },
    { name: 'eddsa-algorithm', patch: { alg: 'EdDSA' }, accepted: true },
    { name: 'ed25519-algorithm', patch: { alg: 'Ed25519' }, accepted: true },
    { name: 'incompatible-algorithm', patch: { alg: 'RS256' }, accepted: false },
    { name: 'malformed-algorithm', patch: { alg: { private: 'metadata-canary' } }, accepted: false },
    { name: 'duplicate-operations', patch: { key_ops: ['verify', 'verify'] }, accepted: false },
    { name: 'verify-operation', patch: { key_ops: ['verify'], use: 'sig' }, accepted: true },
    { name: 'sign-only-operation', patch: { key_ops: ['sign'] }, accepted: false },
    { name: 'encryption-use', patch: { use: 'enc' }, accepted: false },
    { name: 'nonextractable-public', patch: { ext: false }, accepted: true },
    { name: 'malformed-extractable', patch: { ext: 'false' }, accepted: false },
    { name: 'private-member', patch: { d: 'metadata-canary' }, accepted: false },
    { name: 'inconsistent-signature-operations', patch: { use: 'sig', key_ops: ['verify', 'encrypt'] }, accepted: false },
    { name: 'unknown-optional-member', patch: { unknown: 'metadata-canary' }, accepted: true },
    { name: 'conflicting-key-rejected-first', patch: { alg: 'RS256' }, duplicate: 'rejected-first', accepted: false },
    { name: 'conflicting-key-accepted-first', patch: { alg: 'RS256' }, duplicate: 'accepted-first', accepted: false },
  ];
}

/** Both paths use the same actual independently signed proof. The direct path
 * imports the published JWK without the application's normalization step.
 */
export async function keyMetadataMatrix(fixture, verify, cacheFactory) {
  const first = Object.values(fixture.directories)[0].keys[0];
  const material = { kty: first.kty, crv: first.crv, x: first.x }, rows = [];
  for (const trial of keyMetadataCases()) {
    const jwk = { ...material, ...trial.patch }, request = new Request('https://publication.example/a', { headers: fixture.cases[0].headers });
    let fetches = 0;
    const result = await verify(request, { now: new Date(fixture.now), cache: cacheFactory(), includeEvidence: true,
      fetcher: async () => { fetches++; const keys = trial.duplicate === 'rejected-first' ? [jwk, material] : trial.duplicate === 'accepted-first' ? [material, jwk] : [jwk]; return Response.json({ keys }, { headers: { 'Content-Type': 'application/http-message-signatures-directory+json' } }); },
    });
    let direct;
    try {
      const key = await crypto.subtle.importKey('jwk', jwk, 'Ed25519', false, ['verify']);
      // Import acceptance is a metadata boundary, separate from proof math.
      direct = { status: 'imported', type: key.type, usages: key.usages };
    } catch (error) {
      if (!['DataError', 'SyntaxError', 'TypeError', 'Error'].includes(error.name)) throw error;
      direct = { status: 'rejected', error: error.name };
    }
    rows.push({ name: trial.name, applicationPolicyAccepts: trial.accepted, local: { status: result.status, reason: result.reason ?? null, fetches }, direct });
  }
  return rows;
}

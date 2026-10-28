/** Directory-key admission and reviewed demonstration-key policy. */
export const PUBLIC_KEY_POLICY_VERSION = '2026-10-28.1';
/** Reviewed public demonstration keys for our Ed25519 subset, not all weak keys. */
export const KNOWN_TEST_KEYS = [
  {
    id: 'poqkLGiymh_W0uP6PZFw-dvez3QJT5SolqXBCW38r0U',
    x: 'JrQLj5P_89iXES9-vFgrIy29clF9CC_oPPsw3c5D0bs',
    source: 'https://www.rfc-editor.org/rfc/rfc9421.html#appendix-B.1.4',
  },
  {
    id: 'kPrK_qmxVWaYVA9wwBF6Iuo3vVzz7TxHCTwXBygrS4k',
    x: '11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo',
    source: 'https://www.rfc-editor.org/rfc/rfc8037.html#appendix-A.1',
  },
] as const;

export function knownTestKeyId(keyid: string): boolean {
  return KNOWN_TEST_KEYS.some(key => key.id === keyid);
}

/** Thumbprints include the encoded x string; compare bytes to catch aliases. */
export function knownTestPublicKey(jwk: JsonWebKey): boolean {
  if (jwk.kty !== 'OKP' || jwk.crv !== 'Ed25519' || typeof jwk.x !== 'string') return false;
  try {
    const decoded = atob(jwk.x.replace(/-/g, '+').replace(/_/g, '/'));
    if (decoded.length !== 32) return false;
    const canonical = btoa(decoded).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    return KNOWN_TEST_KEYS.some(key => key.x === canonical);
  } catch {
    return false;
  }
}

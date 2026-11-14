/** Directory-key admission and reviewed demonstration-key policy. */
import { publicKeyMaterialToken } from './http-signature-key.js';
export const PUBLIC_KEY_POLICY_VERSION = '2026-11-13.1';
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
  return KNOWN_TEST_KEYS.some(key => key.id === keyid) || OTHER_DEMONSTRATION_KEYS.some(key => key.id === keyid);
}

/** Thumbprints include the encoded x string; compare bytes to catch aliases. */
export function knownTestPublicKey(jwk: JsonWebKey): boolean {
  if (jwk.kty !== 'OKP') {
    const material = publicKeyMaterialToken(jwk);
    return material !== null && OTHER_DEMONSTRATION_KEYS.some(key => publicKeyMaterialToken(key.jwk) === material);
  }
  if (jwk.crv !== 'Ed25519' || typeof jwk.x !== 'string') return false;
  try {
    const decoded = atob(jwk.x.replace(/-/g, '+').replace(/_/g, '/'));
    if (decoded.length !== 32) return false;
    const canonical = btoa(decoded).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    return KNOWN_TEST_KEYS.some(key => key.x === canonical);
  } catch {
    return false;
  }
}

/** Public demonstration keys whose private counterparts are published. */
const OTHER_DEMONSTRATION_KEYS = [
{
  "id": "BHj8s0GPnMEQtkaULIM-PLgEhLBbuGUQ1vMxmBWZzEo",
  "jwk": {
    "kty": "RSA",
    "n": "hAKYdtoeoy8zcAcR874L8cnZxKzAGwd7v36APp7Pv6Q2jdsPBRrwWEBnez6d0UDKDwGbc6nxfEXAy5mbhgajzrw3MOEt8uA5txSKobBpKDeBLOsdJKFqMGmXCQvEG7YemcxDTRPxAleIAgYYRjTSd_QBwVW9OwNFhekro3RtlinV0a75jfZgkne_YiktSvLG34lw2zqXBDTC5NHROUqGTlML4PlNZS5Ri2U4aCNx2rUPRcKIlE0PuKxI4T-HIaFpv8-rdV6eUgOrB2xeI1dSFFn_nnv5OoZJEIB-VmuKn3DCUcCZSFlQPSXSfBDiUGhwOw76WuSSsf1D4b_vLoJ10w",
    "e": "AQAB"
  },
  "source": "https://www.rfc-editor.org/rfc/rfc9421.html#appendix-B.1.1"
},
  {
    "id": "oD0HwocPBSfpNy5W3bpJeyFGY_IQ_YpqxSjQ3Yd-CLA",
    "jwk": {
      "kty": "RSA",
      "n": "r4tmm3r20Wd_PbqvP1s2-QEtvpuRaV8Yq40gjUR8y2Rjxa6dpG2GXHbPfvMs8ct-Lh1GH45x28Rw3Ry53mm-oAXjyQ86OnDkZ5N8lYbggD4O3w6M6pAvLkhk95AndTrifbIFPNU8PPMO7OyrFAHqgDsznjPFmTOtCEcN2Z1FpWgchwuYLPL-Wokqltd11nqqzi-bJ9cvSKADYdUAAN5WUtzdpiy6LbTgSxP7ociU4Tn0g5I6aDZJ7A8Lzo0KSyZYoA485mqcO0GVAdVw9lq4aOT9v6d-nb4bnNkQVklLQ3fVAvJm-xdDOp9LCNCN48V2pnDOkFV6-U9nV5oyc6XI2w",
      "e": "AQAB"
    },
    "source": "https://www.rfc-editor.org/rfc/rfc9421.html#appendix-B.1"
  },
  {
    "id": "ydQXMtvbsOsZyFir-Y7A8t7fKEM1gbKPvyFkdpu4fvI",
    "jwk": {
      "kty": "EC",
      "x": "qIVYZVLCrPZHGHjP17CTW0_-D9Lfw0EkjqF7xB4FivA",
      "y": "Mc4nN9LTDOBhfoUeg8Ye9WedFRhnZXZJA12Qp0zZ6F0",
      "crv": "P-256"
    },
    "source": "https://www.rfc-editor.org/rfc/rfc9421.html#appendix-B.1"
  }
] as const;

/** Public-key policy and cryptographic primitives for RFC 9421 section 3.3.
 * Message construction, directory transport and application trust stay outside.
 */
export const HTTP_PUBLIC_KEY_ALGORITHMS = [
  'ed25519', 'rsa-pss-sha512', 'rsa-v1_5-sha256', 'ecdsa-p256-sha256', 'ecdsa-p384-sha384',
] as const;
export type PublicSignatureAlgorithm = typeof HTTP_PUBLIC_KEY_ALGORITHMS[number];
export interface PublicVerificationKey { key: CryptoKey; algorithm: PublicSignatureAlgorithm }

export function isPublicSignatureAlgorithm(value: unknown): value is PublicSignatureAlgorithm {
  return HTTP_PUBLIC_KEY_ALGORITHMS.some(algorithm => algorithm === value);
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function bounded(value: unknown): value is string { return typeof value === 'string' && value.length > 0 && value.length <= 1400; }
export function base64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
function decoded(value: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+={0,2}$/.test(value)) return null;
  try { return Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)); }
  catch { return null; }
}

/** Identity uses only the required JWK members, in RFC 7638 lexical order.
 * Optional permission metadata is assessed separately, never erased by hashing.
 */
export function publicKeyMaterial(value: unknown): JsonWebKey | null {
  if (!record(value)) return null;
  if (value.kty === 'OKP' && value.crv === 'Ed25519' && bounded(value.x)) return { crv: 'Ed25519', kty: 'OKP', x: value.x };
  if (value.kty === 'RSA' && bounded(value.e) && bounded(value.n)) return { e: value.e, kty: 'RSA', n: value.n };
  if (value.kty === 'EC' && (value.crv === 'P-256' || value.crv === 'P-384') && bounded(value.x) && bounded(value.y)) {
    return { crv: value.crv, kty: 'EC', x: value.x, y: value.y };
  }
  return null;
}

export async function publicKeyThumbprint(value: unknown): Promise<string | null> {
  const material = publicKeyMaterial(value);
  if (material === null) return null;
  return base64Url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(material)))));
}

/** Byte-normalized identity for duplicate/replay checks, not an RFC thumbprint.
 * Retain the historical Ed25519 encoding tolerance; RSA UInts and EC points
 * must use their canonical, bounded public representation.
 */
export function publicKeyMaterialToken(value: unknown): string | null {
  const material = publicKeyMaterial(value);
  if (material === null) return null;
  if (material.kty === 'OKP' && typeof material.x === 'string') {
    const x = decoded(material.x);
    return x?.length === 32 ? JSON.stringify({ crv: material.crv, kty: material.kty, x: base64Url(x) }) : null;
  }
  if (material.kty === 'RSA' && typeof material.n === 'string' && typeof material.e === 'string') {
    const n = decoded(material.n), e = decoded(material.e);
    if (n === null || e === null || n.length < 256 || n.length > 1024 || n[0] === 0 || n[n.length - 1] % 2 === 0
      || e.length < 1 || e.length > 4 || e[0] === 0 || base64Url(n) !== material.n || base64Url(e) !== material.e) return null;
    const bits = (n.length - 1) * 8 + 32 - Math.clz32(n[0]);
    if (bits < 2048 || bits > 8192) return null;
    const exponent = e.reduce((total, byte) => total * 256 + byte, 0);
    return exponent >= 3 && exponent % 2 === 1 ? JSON.stringify(material) : null;
  }
  if (material.kty === 'EC' && typeof material.x === 'string' && typeof material.y === 'string') {
    const x = decoded(material.x), y = decoded(material.y), size = material.crv === 'P-256' ? 32 : 48;
    return x?.length === size && y?.length === size && base64Url(x) === material.x && base64Url(y) === material.y ? JSON.stringify(material) : null;
  }
  return null;
}

function metadataAlgorithm(value: unknown): PublicSignatureAlgorithm | null {
  if (isPublicSignatureAlgorithm(value)) return value;
  switch (value) {
    case 'EdDSA': case 'Ed25519': return 'ed25519';
    case 'PS512': return 'rsa-pss-sha512';
    case 'RS256': return 'rsa-v1_5-sha256';
    case 'ES256': return 'ecdsa-p256-sha256';
    case 'ES384': return 'ecdsa-p384-sha384';
    default: return null;
  }
}
function compatible(material: JsonWebKey, algorithm: PublicSignatureAlgorithm): boolean {
  if (algorithm === 'ed25519') return material.kty === 'OKP' && material.crv === 'Ed25519';
  if (algorithm === 'rsa-pss-sha512' || algorithm === 'rsa-v1_5-sha256') return material.kty === 'RSA';
  return material.kty === 'EC' && material.crv === (algorithm === 'ecdsa-p256-sha256' ? 'P-256' : 'P-384');
}
function joseAlgorithm(algorithm: PublicSignatureAlgorithm): string {
  switch (algorithm) {
    case 'ed25519': return 'EdDSA';
    case 'rsa-pss-sha512': return 'PS512';
    case 'rsa-v1_5-sha256': return 'RS256';
    case 'ecdsa-p256-sha256': return 'ES256';
    case 'ecdsa-p384-sha384': return 'ES384';
  }
}

export function directoryKey(value: unknown): { jwk: JsonWebKey; metadataRejected: boolean } | null {
  const jwk = publicKeyMaterial(value);
  if (jwk === null || !record(value)) return null;
  const rejected = { jwk, metadataRejected: true };
  if (['d', 'p', 'q', 'dp', 'dq', 'qi', 'oth', 'k'].some(name => Object.hasOwn(value, name))) return rejected;
  if (value.use !== undefined) {
    if (value.use !== 'sig') return rejected;
    jwk.use = value.use;
  }
  if (value.alg !== undefined) {
    const algorithm = metadataAlgorithm(value.alg);
    if (algorithm === null || !compatible(jwk, algorithm)) return rejected;
    jwk.alg = joseAlgorithm(algorithm);
  }
  if (value.key_ops !== undefined) {
    if (!Array.isArray(value.key_ops) || !value.key_ops.every((operation): operation is string => typeof operation === 'string')) return rejected;
    if (!value.key_ops.includes('verify') || new Set(value.key_ops).size !== value.key_ops.length) return rejected;
    if (value.use === 'sig' && value.key_ops.some(operation => operation !== 'sign' && operation !== 'verify')) return rejected;
    jwk.key_ops = [...value.key_ops];
  }
  if (value.ext !== undefined) {
    if (typeof value.ext !== 'boolean') return rejected;
    jwk.ext = value.ext;
  }
  return { jwk, metadataRejected: false };
}

/** A signature's untrusted alg parameter can only narrow the admitted key.
 * Without it, infer from trusted key metadata or the fixed key-family default.
 */
export async function importPublicVerificationKey(jwk: JsonWebKey, requested?: PublicSignatureAlgorithm):
  Promise<PublicVerificationKey | { reason: 'key-invalid' | 'key-algorithm-mismatch' }> {
  const admitted = directoryKey(jwk);
  if (admitted === null || admitted.metadataRejected) return { reason: 'key-invalid' };
  jwk = admitted.jwk;
  const advertised = jwk.alg === undefined ? null : metadataAlgorithm(jwk.alg);
  const fallback = jwk.kty === 'OKP' ? 'ed25519' : jwk.kty === 'RSA' ? 'rsa-pss-sha512'
    : jwk.crv === 'P-256' ? 'ecdsa-p256-sha256' : 'ecdsa-p384-sha384';
  const algorithm = requested ?? advertised ?? fallback;
  if (!compatible(jwk, algorithm) || (advertised !== null && advertised !== algorithm)) return { reason: 'key-algorithm-mismatch' };
  if (publicKeyMaterialToken(jwk) === null) return { reason: 'key-invalid' };
  const parameters = algorithm === 'ed25519' ? 'Ed25519'
    : algorithm === 'rsa-pss-sha512' ? { name: 'RSA-PSS', hash: 'SHA-512' }
    : algorithm === 'rsa-v1_5-sha256' ? { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }
    : { name: 'ECDSA', namedCurve: algorithm === 'ecdsa-p256-sha256' ? 'P-256' : 'P-384' };
  try { return { key: await crypto.subtle.importKey('jwk', jwk, parameters, false, ['verify']), algorithm }; }
  catch { return { reason: 'key-invalid' }; }
}

export function verifyPublicSignature(key: PublicVerificationKey, signature: Uint8Array, content: Uint8Array): Promise<boolean> {
  const algorithm = key.algorithm;
  const parameters = algorithm === 'ed25519' ? 'Ed25519'
    : algorithm === 'rsa-pss-sha512' ? { name: 'RSA-PSS', saltLength: 64 }
    : algorithm === 'rsa-v1_5-sha256' ? { name: 'RSASSA-PKCS1-v1_5' }
    : { name: 'ECDSA', hash: algorithm === 'ecdsa-p256-sha256' ? 'SHA-256' : 'SHA-384' };
  if ((algorithm === 'ed25519' || algorithm === 'ecdsa-p256-sha256') && signature.length !== 64
    || algorithm === 'ecdsa-p384-sha384' && signature.length !== 96) return Promise.resolve(false);
  return crypto.subtle.verify(parameters, key.key, signature, content);
}

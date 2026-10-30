// Offline audit of the exact authority-only response profile captured in Research 114.
// Not a general RFC 9421 parser, Worker verifier, or managed-provider oracle.
import { createHash, createPublicKey, verify } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv[2];
if (!root) throw new Error('Supply the private capture directory');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const rows = [];
for (const vendor of ['exa', 'ahrefs']) {
  const capture = JSON.parse(readFileSync(join(root, `${vendor}.json`), 'utf8'));
  const body = readFileSync(join(root, `${vendor}.body`));
  if (capture.status !== 200 || hash(body) !== capture.bodySha256) throw new Error('Capture mismatch');
  const headers = new Headers(capture.responseHeaders);
  const keys = JSON.parse(body).keys;
  const authority = new URL(capture.url).host;
  const captureTime = Date.parse(capture.end) / 1000;
  const inputs = headers.get('signature-input')?.split(/,\s*/);
  const signatures = new Map(headers.get('signature')?.split(/,\s*/).map(member => {
    const match = /^(binding\d+)=:([A-Za-z0-9+/]+={0,2}):$/.exec(member);
    if (!match) throw new Error('Unsupported signature profile');
    return [match[1], Buffer.from(match[2], 'base64')];
  }));
  if (!inputs?.length || signatures.size !== inputs.length) throw new Error('Missing/unequal proofs');
  for (const member of inputs) {
    const match = /^(binding\d+)=(\("@authority";req\);created=(\d+);keyid="([A-Za-z0-9_-]+)";alg="ed25519";expires=(\d+);tag="http-message-signatures-directory")$/.exec(member);
    if (!match) throw new Error('Unsupported signature input; do not silently generalize');
    const [, label, params, created, keyid, expires] = match;
    const key = keys.find(value => value.kid === keyid);
    if (!key || key.kty !== 'OKP' || key.crv !== 'Ed25519') throw new Error('Missing Ed25519 key');
    const thumbprint = createHash('sha256').update(JSON.stringify({ crv: key.crv, kty: key.kty, x: key.x })).digest('base64url');
    if (thumbprint !== keyid) throw new Error('Thumbprint mismatch');
    const publicKey = createPublicKey({ key, format: 'jwk' });
    const signature = signatures.get(label);
    if (!signature || signature.length !== 64) throw new Error('Invalid signature length');
    const base = host => Buffer.from(`"@authority";req: ${host}\n"@signature-params": ${params}`);
    const cryptoValid = verify(null, base(authority), publicKey, signature);
    const timeValid = Number(created) <= captureTime && captureTime <= Number(expires);
    const changedSignature = Buffer.from(signature);
    changedSignature[0] ^= 1;
    const changedKey = { ...key, x: Buffer.alloc(32, 1).toString('base64url') };
    const changedBody = Buffer.from(JSON.stringify({ ...JSON.parse(body), researchControl: true }));
    const controls = {
      wrongAuthorityRejected: !verify(null, base('unrelated.example'), publicKey, signature),
      changedSignatureRejected: !verify(null, base(authority), publicKey, changedSignature),
      differentKeyRejected: !verify(null, base(authority), createPublicKey({ key: changedKey, format: 'jwk' }), signature),
      changedBodyHashDiffers: hash(changedBody) !== hash(body),
      changedBodyRetainsCryptoProof: verify(null, base(authority), publicKey, signature),
    };
    if (!cryptoValid || !timeValid || !Object.values(controls).every(Boolean)) throw new Error('Proof/control failed');
    rows.push({ vendor, label, cryptoValid, timeValidAtCapture: timeValid,
      coveredComponents: ['"@authority";req'], contentDigestPresent: headers.has('content-digest'),
      signatureLifetimeSeconds: Number(expires) - Number(created), controls });
  }
}
console.log(JSON.stringify({ profile: 'captured authority-only directory response', rows,
  proofCount: rows.length, controlAssertions: rows.length * 5, externalRequests: 0,
  limits: ['Time assessed at capture, not execution; no replay claim.',
    'Body mutation retains the advertised verification key; TLS still protects the fetched body in transit.',
    'Node cryptographic check, not independent RFC or Cloudflare-managed execution.'] }, null, 2));

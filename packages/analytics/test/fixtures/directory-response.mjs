// Labelled synthetic directory responses. Signature bases are built here,
// independently of the adapter; the Python reference also checks these bytes.
import { generateKeyPairSync, createHash, sign } from 'node:crypto';
const now = new Date('2026-10-30T16:00:00Z');
const seconds = now.getTime() / 1000;
const url = 'https://fixture.example/.well-known/http-message-signatures-directory';
const pair = () => {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const jwk = publicKey.export({ format: 'jwk' });
  const kid = createHash('sha256').update(JSON.stringify({ crv: jwk.crv, kty: jwk.kty, x: jwk.x })).digest('base64url');
  return { jwk: { ...jwk, kid }, privateKey };
};
export function directoryResponseFixture() {
  const keys = [pair(), pair()];
  const build = ({ digest = false, count = 2, components, created = seconds - 10, expires = seconds + 300,
    tag = 'http-message-signatures-directory', directoryKeys = keys.map(key => key.jwk), digestAlgorithm = 'sha-256',
    inputTransform = value => value, signatureTransform = value => value } = {}) => {
    const body = Buffer.from(JSON.stringify({ keys: directoryKeys }));
    const headers = { 'Content-Type': 'application/http-message-signatures-directory+json' };
    if (digest) headers['Content-Digest'] = `${digestAlgorithm}=:${createHash(digestAlgorithm === 'sha-512' ? 'sha512' : 'sha256').update(body).digest('base64')}:`;
    const covered = components ?? (digest ? ['"@authority";req', '"content-digest"'] : ['"@authority";req']);
    const inputs = [], signatures = [];
    for (let index = 0; index < count; index++) {
      const key = keys[index % keys.length];
      const params = `(${covered.join(' ')});created=${created};keyid="${key.jwk.kid}";alg="ed25519";expires=${expires};tag="${tag}"`;
      const values = { '"@authority";req': 'fixture.example', '"@authority"': 'fixture.example',
        '"content-digest"': headers['Content-Digest'], '"@status"': '200', '"@path";req': '/.well-known/http-message-signatures-directory' };
      const base = `${covered.map(component => `${component}: ${values[component]}`).join('\n')}\n"@signature-params": ${params}`;
      inputs.push(`proof${index}=${inputTransform(params)}`);
      const signature = signatureTransform(sign(null, Buffer.from(base), key.privateKey));
      signatures.push(`proof${index}=:${signature.toString('base64')}:`);
    }
    headers['Signature-Input'] = inputs.join(', '); headers.Signature = signatures.join(', ');
    return { requestUrl: url, status: 200, headers, body: new Uint8Array(body) };
  };
  const clone = input => ({ ...input, headers: { ...input.headers }, body: new Uint8Array(input.body) });
  const cases = [];
  const add = (name, context, expected) => cases.push({ name, context, expected });
  const authority = build(), bound = build({ digest: true });
  add('authority-only', authority, { verified: 2, authority: 2, bound: 0, digest: 'absent' });
  add('digest-bound', bound, { verified: 2, authority: 2, bound: 2, digest: 'matched' });
  add('sha512-bound', build({ digest: true, digestAlgorithm: 'sha-512' }), { verified: 2, authority: 2, bound: 2, digest: 'matched' });
  add('status-also-covered', build({ digest: true, components: ['"@authority";req', '"content-digest"', '"@status"'] }), { verified: 2, authority: 2, bound: 2, digest: 'matched' });
  const bodyChanged = input => { const context = clone(input); context.body = new TextEncoder().encode(JSON.stringify({ ...JSON.parse(new TextDecoder().decode(context.body)), changed: true })); return context; };
  add('unsigned-body-change', bodyChanged(authority), { verified: 2, authority: 2, bound: 0, digest: 'absent' });
  add('signed-body-change', bodyChanged(bound), { verified: 2, authority: 2, bound: 0, digest: 'mismatch' });
  const digestChanged = clone(bound); digestChanged.headers['Content-Digest'] = `sha-256=:${Buffer.alloc(32).toString('base64')}:`;
  add('signed-header-change', digestChanged, { verified: 0, authority: 0, bound: 0, digest: 'mismatch', reason: 'signature-mismatch' });
  add('wrong-authority', { ...clone(authority), requestUrl: url.replace('fixture.example', 'different.example') }, { verified: 0, authority: 0, bound: 0, digest: 'absent', reason: 'signature-mismatch' });
  add('expired', build({ expires: seconds - 1 }), { verified: 0, authority: 0, bound: 0, digest: 'absent', reason: 'outside-validity' });
  add('future', build({ created: seconds + 1 }), { verified: 0, authority: 0, bound: 0, digest: 'absent', reason: 'outside-validity' });
  add('missing-associated-request-flag', build({ components: ['"@authority"'] }), { verified: 0, authority: 0, bound: 0, digest: 'absent', reason: 'component-unsupported' });
  add('unsupported-component', build({ components: ['"@authority";req', '"@path";req'] }), { verified: 0, authority: 0, bound: 0, digest: 'absent', reason: 'component-unsupported' });
  add('digest-without-authority', build({ digest: true, components: ['"content-digest"'] }), { verified: 2, authority: 0, bound: 0, digest: 'matched' });
  add('one-proof-two-keys', build({ count: 1 }), { verified: 1, authority: 1, bound: 0, digest: 'absent', allAuthority: false });
  add('duplicate-key-entry', build({ directoryKeys: [keys[0].jwk, keys[0].jwk, keys[1].jwk] }), { verified: 2, authority: 2, bound: 0, digest: 'absent', duplicates: 1 });
  add('conflicting-duplicate-key', build({ directoryKeys: [keys[0].jwk, { ...keys[0].jwk, use: 'enc' }, keys[1].jwk] }), { verified: 1, authority: 1, bound: 0, digest: 'absent', admitted: 1, rejected: 1 });
  add('wrong-tag', build({ tag: 'web-bot-auth' }), { verified: 0, authority: 0, bound: 0, digest: 'absent', reason: 'different-tag' });
  add('malformed-created-type', build({ inputTransform: input => input.replace(`created=${seconds - 10}`, 'created="wrong"') }), { verified: 0, authority: 0, bound: 0, digest: 'absent', reason: 'invalid-parameters' });
  add('signature-mutated', build({ signatureTransform: signature => { signature[0] ^= 1; return signature; } }), { verified: 0, authority: 0, bound: 0, digest: 'absent', reason: 'signature-mismatch' });
  add('empty-directory', build({ count: 0, directoryKeys: [] }), { assessed: false, reason: 'fields-malformed', admitted: 0 });
  const missing = clone(authority); delete missing.headers.Signature; delete missing.headers['Signature-Input'];
  add('proofs-absent', missing, { assessed: false, reason: 'proofs-absent' });
  const unknownDigest = clone(bound); unknownDigest.headers['Content-Digest'] = 'future-hash=:AAAA:';
  add('unsupported-digest', unknownDigest, { verified: 0, authority: 0, bound: 0, digest: 'unsupported', reason: 'signature-mismatch' });
  const malformedDigest = clone(bound); malformedDigest.headers['Content-Digest'] = 'sha-256=token';
  add('malformed-digest', malformedDigest, { verified: 0, authority: 0, bound: 0, digest: 'malformed', reason: 'signature-mismatch' });
  const firstInvalid = clone(authority);
  // Keep valid SF syntax while corrupting one proof; the later key still verifies.
  firstInvalid.headers.Signature = `proof0=:${Buffer.alloc(64).toString('base64')}:, ${authority.headers.Signature.split(', ')[1]}`;
  add('first-invalid-later-valid', firstInvalid, { verified: 1, authority: 1, bound: 0, digest: 'absent', reason: 'signature-mismatch' });
  add('repeated-proof-one-key', build({ count: 3 }), { verified: 3, authority: 2, bound: 0, digest: 'absent' });
  add('rejected-key-metadata', build({ directoryKeys: [{ ...keys[0].jwk, use: 'enc' }, keys[1].jwk] }), { verified: 1, authority: 1, bound: 0, digest: 'absent', admitted: 1, rejected: 1, reason: 'key-rejected' });
  add('unavailable-key', build({ directoryKeys: [keys[1].jwk] }), { verified: 1, authority: 1, bound: 0, digest: 'absent', admitted: 1, reason: 'key-unavailable' });
  add('additional-unsupported-key', build({ directoryKeys: [keys[0].jwk, keys[1].jwk, { kty: 'future' }] }), { verified: 2, authority: 2, bound: 0, digest: 'absent', admitted: 2 });
  add('signed-unsupported-digest', build({ digest: true, digestAlgorithm: 'future-hash' }), { verified: 2, authority: 2, bound: 0, digest: 'unsupported' });
  add('duplicate-component', build({ components: ['"@authority";req', '"@authority";req'] }), { verified: 0, authority: 0, bound: 0, digest: 'absent', reason: 'duplicate-component' });
  add('conflicting-validity-duplicates', build({ directoryKeys: [{ ...keys[0].jwk, exp: seconds + 100 }, { ...keys[0].jwk, exp: seconds + 200 }, keys[1].jwk] }), { verified: 1, authority: 1, bound: 0, digest: 'absent', admitted: 1, rejected: 1, reason: 'key-rejected' });
  add('expired-key-boundary', build({ directoryKeys: [{ ...keys[0].jwk, exp: seconds }, keys[1].jwk] }), { verified: 1, authority: 1, bound: 0, digest: 'absent', admitted: 1, rejected: 1, reason: 'key-rejected' });
  add('signature-validity-boundary', build({ created: seconds, expires: seconds }), { verified: 2, authority: 2, bound: 0, digest: 'absent' });
  return { now, cases, build, clone };
}

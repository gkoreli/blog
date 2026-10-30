import assert from 'node:assert/strict';
import { createPrivateKey, createPublicKey, createHash, sign, generateKeyPairSync } from 'node:crypto';
import { directoryResponseFixture } from './directory-response.mjs';

export function directoryCacheFixture() {
  const f = directoryResponseFixture(), epoch = f.now.getTime() / 1000;
  const published = JSON.parse(new TextDecoder().decode(f.build().body)).keys;
  const scenarios = [];
  const add = (name, context, offsets) => {
    context.headers['Cache-Control'] = 'max-age=3600';
    for (const offset of offsets) scenarios.push({ name: `${name}@${offset}`, scenario: name, offset,
      now: new Date(f.now.getTime() + offset * 1000).toISOString(),
      context: { ...context, headers: [...new Headers(context.headers)], body: [...context.body] } });
  };
  add('proof-expires', f.build({ expires: epoch + 5 }), [0, 5, 5.001, 6]);
  add('body-proof-expires', f.build({ digest: true, expires: epoch + 5 }), [0, 6]);
  add('future-proof', f.build({ created: epoch + 5, expires: epoch + 20 }), [0, 5]);
  add('key-expires', f.build({ directoryKeys: [published[0], { ...published[1], exp: epoch + 5 }] }), [0, 5]);
  add('future-key', f.build({ directoryKeys: [published[0], { ...published[1], nbf: epoch + 5 }] }), [0, 5]);
  const mixed = f.build({ count: 1, expires: epoch + 5 }), later = f.build({ expires: epoch + 20 });
  mixed.headers['Signature-Input'] += ', ' + later.headers['Signature-Input'].split(', ')[1];
  mixed.headers.Signature += ', ' + later.headers.Signature.split(', ')[1];
  add('mixed-expiry', mixed, [0, 6, 21]);
  const duplicates = f.build({ directoryKeys: Array.from({ length: 128 }, () => published[0]), count: 1 });
  add('duplicate-128', duplicates, [0]);
  const absent = f.clone(duplicates); delete absent.headers.Signature; delete absent.headers['Signature-Input'];
  add('absent-proof-duplicate-128', absent, [0]);
  const unique = [...published];
  for (let index = 2; index < 128; index++) unique.push(generateKeyPairSync('ed25519').publicKey.export({ format: 'jwk' }));
  add('unique-128-two-proofs', f.build({ directoryKeys: unique }), [0]);
  // Published test vector: https://www.rfc-editor.org/rfc/rfc8032.html#section-7.1
  // This public seed is never an operational secret.
  const seed = Buffer.from('9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60', 'hex');
  const privateKey = createPrivateKey({ key: Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), seed]), format: 'der', type: 'pkcs8' });
  const jwk = createPublicKey(privateKey).export({ format: 'jwk' });
  assert.equal(jwk.x, '11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo');
  const kid = createHash('sha256').update(JSON.stringify({ crv: jwk.crv, kty: jwk.kty, x: jwk.x })).digest('base64url');
  const params = `("@authority";req);created=${epoch};expires=${epoch + 60};keyid="${kid}";alg="ed25519";tag="http-message-signatures-directory"`;
  const proof = sign(null, Buffer.from(`"@authority";req: fixture.example\n"@signature-params": ${params}`), privateKey);
  add('known-public-demonstration-key', { requestUrl: 'https://fixture.example/.well-known/http-message-signatures-directory', status: 200,
    headers: { 'Content-Type': 'application/http-message-signatures-directory+json', 'Signature-Input': `test=${params}`, Signature: `test=:${proof.toString('base64')}:` },
    body: new TextEncoder().encode(JSON.stringify({ keys: [{ ...jwk, kid }] })) }, [0]);
  const requestParams = `("@authority" "signature-agent");created=${epoch};expires=${epoch + 60};keyid="${kid}";alg="ed25519";tag="web-bot-auth"`;
  const requestSignature = sign(null, Buffer.from(`"@authority": publication.example\n"signature-agent": "https://fixture.example"\n"@signature-params": ${requestParams}`), privateKey);
  return { scenarios, epoch, demonstrationRequest: { url: 'https://publication.example/article',
    headers: { 'Signature-Agent': '"https://fixture.example"', 'Signature-Input': `test=${requestParams}`, Signature: `test=:${requestSignature.toString('base64')}:` } } };
}

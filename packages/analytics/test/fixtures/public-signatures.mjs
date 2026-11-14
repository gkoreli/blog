import { generateKeyPairSync, createHash, sign, constants } from 'node:crypto';

/** OpenSSL signing, explicit canonical messages and independent thumbprints.
 * No production base builder or WebCrypto signer is used by these fixtures.
 */
export function publicSignatureFixture() {
  const now = '2026-11-13T12:00:00Z', epoch = Date.parse(now) / 1000;
  const origin = 'https://public-key.fixture.example';
  const ed = generateKeyPairSync('ed25519');
  const rsa = generateKeyPairSync('rsa', { modulusLength: 2048, publicExponent: 65537 });
  const p256 = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const p384 = generateKeyPairSync('ec', { namedCurve: 'secp384r1' });
  const oddRsa = generateKeyPairSync('rsa', { modulusLength: 2049, publicExponent: 65537 });
  const oddBase = 'An independently signed 2049-bit RSA verification control';
  const oddModulus = { algorithm: 'rsa-pss-sha512', jwk: oddRsa.publicKey.export({ format: 'jwk' }), base: oddBase,
    signature: sign('sha512', Buffer.from(oddBase), { key: oddRsa.privateKey, padding: constants.RSA_PKCS1_PSS_PADDING, saltLength: 64 }).toString('base64') };
  const specs = [
    ['ed25519', ed, null, {}],
    ['rsa-pss-sha512', rsa, 'sha512', { padding: constants.RSA_PKCS1_PSS_PADDING, saltLength: 64 }],
    ['rsa-v1_5-sha256', rsa, 'sha256', { padding: constants.RSA_PKCS1_PADDING }],
    ['ecdsa-p256-sha256', p256, 'sha256', { dsaEncoding: 'ieee-p1363' }],
    ['ecdsa-p384-sha384', p384, 'sha384', { dsaEncoding: 'ieee-p1363' }],
  ];
  return { now, origin, oddModulus, cases: specs.map(([algorithm, pair, hash, signing]) => {
    const jwk = pair.publicKey.export({ format: 'jwk' });
    const material = jwk.kty === 'RSA' ? { e: jwk.e, kty: jwk.kty, n: jwk.n }
      : jwk.kty === 'EC' ? { crv: jwk.crv, kty: jwk.kty, x: jwk.x, y: jwk.y } : { crv: jwk.crv, kty: jwk.kty, x: jwk.x };
    const kid = createHash('sha256').update(JSON.stringify(material)).digest('base64url');
    const params = `("@authority" "@method" "@path" "signature-agent");created=${epoch};expires=${epoch + 300};keyid="${kid}";alg="${algorithm}";tag="web-bot-auth"`;
    const base = `"@authority": publication.example\n"@method": GET\n"@path": /article\n"signature-agent": "${origin}"\n"@signature-params": ${params}`;
    const signature = sign(hash, Buffer.from(base), { key: pair.privateKey, ...signing });
    const dictionaryParams = params.replace('"signature-agent"', '"signature-agent";key="agent"');
    const dictionaryBase = base.replace('"signature-agent":', '"signature-agent";key="agent":').replace(params, dictionaryParams);
    const implicitParams = params.replace(`;alg="${algorithm}"`, '');
    const implicitBase = base.replace(params, implicitParams);
    const incompatibleAlgorithm = algorithm === 'ed25519' ? 'rsa-pss-sha512' : 'ed25519';
    const incompatibleParams = params.replace(`;alg="${algorithm}"`, `;alg="${incompatibleAlgorithm}"`);
    const incompatibleBase = base.replace(params, incompatibleParams);
    const jose = { ed25519: 'EdDSA', 'rsa-pss-sha512': 'PS512', 'rsa-v1_5-sha256': 'RS256', 'ecdsa-p256-sha256': 'ES256', 'ecdsa-p384-sha384': 'ES384' }[algorithm];
    const body = Buffer.from(JSON.stringify({ keys: [jwk] }));
    const digest = createHash('sha256').update(body).digest('base64');
    const proofParams = `("@authority";req "content-digest");created=${epoch};expires=${epoch + 300};keyid="${kid}";alg="${algorithm}";tag="http-message-signatures-directory"`;
    const proofBase = `"@authority";req: public-key.fixture.example\n"content-digest": sha-256=:${digest}:\n"@signature-params": ${proofParams}`;
    return { algorithm, jwk, kid, base, signature: signature.toString('base64'),
      request: { url: 'https://publication.example/article', headers: {
        'Signature-Agent': `"${origin}"`, 'Signature-Input': `proof=${params}`, Signature: `proof=:${signature.toString('base64')}:`,
      } },
      dictionaryRequest: { url: 'https://publication.example/article', headers: {
        'Signature-Agent': `agent="${origin}"`, 'Signature-Input': `proof=${dictionaryParams}`,
        Signature: `proof=:${sign(hash, Buffer.from(dictionaryBase), { key: pair.privateKey, ...signing }).toString('base64')}:`,
      } },
      implicitJwk: { ...jwk, alg: jose },
      implicitRequest: { url: 'https://publication.example/article', headers: {
        'Signature-Agent': `"${origin}"`, 'Signature-Input': `proof=${implicitParams}`,
        Signature: `proof=:${sign(hash, Buffer.from(implicitBase), { key: pair.privateKey, ...signing }).toString('base64')}:`,
      } },
      incompatibleRequest: { url: 'https://publication.example/article', headers: {
        'Signature-Agent': `"${origin}"`, 'Signature-Input': `proof=${incompatibleParams}`,
        Signature: `proof=:${sign(hash, Buffer.from(incompatibleBase), { key: pair.privateKey, ...signing }).toString('base64')}:`,
      } },
      directory: { requestUrl: origin + '/.well-known/http-message-signatures-directory', status: 200, body: [...body], headers: {
        'Content-Type': 'application/http-message-signatures-directory+json', 'Content-Digest': `sha-256=:${digest}:`,
        'Signature-Input': `proof=${proofParams}`, Signature: `proof=:${sign(hash, Buffer.from(proofBase), { key: pair.privateKey, ...signing }).toString('base64')}:`,
      } },
      wrongSalt: algorithm === 'rsa-pss-sha512' ? sign(hash, Buffer.from(base), { key: pair.privateKey, ...signing, saltLength: 32 }).toString('base64') : null,
      der: algorithm.startsWith('ecdsa') ? sign(hash, Buffer.from(base), { key: pair.privateKey, ...signing, dsaEncoding: 'der' }).toString('base64') : null,
    };
  }) };
}

export { runPublicSignatures } from './run-public-signatures.mjs';

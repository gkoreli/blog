/** Raw canonical signing bytes are built independently of the verifier. */
export async function signatureParameterFixture(recordedAt = '2026-10-28T04:00:00Z') {
  const epoch = Math.floor(Date.parse(recordedAt) / 1000), at = new Date(epoch * 1000).toISOString();
  const pair = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
  const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
  const canonicalKey = JSON.stringify({ crv: jwk.crv, kty: jwk.kty, x: jwk.x });
  const kid = Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalKey))).toString('base64url');
  const baseParams = { created: String(epoch), expires: String(epoch + 60), keyid: JSON.stringify(kid), alg: '"ed25519"', nonce: '"parameter-fixture-nonce"', tag: '"web-bot-auth"' };
  const invalid = 'invalid-nonce-type';
  const cases = [
    ['string-nonce', {}, null], ['absent-nonce', { nonce: null }, null], ['empty-string-nonce', { nonce: '""' }, null],
    ['integer-nonce', { nonce: '7' }, invalid], ['boolean-nonce', { nonce: '?0' }, invalid],
    ['token-nonce', { nonce: 'opaque-token' }, invalid], ['bytes-nonce', { nonce: ':YQ==:' }, invalid],
    ['created-string', { created: JSON.stringify(String(epoch)) }, 'invalid-created-type'], ['expires-boolean', { expires: '?0' }, 'invalid-expires-type'],
    ['algorithm-token', { alg: 'ed25519' }, 'invalid-alg-type'], ['keyid-integer', { keyid: '1' }, 'invalid-keyid-type'], ['tag-token', { tag: 'web-bot-auth' }, 'invalid-tag-type'],
    ['missing-created', { created: null }, 'missing-validity'], ['other-string-tag', { tag: '"other-protocol"' }, 'no-web-bot-auth-signature'],
    ['future-at-local-skew', { created: String(epoch + 60), expires: String(epoch + 120) }, null],
    ['future-beyond-local-skew', { created: String(epoch + 61), expires: String(epoch + 121) }, 'not-yet-valid'],
    ['expiry-at-local-skew', { created: String(epoch - 120), expires: String(epoch - 60) }, null],
    ['expiry-beyond-local-skew', { created: String(epoch - 120), expires: String(epoch - 61) }, 'expired'],
    ['one-day-lifetime', { expires: String(epoch + 86400) }, null],
    ['lifetime-over-one-day', { expires: String(epoch + 86401) }, 'validity-policy-exceeded'],
    ['zero-duration-window', { expires: String(epoch) }, null],
    ['inverted-window', { expires: String(epoch - 1) }, 'invalid-validity-window'],
  ];
  const rows = [];
  for (const form of ['dictionary', 'legacy-string', 'bare-uri']) {
    // All type gates across wire paths; freshness behavior is wire-independent.
    const selected = form === 'dictionary' ? cases : cases.filter(([name]) => name.includes('nonce') || name === 'tag-token');
    for (const [name, updates, expectedReason] of selected) {
      const params = { ...baseParams, ...updates };
      const component = form === 'dictionary' ? '"signature-agent";key="proof"' : '"signature-agent"';
      const serialized = `("@authority" ${component})` + Object.entries(params).filter(([, value]) => value !== null).map(([key, value]) => `;${key}=${value}`).join('');
      const agent = form === 'bare-uri' ? 'https://parameter-fixture.example' : '"https://parameter-fixture.example"';
      const base = `"@authority": publication.example\n${component}: ${agent}\n"@signature-params": ${serialized}`;
      const signature = await crypto.subtle.sign('Ed25519', pair.privateKey, new TextEncoder().encode(base));
      rows.push({ name: `${form}/${name}`, scenario: name, form, now: at, maxAgeSeconds: 86400, expectedReason,
        headers: { 'Signature-Agent': form === 'dictionary' ? `proof=${agent}` : agent, 'Signature-Input': `proof=${serialized}`, Signature: `proof=:${Buffer.from(signature).toString('base64')}:` } });
    }
  }
  return { directory: { keys: [jwk] }, source: 'https://parameter-fixture.example/.well-known/http-message-signatures-directory', rows };
}

export async function signatureParameterMatrix(fixture, api) {
  const rows = [];
  for (const trial of fixture.rows) {
    const paths = [];
    for (const mode of ['default', 'selected', 'audit']) {
      let fetches = 0;
      const request = new Request('https://publication.example/a', { headers: trial.headers });
      const options = { now: new Date(trial.now), maxAgeSeconds: trial.maxAgeSeconds, includeEvidence: true, cache: api.cache(), fetcher: async url => {
        if (String(url) !== fixture.source) throw Error('Unexpected fixture directory');
        fetches++; return Response.json(fixture.directory, { headers: { 'Content-Type': 'application/http-message-signatures-directory+json' } });
      } };
      const result = await (mode === 'default' ? api.verify(request, options) : mode === 'selected' ? api.selected(request, 'proof', options) : api.audit(request, options));
      paths.push(mode === 'audit' ? { mode, assessment: result.assessment, termination: result.termination, verified: result.verifiedCandidates,
        negative: result.notVerifiedByProfileCandidates, unresolved: result.unresolvedCandidates, fetches } : { mode, status: result.status, reason: result.reason ?? null, outcome: api.outcome(result), fetches });
    }
    rows.push({ name: trial.name, expectedReason: trial.expectedReason, paths });
  }
  return rows;
}

export const forwardedSyntaxCases = [
  { name: 'absent', header: null, syntax: 'absent' },
  { name: 'empty', header: '', syntax: 'empty' },
  { name: 'documented-example', header: 'for="openai";use="reference"', syntax: 'parsed', operator: 'openai', use: 'reference' },
  { name: 'token-values', header: 'for=openai;use=immediate', syntax: 'parsed', operator: 'openai', use: 'immediate' },
  { name: 'parameter-name-case', header: 'For=openai;USE=full', syntax: 'parsed', operator: 'openai', use: 'full' },
  { name: 'value-case-is-not-normalized', header: 'for=OpenAI;use=Reference', syntax: 'parsed', operator: null, use: null },
  { name: 'quoted-delimiters', header: 'for="x,for=openai;use=full";use=reference', syntax: 'parsed', operator: null, use: 'reference' },
  { name: 'quoted-escape', header: String.raw`for="op\enai";use=reference`, syntax: 'parsed', operator: 'openai', use: 'reference' },
  { name: 'empty-quoted-value', header: 'for="";use=""', syntax: 'parsed', operator: null, use: null },
  { name: 'node-address-not-an-operator', header: 'for="[2001:db8::1]";use=reference', syntax: 'parsed', operator: null, use: 'reference' },
  { name: 'chain-has-no-selected-actor', header: 'for=openai;use=reference, for=192.0.2.1;use=full', syntax: 'parsed', elements: 2 },
  { name: 'duplicate-different', header: 'for=openai;FOR=other', syntax: 'malformed', duplicate: 'different-values' },
  { name: 'duplicate-same', header: 'for=openai;for=openai', syntax: 'malformed', duplicate: 'same-value' },
  { name: 'duplicate-purpose', header: 'for=openai;use=reference;USE=full', syntax: 'malformed', duplicate: 'different-values' },
  { name: 'unclosed-string', header: 'for="openai', syntax: 'malformed' },
  { name: 'escaped-end', header: 'for="openai\\', syntax: 'malformed' },
  { name: 'space-before-equals', header: 'for =openai', syntax: 'malformed' },
  { name: 'space-after-equals', header: 'for= openai', syntax: 'malformed' },
  { name: 'bare-nontoken', header: 'for=bad/actor', syntax: 'malformed' },
  { name: 'raw-control', header: 'for="openai\u0001"', syntax: 'malformed' },
  { name: 'non-byte-character', header: 'for="Ω"', syntax: 'malformed' },
  { name: 'empty-element', header: 'for=openai,,for=other', syntax: 'policy-rejected' },
  { name: 'header-bound', header: 'a'.repeat(4097), syntax: 'policy-rejected' },
  { name: 'element-bound', header: Array(9).fill('for=openai').join(','), syntax: 'policy-rejected' },
  { name: 'parameter-bound', header: Array.from({ length: 17 }, (_, i) => `x${i}=v`).join(';'), syntax: 'policy-rejected' },
  { name: 'prototype-key-is-data', header: '__proto__=value;for=openai;use=reference', syntax: 'parsed', operator: 'openai', use: 'reference' },
  { name: 'unknown-use', header: 'for=openai;use=training', syntax: 'parsed', operator: 'openai', use: null },
];

/** Independently constructed RFC 9421 bases; no vendor signing credentials. */
export async function forwardedPurposeFixture() {
  const now = '2026-10-29T04:10:00Z', epoch = Date.parse(now) / 1000;
  const pairs = await Promise.all([0, 1].map(() => crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify'])));
  const keys = await Promise.all(pairs.map(pair => crypto.subtle.exportKey('jwk', pair.publicKey)));
  const ids = await Promise.all(keys.map(async key => Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify({ crv: key.crv, kty: key.kty, x: key.x })))).toString('base64url')));
  const agent = 'https://purpose-fixture.example', forwarded = 'for="openai";use="reference"';
  async function sign({ covered = true, key = 0, note = false } = {}) {
    const names = ['@authority', 'signature-agent', ...(covered ? ['forwarded'] : []), ...(note ? ['x-note'] : [])];
    const params = `(${names.map(name => JSON.stringify(name)).join(' ')});created=${epoch};expires=${epoch + 300};keyid="${ids[key]}";alg="ed25519";tag="web-bot-auth"`;
    const values = { '@authority': 'publication.example', 'signature-agent': JSON.stringify(agent), forwarded, 'x-note': '"forwarded": for="openai";use="reference"' };
    const base = [...names.map(name => `${JSON.stringify(name)}: ${values[name]}`), `"@signature-params": ${params}`].join('\n');
    const signature = Buffer.from(await crypto.subtle.sign('Ed25519', pairs[key].privateKey, new TextEncoder().encode(base))).toString('base64');
    return { now, method: 'GET', url: 'https://publication.example/fixture', headers: { Forwarded: forwarded, 'Signature-Agent': JSON.stringify(agent), 'Signature-Input': `proof=${params}`, Signature: `proof=:${signature}:`, ...(note ? { 'X-Note': values['x-note'] } : {}) }, directory: { keys } };
  }
  const signed = await sign(), unsigned = await sign({ covered: false }), second = await sign({ key: 1 });
  const multi = { ...unsigned, headers: { ...unsigned.headers, 'Signature-Input': `${unsigned.headers['Signature-Input']}, ${second.headers['Signature-Input'].replace(/^proof=/, 'second=')}`,
    Signature: `${unsigned.headers.Signature}, ${second.headers.Signature.replace(/^proof=/, 'second=')}` } };
  return { records: { signed, unsigned,
    changedSigned: { ...signed, headers: { ...signed.headers, Forwarded: 'for="openai";use="full"' } },
    changedUnsigned: { ...unsigned, headers: { ...unsigned.headers, Forwarded: 'for="openai";use="full"' } },
    coveredOtherHeader: await sign({ covered: false, note: true }), multi,
    spoof: { ...unsigned, headers: { Forwarded: forwarded } },
    conflict: { ...signed, headers: { ...signed.headers, Forwarded: 'for=openai;use=reference;use=full' } } } };
}

export const structuredExtensionSyntax = [
  ['zero', '0.000', '0.0'], ['negative-zero', '-0.000', '0.0'],
  ['integral-decimal', '1.000', '1.0'], ['leading-trailing-zero', '001.230', '1.23'],
  ['negative', '-01.230', '-1.23'], ['small', '0.001', '0.001'],
  ['maximum', '999999999999.999', '999999999999.999'], ['minimum', '-999999999999.999', '-999999999999.999'],
  ['integer-baseline', '999999999999999', '999999999999999'],
  ['thirteen-integer-digits', '1000000000000.0', null], ['thirteen-leading-zero-digits', '0000000000000.1', null],
  ['four-fraction-digits', '1.0000', null], ['missing-fraction', '1.', null],
  ['missing-integer', '.1', null], ['plus', '+1.0', null], ['exponent', '1e2', null],
  ['numeric-suffix', '1.2x', null], ['second-dot', '1.2.3', null], ['sign-only', '-', null],
].map(([name, value, canonical]) => ({ name, input: `sig=("@authority");x=${value}`, canonical: canonical === null ? null : `sig=("@authority");x=${canonical}` }));
structuredExtensionSyntax.push(
  { name: 'semicolon-sp', input: 'sig=("@authority");   x=1.230', canonical: 'sig=("@authority");x=1.23' },
  { name: 'semicolon-tab', input: 'sig=("@authority");\tx=1.230', canonical: null },
  { name: 'semicolon-sp-tab', input: 'sig=("@authority"); \tx=1.230', canonical: null },
  { name: 'space-before-equals', input: 'sig=("@authority");x =1.230', canonical: null },
  { name: 'space-after-equals', input: 'sig=("@authority");x= 1.230', canonical: null },
  { name: 'duplicate-parameter', input: 'sig=("@authority");x=1.0;x=2.0', canonical: null },
  { name: 'duplicate-dictionary-label', input: 'sig=("@authority");x=1.0, sig=("@method")', canonical: null },
);

/** Sign literal independently specified bases, never the parser under test. */
export async function makeStructuredExtensionsFixture() {
  const pair = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
  const publicKey = await crypto.subtle.exportKey('jwk', pair.publicKey);
  const encode = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes)));
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify({ crv: 'Ed25519', kty: 'OKP', x: publicKey.x })));
  const keyid = encode(digest).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
  const now = '2026-10-31T00:00:00Z', created = 1793404800, expires = created + 300;
  const metadata = `;created=${created};expires=${expires};keyid="${keyid}";alg="ed25519";tag="web-bot-auth"`;
  const requestParams = `("@authority" "signature-agent")${metadata}`;
  const requestBase = params => `"@authority": publication.example\n"signature-agent": "https://agent.extensions.example"\n"@signature-params": ${params}`;
  const sign = async base => `sig=:${encode(await crypto.subtle.sign('Ed25519', pair.privateKey, new TextEncoder().encode(base)))}:`;
  const request = async (name, wireParams, signedParams, expected) => ({ name, expected, url: 'https://publication.example/article', headers: [
    ['signature-agent', '"https://agent.extensions.example"'], ['signature-input', `sig=${wireParams}`], ['signature', await sign(requestBase(signedParams))],
  ] });
  const requests = [
    await request('plain-baseline', requestParams, requestParams, 'verified'),
    await request('decimal-extension', requestParams + ';priority=001.230', requestParams + ';priority=1.23', 'verified'),
    await request('integral-decimal-extension', requestParams + ';priority=1.000', requestParams + ';priority=1.0', 'verified'),
    await request('negative-zero-extension', requestParams + ';priority=-0.000', requestParams + ';priority=0.0', 'verified'),
    await request('maximum-decimal-extension', requestParams + ';priority=999999999999.999', requestParams + ';priority=999999999999.999', 'verified'),
    await request('semicolon-sp', requestParams.replaceAll(';', ';  ') + ';  priority=1.230', requestParams + ';priority=1.23', 'verified'),
    await request('changed-decimal', requestParams + ';priority=1.24', requestParams + ';priority=1.23', 'signature-invalid'),
    await request('changed-parameter-order', requestParams + ';b=2.0;a=1.0', requestParams + ';a=1.0;b=2.0', 'signature-invalid'),
    await request('decimal-created', requestParams.replace(`created=${created}`, `created=${created}.0`), requestParams, 'invalid-created-type'),
    await request('decimal-expires', requestParams.replace(`expires=${expires}`, `expires=${expires}.0`), requestParams, 'invalid-expires-type'),
    await request('tab-after-semicolon', requestParams + ';\tpriority=1.23', requestParams + ';priority=1.23', 'malformed-signature-fields'),
    await request('excessive-precision', requestParams + ';priority=1.2345', requestParams + ';priority=1.23', 'malformed-signature-fields'),
  ];
  const body = JSON.stringify({ keys: [publicKey] });
  const bodyDigest = encode(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body)));
  const digestField = `sha-256=:${bodyDigest}:;  priority=0.500`;
  const responseParams = `("@authority";req "content-digest")${metadata.replace('web-bot-auth', 'http-message-signatures-directory')}`;
  const responseBase = `"@authority";req: agent.extensions.example\n"content-digest": ${digestField}\n"@signature-params": ${responseParams}`;
  const signedResponse = await sign(responseBase);
  const context = { requestUrl: 'https://agent.extensions.example/.well-known/http-message-signatures-directory', status: 200,
    body: Array.from(new TextEncoder().encode(body)), headers: [['content-type', 'application/http-message-signatures-directory+json'], ['content-digest', digestField], ['signature-input', `sig=${responseParams}`], ['signature', signedResponse]] };
  const responses = [
    { name: 'decimal-digest-extension', context },
    { name: 'changed-signed-digest-parameter', context: { ...context, headers: context.headers.map(([name, value]) => [name, name === 'content-digest' ? value.replace('0.500', '0.501') : value]) } },
    { name: 'changed-body', context: { ...context, body: Array.from(new TextEncoder().encode(body + ' ')) } },
  ];
  return { now, publicKey, syntax: structuredExtensionSyntax, requests, responses };
}

export async function runStructuredExtensionsFixture(data, requestApi, responseApi) {
  const syntax = data.syntax.map(row => {
    const parsed = requestApi.parseDictionary(row.input);
    return { name: row.name, canonical: parsed === null ? null : parsed.map(entry => `${entry.key}=${entry.member.type === 'inner-list' ? requestApi.serializeInnerList(entry.member.value) : requestApi.serializeItem(entry.member.value)}`).join(', ') };
  });
  const requests = [];
  for (const row of data.requests) {
    let lookups = 0;
    const result = await requestApi.verifyWebBotAuth(new Request(row.url, { headers: row.headers }), { now: new Date(data.now), cache: requestApi.createWebBotAuthCache(),
      fetcher: async () => { lookups++; return new Response(JSON.stringify({ keys: [data.publicKey] }), { headers: { 'content-type': 'application/http-message-signatures-directory+json' } }); } });
    requests.push({ name: row.name, status: result.status, reason: result.status === 'unverified' ? result.reason : null, lookups });
  }
  const responses = [];
  for (const row of data.responses) responses.push({ name: row.name, audit: await responseApi.auditDirectoryResponse({ ...row.context, body: new Uint8Array(row.context.body) }, { now: new Date(data.now) }) });
  return { syntax, requests, responses };
}

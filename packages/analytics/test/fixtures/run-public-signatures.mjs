/** The same public fixture runner executes in Node and actual Workerd. */
export async function runPublicSignatures(fixture, api) {
  const results = [], cache = api.createWebBotAuthCache();
  for (const row of fixture.cases) {
    const options = { now: new Date(fixture.now), cache, includeEvidence: true,
      fetcher: async () => Response.json({ keys: [row.jwk] }, { headers: { 'Content-Type': 'application/http-message-signatures-directory+json', 'Cache-Control': 'no-store' } }),
    };
    const request = new Request(row.request.url, { headers: row.request.headers });
    const valid = await api.verifyWebBotAuth(request, options);
    const tampered = await api.verifyWebBotAuth(new Request(request.url + '/changed', { headers: request.headers }), options);
    const proof = await api.auditDirectoryResponse({ ...row.directory, body: new Uint8Array(row.directory.body) }, { now: new Date(fixture.now) });
    const dictionary = await api.verifyWebBotAuth(new Request(row.dictionaryRequest.url, { headers: row.dictionaryRequest.headers }), options);
    const implicitOptions = {
      ...options, cache: api.createWebBotAuthCache(), fetcher: async () => Response.json({ keys: [row.implicitJwk] }, { headers: {
        'Content-Type': 'application/http-message-signatures-directory+json', 'Cache-Control': 'max-age=300',
      } }),
    };
    const implicit = await api.verifyWebBotAuth(new Request(row.implicitRequest.url, { headers: row.implicitRequest.headers }), implicitOptions);
    const incompatible = await api.verifyWebBotAuth(new Request(row.incompatibleRequest.url, { headers: row.incompatibleRequest.headers }), implicitOptions);
    const alternatives = [];
    for (const signature of [row.wrongSalt, row.der].filter(Boolean)) {
      const headers = new Headers(request.headers); headers.set('Signature', `proof=:${signature}:`);
      alternatives.push((await api.verifyWebBotAuth(new Request(request, { headers }), options)).status);
    }
    results.push({ algorithm: row.algorithm, valid, dictionary, implicit, incompatible, tampered: tampered.status, proof, alternatives });
  }
  return results;
}

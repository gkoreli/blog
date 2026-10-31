import { createHash, generateKeyPairSync } from 'node:crypto';
import { directoryResponseFixture } from './directory-response.mjs';

/** Same signed incoming request, varied directory evidence; no generated private keys leave this builder. */
export function directoryAdoptionFixture() {
  const f = directoryResponseFixture(), cases = [];
  const add = (name, context, request = f.incoming()) => cases.push({ name, now: f.now.toISOString(), request,
    context: { ...context, headers: [...new Headers(context.headers)], body: [...context.body] } });
  add('authority-only', f.build());
  add('body-bound', f.build({ digest: true }));
  const absent = f.clone(f.build()); delete absent.headers.Signature; delete absent.headers['Signature-Input'];
  add('response-proofs-absent', absent);
  add('response-proofs-expired', f.build({ expires: f.now.getTime() / 1000 - 1 }));
  const changed = f.clone(f.build({ digest: true }));
  changed.body = new TextEncoder().encode(JSON.stringify({ ...JSON.parse(new TextDecoder().decode(changed.body)), changed: true }));
  add('body-changed-same-keys', changed);
  add('signed-empty-digest', f.build({ digest: true, digestValue: '' }));
  add('signed-unsupported-digest', f.build({ digest: true, digestAlgorithm: 'future-hash' }));
  const body = f.build({ digest: true }).body;
  const digest = createHash('sha256').update(body).digest('base64');
  const parameterized = f.build({ digest: true, digestValue: `sha-256=:${digest}:;future="extension"` });
  add('signed-parameterized-digest', parameterized);
  const parameterChanged = f.clone(parameterized); parameterChanged.headers['Content-Digest'] = parameterChanged.headers['Content-Digest'].replace('extension', 'changed');
  add('parameter-changed-without-resigning', parameterChanged);
  const parameterBodyChanged = f.clone(parameterized); parameterBodyChanged.body = changed.body;
  add('parameterized-digest-body-changed', parameterBodyChanged);
  add('proof-for-request-key-only', f.build({ count: 1 }));
  add('proof-for-other-key-only', f.build({ count: 1, signerOffset: 1 }));
  const unique = JSON.parse(new TextDecoder().decode(body)).keys;
  while (unique.length < 128) unique.push(generateKeyPairSync('ed25519').publicKey.export({ format: 'jwk' }));
  const many = f.build({ directoryKeys: unique }); delete many.headers.Signature; delete many.headers['Signature-Input'];
  add('128-keys-response-proofs-absent', many);
  const invalid = f.incoming(); invalid.headers.Signature = `reader=:${Buffer.alloc(64).toString('base64')}:`;
  add('invalid-incoming-proof', f.build({ digest: true }), invalid);
  return { cases };
}

/** Run unchanged in Node and local workerd. Counter wrappers call real WebCrypto unchanged. */
export async function directoryAdoptionTrials(data, requestApi, responseApi) {
  const rows = [];
  const measure = async operation => {
    const counts = { digest: 0, importKey: 0, verify: 0 }, originals = {};
    for (const name of Object.keys(counts)) {
      originals[name] = crypto.subtle[name];
      crypto.subtle[name] = function(...args) { counts[name]++; return originals[name].apply(this, args); };
    }
    try { return { counts, result: await operation() }; }
    finally { for (const name of Object.keys(counts)) crypto.subtle[name] = originals[name]; }
  };
  for (const trial of data.cases) {
    let fetches = 0;
    const incoming = await measure(() => requestApi.verifyWebBotAuth(new Request(trial.request.url, { headers: trial.request.headers }), {
      now: new Date(trial.now), cache: requestApi.createWebBotAuthCache(), includeEvidence: true,
      fetcher: async url => {
        if (String(url) !== trial.context.requestUrl) throw Error('Snapshot URL mismatch');
        fetches++; return new Response(new Uint8Array(trial.context.body), { status: trial.context.status, headers: trial.context.headers });
      },
    }));
    const audit = await measure(() => responseApi.auditDirectoryResponse({ ...trial.context, body: new Uint8Array(trial.context.body) }, { now: new Date(trial.now) }));
    const verified = incoming.result.status === 'verified';
    rows.push({ name: trial.name, fetches, incoming, audit, hypothetical: {
      current: verified,
      requireAllAuthority: verified && audit.result.profiles.cloudflareDirectory03.allAdmittedKeysVerified === true,
      requireAllBodyBound: verified && audit.result.profiles.ietfProtocol01DomainBinding.allAdmittedKeysVerified === true,
    } });
  }
  return rows;
}

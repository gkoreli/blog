import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createWebBotAuthCache, ed25519JwkThumbprint, verifyWebBotAuth } from '../../../../analytics/.test-dist/webbotauth.js';
import { verificationEvidence } from '../../../../analytics/.test-dist/signature-evidence.js';
import { VERIFIER_PROFILE_VERSION } from '../../../../analytics/.test-dist/versions.js';

const [output, expectation] = process.argv.slice(2);
assert.ok(output && ['before', 'after'].includes(expectation));
// Public demonstration material, deliberately published with its signing value
// in RFC 9421 B.1.4 and RFC 8037 A.1. These are not production credentials.
const published = [
  { label: 'rfc9421', kty: 'OKP', crv: 'Ed25519', x: 'JrQLj5P_89iXES9-vFgrIy29clF9CC_oPPsw3c5D0bs', d: 'n4Ni-HpISpVObnQMW0wOhCKROaIKqKtW_2ZYb2p9KcU' },
  { label: 'rfc8037', kty: 'OKP', crv: 'Ed25519', x: '11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo', d: 'nWGxne_9WmC6hEr0kuwsxERJxWl7MmkZcDusAxyuf2A' },
];
const now = new Date('2026-10-27T20:00:00Z'), epoch = now.getTime() / 1000;
const fresh = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
const keys = [...published, { label: 'ephemeral-positive', ...await crypto.subtle.exportKey('jwk', fresh.privateKey) }];
const trials = [];
for (const key of keys) for (const padded of key.label === 'ephemeral-positive' ? [false] : [false, true]) {
  const publicJwk = { kty: key.kty, crv: key.crv, x: key.x + (padded ? '=' : '') };
  const kid = await ed25519JwkThumbprint(publicJwk);
  const privateKey = await crypto.subtle.importKey('jwk', { kty: key.kty, crv: key.crv, x: key.x, d: key.d }, 'Ed25519', false, ['sign']);
  const params = `("@authority" "@method" "@path" "signature-agent");created=${epoch};expires=${epoch + 60};keyid="${kid}";alg="ed25519";tag="web-bot-auth"`;
  const base = `"@authority": publication.example\n"@method": GET\n"@path": /article\n"signature-agent": "https://fixture.example"\n"@signature-params": ${params}`;
  const bytes = await crypto.subtle.sign('Ed25519', privateKey, new TextEncoder().encode(base));
  const rawKey = await crypto.subtle.importKey('jwk', publicJwk, 'Ed25519', false, ['verify']);
  assert.equal(await crypto.subtle.verify('Ed25519', rawKey, bytes, new TextEncoder().encode(base)), true);
  const request = new Request('https://publication.example/article', { headers: {
    'Signature-Agent': '"https://fixture.example"', 'Signature-Input': 'sig=' + params, Signature: `sig=:${Buffer.from(bytes).toString('base64')}:`,
  } });
  const cache = createWebBotAuthCache(); let fetches = 0;
  const result = await verifyWebBotAuth(request, { now, cache, includeEvidence: true, fetcher: async () => {
    fetches++;
    return Response.json({ keys: [publicJwk] }, { headers: { 'Content-Type': 'application/http-message-signatures-directory+json' } });
  } });
  const demo = key.label !== 'ephemeral-positive';
  assert.equal(result.status, expectation === 'after' && demo ? 'unverified' : 'verified');
  if (expectation === 'after' && demo) {
    assert.equal(result.reason, 'known-test-key'); assert.equal(cache.keys.size, 0);
    assert.equal(verificationEvidence(request, result).localOutcome, 'policy-rejected');
    assert.equal(fetches, padded ? 1 : 0);
  }
  trials.push({ label: key.label + (padded ? '-padded-x-alias' : ''), rawCryptoValid: true, localStatus: result.status, reason: result.reason ?? null, directoryFetches: fetches, importedKeys: cache.keys.size });
}
const files = ['webbotauth.ts', 'signature-evidence.ts', 'versions.ts', ...(expectation === 'after' ? ['known-test-keys.ts'] : [])];
writeFileSync(output, JSON.stringify({ checkedAt: new Date().toISOString(), runtime: process.version, expectation, verifierProfile: VERIFIER_PROFILE_VERSION,
  method: 'Independently assembled short-lived method/path-bound requests; published RFC demonstration signing values and one ephemeral positive. Raw native WebCrypto checks precede local policy. Every directory lookup intercepted; no network or production calls.',
  sources: ['https://www.rfc-editor.org/rfc/rfc9421.html#appendix-B.1.4', 'https://www.rfc-editor.org/rfc/rfc8037.html#appendix-A.1'],
  trials, sourceSha256: Object.fromEntries(files.map(file => [file, createHash('sha256').update(readFileSync(new URL('../../../../analytics/src/' + file, import.meta.url))).digest('hex')])),
  networkCalls: 0, productionCalls: 0, limits: ['Two reviewed public example keys; not an exhaustive weak-key detector, vendor impersonation or evidence of exploitation.', 'Padded JWK x is a compatibility acceptance probe, not a recommendation for JWK publishers.'],
}, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ expectation, trials, networkCalls: 0 }));

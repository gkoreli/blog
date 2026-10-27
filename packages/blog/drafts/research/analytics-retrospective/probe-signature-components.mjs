import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { verifyWebBotAuth, createWebBotAuthCache, buildSignatureBase, ed25519JwkThumbprint } from '../../../../analytics/.test-dist/webbotauth.js';
import { verificationEvidence } from '../../../../analytics/.test-dist/signature-evidence.js';
import { VERIFIER_PROFILE_VERSION } from '../../../../analytics/.test-dist/versions.js';

// Independent message assembly: signing with our own base builder would hide
// its acceptance of repeated identifiers (RFC 9421 section 2.5, step 2.1).
const [output, expectation] = process.argv.slice(2);
assert.ok(output && ['before', 'after'].includes(expectation), 'output and before/after are required');
const now = new Date('2026-10-27T18:00:00Z');
const epoch = now.getTime() / 1000;
const pair = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
const kid = await ed25519JwkThumbprint(jwk);
const values = { '"@authority"': 'publication.example', '"user-agent"': 'SyntheticClient/1.0', '"signature-agent";key="sig"': '"https://fixture.example";type=directory' };
const cases = [
  ['unique-components', ['"@authority"', '"user-agent"', '"signature-agent";key="sig"']],
  ['repeated-authority', ['"@authority"', '"@authority"', '"signature-agent";key="sig"']],
  ['repeated-header', ['"@authority"', '"user-agent"', '"user-agent"', '"signature-agent";key="sig"']],
  ['repeated-dictionary-member', ['"@authority"', '"signature-agent";key="sig"', '"signature-agent";key="sig"']],
];
const trials = [];
for (const [label, components] of cases) {
  const params = `(${components.join(' ')});created=${epoch};expires=${epoch + 300};keyid="${kid}";alg="ed25519";tag="web-bot-auth"`;
  const base = [...components.map(component => `${component}: ${values[component]}`), `"@signature-params": ${params}`].join('\n');
  const signature = Buffer.from(await crypto.subtle.sign('Ed25519', pair.privateKey, new TextEncoder().encode(base))).toString('base64');
  const request = new Request('https://publication.example/article', { headers: {
    'User-Agent': 'SyntheticClient/1.0', 'Signature-Agent': 'sig="https://fixture.example";type=directory',
    'Signature-Input': `sig=${params}`, Signature: `sig=:${signature}:`,
  } });
  let directoryFetches = 0;
  const result = await verifyWebBotAuth(request, { now, includeEvidence: true, cache: createWebBotAuthCache(), fetcher: async () => {
    directoryFetches++;
    return Response.json({ keys: [jwk] }, { headers: { 'Content-Type': 'application/http-message-signatures-directory+json' } });
  } });
  const duplicate = label !== 'unique-components';
  assert.equal(result.status, expectation === 'before' || !duplicate ? 'verified' : 'unverified');
  if (expectation === 'after' && duplicate) {
    assert.equal(result.reason, 'duplicate-component');
    assert.equal(buildSignatureBase(request, 'sig'), null);
    assert.equal(directoryFetches, 0);
    assert.equal(verificationEvidence(request, result).localOutcome, 'invalid');
  }
  trials.push({ label, status: result.status, reason: result.reason ?? null, directoryFetches, outcome: verificationEvidence(request, result).localOutcome });
}
const files = ['webbotauth.ts', 'signature-evidence.ts', 'versions.ts'];
writeFileSync(output, JSON.stringify({ checkedAt: new Date().toISOString(), runtime: process.version, expectation, verifierProfile: VERIFIER_PROFILE_VERSION,
  method: 'Independently assembled signature bases, ephemeral Ed25519 key and in-process directory; no vendor identity or native-edge acceptance claim',
  sourceSha256: Object.fromEntries(files.map(file => [file, createHash('sha256').update(readFileSync(new URL('../../../../analytics/src/' + file, import.meta.url))).digest('hex')])),
  trials, networkCalls: 0, productionCalls: 0,
}, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ expectation, trials, networkCalls: 0, productionCalls: 0 }));

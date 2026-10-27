import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { createWebBotAuthCache, ed25519JwkThumbprint, verifyWebBotAuth } from '../../../../analytics/.test-dist/webbotauth.js';
import { verificationEvidence } from '../../../../analytics/.test-dist/signature-evidence.js';
import { VERIFIER_PROFILE_VERSION } from '../../../../analytics/.test-dist/versions.js';

const [output, expectation] = process.argv.slice(2);
assert.ok(output && ['before', 'after'].includes(expectation));
const now = new Date('2026-10-27T19:00:00Z'), epoch = now.getTime() / 1000;
const pair = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
const kid = await ed25519JwkThumbprint(jwk);
const targets = [
  ['public-dns', 'https://fixture.example', false],
  ['localhost', 'https://localhost', true],
  ['localhost-subdomain-dot', 'https://service.localhost.', true],
  ['private-ipv4', 'https://10.0.0.1', true],
  ['loopback-integer', 'https://2130706433', true],
  ['loopback-hex', 'https://0x7f000001', true],
  ['loopback-octal', 'https://0177.0.0.1', true],
  ['link-local', 'https://169.254.169.254', true],
  ['ipv6-loopback', 'https://[::1]', true],
  ['ipv6-mapped', 'https://[::ffff:127.0.0.1]', true],
  ['public-ip-literal', 'https://1.1.1.1', true],
  ['nondefault-port', 'https://fixture.example:8443', true],
  ['single-label', 'https://intranet', true],
  ['local-name', 'https://service.local', true],
  ['internal-name', 'https://service.internal', true],
  ['home-arpa', 'https://service.home.arpa', true],
];
const trials = [];
for (const [label, target, rejected] of targets) {
  const agent = JSON.stringify(target);
  const params = `("@authority" "signature-agent");created=${epoch};expires=${epoch + 300};keyid="${kid}";alg="ed25519";tag="web-bot-auth"`;
  // Independent assembly: no call to the implementation's signature-base builder.
  const base = `"@authority": publication.example\n"signature-agent": ${agent}\n"@signature-params": ${params}`;
  const signature = Buffer.from(await crypto.subtle.sign('Ed25519', pair.privateKey, new TextEncoder().encode(base))).toString('base64');
  let directoryFetches = 0;
  const result = await verifyWebBotAuth(new Request('https://publication.example/article', { headers: {
    'Signature-Agent': agent, 'Signature-Input': `sig=${params}`, Signature: `sig=:${signature}:`,
  } }), { now, includeEvidence: true, cache: createWebBotAuthCache(), fetcher: async () => {
    directoryFetches++;
    return Response.json({ keys: [jwk] }, { headers: { 'Content-Type': 'application/http-message-signatures-directory+json' } });
  } });
  assert.equal(result.status, expectation === 'after' && rejected ? 'unverified' : 'verified');
  if (expectation === 'after' && rejected) {
    assert.equal(result.reason, 'discovery-policy-rejected');
    assert.equal(directoryFetches, 0);
    assert.equal(verificationEvidence(new Request('https://publication.example'), result).localOutcome, 'policy-rejected');
  } else assert.equal(directoryFetches, 1);
  trials.push({ label, status: result.status, reason: result.reason ?? null, directoryFetches });
}
const files = ['webbotauth.ts', 'signature-evidence.ts', 'versions.ts', ...(expectation === 'after' ? ['directory-discovery.ts'] : [])];
writeFileSync(output, JSON.stringify({ checkedAt: new Date().toISOString(), runtime: process.version, expectation, verifierProfile: VERIFIER_PROFILE_VERSION,
  method: 'Independent synthetic signing with ephemeral keys; every directory fetch intercepted in process. No connection to any listed target.',
  trials, sourceSha256: Object.fromEntries(files.map(file => [file, createHash('sha256').update(readFileSync(new URL('../../../../analytics/src/' + file, import.meta.url))).digest('hex')])),
  networkCalls: 0, productionCalls: 0, limits: ['This tests URL admission, not DNS resolution, rebinding, network egress or vendor/native verification.'],
}, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ expectation, trials: trials.length, verified: trials.filter(t => t.status === 'verified').length, directoryFetches: trials.reduce((n, t) => n + t.directoryFetches, 0), networkCalls: 0 }));

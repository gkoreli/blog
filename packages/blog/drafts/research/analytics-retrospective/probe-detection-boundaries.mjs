import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { classifyTraffic } from '../../../../analytics/.test-dist/classify.js';
import { classifyReaderKind } from '../../../../analytics/.test-dist/readerkind.js';
import { extractRequestMetadata } from '../../../../analytics/.test-dist/metadata.js';
import { buildSignatureBase, createWebBotAuthCache, ed25519JwkThumbprint, verifyWebBotAuth } from '../../../../analytics/.test-dist/webbotauth.js';
import { CLASSIFIER_VERSION } from '../../../../analytics/.test-dist/versions.js';

// Compile the analytics package through its test command before running this
// local counterexample probe. No real reader request, address or vendor key.
const shape = {
  'user-agent': 'Mozilla/5.0 Chrome/156.0.0.0 Safari/537.36',
  accept: 'text/html', 'accept-language': 'en',
  'sec-fetch-mode': 'navigate', 'sec-fetch-dest': 'document',
  'sec-fetch-site': 'none', 'sec-fetch-user': '?1',
};
function evaluate(headers = {}, asn = null, signature = { status: 'absent' }) {
  const requestHeaders = new Headers(shape);
  for (const [name, value] of Object.entries(headers)) {
    if (value === null) requestHeaders.delete(name);
    else requestHeaders.set(name, value);
  }
  const request = new Request('https://publication.example/article', { headers: requestHeaders });
  Object.defineProperty(request, 'cf', { value: { asn } });
  const metadata = extractRequestMetadata(request);
  const declared = classifyTraffic(metadata.userAgent);
  return { declared, result: classifyReaderKind({ ...declared, observationSource: 'edge', asn: metadata.asn,
    secFetchMode: metadata.secFetchMode, secFetchDest: metadata.secFetchDest, secFetchSite: metadata.secFetchSite,
    secFetchUser: metadata.secFetchUser, acceptsHtml: metadata.acceptsHtml, hasAcceptLanguage: metadata.hasAcceptLanguage,
    signature, userAgent: metadata.userAgent }) };
}
const cases = [
  { name: 'network-missing', changed: 'No ASN available', ...evaluate() },
  { name: 'network-unlisted', changed: 'Private-use fixture ASN 64512', ...evaluate({}, 64512) },
  { name: 'network-listed', changed: 'Listed hosting ASN 16509', ...evaluate({}, 16509) },
  { name: 'activation-absent', changed: 'Sec-Fetch-User omitted', ...evaluate({ 'sec-fetch-user': null }, 64512) },
  { name: 'contradictory-referral', changed: 'External referrer with same-origin metadata', ...evaluate({ referer: 'https://referrer.example/', 'sec-fetch-site': 'same-origin' }, 64512) },
  { name: 'substring-name', changed: 'UA is NotChatGPT-Userish/1.0', ...evaluate({ 'user-agent': 'NotChatGPT-Userish/1.0' }, 64512) },
  { name: 'conflicting-role-tokens', changed: 'UA is GPTBot/1.0 ChatGPT-User/1.0', ...evaluate({ 'user-agent': 'GPTBot/1.0 ChatGPT-User/1.0' }, 64512) },
  { name: 'bounded-exa-lookalike', changed: 'UA is NotExaUserish/1.0', ...evaluate({ 'user-agent': 'NotExaUserish/1.0' }, 64512) },
];
assert.deepEqual(cases[0].result, cases[1].result);
assert.equal(cases[2].result.kind, 'cloud-browser');
assert.equal(cases[3].result.kind, 'browser');
assert.equal(cases[4].result.kind, 'browser');
assert.equal(cases[5].declared.agentName, 'ChatGPT-User');
assert.equal(cases[6].result.kind, 'ai-assistant');
assert.equal(cases[7].declared.agentName, null);

const now = new Date('2026-10-26T17:00:00Z');
const created = Math.floor(now.getTime() / 1000);
const pair = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
const publicKey = await crypto.subtle.exportKey('jwk', pair.publicKey);
const keyid = await ed25519JwkThumbprint(publicKey);
const signatureInput = `sig=("@authority" "signature-agent";key="sig");created=${created};expires=${created + 300};keyid="${keyid}";alg="ed25519";tag="web-bot-auth"`;
const signatureHeaders = { 'signature-agent': 'sig="https://agent.example";type=directory', 'signature-input': signatureInput, signature: `sig=:${Buffer.alloc(64).toString('base64')}:` };
const original = new Request('https://publication.example/article-a', { headers: { ...shape, ...signatureHeaders, 'user-agent': 'ExaSearchBot/1.0' } });
const base = buildSignatureBase(original, 'sig');
assert.equal(typeof base, 'string');
const signature = Buffer.from(await crypto.subtle.sign('Ed25519', pair.privateKey, new TextEncoder().encode(base))).toString('base64');
signatureHeaders.signature = `sig=:${signature}:`;
let directoryRequests = 0;
const variants = [
  { name: 'original', url: 'https://publication.example/article-a', userAgent: 'ExaSearchBot/1.0' },
  { name: 'unsigned-ua-changed', url: 'https://publication.example/article-a', userAgent: 'ExaUser/1.0' },
  { name: 'unsigned-path-changed', url: 'https://publication.example/article-b', userAgent: 'ExaSearchBot/1.0' },
  { name: 'covered-authority-changed', url: 'https://other.example/article-a', userAgent: 'ExaSearchBot/1.0' },
];
const signatureResults = [];
for (const variant of variants) {
  const request = new Request(variant.url, { headers: { ...shape, ...signatureHeaders, 'user-agent': variant.userAgent } });
  const result = await verifyWebBotAuth(request, { now, cache: createWebBotAuthCache(), async fetcher() {
    directoryRequests++;
    return new Response(JSON.stringify({ keys: [{ ...publicKey, kid: keyid, use: 'sig' }] }), { headers: { 'Content-Type': 'application/http-message-signatures-directory+json' } });
  } });
  assert.equal(result.status, variant.name === 'covered-authority-changed' ? 'unverified' : 'verified');
  signatureResults.push({ name: variant.name, verification: result, declaredRole: evaluate({ 'user-agent': variant.userAgent }, 64512, result).result.kind });
}
assert.equal(signatureResults[0].declaredRole, 'ai-search');
assert.equal(signatureResults[1].declaredRole, 'ai-assistant');
const sha = relative => createHash('sha256').update(readFileSync(fileURLToPath(new URL(relative, import.meta.url)))).digest('hex');
const report = {
  checkedAt: new Date().toISOString(), sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  runtime: process.version, classifierVersion: CLASSIFIER_VERSION, productionCalls: 0, networkCalls: 0,
  sourceSha256: { classifier: sha('../../../../analytics/src/classify.ts'), readerKind: sha('../../../../analytics/src/readerkind.ts'), verifier: sha('../../../../analytics/src/webbotauth.ts'), probe: sha('./probe-detection-boundaries.mjs') },
  ruleCases: cases, signatureCases: signatureResults, injectedDirectoryCalls: directoryRequests,
  signatureProfile: 'Ephemeral local Ed25519 key; only authority and Signature-Agent covered; fixed clock; injected directory responses.',
  syntheticVerificationFixture: { now: now.toISOString(), url: original.url, headers: signatureHeaders, publicKey: { ...publicKey, kid: keyid, use: 'sig' } },
  limits: ['Counterexamples and sensitivity tests, not production prevalence or measured human/bot error rates.', 'All names, inputs, keys and request origins are synthetic; no vendor signature, infrastructure verification or impersonation is performed.', 'Changing an unsigned component is expected signature behavior, not a cryptographic break or a claim of verifier nonconformance.', 'Unlisted ASN is not proof of residential access, missing ASN is not measured network evidence, and role declarations can conflict.'],
};
if (!process.argv[2]) throw new Error('Provide a new output JSON path');
writeFileSync(process.argv[2], JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ ruleCases: cases.length, signatureCases: signatureResults.length, signatureResults, productionCalls: 0 }));

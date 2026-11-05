import assert from 'node:assert/strict';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { publicSignerName, SIGNER_DISPLAY_PROFILE } from '../.test-dist/signers.js';
import { verificationEvidence } from '../.test-dist/signature-evidence.js';
import { storedObservationReceipt } from '../.test-dist/observation-receipt.js';
import { analyzeTraffic } from '../.test-dist/classify.js';
import { classificationEvidence } from '../.test-dist/classification-evidence.js';
import { classifyReaderKind } from '../.test-dist/readerkind.js';
import { extractRequestMetadata } from '../.test-dist/metadata.js';
import { verifyVendorIp, createVendorIpCache } from '../.test-dist/vendor-ip.js';
import { vendorNetworkStateSql } from '../.test-dist/vendor-network-summary.js';
import { assessStoredNetworkAssignment } from '../.test-dist/vendor-declaration-assessment.js';
import { HOSTING_NETWORKS_20260904, networkEvidence } from '../.test-dist/networks.js';
import { CLASSIFIER_VERSION } from '../.test-dist/versions.js';

// Synthetic regressions for documented methods, never a provider-traffic claim.
function facts(ua, asn = 13335, signature = { status: 'absent' }) {
  const request = new Request('https://publication.example/article', { headers: {
    'User-Agent': ua, 'Sec-Fetch-Mode': 'navigate', 'Sec-Fetch-Dest': 'document',
    Accept: 'text/html', 'Accept-Language': 'en', 'CF-Connecting-IP': '66.249.66.1',
  } });
  Object.defineProperty(request, 'cf', { value: { asn } });
  const m = extractRequestMetadata(request), a = analyzeTraffic(ua);
  return { request, ...m, ...a, observationSource: 'edge', signature };
}
function observation(origin) {
  const f = facts('curl/8.5.0', 13335, { status: 'verified', agent: origin });
  return { readerKind: classifyReaderKind(f).kind, signatureStatus: 'verified', signatureAgent: origin,
    classificationEvidence: classificationEvidence(f, f.declarations),
    signatureEvidence: verificationEvidence(f.request, f.signature) };
}

test('new exact publisher names preserve every earlier display catalogue without granting trust', () => {
  for (const origin of ['https://chatgpt.com', 'https://exauser.crawler.exa.ai']) {
    assert.equal(publicSignerName(origin, '2026-10-27.1'), 'Other');
    assert.equal(publicSignerName(origin, '2026-10-28.1'), 'Other');
  }
  assert.equal(publicSignerName('https://chatgpt.com'), 'ChatGPT');
  assert.equal(publicSignerName('https://exauser.crawler.exa.ai'), 'Exa');
  assert.equal(publicSignerName('https://agent.bot.goog', '2026-10-27.1'), 'Other');
  assert.equal(publicSignerName('https://agent.bot.goog', '2026-10-28.1'), 'Google');
  for (const origin of ['https://chatgpt.com.evil.example', 'https://chatgpt.com/path', 'http://chatgpt.com']) assert.equal(publicSignerName(origin), 'Other');
  const unsigned = observation('https://chatgpt.com');
  unsigned.signatureStatus = null; unsigned.signatureEvidence = verificationEvidence(facts('curl/8.5.0').request, { status: 'absent' });
  assert.equal(storedObservationReceipt(unsigned).signature.signer, 'none');
});

test('verified receipt display is retained; legacy replay has a frozen or explicit external basis', () => {
  const row = observation('https://chatgpt.com');
  assert.equal(row.readerKind, 'signed-agent');
  assert.equal(row.signatureEvidence.signerDisplayProfile, SIGNER_DISPLAY_PROFILE);
  const before = storedObservationReceipt(row);
  assert.equal(before.signature.signer, 'ChatGPT');
  assert.equal(before.signature.signerDisplayProfile, SIGNER_DISPLAY_PROFILE);
  const roundTrip = JSON.parse(JSON.stringify(row));
  assert.deepEqual(storedObservationReceipt(roundTrip), before);
  assert.throws(() => storedObservationReceipt(roundTrip, '2026-10-28.1'), /Conflicting/);
  delete roundTrip.signatureEvidence.signerDisplayProfile;
  assert.equal(storedObservationReceipt(roundTrip).signature.signer, 'Other');
  assert.equal(storedObservationReceipt(roundTrip).signature.signerDisplayProfile, '2026-10-28.1');
  assert.equal(storedObservationReceipt(roundTrip, '2026-10-27.1').signature.signerDisplayProfile, '2026-10-27.1');
  for (const invalid of ['future', null, 1]) {
    roundTrip.signatureEvidence.signerDisplayProfile = invalid;
    assert.throws(() => storedObservationReceipt(roundTrip), /Unrecognized/);
  }
});

test('Claude hosted-browser token is a declared role; Google and mixed networks do not acquire provider identity', () => {
  const declared = facts('Mozilla/5.0 (compatible; Claude-Agent/1.0) Chrome/154.0 Safari/537.36');
  assert.deepEqual(declared.declarations.candidates, ['Claude-Agent']);
  assert.equal(classifyReaderKind(declared).kind, 'ai-assistant');
  assert.equal(classifyReaderKind(facts('Claude-AgentExtra/1.0')).kind, 'unresolved');
  assert.deepEqual(facts('Google', 15169).declarations.candidates, []);
  assert.equal(classifyReaderKind(facts('Google', 15169)).kind, 'unresolved');
  for (const asn of [15169, 13335, 9009, 212238, 3257, 6939]) assert.equal(networkEvidence(asn), 'not-listed');
  assert.equal(HOSTING_NETWORKS_20260904.some(n => n.asn === 7979), false);
  assert.equal(networkEvidence(7979), 'hosting-listed');
  assert.equal(classifyReaderKind(facts('Mozilla/5.0 Chrome/143.0 Safari/537.36', 7979)).kind, 'cloud-browser');
});

test('Anthropic classic robots share one bounded method; hosted browsers and old profiles cannot inherit it', async t => {
  const db = new DatabaseSync(':memory:'); t.after(() => db.close());
  const names = ['ClaudeBot', 'Claude-User', 'Claude-SearchBot'];
  const r = facts(names.join(' ')); let calls = 0;
  const e = await verifyVendorIp(r.request, names, { cache: createVendorIpCache(), fetcher: async (url, init) => {
    calls++; assert.equal(url, 'https://claude.com/crawling/bots.json'); assert.equal(init.redirect, 'manual');
    assert.equal(init.headers.has('CF-Connecting-IP'), false);
    return Response.json({ prefixes: [{ ipv4Prefix: '66.249.66.0/24' }] });
  } });
  assert.equal(calls, 1); assert.equal(e.configuredDeclarationCount, 3); assert.equal(e.checks.length, 1);
  assert.equal(e.checks[0].outcome, 'listed');
  const state = value => db.prepare(`SELECT ${vendorNetworkStateSql()} AS state FROM (SELECT ? AS vendor_ip_evidence)`).get(JSON.stringify(value)).state;
  assert.equal(state(e), 'recognized');
  const c = classificationEvidence(r, r.declarations);
  assert.equal(assessStoredNetworkAssignment({ classificationJson: JSON.stringify(c), networkJson: JSON.stringify(e), storedClassifier: CLASSIFIER_VERSION,
    classificationJsonState: 'parsed', networkJsonState: 'parsed' }).state, 'consistent');
  assert.equal(state({ ...e, profile: '2026-10-31.2' }), 'unrecognized');
  const hosted = await verifyVendorIp(r.request, ['Claude-Agent'], { cache: createVendorIpCache(), fetcher: async () => assert.fail('Separate SAIL method is not implemented') });
  assert.equal(hosted.unmappedDeclarationCount, 1); assert.deepEqual(hosted.checks, []);
  const failed = await verifyVendorIp(r.request, ['Claude-User'], { cache: createVendorIpCache(), fetcher: async () => new Response(null, { status: 503 }) });
  assert.equal(failed.checks[0].outcome, 'unavailable'); assert.equal(state(failed), 'recognized');
});

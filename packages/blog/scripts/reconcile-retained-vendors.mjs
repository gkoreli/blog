import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { reconcileInvocations } from '../drafts/research/analytics-retrospective/reconcile-organic-exa.mjs';
import { analyzeTraffic } from '../../analytics/.test-dist/classify.js';
import { verifyWebBotAuth, createWebBotAuthCache } from '../../analytics/.test-dist/webbotauth.js';
import { nativeCategoryEvidence } from '../../analytics/.test-dist/native-bot-evidence.js';
import { VERIFIER_PROFILE_VERSION } from '../../analytics/.test-dist/versions.js';
import { directoryPublicationEvidence } from '../../analytics/.test-dist/directory-publication.js';

const vendors = {
  Exa: { origin: 'https://crawler.exa.ai', names: ['ExaSearchBot','ExaUser'] },
  Ahrefs: { origin: 'https://ahrefs.com', names: ['AhrefsBot','AhrefsSiteAudit'] },
};
const increment = (counts, key) => { counts[key] = (counts[key] ?? 0) + 1; };
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const booleanState = value => typeof value === 'boolean' ? String(value) : 'unavailable';

/** No network or database calls. The caller supplies captured invocation chains and later keys. */
export async function reconcileVendor(name, bytes, directory) {
  assert.ok(Object.hasOwn(vendors, name));
  const vendor = vendors[name], rows = JSON.parse(bytes.toString());
  const { integrity, reconciliations } = reconcileInvocations(rows, new Set(vendor.names));
  const counts = { replayStatus: {}, declarations: {}, nativeCategory: {}, nativeVerifiedBot: {}, nativeSignedAgent: {}, coveredComponents: {}, collections: {} };
  let pairs = 0, scalarReceipts = 0, replayReceiptAgreements = 0;
  for (const item of reconciliations) {
    const data = item.row.$workers.event.request, at = new Date(item.row.timestamp);
    assert.ok(Number.isFinite(at.getTime()));
    const request = new Request(data.url, { method: data.method, headers: new Headers(data.headers) });
    const declaration = analyzeTraffic(request.headers.get('User-Agent') ?? '').declarations;
    for (const candidate of declaration.candidates) increment(counts.declarations, candidate);
    const result = await verifyWebBotAuth(request, { now: at, includeEvidence: true, maxAgeSeconds: 86400,
      cache: createWebBotAuthCache(), fetcher: async url => {
        assert.equal(String(url), `${vendor.origin}/.well-known/http-message-signatures-directory`);
        return new Response(directory, { headers: { 'Content-Type': 'application/http-message-signatures-directory+json', 'Cache-Control': 'max-age=300' } });
      } });
    increment(counts.replayStatus, result.status);
    if (result.status === 'verified') {
      assert.equal(result.agent, vendor.origin);
      for (const [component, covered] of Object.entries(result.evidence.covered)) if (covered) increment(counts.coveredComponents, component);
    }
    const category = nativeCategoryEvidence(data.cf);
    increment(counts.nativeCategory, category.value ?? category.status);
    increment(counts.nativeVerifiedBot, booleanState(data.cf?.botManagement?.verifiedBot));
    increment(counts.nativeSignedAgent, booleanState(data.cf?.botManagement?.signedAgent));
    increment(counts.collections, /^2026-\d{2}-\d{2}\.\d{1,4}$/.test(item.collectionVersion ?? '') ? item.collectionVersion : 'no-complete-pair');
    if (item.complete) pairs++;
    if (item.complete && ['2026-10-27.2','2026-10-27.3'].includes(item.receipt?.version)) {
      const receipt = item.receipt;
      scalarReceipts++;
      assert.equal(result.status, 'verified');
      assert.equal(receipt.signature.source, 'local-webbotauth');
      assert.equal(receipt.signature.outcome, result.status);
      assert.equal(receipt.signature.signer, name);
      assert.equal(receipt.signature.verifierProfile, VERIFIER_PROFILE_VERSION);
      assert.equal(receipt.signature.documentedVendorStatus, 'matching-origin');
      assert.equal(receipt.signature.userAgentCovered, String(result.evidence.covered.userAgent));
      for (const [component, covered] of Object.entries(result.evidence.covered)) assert.equal(receipt.signature.coverage[component], covered);
      assert.equal(receipt.declarations.candidateCount, declaration.candidates.length);
      assert.equal(receipt.declarations.candidateNames, declaration.candidates.toSorted().join(','));
      assert.equal(receipt.native.categoryStatus, category.status);
      assert.equal(receipt.native.categoryValue, category.value ?? 'none');
      assert.equal(receipt.native.verifiedBot, booleanState(data.cf?.botManagement?.verifiedBot));
      assert.equal(receipt.native.signedAgent, booleanState(data.cf?.botManagement?.signedAgent));
      if (receipt.version === '2026-10-27.3') assert.deepEqual(receipt.directoryPublication,
        directoryPublicationEvidence(declaration.candidates, result));
      replayReceiptAgreements++;
    }
  }
  return { vendor: name, input: { records: rows.length, bytes: bytes.length, sha256: digest(bytes) }, integrity,
    selectedInvocations: reconciliations.length, completeAttemptStoredPairs: pairs, scalarReceipts, replayReceiptAgreements, counts,
    directory: { url: `${vendor.origin}/.well-known/http-message-signatures-directory`, bytes: directory.length, sha256: digest(directory) }, exactD1Joins: 0 };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [exaInput, exaKeys, ahrefsInput, ahrefsKeys, output] = process.argv.slice(2);
  assert.ok([exaInput, exaKeys, ahrefsInput, ahrefsKeys, output].every(Boolean));
  const results = [await reconcileVendor('Exa', readFileSync(exaInput), readFileSync(exaKeys)),
    await reconcileVendor('Ahrefs', readFileSync(ahrefsInput), readFileSync(ahrefsKeys))];
  writeFileSync(output, JSON.stringify({ checkedAt: new Date().toISOString(), method: 'Offline retained requestId/operationId chain reconciliation, recorded-time Ed25519 replay and scalar-receipt comparisons.',
    verifierProfile: VERIFIER_PROFILE_VERSION, results, networkCalls: 0, databaseCalls: 0,
    limits: ['Later captured HTTPS keys do not prove the keys originally served at request time.',
      'Uncovered User-Agent and path remain unauthenticated; replay does not establish purpose, operator intent or a human trigger.',
      'Provider categories are independent catalog evidence, not native cryptographic verdicts. Missing booleans remain unavailable.',
      'No retained historical chain supplies an exact D1 row reference. Time/path agreement establishes a cohort only.',
      'Assets and robots requests need not have eligible page-observation logs. Missing logs alone do not establish collection loss.',
      'Record counts are scoped exports, not complete retention or unique HTTP-delivery counts. Raw inputs remain private.'] }, null, 2)+'\n', { flag: 'wx' });
  console.log(JSON.stringify(results.map(r => ({ vendor: r.vendor, invocations: r.selectedInvocations, pairs: r.completeAttemptStoredPairs, replay: r.counts.replayStatus, scalarReceiptAgreements: r.replayReceiptAgreements }))));
}

import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { analyzeOrganicExact } from './analyze-organic-exact.mjs';
import { reconcileInvocations } from './reconcile-organic-exa.mjs';
import { auditWebBotAuth } from '../../../../analytics/.test-dist/webbotauth-audit.js';

const [candidateFile, chainFile, receiptFile, directoryFile, captureFile, output] = process.argv.slice(2); assert.ok(output);
const bytes = [candidateFile, chainFile, receiptFile, directoryFile, captureFile].map(file => readFileSync(file));
const [candidateResponse, chains, receipts] = bytes.slice(0, 3).map(value => JSON.parse(value));
assert.ok(Array.isArray(candidateResponse) && candidateResponse.length === 1 && candidateResponse[0].success === true && Array.isArray(candidateResponse[0].results), 'Expected the accepted single-statement Wrangler response');
const candidates = candidateResponse[0].results;
const capture = JSON.parse(bytes[4]), directoryBytes = bytes[3];
// Reuse the original exact-reference, source-copy and directory commitments;
// never replace those identity gates with timestamp/path similarity.
const exact = await analyzeOrganicExact(candidates, chains, receipts, directoryBytes, capture);
const joined = reconcileInvocations(chains), rows = [];
for (const item of joined.reconciliations) {
  assert.equal(item.complete, true); const raw = item.row.$workers.event.request;
  const assessment = await auditWebBotAuth(new Request(raw.url, { method: raw.method, headers: raw.headers }), {
    now: new Date(item.row.timestamp), fetcher: async url => {
      assert.equal(String(url), capture.source);
      return new Response(directoryBytes, { status: capture.responseStatus, headers: capture.responseHeaders });
    },
  });
  assert.ok(assessment.verifiedCandidates >= 1); rows.push(assessment);
}
const result = { checkedAt: new Date().toISOString(), method: 'Repeat the supplied exact chain/storage and directory commitment gates, then audit eligible proofs at retained invocation timestamps. The audit performs no production request, D1 execution or fresh key capture.',
  storedCollections: exact.counts.collections, storedVerifierProfiles: exact.counts.storedVerifierProfiles,
  currentReplayVerifier: exact.replayVerifierProfile, exactChains: exact.exactNativeChains,
  originalFirstValidReplaysVerified: exact.replayVerified, directoryCapture: exact.directoryCapture,
  assessments: rows, inputSha256: bytes.map(value => createHash('sha256').update(value).digest('hex')),
  productionRequests: 0, d1Statements: 0, externalReplayRequests: 0,
  limits: ['Later captured keys do not reconstruct the directory at request time.', 'Audit replay is separate from the supplied stored-profile evidence; it does not itself perform a current production write.', 'Complete scoped proof assessment is not a person, action, role, purpose, native-provider or authorization verdict.'] };
writeFileSync(output, JSON.stringify(result, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
console.log(JSON.stringify({ exactChains: result.exactChains, completeAudits: rows.filter(row => row.assessment === 'complete').length, verifiedCandidates: rows.reduce((sum, row) => sum + row.verifiedCandidates, 0), externalRequests: 0 }));

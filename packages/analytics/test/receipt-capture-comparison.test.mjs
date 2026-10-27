import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTailRecords, compareReceiptCopies } from '../../blog/drafts/research/analytics-retrospective/compare-receipt-captures.mjs';

function fixture(overrides = {}) {
  const v2 = overrides.version === '2026-10-27.2';
  const receipt = { version: v2 ? '2026-10-27.2' : '2026-10-27.1', classifierProfile: '2026-10-27.5', readerKind: 'other-bot',
    declarations: { status: 'none', categoryAgreement: 'no-match', ...v2 ? { candidateCount: 0, candidateNames: 'none' } : { candidates: [] } },
    signature: { evidenceVersion: '2026-10-27.4', source: 'local-webbotauth', verifierProfile: '2026-10-27.6', status: 'absent', outcome: 'absent',
      reason: v2 ? 'none' : null, ...v2 ? { reasonCount: 0, reasonNames: 'none' } : { reasons: [] }, signer: v2 ? 'none' : null, documentedVendorStatus: 'no-declaration',
      userAgentCovered: v2 ? 'unavailable' : null, coverage: v2 ? { status: 'unavailable' } : null },
    native: { verifiedBot: v2 ? 'unavailable' : null, signedAgent: v2 ? 'unavailable' : null, categoryStatus: 'empty', categoryValue: v2 ? 'none' : null } };
  const fields = { operationId: 'private-operation@example.invalid', collectionVersion: '2026-10-27.8', receipt };
  return { live: [{ logs: [{ message: ['analytics.observation_stored', fields], timestamp: 1700000000000 }] }],
    retained: [{ timestamp: '2023-11-14T22:13:20.000Z', source: { message: 'analytics.observation_stored', ...structuredClone(fields) } }] };
}
test('detects omitted nulls and empty arrays without exposing raw values or identifiers', () => {
  const { live, retained } = fixture(); delete retained[0].source.receipt.native.signedAgent; delete retained[0].source.receipt.declarations.candidates;
  const result = compareReceiptCopies(live, retained);
  assert.equal(result.matchedPairs, 1); assert.equal(result.differingPairs, 1); assert.equal(result.omittedNulls, 1); assert.equal(result.omittedEmptyArrays, 1);
  assert.equal(JSON.stringify(result).includes('example.invalid'), false);
});
test('scalar unknowns and zero counts survive; missing scalar evidence still fails equality', () => {
  const { live, retained } = fixture({ version: '2026-10-27.2' });
  assert.equal(compareReceiptCopies(live, retained).identicalPairs, 1);
  delete retained[0].source.receipt.declarations.candidateCount;
  const result = compareReceiptCopies(live, retained); assert.equal(result.identicalPairs, 0); assert.equal(result.omittedOther, 1);
});
test('same-time candidates, duplicate operations, mismatched profiles and unknown versions cannot match', () => {
  for (const mutate of [
    x => { x.retained[0].source.operationId = 'different'; },
    x => { x.retained.push(structuredClone(x.retained[0])); },
    x => { x.retained[0].source.collectionVersion = 'different'; },
    x => { x.retained[0].timestamp = '2023-11-14T22:13:21.000Z'; },
    x => { x.live[0].logs[0].message[1].receipt.version = 'future'; x.retained[0].source.receipt.version = 'future'; },
    x => { delete x.retained[0].source.operationId; },
    x => { delete x.live[0].logs[0].message[1].receipt.signature.source; delete x.retained[0].source.receipt.signature.source; },
  ]) { const f = fixture(); mutate(f); assert.equal(compareReceiptCopies(f.live, f.retained).matchedPairs, 0); }
});
test('tail parser accepts complete JSON sequences and rejects partial/prefixed data', () => {
  const values = [{ logs: [{ message: ['braces } and \\" are text'] }] }, { logs: [] }];
  assert.deepEqual(parseTailRecords(values.map(x => JSON.stringify(x, null, 2)).join('\n')), values);
  assert.throws(() => parseTailRecords('{"logs":[')); assert.throws(() => parseTailRecords('Connected\n{}'));
});

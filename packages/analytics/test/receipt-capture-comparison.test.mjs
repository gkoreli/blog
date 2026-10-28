import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTailRecords, compareReceiptCopies, normalizeRetainedReceiptCopies } from '../../blog/drafts/research/analytics-retrospective/compare-receipt-captures.mjs';

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

test('v3 publication facts and separate private storage references are compared without disclosure', () => {
  const value = fixture({ version: '2026-10-27.2' });
  for (const fields of [value.live[0].logs[0].message[1], value.retained[0].source]) {
    fields.receipt.version = '2026-10-27.3';
    fields.receipt.directoryPublication = { profile:'2026-10-27.1',method:'reviewed-first-party-directory',reviewedOn:'2026-10-27',configuredDeclarationCount:0,unmappedDeclarationCount:0,status:'no-declaration' };
    fields.storage = { version:'2026-10-27.1',status:'returned',observationId:'9007199254740995' };
  }
  assert.equal(compareReceiptCopies(value.live,value.retained).identicalPairs,1);
  value.retained[0].source.storage.observationId='9007199254740996';
  delete value.retained[0].source.receipt.directoryPublication.status;
  const result=compareReceiptCopies(value.live,value.retained);
  assert.equal(result.differingPairs,1);assert.equal(result.changedFields['storage.observationId'],1);
  assert.equal(result.missingFields['directoryPublication.status'],1);
  assert.equal(JSON.stringify(result).includes('900719925474099'),false);
  delete value.live[0].logs[0].message[1].receipt.directoryPublication.status;
  assert.equal(compareReceiptCopies(value.live,value.retained).matchedPairs,0);
});

test('display-version receipts require and compare the exact signer catalogue stamp', () => {
  const value=fixture({version:'2026-10-27.2'});
  for(const fields of [value.live[0].logs[0].message[1],value.retained[0].source]) {
    fields.receipt.version='2026-10-28.2';
    fields.receipt.directoryPublication={profile:'2026-10-28.1',method:'reviewed-first-party-directory',reviewedOn:'2026-10-28',configuredDeclarationCount:0,unmappedDeclarationCount:0,status:'no-declaration'};
    fields.receipt.signature.signerDisplayProfile='2026-10-28.1';
  }
  assert.equal(compareReceiptCopies(value.live,value.retained).identicalPairs,1);
  delete value.retained[0].source.receipt.signature.signerDisplayProfile;
  assert.equal(compareReceiptCopies(value.live,value.retained).missingFields['signature.signerDisplayProfile'],1);
  value.live[0].logs[0].message[1].receipt.signature.signerDisplayProfile='future';
  assert.equal(compareReceiptCopies(value.live,value.retained).matchedPairs,0);
});

test('v4 selection scalars compare exactly while malformed live assessments remain unaccepted', () => {
  const value=fixture({version:'2026-10-27.2'});
  for(const fields of [value.live[0].logs[0].message[1],value.retained[0].source]) {
    fields.receipt.version='2026-10-28.1';
    fields.receipt.directoryPublication={profile:'2026-10-27.1',method:'reviewed-first-party-directory',reviewedOn:'2026-10-27',configuredDeclarationCount:0,unmappedDeclarationCount:0,status:'no-declaration'};
    fields.receipt.signature.coverage={status:'recorded',authority:true,targetUri:false,method:false,path:false,query:false,userAgent:false,contentDigest:false,replayPolicy:'expiry-only'};
    fields.receipt.signature.selection={policy:'first-valid-in-input-order',matchedCandidates:2,taggedCandidates:2,attemptedCandidates:1,unassessedCandidates:1};
  }
  assert.equal(compareReceiptCopies(value.live,value.retained).identicalPairs,1);
  delete value.retained[0].source.receipt.signature.selection.unassessedCandidates;
  assert.equal(compareReceiptCopies(value.live,value.retained).missingFields['signature.selection.unassessedCandidates'],1);
  value.live[0].logs[0].message[1].receipt.signature.selection.attemptedCandidates=-1;
  assert.equal(compareReceiptCopies(value.live,value.retained).matchedPairs,0);
});

function individualCopy(value) {
  return { ...structuredClone(value.retained[0].source),
    $metadata: { type:'cf-worker',id:'private-provider-record',requestId:'private-request',timestampNs:'1700000000000000000' },
    $workers: { truncated:false } };
}

test('individual native event copies normalize exact nanoseconds without publishing identifiers', () => {
  const value=fixture({version:'2026-10-27.2'}),native=individualCopy(value);
  const normalized=normalizeRetainedReceiptCopies(native);
  assert.equal(normalized.rows[0].timestamp,value.retained[0].timestamp);
  const result=compareReceiptCopies(value.live,native);
  assert.equal(result.identicalPairs,1);assert.deepEqual(result.retainedFormats,{bulk:0,individual:1});
  assert.equal(JSON.stringify(result).includes('private-'),false);assert.equal(JSON.stringify(result).includes('1700000000'),false);
  assert.equal(compareReceiptCopies(value.live,[native]).identicalPairs,1);
});

test('native individual timestamp loss or unsupported shapes cannot establish a matching copy', () => {
  const value=fixture({version:'2026-10-27.2'});
  for(const ns of [undefined,null,1700000000000000000,'1700000000000000001','01700000000000000000','-1','1e18','9'.repeat(21),'private-ns']) {
    const native=individualCopy(value);native.$metadata.timestampNs=ns;
    const result=compareReceiptCopies(value.live,native);assert.equal(result.matchedPairs,0);assert.equal(result.rejectedRetainedRecords.timestamp,1);
  }
  for(const mutate of [n=>{delete n.$metadata.requestId},n=>{n.$metadata.type='span'},n=>{n.source={message:n.message}}]){
    const native=individualCopy(value);mutate(native);const result=compareReceiptCopies(value.live,native);
    assert.equal(result.matchedPairs,0);assert.equal(result.rejectedRetainedRecords.shape,1);
  }
});

test('normalizing copies preserves duplicate ambiguity and refuses explicitly truncated captures', () => {
  const value=fixture({version:'2026-10-27.2'}),native=individualCopy(value);
  assert.equal(compareReceiptCopies(value.live,[native,structuredClone(native)]).ambiguousOperations,1);
  native.$workers.truncated=true;assert.equal(compareReceiptCopies(value.live,native).invalidPairs,1);
  const bulk=fixture({version:'2026-10-27.2'});bulk.live[0].truncated=true;
  assert.equal(compareReceiptCopies(bulk.live,bulk.retained).invalidPairs,1);
});

test('bulk invocation/span context remains separate from receipt-format rejection', () => {
  const value=fixture({version:'2026-10-27.2'});
  value.retained.push({timestamp:value.retained[0].timestamp,$metadata:{type:'cf-worker-event'}});
  value.retained.push({timestamp:value.retained[0].timestamp,$metadata:{type:'span'}});
  const result=compareReceiptCopies(value.live,value.retained);assert.equal(result.identicalPairs,1);
  assert.equal(result.retainedFormats.bulk,3);assert.deepEqual(result.rejectedRetainedRecords,{shape:0,timestamp:0});
});

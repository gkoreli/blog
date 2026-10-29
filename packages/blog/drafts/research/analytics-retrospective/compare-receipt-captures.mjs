import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { networkReceiptPaths, validNetworkReceipt, extraNetworkReceiptFields } from './network-receipt-fields.mjs';

const versions = new Set(['2026-10-27.1', '2026-10-27.2', '2026-10-27.3', '2026-10-28.1', '2026-10-28.2', '2026-10-29.1']);
const paths = [...networkReceiptPaths,'version','classifierProfile','readerKind','declarations.status','declarations.candidates','declarations.candidateCount','declarations.candidateNames','declarations.categoryAgreement',
  'signature.evidenceVersion','signature.source','signature.verifierProfile','signature.status','signature.outcome','signature.reason','signature.reasons','signature.reasonCount','signature.reasonNames','signature.signer','signature.signerDisplayProfile','signature.documentedVendorStatus','signature.userAgentCovered',
  ...['policy','matchedCandidates','taggedCandidates','attemptedCandidates','unassessedCandidates'].map(key=>'signature.selection.'+key),
  'signature.coverage','signature.coverage.status','signature.coverage.authority','signature.coverage.targetUri','signature.coverage.method','signature.coverage.path','signature.coverage.query','signature.coverage.userAgent','signature.coverage.contentDigest','signature.coverage.replayPolicy',
  'native.verifiedBot','native.signedAgent','native.categoryStatus','native.categoryValue',
  'directoryPublication.profile','directoryPublication.method','directoryPublication.reviewedOn','directoryPublication.configuredDeclarationCount','directoryPublication.unmappedDeclarationCount','directoryPublication.status'];
const storagePaths = ['version','status','observationId'];
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const field = (value, path) => path.split('.').reduce((value, key) => object(value) && Object.hasOwn(value, key) ? value[key] : undefined, value);

/** Native individual-event copies flatten source fields and carry exact nanosecond text.
 * Accept only an unambiguous stored-event shape and millisecond-exact timestamps.
 * Shape validation does not authenticate the provider or a capture's provenance.
 */
export function normalizeRetainedReceiptCopies(input) {
  const values = Array.isArray(input) ? input : [input];
  const rows = [], formats = { bulk: 0, individual: 0 }, rejected = { shape: 0, timestamp: 0 };
  for (const value of values) {
    if (!object(value)) { rejected.shape++; continue; }
    if (object(value.source)) {
      if (value.message !== undefined || value.receipt !== undefined || value.storage !== undefined) { rejected.shape++; continue; }
      rows.push(value); formats.bulk++; continue;
    }
    const metadata = value.$metadata;
    if (Array.isArray(input) && typeof value.timestamp === 'string' && object(metadata)
      && ['cf-worker-event','span'].includes(metadata.type) && value.receipt === undefined && value.storage === undefined) {
      rows.push(value); formats.bulk++; continue;
    }
    if (value.message !== 'analytics.observation_stored' || !object(metadata)
      || metadata.type !== 'cf-worker' || typeof metadata.id !== 'string' || metadata.id.length === 0
      || typeof metadata.requestId !== 'string' || metadata.requestId.length === 0) { rejected.shape++; continue; }
    const ns = metadata.timestampNs;
    if (typeof ns !== 'string' || !/^[1-9][0-9]{0,19}$/.test(ns)) { rejected.timestamp++; continue; }
    const timestamp = BigInt(ns);
    const ms = timestamp / 1000000n;
    if (timestamp % 1000000n !== 0n || ms > BigInt(Number.MAX_SAFE_INTEGER)
      || !Number.isFinite(new Date(Number(ms)).getTime())) { rejected.timestamp++; continue; }
    rows.push({ timestamp: new Date(Number(ms)).toISOString(), $metadata: metadata, $workers: value.$workers,
      source: { message: value.message, operationId: value.operationId, collectionVersion: value.collectionVersion,
        receipt: value.receipt, storage: value.storage } });
    formats.individual++;
  }
  return { rows, inputRecords: values.length, formats, rejected };
}
function completeLiveReceipt(receipt) {
  if (!object(receipt) || !versions.has(receipt.version)) return false;
  const v1 = receipt.version === '2026-10-27.1', displayVersion = ['2026-10-28.2','2026-10-29.1'].includes(receipt.version);
  const selectionVersion = receipt.version === '2026-10-28.1' || displayVersion && receipt.signature?.selection !== undefined;
  if (receipt.version==='2026-10-29.1' && !validNetworkReceipt(receipt.vendorNetwork)) return false;
  if (receipt.version!=='2026-10-29.1' && receipt.vendorNetwork!==undefined) return false;
  const required = paths.filter(path => !path.startsWith('vendorNetwork.') && !path.startsWith('signature.coverage.')
    && (['2026-10-27.3','2026-10-28.1','2026-10-28.2','2026-10-29.1'].includes(receipt.version) || !path.startsWith('directoryPublication.'))
    && (selectionVersion || !path.startsWith('signature.selection.'))
    && (displayVersion || path !== 'signature.signerDisplayProfile')
    && !(v1 ? ['declarations.candidateCount','declarations.candidateNames','signature.reasonCount','signature.reasonNames']
      : ['declarations.candidates','signature.reasons']).includes(path));
  if (!required.every(path => field(receipt, path) !== undefined)) return false;
  if (displayVersion && receipt.signature.signerDisplayProfile !== '2026-10-28.1') return false;
  const coverage = receipt.signature.coverage;
  if (selectionVersion) {
    const s=receipt.signature.selection;
    if (!object(s)||s.policy!=='first-valid-in-input-order'||coverage?.status!=='recorded'
      ||!['matchedCandidates','taggedCandidates','attemptedCandidates','unassessedCandidates'].every(key=>Number.isSafeInteger(s[key])&&s[key]>=0)
      ||s.taggedCandidates<1||s.attemptedCandidates<1||s.matchedCandidates<s.taggedCandidates||s.taggedCandidates<s.attemptedCandidates
      ||s.unassessedCandidates!==s.taggedCandidates-s.attemptedCandidates)return false;
  }
  if (v1 && coverage === null) return true;
  if (!v1 && object(coverage) && coverage.status === 'unavailable') return true;
  return object(coverage) && (v1 || coverage.status === 'recorded') && paths.filter(path => path.startsWith('signature.coverage.') && path !== 'signature.coverage.status')
    .every(path => typeof field(receipt, path) === (path.endsWith('replayPolicy') ? 'string' : 'boolean'));
}

/** Parse complete JSON objects separated by whitespace, never salvage partial logs. */
export function parseTailRecords(text) {
  const rows = []; let start = null, depth = 0, quoted = false, escaped = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (start === null) { if (/\s/.test(ch)) continue; assert.equal(ch, '{', 'Unexpected tail preamble'); start = i; }
    if (quoted) { if (escaped) escaped = false; else if (ch === '\\') escaped = true; else if (ch === '"') quoted = false; }
    else if (ch === '"') quoted = true;
    else if (ch === '{' || ch === '[') depth++;
    else if (ch === '}' || ch === ']') { depth--; if (depth === 0) { rows.push(JSON.parse(text.slice(start, i + 1))); start = null; } }
  }
  assert.equal(start, null, 'Incomplete trailing tail record'); return rows;
}

export function compareReceiptCopies(liveEvents, retainedInput) {
  assert.ok(Array.isArray(liveEvents));
  const normalized = normalizeRetainedReceiptCopies(retainedInput), retainedRows = normalized.rows;
  const live = liveEvents.flatMap(event => (event.logs ?? []).filter(log => Array.isArray(log.message) && log.message[0] === 'analytics.observation_stored')
    .map(log => ({ fields: log.message[1], timestamp: log.timestamp, truncated: event.truncated === true })));
  const retained = retainedRows.filter(row => row?.source?.message === 'analytics.observation_stored')
    .map(row => ({ fields: row.source, timestamp: Date.parse(row.timestamp), truncated: row.$workers?.truncated === true || row.$cloudflare?.truncated === true }));
  const valid = item => object(item.fields) && typeof item.fields.operationId === 'string' && item.fields.operationId.length > 0;
  const group = rows => {
    const result = new Map();
    for (const item of rows.filter(valid)) { const key = item.fields.operationId; result.set(key, [...result.get(key) ?? [], item]); }
    return result;
  };
  const L = group(live), R = group(retained), keys = new Set([...L.keys(), ...R.keys()]);
  const result = { liveStoredRecords: live.length, retainedStoredRecords: retained.length,
    retainedInputRecords: normalized.inputRecords, retainedFormats: normalized.formats, rejectedRetainedRecords: normalized.rejected,
    missingOperationRecords: [...live, ...retained].filter(item => !valid(item)).length,
    unmatchedLiveRecords: 0, unmatchedRetainedRecords: 0, ambiguousOperations: 0, invalidPairs: 0,
    matchedPairs: 0, identicalPairs: 0, differingPairs: 0, omittedNulls: 0, omittedEmptyArrays: 0, omittedOther: 0,
    missingFields: {}, addedFields: {}, changedFields: {}, versions: {}, unexpectedNetworkFields: 0 };
  const add = (counts, key) => { counts[key] = (counts[key] ?? 0) + 1; };
  for (const key of keys) {
    const left = L.get(key) ?? [], right = R.get(key) ?? [];
    if (!left.length) { result.unmatchedRetainedRecords += right.length; continue; }
    if (!right.length) { result.unmatchedLiveRecords += left.length; continue; }
    if (left.length !== 1 || right.length !== 1) { result.ambiguousOperations++; continue; }
    const a = left[0], b = right[0], ar = a.fields.receipt, br = b.fields.receipt;
    if (a.truncated || b.truncated || !Number.isFinite(a.timestamp) || a.timestamp !== b.timestamp
      || typeof a.fields.collectionVersion !== 'string' || a.fields.collectionVersion !== b.fields.collectionVersion
      || !completeLiveReceipt(ar) || !object(br) || ar.version !== br.version) { result.invalidPairs++; continue; }
    result.matchedPairs++; add(result.versions, ar.version);
    const unexpectedNetworkFields=extraNetworkReceiptFields(br.vendorNetwork);
    result.unexpectedNetworkFields+=unexpectedNetworkFields;
    let different = unexpectedNetworkFields>0;
    const comparisons = paths.map(path => ({ path, av: field(ar, path), bv: field(br, path) }));
    if (a.fields.storage !== undefined || b.fields.storage !== undefined) {
      for (const path of storagePaths) comparisons.push({ path: 'storage.' + path, av: field(a.fields.storage, path), bv: field(b.fields.storage, path) });
    }
    for (const {path, av, bv} of comparisons) {
      if (object(av) && object(bv) || object(av) && bv === undefined) continue;
      if (av === undefined && bv === undefined) continue;
      if (JSON.stringify(av) === JSON.stringify(bv)) continue;
      different = true;
      if (bv === undefined) {
        add(result.missingFields, path);
        if (av === null) result.omittedNulls++;
        else if (Array.isArray(av) && av.length === 0) result.omittedEmptyArrays++;
        else result.omittedOther++;
      } else if (av === undefined) add(result.addedFields, path);
      else add(result.changedFields, path);
    }
    if (different) result.differingPairs++; else result.identicalPairs++;
  }
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [liveInput, retainedInput, output] = process.argv.slice(2); assert.ok(liveInput && retainedInput && output);
  const a = readFileSync(liveInput), b = readFileSync(retainedInput);
  const result = { checkedAt: new Date().toISOString(), method: 'Compare known receipt fields only, matched by unique existing operation reference, exact log timestamp, collection and receipt versions; no timestamp-only or D1-row join.',
    inputs: [a,b].map(bytes => ({ bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') })),
    ...compareReceiptCopies(parseTailRecords(a.toString()), JSON.parse(b.toString())),
    limits: ['Known-field comparison, not complete raw-log equality or authentication of provider captures.', 'Unknown receipt versions and ambiguous/invalid pairs cannot supply accepted matches.', 'Observed differences do not locate their cause within provider ingestion, storage, API, UI or export.', 'No raw values, arbitrary field names, operation/provider identifiers or request context appear in this aggregate.'] };
  writeFileSync(output, JSON.stringify(result, null, 2)+'\n', { flag: 'wx' });
  console.log(JSON.stringify({ matchedPairs: result.matchedPairs, differingPairs: result.differingPairs, omittedNulls: result.omittedNulls, omittedEmptyArrays: result.omittedEmptyArrays }));
}

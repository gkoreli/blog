import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const versions = new Set(['2026-10-27.1', '2026-10-27.2']);
const paths = ['version','classifierProfile','readerKind','declarations.status','declarations.candidates','declarations.candidateCount','declarations.candidateNames','declarations.categoryAgreement',
  'signature.evidenceVersion','signature.source','signature.verifierProfile','signature.status','signature.outcome','signature.reason','signature.reasons','signature.reasonCount','signature.reasonNames','signature.signer','signature.documentedVendorStatus','signature.userAgentCovered',
  'signature.coverage','signature.coverage.status','signature.coverage.authority','signature.coverage.targetUri','signature.coverage.method','signature.coverage.path','signature.coverage.query','signature.coverage.userAgent','signature.coverage.contentDigest','signature.coverage.replayPolicy',
  'native.verifiedBot','native.signedAgent','native.categoryStatus','native.categoryValue'];
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const field = (value, path) => path.split('.').reduce((value, key) => object(value) && Object.hasOwn(value, key) ? value[key] : undefined, value);
function completeLiveReceipt(receipt) {
  if (!object(receipt) || !versions.has(receipt.version)) return false;
  const v1 = receipt.version === '2026-10-27.1';
  const required = paths.filter(path => !path.startsWith('signature.coverage.')
    && !(v1 ? ['declarations.candidateCount','declarations.candidateNames','signature.reasonCount','signature.reasonNames']
      : ['declarations.candidates','signature.reasons']).includes(path));
  if (!required.every(path => field(receipt, path) !== undefined)) return false;
  const coverage = receipt.signature.coverage;
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

export function compareReceiptCopies(liveEvents, retainedRows) {
  assert.ok(Array.isArray(liveEvents) && Array.isArray(retainedRows));
  const live = liveEvents.flatMap(event => (event.logs ?? []).filter(log => Array.isArray(log.message) && log.message[0] === 'analytics.observation_stored')
    .map(log => ({ fields: log.message[1], timestamp: log.timestamp })));
  const retained = retainedRows.filter(row => row?.source?.message === 'analytics.observation_stored')
    .map(row => ({ fields: row.source, timestamp: Date.parse(row.timestamp) }));
  const valid = item => object(item.fields) && typeof item.fields.operationId === 'string' && item.fields.operationId.length > 0;
  const group = rows => {
    const result = new Map();
    for (const item of rows.filter(valid)) { const key = item.fields.operationId; result.set(key, [...result.get(key) ?? [], item]); }
    return result;
  };
  const L = group(live), R = group(retained), keys = new Set([...L.keys(), ...R.keys()]);
  const result = { liveStoredRecords: live.length, retainedStoredRecords: retained.length,
    missingOperationRecords: [...live, ...retained].filter(item => !valid(item)).length,
    unmatchedLiveRecords: 0, unmatchedRetainedRecords: 0, ambiguousOperations: 0, invalidPairs: 0,
    matchedPairs: 0, identicalPairs: 0, differingPairs: 0, omittedNulls: 0, omittedEmptyArrays: 0, omittedOther: 0,
    missingFields: {}, addedFields: {}, changedFields: {}, versions: {} };
  const add = (counts, key) => { counts[key] = (counts[key] ?? 0) + 1; };
  for (const key of keys) {
    const left = L.get(key) ?? [], right = R.get(key) ?? [];
    if (!left.length) { result.unmatchedRetainedRecords += right.length; continue; }
    if (!right.length) { result.unmatchedLiveRecords += left.length; continue; }
    if (left.length !== 1 || right.length !== 1) { result.ambiguousOperations++; continue; }
    const a = left[0], b = right[0], ar = a.fields.receipt, br = b.fields.receipt;
    if (!Number.isFinite(a.timestamp) || a.timestamp !== b.timestamp
      || typeof a.fields.collectionVersion !== 'string' || a.fields.collectionVersion !== b.fields.collectionVersion
      || !completeLiveReceipt(ar) || !object(br) || ar.version !== br.version) { result.invalidPairs++; continue; }
    result.matchedPairs++; add(result.versions, ar.version); let different = false;
    for (const path of paths) {
      const av = field(ar, path), bv = field(br, path);
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

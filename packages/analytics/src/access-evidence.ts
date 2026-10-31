import { isReaderKind, type ReaderKind } from './contracts.js';

export const ACCESS_EVIDENCE_VERSION = 'access-evidence-v2';
export const ACCESS_EVIDENCE_PROFILE = '2026-10-31.2';
export const ACCESS_EVIDENCE_MAX_BYTES = 256 * 1024;
type Context = { method: string; host: string; path: string; query: string };
type Response = { status: number; observedAt: number; observationBasis: 'headers-observed' | 'after-body-read' | 'controller-completed'; ray: string | null };
type Lookup = { scope: string; state: 'complete' | 'partial' | 'unavailable'; records: Array<{ reference: string; kind: string | null; collection: string | null; classifier: string | null }> };
type Attempt = {
  reference: string; executed: boolean; labelSource: 'controlled-client-receipt' | 'agent-controller' | 'human-attestation' | 'unconfirmed';
  declaredOperator: 'automation' | 'human-reported' | 'unconfirmed';
  context: Context; contextBasis: 'recorded-request' | 'protocol-reconstruction'; start: number; end: number; timingBasis: 'execution-window' | 'observation-second-window';
  response: Response | null; collector: Lookup | null;
};
type Event = { reference: string; context: Context; at: number; ray: string; action: string; source: string; ruleId: string; sampleInterval: number | null };
type StoredKind = ReaderKind | 'not-recorded' | 'unrecognized';
export interface AccessEvidenceReport {
  version: typeof ACCESS_EVIDENCE_VERSION; profile: typeof ACCESS_EVIDENCE_PROFILE;
  provenance: 'saved-control' | 'synthetic'; sourceAuthenticity: 'not-established'; populationCompleteness: 'not-established';
  totals: { plannedAttempts: number; executedAttempts: number; observedResponses: number; suppliedSecurityRecords: number; uniquelyAssignedSecurityRecords: number; ambiguousSecurityRecords: number; unmatchedSecurityRecords: number; attemptsWithAssignedSecurityRecords: number; suppliedCollectorRecords: number; completeCollectorLookups: number; partialCollectorLookups: number; unknownCollectorAttempts: number; identicalSecurityFactGroups: number };
  attempts: Array<{
    ordinal: number; executed: boolean; labelSource: Attempt['labelSource']; declaredOperator: 'automation' | 'human-reported' | 'unconfirmed'; timingBasis: Attempt['timingBasis']; contextBasis: Attempt['contextBasis'];
    responseStatus: number | null; responseObservationBasis: Response['observationBasis'] | null; assignedSecurityRecords: number; ambiguousSecurityRecords: number;
    collector: 'not-executed' | 'unknown' | 'partial' | 'complete-empty' | 'complete-with-records';
    collectorLookupState: 'not-supplied' | Lookup['state']; suppliedCollectorRecords: number; storedKinds: Array<{ kind: StoredKind; records: number }>;
    methodHistory: Array<{ collection: string | null; classifier: string | null; records: number }>;
    warnings: Array<'block-with-success-response' | 'block-with-collector-records'>;
  }>;
  securityRecords: Array<{
    ordinal: number; association: 'unique-context-match' | 'ambiguous-context-match' | 'unmatched'; candidateAttemptOrdinals: number[];
    sameRayTimeCompatibleContextConflicts: number; sameRayOutsideWindow: number;
    action: 'block' | 'not-recorded' | 'other'; feature: 'bic' | 'not-established'; sampleInterval: number | null; identicalFactCopies: number;
  }>;
  limits: string[];
}
function fail(code: string): never { throw Error(`Access evidence rejected: ${code}`); }
function record(v: unknown): v is Record<string, unknown> { return v !== null && typeof v === 'object' && !Array.isArray(v); }
function fields(v: Record<string, unknown>, names: string[]): boolean { return names.every(k => Object.hasOwn(v, k)) && Object.keys(v).length === names.length; }
function text(v: unknown, max: number): v is string { return typeof v === 'string' && v.length <= max && !/[\u0000-\u001f\u007f]/.test(v); }
function ref(v: unknown): v is string { return text(v, 128) && v.trim().length > 0; }
function rows(v: unknown, max: number): unknown[] { return Array.isArray(v) && v.length <= max ? v : fail('array-budget'); }
function instant(v: unknown, seconds = false): number {
  if (typeof v !== 'string' || !(seconds ? /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/ : /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/).test(v)) return fail('time');
  const n = Date.parse(v);
  return Number.isFinite(n) && new Date(n).toISOString().replace('.000Z', 'Z') === v.replace('.000Z', 'Z') ? n : fail('time');
}
function context(v: unknown): Context {
  if (!record(v) || !fields(v, ['method', 'host', 'path', 'query']) || typeof v.method !== 'string' || !/^[A-Z]{1,16}$/.test(v.method)
    || typeof v.host !== 'string' || !/^(?=.{1,253}$)[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(v.host)
    || !text(v.path, 2048) || !v.path.startsWith('/') || v.path.startsWith('//') || /[?#\\\s]/.test(v.path)
    || !text(v.query, 2048) || /[#\s]/.test(v.query) || v.query.startsWith('?')) return fail('context');
  try { if (new URL(v.path, 'https://context.invalid').pathname !== v.path) return fail('path'); } catch { return fail('path'); }
  if (/%(?![a-fA-F0-9]{2})/.test(v.path + v.query)) return fail('encoding');
  return { method: v.method, host: v.host, path: v.path, query: v.query };
}
function ray(v: unknown): v is string { return typeof v === 'string' && /^[a-f0-9]{16}$/.test(v); }
function stamp(v: unknown): v is string | null { return v === null || typeof v === 'string' && /^\d{4}-\d{2}-\d{2}\.\d{1,6}$/.test(v) && Number.isFinite(Date.parse(v.slice(0,10) + 'T00:00:00Z')) && new Date(v.slice(0,10) + 'T00:00:00Z').toISOString().startsWith(v.slice(0,10)); }
function unique(reference: string, used: Set<string>): void { if (used.has(reference)) fail('duplicate-reference'); used.add(reference); }
function lookup(v: unknown, used: Set<string>): Lookup | null {
  if (v === null) return null;
  if (!record(v) || !fields(v, ['scope', 'state', 'records']) || !ref(v.scope) || v.state !== 'complete' && v.state !== 'partial' && v.state !== 'unavailable') return fail('collector');
  const records = rows(v.records, 32).map(r => {
    if (!record(r) || !fields(r, ['reference', 'kind', 'collection', 'classifier']) || !ref(r.reference)
      || r.kind !== null && !text(r.kind,128) || !stamp(r.collection) || !stamp(r.classifier)) return fail('collector-record');
    unique(r.reference, used);
    return { reference: r.reference, kind: r.kind, collection: r.collection, classifier: r.classifier };
  });
  if (v.state === 'unavailable' && records.length) return fail('unavailable-with-records');
  return { scope: v.scope, state: v.state, records };
}
function attempt(v: unknown, used: Set<string>, collectorRefs: Set<string>): Attempt {
  if (!record(v) || !fields(v, ['reference', 'executed', 'labelSource', 'declaredOperator', 'context', 'contextBasis', 'startInclusive', 'endExclusive', 'timingBasis', 'response', 'collector'])
    || !ref(v.reference) || typeof v.executed !== 'boolean'
    || v.labelSource !== 'controlled-client-receipt' && v.labelSource !== 'agent-controller' && v.labelSource !== 'human-attestation' && v.labelSource !== 'unconfirmed'
    || v.declaredOperator !== 'automation' && v.declaredOperator !== 'human-reported' && v.declaredOperator !== 'unconfirmed'
    || v.contextBasis !== 'recorded-request' && v.contextBasis !== 'protocol-reconstruction'
    || v.timingBasis !== 'execution-window' && v.timingBasis !== 'observation-second-window') return fail('attempt');
  unique(v.reference, used);
  if (!v.executed && (v.labelSource !== 'unconfirmed' || v.declaredOperator !== 'unconfirmed')) return fail('unexecuted-evidence');
  if (v.labelSource === 'agent-controller' && v.declaredOperator !== 'automation'
    || v.labelSource === 'human-attestation' && v.declaredOperator !== 'human-reported'
    || v.labelSource === 'unconfirmed' && v.declaredOperator !== 'unconfirmed') return fail('label-provenance');
  const start = instant(v.startInclusive), end = instant(v.endExclusive);
  if (end <= start || end - start > 60_000 || v.timingBasis === 'observation-second-window' && (start % 1000 !== 0 || end - start !== 1000)) return fail('window');
  let response: Response | null = null;
  if (v.response !== null) {
    const r = v.response;
    if (!record(r) || !fields(r, ['status', 'observedAt', 'observationBasis', 'ray']) || typeof r.status !== 'number' || !Number.isInteger(r.status) || r.status < 100 || r.status > 599 || r.ray !== null && !ray(r.ray)
      || r.observationBasis !== 'headers-observed' && r.observationBasis !== 'after-body-read' && r.observationBasis !== 'controller-completed') return fail('response');
    const observedAt = instant(r.observedAt);
    if (observedAt < start || observedAt >= end) return fail('response-observation-outside-window');
    response = { status: r.status, observedAt, observationBasis: r.observationBasis, ray: r.ray };
  }
  const collector = lookup(v.collector, collectorRefs);
  if (!v.executed && (response !== null || collector !== null)) return fail('unexecuted-evidence');
  if (v.timingBasis === 'observation-second-window' && response === null) return fail('observation-window-without-response');
  return { reference: v.reference, executed: v.executed, labelSource: v.labelSource, declaredOperator: v.declaredOperator, context: context(v.context), contextBasis: v.contextBasis, start, end, timingBasis: v.timingBasis, response, collector };
}
function event(v: unknown, used: Set<string>): Event {
  if (!record(v) || !fields(v, ['reference', 'context', 'datetime', 'ray', 'action', 'source', 'ruleId', 'sampleInterval']) || !ref(v.reference)
    || !ray(v.ray) || !text(v.action,128) || !text(v.source,128) || !text(v.ruleId,128)
    || v.sampleInterval !== null && (typeof v.sampleInterval !== 'number' || !Number.isSafeInteger(v.sampleInterval) || v.sampleInterval < 1)) return fail('security-record');
  unique(v.reference, used);
  return { reference: v.reference, context: context(v.context), at: instant(v.datetime,true), ray: v.ray, action: v.action, source: v.source, ruleId: v.ruleId, sampleInterval: v.sampleInterval };
}
const LIMITS = [
  'Counts describe supplied records and declared scope. Schema validation authenticates neither captures, labels nor lookup completeness; no population completeness is established.',
  'Security records are not unique requests or visits. Repeated facts are surfaced without deduplication; sampleInterval is not a population multiplier or a completeness promise.',
  'A contextual Ray match corroborates supplied evidence; it is not identity authentication. Observation-second overlap is not a measured execution duration or guaranteed provider-clock agreement.',
  'Complete-empty means zero supplied records in a caller-declared complete lookup scope, not absent Worker invocation or global storage absence. Partial and unavailable evidence remain distinct.',
  'Observation clocks record caller-observed stages, not network-arrival instants. Context basis distinguishes retained request metadata from protocol reconstruction; neither authenticates wire context or redirects.',
  'Response status does not prove article delivery, reading or usefulness. BIC actions do not establish malicious intent, human identity, purpose or RFC9421 verification.',
  'Stored kinds are observations, not truth labels or accuracy measurements. This report does not enter the calibration confusion matrix. Input references, Rays, context and arbitrary source labels are omitted.',
];

/** Offline controlled-attempt accounting; no transport, collection, storage or calibration mutation. */
export function analyzeAccessEvidence(input: unknown): AccessEvidenceReport {
  let serialized: string | undefined;
  try { serialized = JSON.stringify(input); } catch { return fail('json'); }
  if (!serialized || new TextEncoder().encode(serialized).length > ACCESS_EVIDENCE_MAX_BYTES) return fail('input-budget');
  if (!record(input) || !fields(input, ['version', 'provenance', 'attempts', 'securityRecords']) || input.version !== ACCESS_EVIDENCE_VERSION
    || input.provenance !== 'saved-control' && input.provenance !== 'synthetic') return fail('envelope');
  const attemptRefs = new Set<string>(), collectorRefs = new Set<string>(), eventRefs = new Set<string>();
  const attempts = rows(input.attempts,32).map(v => attempt(v, attemptRefs, collectorRefs));
  return report(attempts, rows(input.securityRecords,128).map(v => event(v,eventRefs)), input.provenance);
}

function report(attempts: Attempt[], events: Event[], provenance: AccessEvidenceReport['provenance']): AccessEvidenceReport {
  const totals: AccessEvidenceReport['totals'] = {
    plannedAttempts: attempts.length, executedAttempts: 0, observedResponses: 0, suppliedSecurityRecords: events.length,
    uniquelyAssignedSecurityRecords: 0, ambiguousSecurityRecords: 0, unmatchedSecurityRecords: 0, attemptsWithAssignedSecurityRecords: 0,
    suppliedCollectorRecords: 0, completeCollectorLookups: 0, partialCollectorLookups: 0, unknownCollectorAttempts: 0, identicalSecurityFactGroups: 0,
  };
  const result: AccessEvidenceReport = { version: ACCESS_EVIDENCE_VERSION, profile: ACCESS_EVIDENCE_PROFILE, provenance,
    sourceAuthenticity: 'not-established', populationCompleteness: 'not-established', totals, attempts: [], securityRecords: [], limits: [...LIMITS] };
  result.attempts = attempts.map((a,i) => {
    const kinds = new Map<StoredKind,number>(), history = new Map<string,{ collection: string | null; classifier: string | null; records: number }>();
    const collector = !a.executed ? 'not-executed' : !a.collector || a.collector.state === 'unavailable' ? 'unknown'
      : a.collector.state === 'partial' ? 'partial' : a.collector.records.length ? 'complete-with-records' : 'complete-empty';
    if (a.executed) totals.executedAttempts++;
    if (a.response) totals.observedResponses++;
    if (collector === 'unknown') totals.unknownCollectorAttempts++;
    if (a.collector?.state === 'complete') totals.completeCollectorLookups++;
    if (collector === 'partial') totals.partialCollectorLookups++;
    for (const r of a.collector?.records ?? []) {
      totals.suppliedCollectorRecords++;
      const kind = r.kind === null ? 'not-recorded' : isReaderKind(r.kind) ? r.kind : 'unrecognized';
      kinds.set(kind,(kinds.get(kind) ?? 0) + 1);
      const { collection, classifier } = r;
      const key = `${collection}:${classifier}`, h = history.get(key);
      if (h) h.records++; else history.set(key,{ collection, classifier, records: 1 });
    }
    return { ordinal: i+1, executed: a.executed, labelSource: a.labelSource, declaredOperator: a.declaredOperator,
      timingBasis: a.timingBasis, contextBasis: a.contextBasis, responseObservationBasis: a.response?.observationBasis ?? null, responseStatus: a.response?.status ?? null, assignedSecurityRecords: 0, ambiguousSecurityRecords: 0, collector,
      collectorLookupState: a.collector?.state ?? 'not-supplied', suppliedCollectorRecords: a.collector?.records.length ?? 0, storedKinds: [...kinds].sort(([a],[b]) => a < b ? -1 : a > b ? 1 : 0).map(([kind,records]) => ({kind,records})),
      methodHistory: [...history.values()].sort((a,b) => JSON.stringify(a).localeCompare(JSON.stringify(b))), warnings: [] };
  });
  const facts = events.map(({reference: _reference,...e}) => JSON.stringify(e)), copies = new Map<string,number>();
  for (const f of facts) copies.set(f,(copies.get(f) ?? 0)+1);
  totals.identicalSecurityFactGroups = [...copies.values()].filter(n => n>1).length;
  result.securityRecords = events.map((e,i) => {
    const candidates: number[] = []; let conflicts = 0, outside = 0;
    attempts.forEach((a,j) => {
      if (!a.executed || a.response?.ray !== e.ray) return;
      if (!(e.at < a.end && e.at + 1000 > a.start)) { outside++; return; }
      if (a.context.method !== e.context.method || a.context.host !== e.context.host || a.context.path !== e.context.path || a.context.query !== e.context.query) { conflicts++; return; }
      candidates.push(j+1);
    });
    const association = candidates.length === 1 ? 'unique-context-match' : candidates.length > 1 ? 'ambiguous-context-match' : 'unmatched';
    if (association === 'unique-context-match') {
      totals.uniquelyAssignedSecurityRecords++;
      const a = result.attempts[candidates[0]-1]; a.assignedSecurityRecords++;
      if (e.action === 'block') {
        if (a.responseStatus !== null && a.responseStatus >= 200 && a.responseStatus < 300 && !a.warnings.includes('block-with-success-response')) a.warnings.push('block-with-success-response');
        if (a.suppliedCollectorRecords && !a.warnings.includes('block-with-collector-records')) a.warnings.push('block-with-collector-records');
      }
    } else if (association === 'ambiguous-context-match') {
      totals.ambiguousSecurityRecords++;
      for (const ordinal of candidates) result.attempts[ordinal-1].ambiguousSecurityRecords++;
    } else totals.unmatchedSecurityRecords++;
    return { ordinal: i+1, association, candidateAttemptOrdinals: candidates, sameRayTimeCompatibleContextConflicts: conflicts, sameRayOutsideWindow: outside,
      action: e.action === 'block' ? 'block' : e.action === '' ? 'not-recorded' : 'other', feature: e.source === 'bic' && e.ruleId === 'bic' ? 'bic' : 'not-established',
      sampleInterval: e.sampleInterval, identicalFactCopies: copies.get(facts[i]) ?? 1 };
  });
  totals.attemptsWithAssignedSecurityRecords = result.attempts.filter(a => a.assignedSecurityRecords > 0).length;
  return result;
}

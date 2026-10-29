import { auditWebBotAuth, type SignatureAudit, type SignatureAuditOptions } from './webbotauth-audit.js';
import { inspectWebBotAuthCandidates, inspectWebBotAuthCandidateCapture } from './webbotauth.js';
import { verificationTime } from './verification-clock.js';

export interface RetainedSignatureAuditOptions extends Omit<SignatureAuditOptions, 'now'> {
  /** Required recorded assessment time. Never default historical replay to now. */
  recordedAt: Date;
}

export interface RetainedSignatureAudit {
  version: '2026-10-29.1';
  scope: 'retained-request-representation';
  recordedClock: 'supplied' | 'missing-or-invalid';
  originalRequestValidity: 'not-established';
  directorySnapshotEquivalence: 'not-established';
  replayInterpretation: 'verified-captured-context' | 'not-verified-captured-context' | 'not-assessed';
  capturedInputAudit: SignatureAudit | null;
  availability: {
    inspectedCandidates: number; uninspectedCandidates: number | null;
    components: number; missingHeaderComponents: number;
    placeholderShapedHeaderComponents: number; unresolvedComponents: number;
  };
}

/** Optional offline diagnostic, absent from collection and reporting. The
 * nested verdict describes only the supplied representation and resolver.
 * Even an intact-looking failed capture cannot prove original invalidity.
 * A successful replay does not reconstruct a historical directory snapshot.
 */
export async function auditRetainedWebBotAuth(request: Request, options: RetainedSignatureAuditOptions): Promise<RetainedSignatureAudit> {
  const result: RetainedSignatureAudit = {
    version: '2026-10-29.1', scope: 'retained-request-representation',
    recordedClock: 'missing-or-invalid', originalRequestValidity: 'not-established', directorySnapshotEquivalence: 'not-established',
    replayInterpretation: 'not-assessed', capturedInputAudit: null,
    availability: { inspectedCandidates: 0, uninspectedCandidates: null, components: 0, missingHeaderComponents: 0, placeholderShapedHeaderComponents: 0, unresolvedComponents: 0 },
  };
  if (options.recordedAt === undefined || options.recordedAt === null) return result;
  const time = verificationTime(options.recordedAt);
  if (time === null) return result;
  result.recordedClock = 'supplied';
  const snapshot = new Request(request.url, { method: request.method, headers: new Headers(request.headers) });
  // Start exactly one bounded crypto audit. It snapshots the same inputs before
  // awaiting transport. Availability uses its admitted policy/candidate cap.
  const audit = await auditWebBotAuth(snapshot, { ...options, now: new Date(time) });
  result.capturedInputAudit = audit;
  if (audit.verifiedCandidates > 0) result.replayInterpretation = 'verified-captured-context';
  else if (audit.attemptedCandidates > 0) result.replayInterpretation = 'not-verified-captured-context';
  if (audit.policy === null || audit.termination === 'header-budget') return result;
  const inspected = inspectWebBotAuthCandidates(snapshot);
  if (inspected.status === 'absent') { result.availability.uninspectedCandidates = 0; return result; }
  if (inspected.status !== 'ready') return result;
  for (const label of inspected.labels.slice(0, audit.policy.maxCandidates)) {
    const facts = inspectWebBotAuthCandidateCapture(snapshot, label);
    if (facts === null) continue;
    result.availability.inspectedCandidates++;
    result.availability.components += facts.components;
    result.availability.missingHeaderComponents += facts.missingHeaderComponents;
    result.availability.placeholderShapedHeaderComponents += facts.placeholderShapedHeaderComponents;
    result.availability.unresolvedComponents += facts.unresolvedComponents;
  }
  result.availability.uninspectedCandidates = inspected.labels.length - result.availability.inspectedCandidates;
  return result;
}

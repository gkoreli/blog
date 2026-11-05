export type SubscriptionPhase = 'idle' | 'verifying' | 'sending' | 'unknown';

export interface SubscriptionDiagnosticContext {
  attemptId: string | null;
  elapsedMs: number | null;
  online: 'online' | 'offline' | 'unknown';
  visibility: 'visible' | 'hidden' | 'unknown';
  widget: 'rendering' | 'ready' | 'verifying' | 'interactive' | 'token-received' | 'removed' | 'unknown';
  script: 'available' | 'unavailable' | 'unknown';
  recovery: 'automatic-retry' | 'manual-retry' | 'no-attempt' | 'unknown';
}

export type TurnstileErrorEvidence =
  | { state: 'not-applicable' }
  | { state: 'not-provided' }
  | { state: 'invalid' }
  | { state: 'bounded-code'; code: string };

/** Reported response metadata is a lookup hint, never an authenticated join. */
export type SubscriptionOperationEvidence =
  | { state: 'unrecorded' | 'invalid' | 'not-started' | 'response-unavailable' | 'response-id-missing' | 'response-id-invalid' | 'redirected-response' }
  | { state: 'response-id'; requestId: string };

export type SubscriptionErrorEvidence =
  | { state: 'invalid' }
  | { state: 'unsupported-profile' }
  | {
    state: 'recorded';
    profile: 'subscribe-error-v1';
    phase: SubscriptionPhase;
    turnstileError: TurnstileErrorEvidence;
  }
  | {
    state: 'recorded';
    profile: 'subscribe-error-v2';
    phase: SubscriptionPhase;
    turnstileError: TurnstileErrorEvidence;
    operation: SubscriptionOperationEvidence;
  }
  | {
    state: 'recorded';
    profile: 'subscribe-error-v3';
    phase: SubscriptionPhase;
    turnstileError: TurnstileErrorEvidence;
    operation: SubscriptionOperationEvidence;
    context: SubscriptionDiagnosticContext;
  };

function requestId(value: unknown): value is string {
  return typeof value === 'string' && value.length === 36
    && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

/** Only our existing random UUIDv4 response identifier; no arbitrary header capture. */
export function captureSubscriptionResponse(value: string | null, redirected: boolean): SubscriptionOperationEvidence {
  if (redirected) return { state: 'redirected-response' };
  if (value === null) return { state: 'response-id-missing' };
  return requestId(value) ? { state: 'response-id', requestId: value.toLowerCase() } : { state: 'response-id-invalid' };
}

function parseOperation(value: unknown): SubscriptionOperationEvidence {
  if (value === undefined) return { state: 'unrecorded' };
  if (typeof value !== 'object' || value === null || !('state' in value)) return { state: 'invalid' };
  switch (value.state) {
    case 'unrecorded': case 'invalid': case 'not-started': case 'response-unavailable':
    case 'response-id-missing': case 'response-id-invalid': case 'redirected-response':
      return { state: value.state };
    case 'response-id':
      return 'requestId' in value && requestId(value.requestId)
        ? { state: 'response-id', requestId: value.requestId.toLowerCase() } : { state: 'invalid' };
    default: return { state: 'invalid' };
  }
}

function boundedCode(value: unknown): value is string {
  return typeof value === 'string' && value.length === 6 && /^[0-9]{6}$/.test(value);
}

function captureProviderCode(value: unknown): TurnstileErrorEvidence {
  if (value === undefined) return { state: 'not-provided' };
  return boundedCode(value) ? { state: 'bounded-code', code: value } : { state: 'invalid' };
}

/** Syntax-bounded, client-reported evidence; never a bot verdict or provider authentication. */
export function captureSubscriptionError(
  phase: SubscriptionPhase,
  provider?: { errorCode: unknown },
  operation: SubscriptionOperationEvidence = { state: 'unrecorded' },
  context?: SubscriptionDiagnosticContext,
): SubscriptionErrorEvidence {
  const common = {
    state: 'recorded' as const, phase,
    turnstileError: provider ? captureProviderCode(provider.errorCode) : { state: 'not-applicable' as const },
    operation: parseOperation(operation),
  };
  return context ? { ...common, profile: 'subscribe-error-v3', context: parseDiagnosticContext(context) }
    : { ...common, profile: 'subscribe-error-v2' };
}

function parseDiagnosticContext(value: unknown): SubscriptionDiagnosticContext {
  const raw = typeof value === 'object' && value !== null ? value : {};
  return {
    attemptId: 'attemptId' in raw && requestId(raw.attemptId) ? raw.attemptId.toLowerCase() : null,
    elapsedMs: 'elapsedMs' in raw && typeof raw.elapsedMs === 'number' && Number.isFinite(raw.elapsedMs)
      && raw.elapsedMs >= 0 && raw.elapsedMs <= 300_000 ? Math.floor(raw.elapsedMs) : null,
    online: 'online' in raw && (raw.online === 'online' || raw.online === 'offline') ? raw.online : 'unknown',
    visibility: 'visibility' in raw && (raw.visibility === 'visible' || raw.visibility === 'hidden') ? raw.visibility : 'unknown',
    widget: 'widget' in raw && (raw.widget === 'rendering' || raw.widget === 'ready' || raw.widget === 'verifying'
      || raw.widget === 'interactive' || raw.widget === 'token-received' || raw.widget === 'removed') ? raw.widget : 'unknown',
    script: 'script' in raw && (raw.script === 'available' || raw.script === 'unavailable') ? raw.script : 'unknown',
    recovery: 'recovery' in raw && (raw.recovery === 'automatic-retry' || raw.recovery === 'manual-retry'
      || raw.recovery === 'no-attempt') ? raw.recovery : 'unknown',
  };
}

function parsePhase(value: unknown): SubscriptionPhase {
  if (value === 'idle' || value === 'verifying' || value === 'sending') return value;
  return 'unknown';
}

function parseProvider(value: unknown): TurnstileErrorEvidence {
  if (typeof value !== 'object' || value === null || !('state' in value)) return { state: 'invalid' };
  if (value.state === 'not-applicable' || value.state === 'not-provided' || value.state === 'invalid') {
    return { state: value.state };
  }
  if (value.state === 'bounded-code' && 'code' in value && boundedCode(value.code)) {
    return { state: 'bounded-code', code: value.code };
  }
  return { state: 'invalid' };
}

/** Rebuild closed fields instead of serializing an arbitrary caller-supplied object. */
export function parseSubscriptionErrorEvidence(value: unknown): SubscriptionErrorEvidence | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'object' || value === null || !('state' in value)) return { state: 'invalid' };
  if (value.state === 'invalid' || value.state === 'unsupported-profile') return { state: value.state };
  if (value.state !== 'recorded') return { state: 'invalid' };
  if (!('profile' in value) || (value.profile !== 'subscribe-error-v1' && value.profile !== 'subscribe-error-v2'
    && value.profile !== 'subscribe-error-v3')) return { state: 'unsupported-profile' };
  const common = {
    state: 'recorded' as const,
    phase: parsePhase('phase' in value ? value.phase : undefined),
    turnstileError: parseProvider('turnstileError' in value ? value.turnstileError : undefined),
  };
  if (value.profile === 'subscribe-error-v1') return { ...common, profile: value.profile };
  const operation = parseOperation('operation' in value ? value.operation : undefined);
  return value.profile === 'subscribe-error-v2' ? {
    ...common, profile: value.profile, operation,
  } : {
    ...common, profile: value.profile, operation,
    context: parseDiagnosticContext('context' in value ? value.context : undefined),
  };
}

export type SubscriptionPhase = 'idle' | 'verifying' | 'sending' | 'unknown';

export type TurnstileErrorEvidence =
  | { state: 'not-applicable' }
  | { state: 'not-provided' }
  | { state: 'invalid' }
  | { state: 'bounded-code'; code: string };

export type SubscriptionErrorEvidence =
  | { state: 'invalid' }
  | { state: 'unsupported-profile' }
  | {
    state: 'recorded';
    profile: 'subscribe-error-v1';
    phase: SubscriptionPhase;
    turnstileError: TurnstileErrorEvidence;
  };

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
): SubscriptionErrorEvidence {
  return {
    state: 'recorded', profile: 'subscribe-error-v1', phase,
    turnstileError: provider ? captureProviderCode(provider.errorCode) : { state: 'not-applicable' },
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
  if (!('profile' in value) || value.profile !== 'subscribe-error-v1') return { state: 'unsupported-profile' };
  return {
    state: 'recorded', profile: 'subscribe-error-v1',
    phase: parsePhase('phase' in value ? value.phase : undefined),
    turnstileError: parseProvider('turnstileError' in value ? value.turnstileError : undefined),
  };
}

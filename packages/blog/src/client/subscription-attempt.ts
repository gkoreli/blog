/** Browser-side attempt policy. No provider, DOM, transport or personal data lives here. */
export const SUBSCRIPTION_ATTEMPT_POLICY = {
  verificationMs: 30_000,
  interactionMs: 120_000,
  requestMs: 35_000,
  automaticRecoveries: 1,
} as const;

export type VerificationStep = 'waiting-api' | 'rendering' | 'ready' | 'executing' | 'interactive';

interface VerificationState {
  readonly phase: 'verifying';
  readonly step: VerificationStep;
  readonly deadlineAt: number;
  readonly recoveryCount: 0 | 1;
  readonly interactionWindowUsed: boolean;
}

interface SendingState {
  readonly phase: 'sending';
  readonly deadlineAt: number;
}

export type RequestObservation = 'accepted-response' | 'rejected-response' | 'response-unavailable';

export type SubscriptionAttemptState = VerificationState | SendingState | {
  readonly phase: 'settled';
  readonly outcome: RequestObservation | 'verification-failed';
};

/** One identity owns one verification lifecycle and, at most, one signup POST. */
export class SubscriptionAttempt {
  readonly id: string;
  readonly startedAt: number;
  #state: SubscriptionAttemptState;

  constructor(id: string, startedAt: number) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      throw new Error('Invalid subscription attempt identity');
    }
    if (!Number.isFinite(startedAt) || startedAt < 0) throw new Error('Invalid subscription attempt clock');
    this.id = id;
    this.startedAt = startedAt;
    this.#state = {
      phase: 'verifying', step: 'waiting-api',
      deadlineAt: startedAt + SUBSCRIPTION_ATTEMPT_POLICY.verificationMs,
      recoveryCount: 0, interactionWindowUsed: false,
    };
  }

  get state(): SubscriptionAttemptState { return this.#state; }

  expired(now: number): boolean {
    return this.#state.phase !== 'settled'
      && (!Number.isFinite(now) || now < this.startedAt || now >= this.#state.deadlineAt);
  }

  startRendering(now: number): boolean {
    if (this.#state.phase !== 'verifying' || this.#state.step !== 'waiting-api' || this.expired(now)) return false;
    this.#state = { ...this.#state, step: 'rendering' };
    return true;
  }

  rendered(now: number): boolean {
    if (this.#state.phase !== 'verifying' || this.#state.step !== 'rendering' || this.expired(now)) return false;
    this.#state = { ...this.#state, step: 'ready' };
    return true;
  }

  startExecution(now: number): boolean {
    if (this.#state.phase !== 'verifying' || this.#state.step !== 'ready' || this.expired(now)) return false;
    this.#state = { ...this.#state, step: 'executing' };
    return true;
  }

  beforeInteraction(now: number): boolean {
    if (this.#state.phase !== 'verifying'
      || (this.#state.step !== 'executing' && this.#state.step !== 'interactive') || this.expired(now)) return false;
    this.#state = {
      ...this.#state, step: 'interactive', interactionWindowUsed: true,
      deadlineAt: this.#state.interactionWindowUsed
        ? this.#state.deadlineAt : now + SUBSCRIPTION_ATTEMPT_POLICY.interactionMs,
    };
    return true;
  }

  afterInteraction(now: number): boolean {
    if (this.#state.phase !== 'verifying' || this.#state.step !== 'interactive' || this.expired(now)) return false;
    this.#state = { ...this.#state, step: 'executing' };
    return true;
  }

  recover(errorCode: unknown, now: number): boolean {
    if (this.#state.phase !== 'verifying' || this.#state.step === 'waiting-api'
      || this.#state.recoveryCount >= SUBSCRIPTION_ATTEMPT_POLICY.automaticRecoveries
      || this.expired(now) || !retryableVerificationError(errorCode)) return false;
    // A replacement widget belongs to this attempt and keeps its existing deadline.
    this.#state = { ...this.#state, step: 'waiting-api', recoveryCount: 1 };
    return true;
  }

  handoff(now: number): boolean {
    if (this.#state.phase !== 'verifying'
      || (this.#state.step !== 'executing' && this.#state.step !== 'interactive') || this.expired(now)) return false;
    this.#state = { phase: 'sending', deadlineAt: now + SUBSCRIPTION_ATTEMPT_POLICY.requestMs };
    return true;
  }

  failVerification(): boolean {
    if (this.#state.phase !== 'verifying') return false;
    this.#state = { phase: 'settled', outcome: 'verification-failed' };
    return true;
  }

  settleRequest(observation: RequestObservation, now: number): boolean {
    if (this.#state.phase !== 'sending' || (observation !== 'response-unavailable' && this.expired(now))) return false;
    this.#state = { phase: 'settled', outcome: observation };
    return true;
  }
}

/** Provider syntax is not an operator identity or a diagnosis of an internal suffix. */
export function retryableVerificationError(code: unknown): boolean {
  return typeof code === 'string' && (/^(300|600)[0-9]{3}$/.test(code)
    || code === '200500' || code === '110600' || code === '110620');
}

export function verificationToken(value: unknown):
  { readonly ok: true; readonly token: string } | { readonly ok: false; readonly reason: 'empty' | 'invalid' } {
  if (typeof value !== 'string' || value.length > 2048) return { ok: false, reason: 'invalid' };
  if (!value.trim()) return { ok: false, reason: 'empty' };
  // Tokens are opaque; do not normalize or log the provider's value.
  return { ok: true, token: value };
}

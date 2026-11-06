import type { ConfirmationAdmission, ConfirmationCommand, ConfirmationOutcome, ConfirmationReceipt, ConfirmationReservation, IssuedConfirmation } from './confirmation.js';
import type { ConfirmationDelivery, ConfirmationDeliveryDiagnostics } from './email.js';
import type { TurnstileVerification, VerificationFailureReason } from './turnstile.js';

/** Closed application observations; recipients, tokens and provider IDs are absent. */
export type ConfirmationObservation =
  | { stage: 'verification_failed'; reason: VerificationFailureReason; verifierStatus: number | null;
    verifierCodes: TurnstileVerification['errorCodes']; verifierAttempts: number;
    verifierElapsedMs: number; verifierRetryReason: TurnstileVerification['retryReason'] }
  | { stage: 'verification_passed'; verifierStatus: number | null; verifierAttempts: number;
    verifierElapsedMs: number; verifierRetryReason: TurnstileVerification['retryReason'] }
  | { stage: 'capacity_limited' | 'unchanged' | 'reserved' }
  | { stage: 'outcome_write_unconfirmed'; delivery: ConfirmationOutcome }
  | { stage: 'delivery_exception'; delivery: 'unknown'; receiptConfirmed: boolean }
  | { stage: ConfirmationOutcome; providerStatus: number | null; receiptConfirmed: boolean;
    deliveryAttempts: number; deliveryElapsedMs: number;
    deliveryRetryReason: ConfirmationDeliveryDiagnostics['retryReason'];
    deliveryStopReason: ConfirmationDeliveryDiagnostics['stopReason'] };

export interface ConfirmationPorts {
  verify(challengeToken: string): Promise<TurnstileVerification>;
  issue(): Promise<IssuedConfirmation>;
  admit(reservation: ConfirmationReservation): Promise<ConfirmationAdmission>;
  deliver(email: string, confirmationToken: string, unsubscribeToken: string, id: string): Promise<ConfirmationDelivery>;
  record(id: string, receipt: ConfirmationReceipt): Promise<void>;
  observe(event: ConfirmationObservation): void;
}

export type ConfirmationDecision =
  | 'verification-rejected' | 'verification-unavailable' | 'capacity'
  | 'unchanged' | 'accepted' | 'delivery-unconfirmed';

/** Orchestrate one intent. Only durable admission permits the external send. */
export async function requestConfirmation(command: ConfirmationCommand, ports: ConfirmationPorts): Promise<ConfirmationDecision> {
  const verification = await ports.verify(command.challengeToken);
  if (!verification.ok) {
    ports.observe({ stage: 'verification_failed', reason: verification.reason,
      verifierStatus: verification.httpStatus, verifierCodes: verification.errorCodes,
      verifierAttempts: verification.attempts, verifierElapsedMs: verification.elapsedMs,
      verifierRetryReason: verification.retryReason });
    return verification.kind === 'unavailable' ? 'verification-unavailable' : 'verification-rejected';
  }
  ports.observe({ stage: 'verification_passed', verifierStatus: verification.httpStatus,
    verifierAttempts: verification.attempts, verifierElapsedMs: verification.elapsedMs,
    verifierRetryReason: verification.retryReason });
  const issued = await ports.issue();
  const admission = await ports.admit({ id: command.id, email: command.email,
    tokenHash: issued.tokenHash, subscriberId: issued.subscriberId, unsubscribeToken: issued.unsubscribeToken,
    source: command.source, consentIp: command.consentIp, userAgent: command.userAgent, mode: command.mode });
  if (admission.decision === 'capacity') {
    ports.observe({ stage: 'capacity_limited' });
    return 'capacity';
  }
  if (admission.decision === 'unchanged') {
    ports.observe({ stage: 'unchanged' });
    return 'unchanged';
  }
  ports.observe({ stage: 'reserved' });
  let delivery: ConfirmationDelivery;
  try {
    delivery = await ports.deliver(command.email.value, issued.confirmationToken, admission.unsubscribeToken, command.id);
  } catch {
    // Even an unexpected adapter escape cannot prove that no external effect occurred.
    // Record only that uncertainty; provider attempts/status/timing are unobserved.
    let receiptConfirmed = true;
    try { await ports.record(command.id, { outcome: 'unknown', providerId: null, providerStatus: null }); }
    catch {
      receiptConfirmed = false;
      ports.observe({ stage: 'outcome_write_unconfirmed', delivery: 'unknown' });
    }
    ports.observe({ stage: 'delivery_exception', delivery: 'unknown', receiptConfirmed });
    return 'delivery-unconfirmed';
  }
  let receiptConfirmed = true;
  try { await ports.record(command.id, delivery); }
  catch {
    // A lost write acknowledgment does not revoke admission or permit another send.
    receiptConfirmed = false;
    ports.observe({ stage: 'outcome_write_unconfirmed', delivery: delivery.outcome });
  }
  ports.observe({ stage: delivery.outcome, providerStatus: delivery.providerStatus,
    receiptConfirmed, deliveryAttempts: delivery.diagnostics.attempts,
    deliveryElapsedMs: delivery.diagnostics.elapsedMs, deliveryRetryReason: delivery.diagnostics.retryReason,
    deliveryStopReason: delivery.diagnostics.stopReason });
  return delivery.outcome === 'accepted' ? 'accepted' : 'delivery-unconfirmed';
}

/** Confirmation language and policy, independent of HTTP, SQL and provider wire data. */
export type ConfirmationMode = 'subscribe' | 'resend';
export type ConfirmationOutcome = 'accepted' | 'failed' | 'unknown';
export type ConfirmationReceipt =
  | { outcome: 'accepted'; providerId: string; providerStatus: number }
  | { outcome: 'failed' | 'unknown'; providerId: null; providerStatus: number | null };

export const CONFIRMATION_LIMITS = {
  addressCooldown: 10 * 60,
  addressPerDay: 3,
  globalPerHour: 25,
  globalPerDay: 100,
  tokenLifetime: 24 * 60 * 60,
  retention: 7 * 24 * 60 * 60,
} as const;

/** This site's existing address policy, represented once as an immutable value. */
export class SubscriberAddress {
  private constructor(readonly value: string) { Object.freeze(this); }

  static parse(value: unknown): SubscriberAddress | null {
    if (typeof value !== 'string') return null;
    const normalized = value.trim().toLowerCase();
    return normalized.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
      ? new SubscriberAddress(normalized) : null;
  }
}

export interface ConfirmationCommand {
  id: string;
  email: SubscriberAddress;
  challengeToken: string;
  mode: ConfirmationMode;
  source: string | null;
  consentIp: string | null;
  userAgent: string | null;
}

export interface IssuedConfirmation {
  confirmationToken: string;
  tokenHash: string;
  subscriberId: string;
  unsubscribeToken: string;
}

export interface ConfirmationReservation {
  id: string;
  email: SubscriberAddress;
  tokenHash: string;
  subscriberId: string;
  unsubscribeToken: string;
  source: string | null;
  consentIp: string | null;
  userAgent: string | null;
  mode: ConfirmationMode;
}

export type ConfirmationAdmission =
  | { decision: 'admitted'; unsubscribeToken: string }
  | { decision: 'capacity' }
  | { decision: 'unchanged' };

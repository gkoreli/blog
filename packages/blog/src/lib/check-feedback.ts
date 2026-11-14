import { utcInstant } from '@gkoreli/time';

export interface FeedbackQuota { limit: number; remaining: number; resetAt: string; }
export interface CheckFeedback {
  tone: 'limited' | 'error' | 'loading' | 'ready';
  title: string;
  detail: string;
  meta?: string;
  alternatives?: boolean;
  resetAt?: string;
}

export function feedbackQuota(value: unknown): FeedbackQuota | null {
  if (typeof value !== 'object' || value === null || !('limit' in value) || !('remaining' in value) || !('resetAt' in value)) return null;
  if (typeof value.limit !== 'number' || !Number.isInteger(value.limit) || value.limit < 1 || value.limit > 1000000
    || typeof value.remaining !== 'number' || !Number.isInteger(value.remaining) || value.remaining < 0 || value.remaining > value.limit
    || typeof value.resetAt !== 'string') return null;
  try { return { limit: value.limit, remaining: value.remaining, resetAt: utcInstant(value.resetAt) }; }
  catch { return null; }
}

/** Keep the reset instant structured; presentation adapters own its timezone. */
export function failureFeedback(message: string, status: number, quota: unknown): CheckFeedback {
  const allowance = feedbackQuota(quota);
  if (status === 429 && allowance?.remaining === 0) {
    return { tone: 'limited', title: 'Daily limit reached', detail: 'Your network’s free checks reset', resetAt: allowance.resetAt, meta: `0 of ${allowance.limit} checks remaining`, alternatives: true };
  }
  return { tone: status === 429 ? 'limited' : 'error', title: status === 429 ? 'Give it a moment' : 'The check couldn’t finish', detail: message, alternatives: true };
}

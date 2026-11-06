export interface FeedbackQuota { limit: number; remaining: number; resetAt: string; }
export interface CheckFeedback {
  tone: 'limited' | 'error' | 'loading' | 'ready';
  title: string;
  detail: string;
  meta?: string;
  alternatives?: boolean;
}

export function feedbackQuota(value: unknown): FeedbackQuota | null {
  if (typeof value !== 'object' || value === null || !('limit' in value) || !('remaining' in value) || !('resetAt' in value)) return null;
  if (typeof value.limit !== 'number' || !Number.isInteger(value.limit) || value.limit < 1 || value.limit > 1000000
    || typeof value.remaining !== 'number' || !Number.isInteger(value.remaining) || value.remaining < 0 || value.remaining > value.limit
    || typeof value.resetAt !== 'string' || !Number.isFinite(Date.parse(value.resetAt))) return null;
  return { limit: value.limit, remaining: value.remaining, resetAt: value.resetAt };
}

/** The browser uses local time; server-rendered feedback names UTC explicitly. */
export function failureFeedback(message: string, status: number, quota: unknown, timeZone?: string): CheckFeedback {
  const allowance = feedbackQuota(quota);
  if (status === 429 && allowance?.remaining === 0) {
    const reset = new Date(allowance.resetAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short', ...(timeZone ? { timeZone } : {}) });
    return { tone: 'limited', title: 'Daily limit reached', detail: `Your network’s free checks reset ${reset}.`, meta: `0 of ${allowance.limit} checks remaining`, alternatives: true };
  }
  return { tone: status === 429 ? 'limited' : 'error', title: status === 429 ? 'Give it a moment' : 'The check couldn’t finish', detail: message, alternatives: true };
}

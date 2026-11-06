export const AI_CHECK_DAILY_LIMIT = 10;

export interface CheckQuota {
  limit: number;
  remaining: number;
  resetAt: string;
}

export interface QuotaStore {
  consume(key: string, day: string, resetAt: number): Promise<number | null>;
}

export const CONSUME_QUOTA_SQL = `INSERT INTO ai_check_daily_quota (caller_key, utc_day, used, reset_at)
VALUES (?, ?, 1, ?)
ON CONFLICT (caller_key, utc_day) DO UPDATE SET used = used + 1
WHERE used < 10 RETURNING used`;

export function d1QuotaStore(db: D1Database): QuotaStore {
  return {
    async consume(key, day, resetAt) {
      const row = await db.prepare(CONSUME_QUOTA_SQL).bind(key, day, resetAt).first<{ used: number }>();
      if (row === null) return null;
      if (!Number.isInteger(row.used) || row.used < 1 || row.used > AI_CHECK_DAILY_LIMIT) throw new Error('quota-state-invalid');
      return row.used;
    },
  };
}

/** Purpose/day separation prevents joining this admission token to analytics IDs. */
export async function quotaCallerKey(secret: string, ip: string, day: string): Promise<string> {
  if (!secret || !ip) throw new Error('quota-identity-unavailable');
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const digest = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(JSON.stringify(['ai-check-quota-v1', day, ip]))));
  return [...digest].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function admitCheck(store: QuotaStore, callerKey: string, now = new Date()): Promise<{ allowed: boolean; quota: CheckQuota }> {
  const day = now.toISOString().slice(0, 10);
  const resetAt = Date.parse(`${day}T00:00:00.000Z`) + 86_400_000;
  const used = await store.consume(callerKey, day, resetAt);
  return {
    allowed: used !== null,
    quota: { limit: AI_CHECK_DAILY_LIMIT, remaining: used === null ? 0 : AI_CHECK_DAILY_LIMIT - used, resetAt: new Date(resetAt).toISOString() },
  };
}

/** Admission rows become cleanup-eligible one day after their allowance resets. */
export async function purgeCheckQuota(db: D1Database, now = Date.now()): Promise<void> {
  await db.prepare('DELETE FROM ai_check_daily_quota WHERE reset_at < ?').bind(now - 86_400_000).run();
}

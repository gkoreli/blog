/**
 * db.ts — D1 types and query helpers for newsletter subscribers.
 *
 * All queries use parameterised bindings — no string interpolation into SQL.
 * Confirmation tokens are stored as SHA-256 hashes; unsubscribe tokens are raw
 * so later newsletters can include stable opt-out links while the row is retained.
 * See tokens.ts for generateToken() / hashToken() / truncateIp().
 */

export interface NewsletterEnv {
  /** Shared D1 binding — same as analytics (blog-analytics database). */
  DB: D1Database;
  RESEND_API_KEY: string;
  TURNSTILE_SECRET_KEY: string;
  /** Public signup fails unavailable when the native limiter is missing. */
  SUBSCRIBE_RATE_LIMITER?: RateLimit;
  /** Svix signing secret from Resend dashboard (for webhook verification). */
  RESEND_WEBHOOK_SECRET?: string;
  /** Bearer token for POST /api/send (admin newsletter send). Optional — returns 501 if unset. */
  ADMIN_SECRET?: string;
}

export type SubscriberStatus = 'pending' | 'active' | 'unsubscribed' | 'bounced';

export interface Subscriber {
  id: string;
  email: string;
  status: SubscriberStatus;
  /** SHA-256 hash of the raw confirm token. NULL after confirmation. */
  confirm_token: string | null;
  /** ISO datetime; NULL after confirmation. */
  confirm_token_expires_at: string | null;
  /**
   * Raw (unhashed) unsubscribe token — stable while the subscriber row is retained.
   *
   * Design note: confirm tokens are hashed before storage because they grant account
   * activation (a D1 breach must not yield usable confirm URLs). Unsubscribe tokens
   * grant opt-out only — low-stakes — and must be included verbatim in every newsletter
   * footer URL. Storing raw allows building the URL without a round-trip decode.
   */
  unsubscribe_token: string;
  source: string | null;
  /** Truncated signup-request IP, e.g. "1.2.3.x"; not an authenticated identity. */
  consent_ip: string | null;
  /** User-Agent at signup time, truncated to 512 chars. For abuse pattern detection. */
  user_agent: string | null;
  created_at: string; // First stored request; confirmed_at records the latest activation.
  confirmed_at: string | null;
  unsubscribed_at: string | null;
  bounced_at: string | null;
  suppression_reason: 'bounce' | 'complaint' | 'confirmation-opt-out' | 'legacy-inactive' | null;
}

export interface DeliveryLog {
  id: string;
  campaign_id: string;
  sub_id: string;
  email: string;
  status: 'sent' | 'failed';
  resend_id: string | null;
  error: string | null;
  sent_at: string;
}

/** Chosen confirmation-token lifetime for this blog. */
export const CONFIRM_TOKEN_TTL_HOURS = 24;

/** Blog retention policy; deleting these rows also removes their suppression state. */
export const UNSUBSCRIBED_RETENTION_DAYS = 90;

// ── Reads ─────────────────────────────────────────────────────────────────────

export async function findByEmail(db: D1Database, email: string): Promise<Subscriber | null> {
  return db.prepare('SELECT * FROM subscribers WHERE email = ?').bind(email).first<Subscriber>();
}

/**
 * Look up a subscriber by their hashed confirm token, regardless of expiry.
 * Used to distinguish "token expired" from "token not found / already confirmed".
 * Parameter: SHA-256 hash of the raw token (not the raw token itself).
 */
export async function findByConfirmTokenHash(
  db: D1Database,
  tokenHash: string,
): Promise<(Subscriber & { token_valid: number }) | null> {
  return db
    .prepare(`SELECT *, CASE WHEN (confirm_token = ? AND confirm_token_expires_at > datetime('now'))
      OR EXISTS (SELECT 1 FROM confirmation_attempts WHERE email = subscribers.email
        AND token_hash = ? AND revoked = 0 AND expires_at > unixepoch())
      THEN 1 ELSE 0 END AS token_valid
      FROM subscribers WHERE confirm_token = ? OR email IN (
      SELECT email FROM confirmation_attempts WHERE token_hash = ?
    )`)
    .bind(tokenHash, tokenHash, tokenHash, tokenHash)
    .first<Subscriber & { token_valid: number }>();
}

// ── Writes ────────────────────────────────────────────────────────────────────

/**
 * Atomically mark subscriber active and clear the one-time confirm token.
 * WHERE clause enforces: token match + pending status + within 24-hour window.
 * Parameter: SHA-256 hash of the raw token from the URL.
 * Returns true if a row was updated (successful first confirmation).
 */
export async function confirmSubscriber(db: D1Database, tokenHash: string, email: string): Promise<boolean> {
  const result = await db.batch([
    db.prepare(`UPDATE subscribers
      SET status = 'active', confirmed_at = datetime('now'),
          confirm_token = NULL, confirm_token_expires_at = NULL
      WHERE email = ? AND status = 'pending' AND suppression_reason IS NULL
        AND ((confirm_token = ? AND confirm_token_expires_at > datetime('now'))
          OR EXISTS (SELECT 1 FROM confirmation_attempts
            WHERE email = subscribers.email AND token_hash = ?
              AND revoked = 0 AND expires_at > unixepoch()))
    `).bind(email, tokenHash, tokenHash),
    // A failed replay against a NEW pending cycle must not revoke its tokens.
    db.prepare(`UPDATE confirmation_attempts SET revoked = 1 WHERE email = ?
      AND EXISTS (SELECT 1 FROM subscribers WHERE email = ? AND status = 'active')
    `).bind(email, email),
  ]);
  return (result[0]?.meta.changes ?? 0) > 0;
}

/**
 * Unsubscribe via the stable raw unsubscribe token from the email footer URL.
 * Token is stored raw (not hashed) — see Subscriber.unsubscribe_token for rationale.
 */
export async function unsubscribeByToken(
  db: D1Database,
  rawToken: string,
  blockConfirmations = false,
): Promise<boolean> {
  const result = await db.batch([
    db.prepare(`UPDATE confirmation_attempts SET revoked = 1
      WHERE email IN (SELECT email FROM subscribers WHERE unsubscribe_token = ?)
    `).bind(rawToken),
    db.prepare(`UPDATE subscribers
      SET status = CASE WHEN status = 'bounced' THEN status ELSE 'unsubscribed' END,
        unsubscribed_at = CASE WHEN status NOT IN ('unsubscribed', 'bounced')
          OR (? = 1 AND suppression_reason IS NULL) THEN datetime('now') ELSE unsubscribed_at END,
        confirm_token = NULL, confirm_token_expires_at = NULL,
        suppression_reason = CASE WHEN ? = 1
          THEN COALESCE(suppression_reason, 'confirmation-opt-out') ELSE suppression_reason END
      WHERE unsubscribe_token = ?
    `).bind(blockConfirmations ? 1 : 0, blockConfirmations ? 1 : 0, rawToken),
  ]);
  return (result[1]?.meta.changes ?? 0) > 0;
}

/** Hard bounce: address is undeliverable. Called from Resend webhook. */
export async function markBounced(db: D1Database, email: string): Promise<void> {
  await db.batch([
    db.prepare('UPDATE confirmation_attempts SET revoked = 1 WHERE email = ?').bind(email),
    db.prepare(`UPDATE subscribers SET status = 'bounced', bounced_at = datetime('now'),
      suppression_reason = COALESCE(suppression_reason, 'bounce'),
      confirm_token = NULL, confirm_token_expires_at = NULL WHERE email = ?`).bind(email),
  ]);
}

/**
 * Suppress newsletter and confirmation mail after a signed email.complained event.
 */
export async function markComplained(db: D1Database, email: string): Promise<void> {
  await db.batch([
    db.prepare('UPDATE confirmation_attempts SET revoked = 1 WHERE email = ?').bind(email),
    db.prepare(`UPDATE subscribers SET status = 'unsubscribed', unsubscribed_at = datetime('now'),
      suppression_reason = 'complaint', confirm_token = NULL, confirm_token_expires_at = NULL
      WHERE email = ?`).bind(email),
  ]);
}

// ── Maintenance (cron) ────────────────────────────────────────────────────────

/** Delete pending subscribers whose confirm token has expired. Returns rows deleted. */
export async function purgeExpiredPending(db: D1Database): Promise<number> {
  const result = await db
    .prepare(
      `DELETE FROM subscribers
       WHERE status = 'pending' AND confirm_token_expires_at < datetime('now')`,
    )
    .run();
  return result.meta.changes ?? 0;
}

/**
 * Apply this blog's inactive-row retention policy, including suppression state.
 * Each status uses its own event timestamp:
 *   unsubscribed → unsubscribed_at
 *   bounced      → bounced_at
 * Returns rows deleted.
 */
export async function purgeOldInactive(db: D1Database): Promise<number> {
  const result = await db
    .prepare(
      `DELETE FROM subscribers
       WHERE (status = 'unsubscribed' AND unsubscribed_at < datetime('now', '-${UNSUBSCRIBED_RETENTION_DAYS} days'))
          OR (status = 'bounced'      AND bounced_at      < datetime('now', '-${UNSUBSCRIBED_RETENTION_DAYS} days'))`,
    )
    .run();
  return result.meta.changes ?? 0;
}

// ── Newsletter send ───────────────────────────────────────────────────────────

/** Fetch all active subscribers for a newsletter send. */
export async function getActiveSubscribers(db: D1Database): Promise<Subscriber[]> {
  const result = await db
    .prepare(`SELECT * FROM subscribers WHERE status = 'active' ORDER BY confirmed_at ASC`)
    .all<Subscriber>();
  return result.results;
}

/**
 * Returns true if any delivery_log rows exist for this campaign_id.
 * Used for idempotency: prevent duplicate sends on retry.
 */
export async function campaignExists(db: D1Database, campaignId: string): Promise<boolean> {
  const row = await db
    .prepare(`SELECT 1 FROM delivery_logs WHERE campaign_id = ? LIMIT 1`)
    .bind(campaignId)
    .first<{ 1: number }>();
  return row !== null;
}

/** Insert a delivery log row. Called after each Resend batch response. */
export async function insertDeliveryLog(db: D1Database, log: DeliveryLog): Promise<void> {
  await db
    .prepare(
      `INSERT INTO delivery_logs (id, campaign_id, sub_id, email, status, resend_id, error, sent_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    )
    .bind(log.id, log.campaign_id, log.sub_id, log.email, log.status, log.resend_id, log.error)
    .run();
}

/** Bulk insert delivery log rows in a single statement (up to 100 per batch). */
export async function insertDeliveryLogs(db: D1Database, logs: DeliveryLog[]): Promise<void> {
  if (logs.length === 0) return;
  // D1 batch() executes multiple prepared statements atomically
  await db.batch(
    logs.map(log =>
      db
        .prepare(
          `INSERT INTO delivery_logs (id, campaign_id, sub_id, email, status, resend_id, error, sent_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        )
        .bind(log.id, log.campaign_id, log.sub_id, log.email, log.status, log.resend_id, log.error),
    ),
  );
}

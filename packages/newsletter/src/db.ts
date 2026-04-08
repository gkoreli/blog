/**
 * db.ts — D1 types and query helpers for newsletter subscribers.
 *
 * All queries use parameterised bindings — no string interpolation into SQL.
 * Token values stored here are SHA-256 hashes; raw tokens live only in email URLs.
 * See tokens.ts for generateToken() / hashToken() / truncateIp().
 */

export interface NewsletterEnv {
  /** Shared D1 binding — same as analytics (blog-analytics database). */
  DB: D1Database;
  RESEND_API_KEY: string;
  TURNSTILE_SECRET_KEY: string;
  /** Native Workers Rate Limiting binding (free tier). Optional — skipped in local dev. */
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
   * Raw (unhashed) permanent unsubscribe token — 256-bit hex string.
   *
   * Design note: confirm tokens are hashed before storage because they grant account
   * activation (a D1 breach must not yield usable confirm URLs). Unsubscribe tokens
   * grant opt-out only — low-stakes — and must be included verbatim in every newsletter
   * footer URL. Storing raw allows building the URL without a round-trip decode.
   */
  unsubscribe_token: string;
  source: string | null;
  /** Truncated IP for GDPR consent proof, e.g. "1.2.3.x". */
  consent_ip: string | null;
  /** User-Agent at signup time, truncated to 512 chars. For abuse pattern detection. */
  user_agent: string | null;
  created_at: string; // = consent timestamp
  confirmed_at: string | null;
  unsubscribed_at: string | null;
  bounced_at: string | null;
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

/** Confirm-token lifetime: 24 hours — industry standard for double opt-in. */
export const CONFIRM_TOKEN_TTL_HOURS = 24;

/** GDPR data-minimisation: delete unsubscribed/bounced rows after this many days. */
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
): Promise<Subscriber | null> {
  return db
    .prepare('SELECT * FROM subscribers WHERE confirm_token = ?')
    .bind(tokenHash)
    .first<Subscriber>();
}

// ── Writes ────────────────────────────────────────────────────────────────────

export async function insertSubscriber(
  db: D1Database,
  id: string,
  email: string,
  confirmTokenHash: string,
  rawUnsubscribeToken: string,
  source: string | null,
  consentIp: string | null,
  userAgent: string | null,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO subscribers
         (id, email, confirm_token, confirm_token_expires_at, unsubscribe_token, source, consent_ip, user_agent)
       VALUES
         (?, ?, ?, datetime('now', '+${CONFIRM_TOKEN_TTL_HOURS} hours'), ?, ?, ?, ?)`,
    )
    .bind(id, email, confirmTokenHash, rawUnsubscribeToken, source, consentIp, userAgent)
    .run();
}

/**
 * Refresh tokens for a pending subscriber re-submitting the form.
 * Resets the 24-hour expiry window and updates the consent IP.
 */
export async function refreshPendingTokens(
  db: D1Database,
  email: string,
  confirmTokenHash: string,
  rawUnsubscribeToken: string,
  consentIp: string | null,
  userAgent: string | null,
): Promise<void> {
  await db
    .prepare(
      `UPDATE subscribers
       SET confirm_token            = ?,
           confirm_token_expires_at = datetime('now', '+${CONFIRM_TOKEN_TTL_HOURS} hours'),
           unsubscribe_token        = ?,
           consent_ip               = ?,
           user_agent               = ?,
           created_at               = datetime('now')
       WHERE email = ? AND status = 'pending'`,
    )
    .bind(confirmTokenHash, rawUnsubscribeToken, consentIp, userAgent, email)
    .run();
}

/**
 * Atomically mark subscriber active and clear the one-time confirm token.
 * WHERE clause enforces: token match + pending status + within 24-hour window.
 * Parameter: SHA-256 hash of the raw token from the URL.
 * Returns true if a row was updated (successful first confirmation).
 */
export async function confirmSubscriber(db: D1Database, tokenHash: string): Promise<boolean> {
  const result = await db
    .prepare(
      `UPDATE subscribers
       SET status                   = 'active',
           confirmed_at             = datetime('now'),
           confirm_token            = NULL,
           confirm_token_expires_at = NULL
       WHERE confirm_token            = ?
         AND status                   = 'pending'
         AND confirm_token_expires_at > datetime('now')`,
    )
    .bind(tokenHash)
    .run();
  return (result.meta.changes ?? 0) > 0;
}

/**
 * Unsubscribe via the permanent raw unsubscribe token from the email footer URL.
 * Token is stored raw (not hashed) — see Subscriber.unsubscribe_token for rationale.
 */
export async function unsubscribeByToken(
  db: D1Database,
  rawToken: string,
): Promise<boolean> {
  const result = await db
    .prepare(
      `UPDATE subscribers
       SET status          = 'unsubscribed',
           unsubscribed_at = datetime('now')
       WHERE unsubscribe_token = ? AND status NOT IN ('unsubscribed', 'bounced')`,
    )
    .bind(rawToken)
    .run();
  return (result.meta.changes ?? 0) > 0;
}

/** Hard bounce: address is undeliverable. Called from Resend webhook. */
export async function markBounced(db: D1Database, email: string): Promise<void> {
  await db
    .prepare(
      `UPDATE subscribers SET status = 'bounced', bounced_at = datetime('now')
       WHERE email = ? AND status = 'active'`,
    )
    .bind(email)
    .run();
}

/**
 * Spam complaint: CAN-SPAM mandates immediate unsubscribe.
 * Called from Resend webhook on email.complained event.
 */
export async function markComplained(db: D1Database, email: string): Promise<void> {
  await db
    .prepare(
      `UPDATE subscribers
       SET status = 'unsubscribed', unsubscribed_at = datetime('now')
       WHERE email = ? AND status NOT IN ('unsubscribed', 'bounced')`,
    )
    .bind(email)
    .run();
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
 * GDPR Art. 5(1)(e) — data minimisation: delete rows where personal data
 * (email) is no longer needed. Each status uses its own event timestamp:
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

import type { ServerClientErrorEvent } from './types.js';
import { parseSubscriptionErrorEvidence } from './subscription-evidence.js';

export interface ClientObservabilityEnv {
  DB: D1Database;
  /** Separate, approximate per-location diagnostic budget; unavailable means no ingestion. */
  CLIENT_ERROR_RATE_LIMITER?: RateLimit;
}

const INSERT = `INSERT INTO client_errors
  (id, type, message, path, referrer, component, status, source, line, column, stack, user_agent, build_id, ray, country, colo, as_organization, occurred_at, subscription_evidence)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

export async function recordClientError(db: D1Database, event: ServerClientErrorEvent): Promise<void> {
  const subscription = event.type === 'interaction_error' && event.component === 'subscribe_form'
    ? parseSubscriptionErrorEvidence(event.subscriptionEvidence) : undefined;
  const occurred = Date.parse(event.occurredAt);
  const result = await db.prepare(INSERT).bind(
    event.id,
    event.type,
    event.message,
    event.path,
    event.referrer ?? null,
    event.component ?? null,
    event.status ?? null,
    event.source ?? null,
    event.line ?? null,
    event.column ?? null,
    event.stack ?? null,
    event.userAgent ?? null,
    event.buildId ?? null,
    event.ray,
    event.country,
    event.colo,
    event.asOrganization,
    Number.isFinite(occurred) ? new Date(occurred).toISOString() : null,
    subscription === undefined ? null : JSON.stringify(subscription),
  ).run();
  if (result.success !== true || result.meta.changes !== 1) {
    throw new Error('client_error_write_unconfirmed', {
      cause: {
        resultStatus: result.success === true ? 'success' : 'not-successful',
        affectedRows: Number.isSafeInteger(result.meta.changes) && result.meta.changes >= 0
          ? result.meta.changes : null,
      },
    });
  }
}

export async function purgeOldClientErrors(db: D1Database): Promise<number> {
  const result = await db
    .prepare(`DELETE FROM client_errors WHERE created_at < datetime('now', '-30 days')`)
    .run();
  return result.meta.changes ?? 0;
}

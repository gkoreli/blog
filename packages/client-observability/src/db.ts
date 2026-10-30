import type { ServerClientErrorEvent } from './types.js';
import { parseSubscriptionErrorEvidence } from './subscription-evidence.js';
import { SANITIZATION_PROFILE, ADMISSION_PROFILE } from './sanitization.js';
import { parseClientErrorPayload } from './schema.js';

export interface ClientObservabilityEnv {
  DB: D1Database;
  /** Separate, approximate per-location diagnostic budget; unavailable means no ingestion. */
  CLIENT_ERROR_RATE_LIMITER?: RateLimit;
}

const INSERT = `INSERT INTO client_errors
  (id, type, message, path, referrer, component, status, source, line, column, stack, user_agent, build_id, ray, country, colo, as_organization, occurred_at, subscription_evidence, processing_evidence)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

export async function recordClientError(db: D1Database, event: ServerClientErrorEvent): Promise<void> {
  const clean = parseClientErrorPayload(event, event.requestOrigin);
  if (!clean) throw new Error('client_error_payload_invalid');
  const subscription = clean.type === 'interaction_error' && clean.component === 'subscribe_form'
    ? parseSubscriptionErrorEvidence(clean.subscriptionEvidence) : undefined;
  const processing = {
    profile: 'client-error-processing-v1', sanitization: SANITIZATION_PROFILE,
    admission: event.admissionProfile === ADMISSION_PROFILE ? ADMISSION_PROFILE : 'unassessed',
  };
  const occurred = Date.parse(clean.occurredAt);
  const result = await db.prepare(INSERT).bind(
    event.id,
    clean.type,
    clean.message,
    clean.path,
    clean.referrer ?? null,
    clean.component ?? null,
    clean.status ?? null,
    clean.source ?? null,
    clean.line ?? null,
    clean.column ?? null,
    clean.stack ?? null,
    clean.userAgent ?? null,
    clean.buildId ?? null,
    event.ray,
    event.country,
    event.colo,
    event.asOrganization,
    Number.isFinite(occurred) ? new Date(occurred).toISOString() : null,
    subscription === undefined ? null : JSON.stringify(subscription),
    JSON.stringify(processing),
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

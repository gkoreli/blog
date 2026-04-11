import type { ServerClientErrorEvent } from './types.js';

export interface ClientObservabilityEnv {
  DB: D1Database;
}

const INSERT = `INSERT INTO client_errors
  (id, type, message, path, referrer, component, status, source, line, column, stack, user_agent, build_id, ray, country, colo, as_organization)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

export async function recordClientError(db: D1Database, event: ServerClientErrorEvent): Promise<void> {
  await db.prepare(INSERT).bind(
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
  ).run();
}

export async function purgeOldClientErrors(db: D1Database): Promise<number> {
  const result = await db
    .prepare(`DELETE FROM client_errors WHERE created_at < datetime('now', '-30 days')`)
    .run();
  return result.meta.changes ?? 0;
}

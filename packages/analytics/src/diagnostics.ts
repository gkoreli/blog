import type { RequestDiagnosticInputs } from './request-evidence.js';
import { REQUEST_EVIDENCE_VERSION } from './request-evidence.js';

import { DIAGNOSTIC_RETENTION_DAYS } from './contracts.js';
export { DIAGNOSTIC_RETENTION_DAYS } from './contracts.js';
export const MAX_DIAGNOSTIC_BYTES = 4096;

export interface ObservationDiagnostic extends RequestDiagnosticInputs {
  operationId: string;
  requestRayId: string | null;
  verifierProfile: string;
  signatureOutcome: 'absent' | 'verified' | 'unverified';
  signatureReason: string | null;
}

export function diagnosticExpiry(observedAt: string): string {
  const date = new Date(`${observedAt.replace(' ', 'T')}Z`);
  if (!Number.isFinite(date.getTime())) throw new Error('Invalid diagnostic observation time');
  date.setUTCDate(date.getUTCDate() + DIAGNOSTIC_RETENTION_DAYS);
  return date.toISOString().replace('T', ' ').slice(0, 19);
}

/** Optional diagnostics never get their own public HTTP route. */
export function allowsDiagnostics(mode: string | undefined, request: Request): boolean {
  if (mode !== 'private-v1') return false;
  // Voluntary stronger product policy; GPC's legal scope is sale/sharing.
  if (request.headers.get('Sec-GPC')?.trim() === '1' || request.headers.get('DNT')?.trim() === '1') return false;
  return true;
}

export async function recordDiagnostic(
  db: D1Database,
  observationId: number,
  observedAt: string,
  diagnostic: ObservationDiagnostic,
): Promise<void> {
  if (!Number.isSafeInteger(observationId) || observationId < 1) throw new Error('Invalid diagnostic observation reference');
  const payload = JSON.stringify(diagnostic);
  if (new TextEncoder().encode(payload).byteLength > MAX_DIAGNOSTIC_BYTES) throw new Error('Diagnostic exceeds its byte budget');
  await db.prepare(`INSERT INTO page_observation_diagnostics
    (observation_id, evidence_version, captured_at, expires_at, payload)
    VALUES (?, ?, ?, ?, ?)`)
    .bind(observationId, REQUEST_EVIDENCE_VERSION, observedAt, diagnosticExpiry(observedAt), payload).run();
}

/** Read-side expiry is enforced before exposing even private source evidence. */
export async function readRecentDiagnostics(db: D1Database, now = new Date(), limit = 25): Promise<unknown[]> {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error('Diagnostic limit must be between 1 and 100');
  const cutoff = now.toISOString().replace('T', ' ').slice(0, 19);
  const result = await db.prepare(`SELECT observation_id, evidence_version, captured_at, expires_at, payload
    FROM page_observation_diagnostics WHERE expires_at > ? ORDER BY expires_at DESC LIMIT ?`)
    .bind(cutoff, limit).all();
  return result.results;
}

/** At most 10,000 indexed deletions per scheduled invocation; expose backlog. */
export async function purgeExpiredDiagnostics(db: D1Database, now = new Date()): Promise<{ deleted: number; atLimit: boolean }> {
  const cutoff = now.toISOString().replace('T', ' ').slice(0, 19);
  let deleted = 0;
  for (let iteration = 0; iteration < 10; iteration++) {
    const result = await db.prepare(`DELETE FROM page_observation_diagnostics WHERE observation_id IN (
      SELECT observation_id FROM page_observation_diagnostics WHERE expires_at <= ? ORDER BY expires_at LIMIT 1000
    )`).bind(cutoff).run();
    const changes = result.meta.changes ?? 0;
    deleted += changes;
    if (changes < 1000) return { deleted, atLimit: false };
  }
  return { deleted, atLimit: true };
}

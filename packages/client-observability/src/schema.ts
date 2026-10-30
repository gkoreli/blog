import type { ClientErrorEvent, ClientErrorType } from './types.js';
import { parseSubscriptionErrorEvidence } from './subscription-evidence.js';
import { sanitizeClientError } from './sanitization.js';

// Do not truncate a URL into a different parseable authority before scrubbing it.
// HTTP ingestion already bounds the whole body; direct/browser callers get the same field cap.
const MAX_INPUT = 8 * 1024;
const MAX_COMPONENT = 80;
const MAX_UA = 512;
const MAX_BUILD_ID = 80;

function errorType(value: unknown): ClientErrorType | null {
  if (value === 'window_error') return value;
  if (value === 'unhandled_rejection') return value;
  if (value === 'interaction_error') return value;
  return null;
}

function stringField(value: unknown, max: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim().slice(0, max);
  return trimmed || undefined;
}

function rawField(value: unknown): string | undefined {
  return typeof value === 'string' && value.length <= MAX_INPUT ? value.trim() || undefined : undefined;
}

function numberField(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : undefined;
}

function statusField(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value >= 100 && value <= 599
    ? value
    : undefined;
}

function dateField(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : undefined;
}

export function parseClientErrorPayload(raw: unknown, origin?: string): ClientErrorEvent | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const type = 'type' in raw ? errorType(raw.type) : null;
  if (!type) return null;

  const message = 'message' in raw ? rawField(raw.message) : undefined;
  const path = 'path' in raw ? rawField(raw.path) : undefined;
  const occurredAt = 'occurredAt' in raw ? dateField(raw.occurredAt) : undefined;
  if (!message || !path || !path.startsWith('/') || !occurredAt) return null;
  const component = 'component' in raw ? stringField(raw.component, MAX_COMPONENT) : undefined;

  return sanitizeClientError({
    type,
    message,
    path,
    occurredAt,
    referrer: 'referrer' in raw ? rawField(raw.referrer) : undefined,
    component,
    status: 'status' in raw ? statusField(raw.status) : undefined,
    source: 'source' in raw ? rawField(raw.source) : undefined,
    line: 'line' in raw ? numberField(raw.line) : undefined,
    column: 'column' in raw ? numberField(raw.column) : undefined,
    stack: 'stack' in raw ? rawField(raw.stack) : undefined,
    userAgent: 'userAgent' in raw ? stringField(raw.userAgent, MAX_UA) : undefined,
    buildId: 'buildId' in raw ? stringField(raw.buildId, MAX_BUILD_ID) : undefined,
    subscriptionEvidence: type === 'interaction_error' && component === 'subscribe_form'
      ? parseSubscriptionErrorEvidence('subscriptionEvidence' in raw ? raw.subscriptionEvidence : undefined)
      : undefined,
  }, origin);
}

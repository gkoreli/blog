import type { ClientErrorEvent, ClientErrorType } from './types.js';

const TYPES = new Set<ClientErrorType>(['window_error', 'unhandled_rejection', 'interaction_error']);
const MAX_MESSAGE = 500;
const MAX_PATH = 200;
const MAX_REFERRER = 200;
const MAX_COMPONENT = 80;
const MAX_SOURCE = 200;
const MAX_STACK = 2_000;
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

export function parseClientErrorPayload(raw: unknown): ClientErrorEvent | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const type = 'type' in raw ? errorType(raw.type) : null;
  if (!type) return null;

  const message = 'message' in raw ? stringField(raw.message, MAX_MESSAGE) : undefined;
  const path = 'path' in raw ? stringField(raw.path, MAX_PATH) : undefined;
  const occurredAt = 'occurredAt' in raw ? dateField(raw.occurredAt) : undefined;
  if (!message || !path || !path.startsWith('/') || !occurredAt) return null;

  return {
    type,
    message,
    path: path.split(/[?#]/)[0] ?? path,
    occurredAt,
    referrer: 'referrer' in raw ? stringField(raw.referrer, MAX_REFERRER) : undefined,
    component: 'component' in raw ? stringField(raw.component, MAX_COMPONENT) : undefined,
    status: 'status' in raw ? statusField(raw.status) : undefined,
    source: 'source' in raw ? stringField(raw.source, MAX_SOURCE) : undefined,
    line: 'line' in raw ? numberField(raw.line) : undefined,
    column: 'column' in raw ? numberField(raw.column) : undefined,
    stack: 'stack' in raw ? stringField(raw.stack, MAX_STACK) : undefined,
    userAgent: 'userAgent' in raw ? stringField(raw.userAgent, MAX_UA) : undefined,
    buildId: 'buildId' in raw ? stringField(raw.buildId, MAX_BUILD_ID) : undefined,
  };
}

import type { ClientErrorEvent } from './types.js';

export const SANITIZATION_PROFILE = 'client-error-urls-v1';
export const ADMISSION_PROFILE = 'origin-route-budget-v1';
const UNSUPPORTED_SOURCE = '[unsupported-source]';
const FILTERED_URL = '[filtered-url]';

/** Project routes whose path segments are bearer tokens, independently of query strings. */
function tokenPath(path: string): string {
  let decoded: string;
  try { decoded = decodeURIComponent(path); } catch { decoded = path; }
  const match = /^\/api\/(confirm|unsubscribe)\//.exec(decoded);
  return match ? `/api/${match[1]}/[redacted]` : path;
}

function pathField(raw: string): string | null {
  const path = raw.trim().split(/[?#]/)[0] ?? '';
  if (!path.startsWith('/') || path.startsWith('//') || /[\u0000-\u001f\u007f]/.test(path)) return null;
  return tokenPath(path).slice(0, 200);
}

function httpUrl(raw: string): URL | null {
  try {
    const url = new URL(raw);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null;
  } catch { return null; }
}

function cleanUrl(url: URL): string {
  // origin excludes userinfo; only the path survives, never query or fragment.
  return url.origin + tokenPath(url.pathname);
}

function sourceField(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  if (raw === UNSUPPORTED_SOURCE) return raw;
  if (raw.startsWith('/') && !raw.startsWith('//')) return pathField(raw) ?? UNSUPPORTED_SOURCE;
  const url = httpUrl(raw);
  return url ? cleanUrl(url).slice(0, 200) : UNSUPPORTED_SOURCE;
}

function referrerField(raw: string | undefined, origin: string | undefined): string | undefined {
  if (!raw) return undefined;
  const url = httpUrl(raw);
  if (!url) return undefined;
  return (url.origin === origin ? cleanUrl(url) : url.origin).slice(0, 200);
}

/** Structural URL scrubbing, not a detector for arbitrary personal data or secrets. */
function textField(raw: string | undefined, max: number): string | undefined {
  if (!raw) return undefined;
  const text = raw.replace(/\b(?:https?:\/\/|(?:data|file|blob|javascript|mailto):)[^\s<>"'`)]+/gi, match => {
    const url = httpUrl(match);
    return url ? cleanUrl(url) : FILTERED_URL;
  }).replace(/\/api\/(confirm|unsubscribe)\/[^\s/?#)]+/g, '/api/$1/[redacted]');
  return text.trim().slice(0, max) || undefined;
}

/** Idempotent field boundary, applied before console logging and again at storage. */
export function sanitizeClientError(event: ClientErrorEvent, origin?: string): ClientErrorEvent | null {
  const path = pathField(event.path);
  const message = textField(event.message, 500);
  if (!path || !message) return null;
  const component = event.component?.trim();
  return {
    type: event.type, path, message, occurredAt: event.occurredAt,
    status: event.status, line: event.line, column: event.column,
    userAgent: event.userAgent, buildId: event.buildId,
    subscriptionEvidence: event.subscriptionEvidence,
    component: component && component.length <= 80 && /^[a-z0-9_-]+$/.test(component) ? component : undefined,
    referrer: referrerField(event.referrer, origin),
    source: sourceField(event.source),
    stack: textField(event.stack, 2_000),
  };
}

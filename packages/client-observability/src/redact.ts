import type { ClientContext, ClientErrorEvent, ClientErrorInput } from './types.js';

const MAX_MESSAGE = 500;
const MAX_PATH = 200;
const MAX_REFERRER = 200;
const MAX_COMPONENT = 80;
const MAX_SOURCE = 200;
const MAX_STACK = 2_000;
const MAX_UA = 512;
const MAX_BUILD_ID = 80;
const COMPONENT_RE = /^[a-z0-9_-]+$/;

function trimMax(value: string, max: number): string {
  return value.trim().slice(0, max);
}

function cleanPath(raw: string): string | null {
  const path = raw.split(/[?#]/)[0] ?? '';
  if (!path.startsWith('/')) return null;
  const stripped = trimMax(path, MAX_PATH);
  return stripped || null;
}

function cleanReferrer(raw: string | undefined, currentOrigin: string): string | undefined {
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    if (url.origin === currentOrigin) {
      return trimMax(`${url.origin}${url.pathname}`, MAX_REFERRER);
    }
    return trimMax(url.origin, MAX_REFERRER);
  } catch {
    return undefined;
  }
}

function cleanComponent(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const component = trimMax(raw, MAX_COMPONENT);
  return COMPONENT_RE.test(component) ? component : undefined;
}

function cleanStatus(raw: number | undefined): number | undefined {
  if (raw === undefined) return undefined;
  if (!Number.isInteger(raw) || raw < 100 || raw > 599) return undefined;
  return raw;
}

function cleanPositiveInteger(raw: number | undefined): number | undefined {
  if (raw === undefined) return undefined;
  if (!Number.isInteger(raw) || raw < 0) return undefined;
  return raw;
}

function stripUrlDetails(raw: string, max: number): string {
  return trimMax(raw.replace(/https?:\/\/[^\s?#)]+[^\s)]*/g, match => {
    try {
      const url = new URL(match);
      return `${url.origin}${url.pathname}`;
    } catch {
      return match;
    }
  }), max);
}

function cleanSource(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  return stripUrlDetails(raw, MAX_SOURCE);
}

function cleanStack(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  return stripUrlDetails(raw, MAX_STACK);
}

export function browserContext(): ClientContext {
  return {
    path: location.pathname,
    referrer: document.referrer || undefined,
    userAgent: navigator.userAgent || undefined,
    occurredAt: new Date().toISOString(),
  };
}

export function defaultRedact(
  event: ClientErrorInput,
  context: ClientContext,
): ClientErrorEvent | null {
  const path = cleanPath(context.path);
  const message = trimMax(event.message, MAX_MESSAGE);
  if (!path || !message) return null;

  return {
    type: event.type,
    message,
    path,
    occurredAt: context.occurredAt,
    referrer: cleanReferrer(context.referrer, location.origin),
    component: cleanComponent(event.component),
    status: cleanStatus(event.status),
    source: cleanSource(event.source),
    line: cleanPositiveInteger(event.line),
    column: cleanPositiveInteger(event.column),
    stack: cleanStack(event.stack),
    userAgent: context.userAgent ? trimMax(context.userAgent, MAX_UA) : undefined,
    buildId: context.buildId ? trimMax(context.buildId, MAX_BUILD_ID) : undefined,
  };
}

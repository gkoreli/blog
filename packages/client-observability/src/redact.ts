import type { ClientContext, ClientErrorEvent, ClientErrorInput } from './types.js';
import { parseClientErrorPayload } from './schema.js';

export function browserContext(): ClientContext {
  return {
    path: location.pathname,
    referrer: document.referrer || undefined,
    userAgent: navigator.userAgent || undefined,
    occurredAt: new Date().toISOString(),
  };
}

export function defaultRedact(event: ClientErrorInput, context: ClientContext): ClientErrorEvent | null {
  // Context owns path/time/build fields; arbitrary event properties cannot replace it.
  return parseClientErrorPayload({ ...event, ...context }, location.origin);
}

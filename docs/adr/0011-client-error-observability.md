# ADR-0011: Client Error Observability — First-Party Browser Logging

## Status

Accepted — 2026-04-11. Implementation pending.

## Context

The newsletter subscribe incident exposed a visibility gap.

A real reader in Georgia submitted the subscribe form from Brave on macOS. Cloudflare Workers logs showed the request and the final `400`, but not what the reader saw in the browser. After adding server-side rejection logging, we learned the Worker was rejecting the request because Turnstile Siteverify returned `HTTP 400`. The reader-facing message was only visible in the browser:

```text
Verification failed. Retry once, or allow bot protection for this site.
```

Cloudflare Workers Logs answered the server question:

- Which route ran?
- What response status was returned?
- Did the Worker throw?
- What did our `console.warn()` emit?

They did not answer the browser question:

- Did the Turnstile script load?
- Did Brave block the widget iframe?
- Did the frontend receive a JSON error and display it?
- Did `window.error` or `unhandledrejection` fire?
- What exact message did the user see?

This is expected. Workers Logs are server-side logs. Browser DevTools console output stays in the user's browser unless the site explicitly reports it.

## Decision

Build a first-party client error observability layer instead of adding Sentry or another third-party SDK.

Add a small `@gkoreli/client-observability` package with two sides:

1. **Browser logger** — typed client service with dependency injection for transport, context, sampling, and redaction.
2. **Worker handler** — `POST /api/client-error`, validates and stores sanitized browser events, and emits structured `console.warn()` logs.

Use the existing `DB` D1 binding and add a `client_errors` table to `blog-analytics`. This follows the analytics and newsletter pattern: one Cloudflare Worker, one D1 database at current scale, package boundaries in code.

## Goals

- Capture the exact user-visible error message for failed interactions.
- Correlate client-reported failures with Worker requests using path, timestamp, response status, and optional request/ray identifiers.
- Keep the implementation dependency-free and small enough for the Worker bundle budget.
- Avoid collecting form contents, emails, Turnstile tokens, cookies, localStorage values, stack dumps with arbitrary user data, or full URLs with query strings.
- Preserve the blog's first-party data ownership model.
- Make the client logger testable by injecting its transport and context provider.

## Non-Goals

- Session replay.
- Heatmaps.
- Source-map symbolication service.
- User identity tracking.
- Full distributed tracing.
- Third-party error dashboards.
- Capturing every console log. Only explicit error events and known UX failures are in scope.

## Architecture

```
Browser
  ├── window.error
  ├── window.unhandledrejection
  └── explicit interaction reports
        │
        ▼
  createClientLogger({
    transport,
    context,
    redact,
    sample,
  })
        │
        ▼
POST /api/client-error
        │
        ▼
Worker handleClientError()
  ├── validate payload shape
  ├── normalize path + referrer
  ├── truncate message/stack/component fields
  ├── enrich with request.cf country/colo/asOrganization
  ├── write sanitized event to D1
  └── console.warn('[client:error]', structuredFields)
```

### Package layout

```
packages/client-observability/
├── migrations/
│   └── 0001_create_client_errors.sql
└── src/
    ├── index.ts          ← public exports
    ├── client.ts         ← createClientLogger()
    ├── transport.ts      ← FetchTransport, BeaconTransport, NoopTransport
    ├── redact.ts         ← default redaction + path normalization
    ├── server.ts         ← handleClientError()
    ├── db.ts             ← D1 types + insert helper
    └── schema.ts         ← runtime validation without dependencies
```

Blog integration:

```
packages/blog/src/client/main.ts
  ├── initThemeToggle()
  ├── initSubscribeForm({ logger })
  └── initClientErrorReporting(logger)

packages/blog/src/worker/index.ts
  └── POST /api/client-error → handleClientError(request, env, ctx)
```

## Client Design

The logger is an injected service, not a global singleton hidden inside modules.

```typescript
export interface ClientLogTransport {
  send(event: ClientErrorEvent): Promise<void>;
}

export interface ClientLogger {
  report(event: ClientErrorInput): void;
}

export interface ClientLoggerConfig {
  transport: ClientLogTransport;
  context: () => ClientContext;
  redact: (event: ClientErrorInput) => ClientErrorEvent | null;
  sample: (event: ClientErrorEvent) => boolean;
}

export function createClientLogger(config: ClientLoggerConfig): ClientLogger;
```

The subscribe module should receive the logger explicitly:

```typescript
initSubscribeForm({
  logger,
});
```

When a failed API response becomes visible to the user:

```typescript
const message = data.error ?? 'Something went wrong. Try again.';
setError(message);
logger.report({
  type: 'interaction_error',
  component: 'subscribe_form',
  message,
  status: res.status,
});
```

Global browser listeners report uncaught failures:

```typescript
window.addEventListener('error', event => {
  logger.report({
    type: 'window_error',
    message: event.message,
    source: event.filename,
    line: event.lineno,
    column: event.colno,
    stack: event.error instanceof Error ? event.error.stack : undefined,
  });
});

window.addEventListener('unhandledrejection', event => {
  logger.report({
    type: 'unhandled_rejection',
    message: reasonToMessage(event.reason),
    stack: reasonToStack(event.reason),
  });
});
```

## Event Shape

Client request body:

```typescript
interface ClientErrorPayload {
  type: 'window_error' | 'unhandled_rejection' | 'interaction_error';
  message: string;
  path: string;
  referrer?: string;
  component?: string;
  status?: number;
  source?: string;
  line?: number;
  column?: number;
  stack?: string;
  userAgent?: string;
  buildId?: string;
  occurredAt: string;
}
```

Fields are intentionally boring. No arbitrary `metadata` bag in Phase 1. Loose metadata becomes accidental PII storage.

### Redaction and limits

The client redactor runs before transport:

| Field | Rule |
|-------|------|
| `message` | string, trim, max 500 chars |
| `path` | pathname only, strip query/hash, max 200 chars |
| `referrer` | origin + pathname only for same-origin; external origin only |
| `component` | allowlisted identifier, max 80 chars |
| `status` | integer 100-599 |
| `source` | same-origin path only or browser-provided script URL origin/path, max 200 chars |
| `stack` | max 2,000 chars; strip query strings from URLs |
| `userAgent` | optional; server also has UA header, max 512 chars |
| `buildId` | static build/version string when available |

The server validates the same limits again. Client redaction is a convenience, not a trust boundary.

## Server Design

Route:

| Route | Method | Handler | Auth |
|-------|--------|---------|------|
| `/api/client-error` | POST | `handleClientError` | same-origin + size limit |

The handler:

1. Rejects non-JSON and bodies over 8 KB.
2. Parses JSON with `catch(() => null)`.
3. Validates every field with local type guards.
4. Applies server-side normalization and truncation.
5. Enriches with Cloudflare request metadata:
   - country
   - colo
   - asOrganization
   - request `cf-ray`
6. Inserts into D1.
7. Emits a structured Worker log.

Console log shape:

```typescript
console.warn('[client:error]', {
  type,
  component,
  message,
  path,
  status,
  ray,
  country,
  colo,
});
```

Do not log stack traces by default. Store truncated stacks in D1 for manual investigation, but keep Workers Logs compact and searchable.

## Schema

```sql
CREATE TABLE IF NOT EXISTS client_errors (
  id              TEXT PRIMARY KEY,
  type            TEXT NOT NULL
                  CHECK (type IN ('window_error', 'unhandled_rejection', 'interaction_error')),
  message         TEXT NOT NULL,
  path            TEXT NOT NULL,
  referrer        TEXT,
  component       TEXT,
  status          INTEGER,
  source          TEXT,
  line            INTEGER,
  column          INTEGER,
  stack           TEXT,
  user_agent      TEXT,
  build_id        TEXT,
  ray             TEXT,
  country         TEXT,
  colo            TEXT,
  as_organization TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_client_errors_created_at ON client_errors (created_at);
CREATE INDEX IF NOT EXISTS idx_client_errors_type       ON client_errors (type);
CREATE INDEX IF NOT EXISTS idx_client_errors_path       ON client_errors (path);
CREATE INDEX IF NOT EXISTS idx_client_errors_component  ON client_errors (component);
```

## Retention

Client errors are operational diagnostics, not product analytics. Retain for 30 days by default.

Add the cleanup to the existing scheduled Worker path:

```sql
DELETE FROM client_errors
WHERE created_at < datetime('now', '-30 days');
```

If an incident requires longer retention, export the relevant rows manually before the retention window expires.

## Sampling

Phase 1 sends:

- 100% of `interaction_error` events for newsletter subscribe, because these are low-volume and user-facing.
- 100% of uncaught errors initially, until volume proves otherwise.

If volume grows, add deterministic sampling by event fingerprint:

```text
hash(type + component + message + path) % 100 < sampleRate
```

Do not random-sample subscribe failures before the newsletter flow is stable.

## Security and Privacy

Never collect:

- email addresses
- request bodies
- Turnstile tokens
- cookies
- localStorage values
- full URLs with query strings
- DOM snapshots
- form field values
- IP addresses in the client payload

Server-side Cloudflare request metadata may include IP-derived geography, but the table stores only coarse fields. Do not store `cf-connecting-ip`.

The endpoint is same-origin only. Unknown origins receive no CORS allowance. Non-browser abuse is rate-limited by body size and cheap validation; add a native Workers rate limiter if abuse appears.

## Why Not Sentry

Sentry is excellent, but it is wrong for this project right now:

- Adds a third-party script to every page.
- Sends browser errors to an external processor.
- Adds bundle weight and configuration surface.
- Encourages capturing rich context that can easily include PII.
- Solves source maps, releases, ownership, alerting, and dashboards before we need them.

The blog already has a first-party Worker, D1, and a strict minimal-dependency philosophy. A tiny first-party logger solves the current problem directly.

## Consequences

### Positive

- We can see the exact message shown to users.
- Subscribe failures become debuggable from both sides: server rejection reason and browser-visible message.
- No third-party dependency or privacy policy expansion beyond first-party diagnostics.
- D1 gives queryable incident history beyond ephemeral logs.
- The injected client logger keeps modules testable and avoids hard-coded global reporting.

### Negative

- We own the ingestion endpoint, schema, cleanup, and dashboard/query workflow.
- No automatic source-map symbolication.
- No alerting in Phase 1.
- Browser reports can be spoofed; they are diagnostics, not security evidence.

## Implementation Plan

1. Create `packages/client-observability`.
2. Add D1 migration `0001_create_client_errors.sql`.
3. Add `handleClientError()` and route `POST /api/client-error`.
4. Add `createClientLogger()` with injected transport/context/redactor/sampler.
5. Wire global browser listeners in `main.ts`.
6. Refactor `initSubscribeForm()` to accept `{ logger }`.
7. Report subscribe failures immediately after `setError(message)`.
8. Add scheduled cleanup for rows older than 30 days.
9. Add focused tests for redaction, schema validation, and subscribe failure reporting.

## References

- Cloudflare Workers Logs: invocation logs, custom logs, errors, and uncaught exceptions are Worker-side observability, not browser console capture.
- Cloudflare Turnstile Siteverify: server-side validation is mandatory; tokens expire after 300 seconds and are single-use.
- Cloudflare Turnstile client-side error codes: browser-side widget errors can come from blocked iframes, invalid site keys, unauthorized domains, timeouts, and challenge failures.

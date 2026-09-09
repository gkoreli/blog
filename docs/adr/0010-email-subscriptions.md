# ADR-0010: Email Subscriptions — D1 + Resend + Turnstile

## Status

Accepted — 2026-04-08. Implementation shipped same day.

### Reliability checkpoint — September 7 UTC, 2026

Implementation is not evidence of current signup health. An inspected production rejection returned Turnstile `invalid-input-secret` before subscriber storage or email scheduling. The [reliability worklist](../folders/FLDR-0010-newsletter-reliability-and-bot-protection-worklist.md) tracks credential repair, missing client reports, durable outcomes, and locally reproduced resubscription/confirmation bugs. No successful production signup and confirmation was established in that investigation. The [recovery audit](../../packages/blog/drafts/research/newsletter-reliability/04-recovery.md) distinguishes absent addresses in inspected stores from provider history still inaccessible.

The request flows and security descriptions below were reconciled with the September 7 source. Historical launch assumptions and legal rationale are not a current plan-limit check, abuse-effectiveness measurement, or compliance determination.

## Historical context — April 8, 2026

The procrastination article hit 8.3K views in under two hours, 52 shares, #9 on r/ADHD — with zero way to capture readers for the next article. Every channel used to distribute (Reddit, X, HN) is rented attention: the algorithm decides if people see the next post. Email is still the most practical owned re-engagement channel — no feed ranking, no platform decay — but deliverability and visibility are not guaranteed: Gmail filters by sender reputation and auto-sorts into Promotions; Apple Mail Privacy Protection blocks open tracking. Industry benchmarks put average open rates at ~32–34% (Mailchimp, Constant Contact). That's not 100% reach, but it's a direct line to readers who opted in, which no social platform offers.

The goal: capture readers at peak intent (just finished an article that resonated) and retain them so the next article starts with a baseline audience instead of zero.

**Constraints:**
- Already running Cloudflare Workers + D1 + static assets — no new infrastructure budget
- Personal blog scale: 0 subscribers today, target <10K over 12–18 months
- Free tier must cover the full stack (D1, Workers, Resend, Turnstile all have generous free tiers)
- **1 MB Workers bundle size limit** — every dependency byte is a liability; the blog Worker includes analytics + newsletter in one bundle
- Must ship tonight while traffic is live, not after a 2-week architecture review

## Decision

**Add `packages/newsletter` — a self-contained package following the `packages/analytics` pattern.**

Routes added to the existing worker under `/api/*` (already `run_worker_first` in wrangler config):

| Route | Method | Handler | Auth |
|-------|--------|---------|------|
| `/api/subscribe` | OPTIONS | `corsPreflightResponse` | CORS |
| `/api/subscribe` | POST | `handleSubscribe` | Turnstile + rate limit |
| `/api/resend-confirmation` | OPTIONS | `handleResendConfirmationPreflight` | CORS |
| `/api/resend-confirmation` | POST | `handleResendConfirmation` | rate limit |
| `/api/confirm/:token` | GET | `handleConfirm` | — |
| `/api/unsubscribe/:token` | GET | `handleUnsubscribe` | — |
| `/api/unsubscribe/:token` | POST | `handleUnsubscribe` | — (RFC 8058 one-click) |
| `/api/send` | POST | `handleSend` | Bearer ADMIN_SECRET |
| `/api/webhooks/resend` | POST | `handleResendWebhook` | Svix HMAC-SHA256 |

Nightly cron at 03:00 UTC handled by `handleScheduled`.

**Reuse the existing `DB` D1 binding.** Add a `subscribers` table to `blog-analytics` — no new D1 database, no new wrangler binding.

**Turnstile** for pre-send verification. The client explicitly renders with `execution: 'execute'` and `appearance: 'execute'`, then executes on submit. These client settings do not establish the widget mode configured in Cloudflare; the account widget read was inaccessible during the audit. `TURNSTILE_SITE_KEY` is baked into static HTML as `data-turnstile-sitekey`. `TURNSTILE_SECRET_KEY` is a Worker secret. Missing-secret and verifier-network-error cases currently allow the request; an invalid secret rejects it. TASK-0124 and TASK-0127 track this inconsistent failure policy.

**Resend** for email delivery. One `fetch()` to `https://api.resend.com/emails`. Free tier: 3,000 emails/month, 100/day — more than sufficient for Phase 1. `RESEND_API_KEY` set as a Worker secret. Resend is the delivery pipe; D1 is the source of truth. Swap the delivery layer later without losing subscriber data.

**Double opt-in** — require a valid confirmation link before activating a pending address. This records a confirmation action; it does not identify who first submitted the address or prevent the initial confirmation email from being abused. Separate `confirm_token` (hashed, one-time, cleared after use) and `unsubscribe_token` (stored raw, included in every newsletter).

**Subscribe form** in the `page.ts` footer. The button is initially enabled and disabled while submitting. With a ready widget, the callback sends the returned token. If the widget is unavailable at initialization or submit time, the client sends an empty token; this fallback also exists in production, where a configured verifier rejects it. TASK-0125 tracks readiness and recovery. Form logic lives in `packages/blog/src/client/subscribe.ts`, imported by `main.ts`.

**`source` column** tracks which page the subscriber came from plus a deliberately small acquisition allowlist: `utm_source`, `utm_campaign`, and the external referrer hostname. Arbitrary query parameters, referrer paths, and full referrer URLs are discarded. This is enough to learn which article and launch channel convert without growing a second analytics system.

## Architecture

```
packages/newsletter/
├── migrations/
│   ├── 0001_create_subscribers.sql     ← authoritative schema (fresh installs)
│   ├── 0002_for_existing_installs.sql  ← ALTER TABLE for pre-2026-04-08 installs
│   ├── 0003_add_bounced_at.sql         ← adds bounced_at column (GDPR purge fix)
│   └── 0004_delivery_logs.sql          ← user_agent on subscribers + delivery_logs table
└── src/
    ├── index.ts                    ← public API exports
    ├── db.ts                       ← D1 types + all query helpers
    ├── tokens.ts                   ← 256-bit token generation + SHA-256 hashing + IP truncation
    ├── turnstile.ts                ← Cloudflare Turnstile siteverify wrapper
    ├── email.ts                    ← Resend fetch: sendConfirmationEmail + sendNewsletterBatch
    ├── responses.ts                ← shared JSON + HTML response helpers, CORS, security headers
    ├── subscribe.ts                ← POST /api/subscribe handler
    ├── confirm.ts                  ← GET /api/confirm/:token handler
    ├── unsubscribe.ts              ← GET + POST /api/unsubscribe/:token handler
    ├── resend-confirmation.ts      ← POST /api/resend-confirmation handler
    ├── send.ts                     ← POST /api/send handler (admin bulk send)
    ├── webhook.ts                  ← POST /api/webhooks/resend (bounce/complaint handling)
    └── cleanup.ts                  ← Cron Trigger handler (nightly purge)
```

### Request flow: subscribe

```
Browser form
  POST /api/subscribe { email, turnstile, source }
    │
    ├── 1. Select allowed CORS response origin; this is not a POST rejection check
    ├── 2. Rate limit: 3 attempts / 60 seconds per IP
    ├── 3. Parse JSON and validate email format/length
    ├── 4. verifyTurnstile() → rejection returns 400 before DB access
    ├── 5. findByEmail(DB) → active: 202 without another email
    ├── 6. Generate independent confirmation, unsubscribe, and row-ID tokens
    │       SHA-256 confirmation token for DB; retain unsubscribe token raw
    ├── 7. Refresh pending row, or insert a new pending row with source/context
    │       BUG: retained inactive rows reach INSERT and fail email uniqueness
    └── 8. ctx.waitUntil(sendConfirmationEmail(...)); return 202
               Provider failure is logged after the browser response
```

The original invalid-secret failure stops at step 4. There is no saved address from that request to restore, and a 202 from a later successful path would still not prove email delivery.

### Request flow: confirm

```
GET /api/confirm/:rawToken
  │
  ├── 1. hashToken(rawToken) → tokenHash
  ├── 2. Atomic confirmSubscriber(DB, tokenHash)
  │       → pending + unexpired match: set active, clear token fields, HTTP 200
  └── 3. On no update, findByConfirmTokenHash(DB, tokenHash)
          → pending row: "Link expired", HTTP 200
          → otherwise: "Already confirmed / Your subscription is active", HTTP 200
              BUG: an unknown token does not establish an active subscription
```

TASK-0129 tracks this reproduced false-success message and the inactive-address insertion bug. The diagram describes current behavior, not the desired contract.

### Request flow: bounce/complaint webhook

```
POST /api/webhooks/resend
  │
  ├── 1. Read svix-id, svix-timestamp, svix-signature headers
  ├── 2. Replay-attack guard: |now - svix-timestamp| ≤ 300 s
  ├── 3. HMAC-SHA256(RESEND_WEBHOOK_SECRET, svix-id + "." + ts + "." + body)
  ├── 4. timingSafeEqual(computed, provided) — constant-time to prevent timing attacks
  ├── 5a. email.bounced   → markBounced(DB, email)    (status='bounced', bounced_at=now())
  └── 5b. email.complained → markComplained(DB, email) (status='unsubscribed', unsubscribed_at=now())
```

**Env composition in the worker:**
```typescript
type Env = AnalyticsEnv & NewsletterEnv;
// AnalyticsEnv:    { DB, ASSETS, OWNER_IPS? }
// NewsletterEnv:   { DB, RESEND_API_KEY, TURNSTILE_SECRET_KEY,
//                    SUBSCRIBE_RATE_LIMITER?, RESEND_WEBHOOK_SECRET? }
// TypeScript intersection: DB appears once, both packages share the binding
```

## Schema

```sql
CREATE TABLE subscribers (
  id                       TEXT PRIMARY KEY,
  email                    TEXT UNIQUE NOT NULL,
  status                   TEXT NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'active', 'unsubscribed', 'bounced')),

  -- Confirmation token is hashed; permanent unsubscribe token is stored raw
  confirm_token            TEXT,             -- NULL after use
  confirm_token_expires_at TEXT,             -- 24-hour window; NULL after confirmation
  unsubscribe_token        TEXT NOT NULL,    -- permanent, never expires

  source                   TEXT,             -- signup path + allowlisted acquisition params
  consent_ip               TEXT,             -- truncated request IP: "1.2.3.x"
  user_agent               TEXT,             -- added by migration 0004

  created_at               TEXT NOT NULL DEFAULT (datetime('now')),  -- = consent timestamp
  confirmed_at             TEXT,
  unsubscribed_at          TEXT,
  bounced_at               TEXT             -- set by Resend webhook; used for GDPR purge timing
);

CREATE INDEX idx_sub_email         ON subscribers (email);
CREATE INDEX idx_sub_confirm_token ON subscribers (confirm_token);
CREATE INDEX idx_sub_unsub_token   ON subscribers (unsubscribe_token);
CREATE INDEX idx_sub_status        ON subscribers (status);
```

## Security Design

### Token entropy: 256-bit via `crypto.getRandomValues()`

The implementation generates 32 random bytes with `crypto.getRandomValues()` and encodes them as 64 hex characters. Confirmation tokens are one-time credentials; unsubscribe tokens remain usable while the subscriber row exists. The earlier comparison that called 122 bits greater than 128 was incorrect and is removed.

```typescript
// tokens.ts
export function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}
```

The confirm token lives in an email link for up to 24 hours and is sent to an email provider. 256-bit headroom is appropriate.

### SHA-256 confirmation-token hashing before D1 storage

The database stores only the confirmation token's SHA-256 hash. It stores the unsubscribe token raw so the mail sender can include it in future footer links.

**Threat model:** A database export does not directly reveal usable confirmation tokens. It does reveal subscriber addresses and usable unsubscribe tokens. Confirmation hashing does not protect those other fields from a database disclosure.

```typescript
export async function hashToken(raw: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
```

### Confirm token expiry: 24 hours

`confirm_token_expires_at = datetime('now', '+24 hours')` is set at subscription time. The atomic update checks pending status and expiry before activation. The current HTML helper returns 200 for successful, expired, and unknown-token pages; the last case also carries the false-success message documented above.

### Unsubscribe tokens: permanent, stored raw (not hashed)

Unsubscribe tokens are stored as raw values in D1 — unlike confirm tokens, which are hashed.

**Why the different treatment:**
| Token | Stakes if DB leaked | How stored | URL contains |
|-------|--------------------|-----------:|-------------|
| Confirm | Attacker activates pending accounts | SHA-256 hash | raw token |
| Unsubscribe | Attacker can mass-unsubscribe | **raw** | raw token |

A disclosed unsubscribe token enables unauthorized opt-out. The implementation accepts that risk to compose permanent footer links from stored subscriber state:
1. The raw token must appear verbatim in every newsletter footer URL
2. Without the raw value, you cannot build the URL without a reverse lookup (impossible with SHA-256)
3. `sendNewsletterBatch()` reads `subscriber.unsubscribe_token` directly when composing emails

No unsubscribe-token expiry is set. A link resolves only while its corresponding subscriber row exists.

### Scoped CORS (not wildcard)

```typescript
// responses.ts
const PRODUCTION_ORIGIN = 'https://gkoreli.com';
const LOCAL_RE = /^http:\/\/localhost(:\d+)?$/;
```

`Access-Control-Allow-Origin` is set for a matching origin and omitted otherwise. OPTIONS rejects unknown origins. The POST handler uses `allowedOrigin()` to select response headers; it does not reject a POST solely for an unknown or missing Origin. CORS therefore must not be described as authentication or a general server-side abuse barrier. `Access-Control-Allow-Credentials` is not set.

### Security headers

Two sets applied contextually:

```typescript
// JSON API responses
'Referrer-Policy': 'strict-origin-when-cross-origin'

// HTML pages (confirm/unsubscribe)
'Referrer-Policy': 'no-referrer'   // token in URL — don't leak to linked resources
'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"
'X-Content-Type-Options': 'nosniff'
```

`no-referrer` on confirm/unsubscribe HTML pages ensures the raw token in the URL (`/api/confirm/:rawToken`) is not sent in the `Referer` header to any resource the HTML page might load. The tight CSP prevents the simple HTML success pages from loading external resources at all.

### Native Workers Rate Limiting

`wrangler.jsonc` declares this native rate-limit binding:

```jsonc
"ratelimits": [{
  "name": "SUBSCRIBE_RATE_LIMITER",
  "namespace_id": "1001",
  "simple": { "limit": 3, "period": 60 }
}]
```

Three attempts per minute per IP, applied before verification and shared with the resend-confirmation route. This permits a higher sustained attempt rate than the originally described three per five minutes. Cloudflare's counters are per location and eventually consistent; they are not a global send budget. [Rate-limit behavior](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/), checked September 7, 2026.

### Webhook HMAC verification (Svix protocol)

Resend's webhook delivery uses the Svix signing protocol: HMAC-SHA256 over `svix-id + "." + svix-timestamp + "." + body`, with the secret base64-decoded from `RESEND_WEBHOOK_SECRET`.

Constant-time comparison prevents timing oracle attacks:

```typescript
function timingSafeEqual(a: string, b: string): boolean {
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  if (aBytes.length !== bBytes.length) return false;
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) diff |= aBytes[i] ^ bBytes[i];
  return diff === 0;
}
```

Replay-attack guard: `|now - svix-timestamp| ≤ 300 seconds`. Emails are redacted in logs using the first 3 characters + `***@domain`.

### Confirmation and retention: implemented behavior

After verification, the subscriber row records the submitted address, truncated request IP, timestamp, source, and browser details. A later valid confirmation records activation. These fields do not authenticate who first submitted the address, and this ADR does not establish their legal sufficiency.

The nightly cleanup deletes expired pending rows and inactive rows older than ninety days using their unsubscribe/bounce timestamps. These are implementation choices, not a complete erasure-request workflow or proof of compliance. Confirmation mail has already been attempted before a pending row expires; double opt-in does not prevent that first message from being abused.

Earlier categorical legal and deliverability claims were not verified by this investigation and are removed from current instructions. They remain in Git history. Any future sending decision must use the actual message content, provider requirements, consent evidence, and applicable rules. This checkpoint performs no new legal review.

### Sender configuration and message classes

The code has separate `sendConfirmationEmail()` and `sendNewsletterBatch()` functions. Newsletter messages already include `List-Unsubscribe` and `List-Unsubscribe-Post` headers plus footer links. These are implemented features, not future work.

DNS authentication and provider sending limits require an account check before a real send. This investigation did not verify SPF, DKIM, DMARC, current provider limits, or delivery. The application key's ability to send does not establish read access to provider history or successful inbox delivery.

## Why No Third-Party Libraries

The package uses Web Crypto for random tokens, hashing and HMAC, and direct fetch calls for Turnstile and Resend. This keeps the runtime dependency surface small. It also means we own lifecycle correctness, verification, retries and reporting.

The earlier library-size estimates and one-megabyte uncompressed Worker-limit claim were not supported by a pinned bundle measurement in this ADR and are removed. Assess a proposed dependency by the actual built artifact and the current account limit, rather than npm package size or an old estimate.

### Inspiration from open source reference implementations

The April decision recorded the following GitHub projects as implementation inspiration. They established possible architecture patterns; the preserved record contains no comparative completion or abuse study. The [September 2026 reassessment](../../packages/blog/drafts/research/newsletter-reliability/05-prior-art-2026.md) adds maintained newsletter providers, self-hosted proof of work, and the original Turnstile rationale.

**[SamirPaulb/newsletter-and-contact-system](https://github.com/SamirPaulb/newsletter-and-contact-system)**
The current README describes Workers, Turnstile, native rate limits, KV operational storage, and D1 archival storage. It was originally cited for a Workers/KV pattern. This is repository documentation, not a verified reliability result or proof of a strict global send ceiling.

**[i365dev/LetterDrop](https://github.com/i365dev/LetterDrop)**
Originally cited for a Workers/D1/Resend newsletter pattern. The repository remains available; its existence does not establish that the combination is validated in production. No deployed service or end-to-end reliability measurement was inspected in the September reassessment.

**[Divkix/pickmyclass](https://github.com/Divkix/pickmyclass)**
Originally cited for confirmation tokens in URLs. Its current token storage was not re-audited and should not be used to establish our security properties. Our own confirmation tokens are hashed; unsubscribe tokens remain stored raw.

**[mnestorov/security-headers-cloudflare-worker](https://github.com/mnestorov/security-headers-cloudflare-worker)**
Originally cited as a security-header example. A reference implementation alone cannot establish which policies are correct for this site's content and integrations; validate the actual served headers and behavior.

The reference links above are historical pointers. The September 9 UTC pass checked the first two repository pages, not their full code or production use. A general claim that our database disclosure reveals no usable tokens would be false.

Owning the small integration does not prove it more reliable than a maintained library. The September audit found missing reporting paths and lifecycle bugs in our implementation. Dependency choice and tested behavior are separate decisions.

## Tradeoffs

### Reusing the analytics database

The newsletter, analytics, and client-error reports share `blog-analytics`. That reduces configuration, but puts subscriber addresses and operational records in the same database and makes them depend on shared D1 capacity. A second database in the same account would not isolate the account-level read allowance.

Separating storage would require bindings, routing/environment changes, migration and validation; it is not a one-file edit. No such migration is authorized or performed by this documentation checkpoint.

### Delivery provider

The current implementation sends through Resend. Native Cloudflare sending was an earlier alternative; its availability, current pricing and migration requirements were not checked in this investigation. No provider replacement is selected.

### Turnstile mode and initialization

An invisible widget was the historical design preference. Actual widget type is configured in Cloudflare and was not verified during this incident because the account read was denied. Current client code sets `execution: 'execute'` and `appearance: 'execute'`; these options do not prove the dashboard mode or equivalent protection across modes.

The main module checks `window.turnstile` once during initialization. Deferred script placement does not guarantee successful loading, a ready widget, or recovery from a blocked script. If initialization misses it, the form submits an empty token. The earlier claims of guaranteed availability, no timing risk, and a universally hidden widget were unsupported. TASK-0125 covers readiness, error callbacks and recovery; the [client audit](../../packages/blog/drafts/research/newsletter-reliability/02-client-audit.md) contains the observed code and local probes.

### Native rate limiting

The Worker invokes `SUBSCRIBE_RATE_LIMITER.limit()` before verification. It is a runtime binding called by application code, not a rule that runs before the Worker. Current limits are three attempts per sixty seconds per IP, with provider-documented locality/consistency limits. The implementation makes no application KV writes for this limiter; per-address cooldowns and a global send budget remain open design work.

## What is NOT built (intentional scope)

- **Admin UI** — no dedicated subscriber dashboard. For an authorized investigation, prefer a bounded aggregate or targeted private query; remote SQL consumes read allowance, and subscriber addresses/tokens must not appear in public output.
- **Click tracking / open rates** — Resend provides these on paid plan. Not needed at Phase 1–2.
- **Drip sequences / automation** — deliberate simplicity. One confirmation email. Newsletters sent manually via `POST /api/send`. Automate when the manual process is the bottleneck.
- **Separate `NEWSLETTER_DB` binding** — see DB tradeoff above. Defer until subscriber list is meaningful.
- **Queue-based sending** — `POST /api/send` awaits provider batches. No delivery-latency guarantee or queue is established; confirmation sending separately uses `ctx.waitUntil`.

## Known Gaps

The current gaps are tracked in TASK-0124–TASK-0129: invalid production verifier credentials, widget/load errors without explicit reports, inconsistent verifier failure policy, incomplete diagnostic ingestion, confirmation delivery without a durable outcome, inactive-address resubscription errors, and false success for unknown confirmation tokens. The audit distinguishes local reproductions from observed production incidents.

Earlier iframe-console messages and historical CSP descriptions cannot establish present signup health. Keep the site's current headers and client implementation as the reference; do not relax protection to silence an uncorrelated console message.

## Future Vision

### Phase 2 (50+ subscribers) — SHIPPED

**Historical first-send checklist:** these boxes are not a current account-state audit. Migration 0004 and the required binding names are already present in the inspected deployment; inspect migration history and configuration before repeating setup commands. DNS and real-delivery validation remain unperformed in this investigation.
- [ ] SPF record on `gkoreli.com` (Resend provides the TXT record on domain verification)
- [ ] DKIM signing enabled via Resend domain settings
- [ ] DMARC policy record (`_dmarc.gkoreli.com`) — start with `p=none` for monitoring, move to `p=quarantine` once aligned
- [ ] ADMIN_SECRET set: `wrangler secret put ADMIN_SECRET`
- [ ] Verify SPF/DKIM/DMARC at [mail-tester.com](https://www.mail-tester.com) or [mxtoolbox.com](https://mxtoolbox.com)
- [ ] Apply migration 0004: `wrangler d1 execute blog-analytics --file packages/newsletter/migrations/0004_delivery_logs.sql`

**Shipped:**
- `POST /api/send` — sends to all `active` subscribers via Resend batch API (100/chunk).
  Auth: `Authorization: Bearer $ADMIN_SECRET`. Idempotent via `campaign_id`.
- `POST /api/resend-confirmation` — resend confirm email to pending subscribers.
  Normal eligible/ineligible responses return 200 without revealing pending state; validation and rate-limit errors can return 400/429. Provider delivery can still fail after the response.
- `POST /api/unsubscribe/:token` — RFC 8058 one-click unsubscribe for Gmail.
- `delivery_logs` table — per-recipient audit trail (campaign_id, status, resend_id).
- `List-Unsubscribe` + `List-Unsubscribe-Post` headers on every newsletter email.
- `user_agent` column on subscribers for abuse pattern detection.
- Bounce suppression already in place (webhook → `status='bounced'`)

**To send a newsletter:**
```bash
curl -X POST https://gkoreli.com/api/send \
  -H "Authorization: Bearer $ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "campaign_id": "2026-04-post-title",
    "subject": "New post: ...",
    "html": "<p>...</p>",
    "text": "..."
  }'
```

### Phase 3 (500+ subscribers)
- Migrate to Cloudflare native email sending (replace Resend entirely, zero cost)
- Subscriber segments via `tags TEXT` column (e.g., `adhd,engineering`)
- RSS-to-email automation: new post published → Cloudflare Queues → auto-send to list
- Click tracking via redirect: `/r/:token/:url` endpoint logs clicks before redirecting
- Migrate subscriber storage to separate `blog-newsletter` D1

### Phase 4 (2K+ subscribers)
- Subscriber-facing preferences page (`/preferences?token=rawUnsubToken`)
- Cross-post to Substack or Buttondown for discovery
- A/B test subject lines via Resend batch API

## Setup Checklist

```bash
# One-time setup

# 1. Create Turnstile widget at dash.cloudflare.com → Turnstile
#    Widget type: Invisible (REQUIRED — "invisible" is a dashboard setting, not a
#    client-side parameter; using a Managed sitekey here will render a visible widget)
#    Domain: gkoreli.com
#    Copy Site Key (public) → set TURNSTILE_SITE_KEY in build env
wrangler secret put TURNSTILE_SECRET_KEY

# 2. Create Resend account at resend.com
#    Verify gkoreli.com domain (DNS TXT record)
#    Create API key with "Send" permission only
wrangler secret put RESEND_API_KEY

# 3. Create Resend webhook
#    Endpoint: https://gkoreli.com/api/webhooks/resend
#    Events: email.bounced, email.complained
#    Copy Signing Secret
wrangler secret put RESEND_WEBHOOK_SECRET

# 4. Apply D1 migration
#    Fresh install (no prior subscribers table):
wrangler d1 execute blog-analytics \
  --file packages/newsletter/migrations/0001_create_subscribers.sql
#    Existing install (applied 0001 before 2026-04-08):
wrangler d1 execute blog-analytics \
  --file packages/newsletter/migrations/0002_for_existing_installs.sql
#    All installs — adds bounced_at (GDPR purge fix, safe to run on empty table):
wrangler d1 execute blog-analytics \
  --file packages/newsletter/migrations/0003_add_bounced_at.sql
#    All installs — adds user_agent column + delivery_logs table:
wrangler d1 execute blog-analytics \
  --file packages/newsletter/migrations/0004_delivery_logs.sql

# 5. Set admin secret for POST /api/send
wrangler secret put ADMIN_SECRET

# 6. Build with site key, then deploy
TURNSTILE_SITE_KEY=0xYOURSITEKEY pnpm build
wrangler deploy
```

## References

**Law and regulation**
- [ePrivacy Directive 2002/58/EC](https://eur-lex.europa.eu/eli/dir/2002/58/oj/eng) — Directive on privacy and electronic communications; governs when prior consent is required for direct-marketing emails in the EU. The baseline rule that makes unsolicited newsletters illegal.
- [FTC CAN-SPAM Act compliance guide](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business) — U.S. requirements for commercial email: accurate headers, honest subject lines, valid physical address, working opt-out. Triggered by commercial content, not blog status.

**Deliverability**
- [Google Email Sender Guidelines](https://support.google.com/a/answer/81126) — Hard requirements from Google/Gmail: SPF or DKIM for all senders; SPF + DKIM + DMARC for bulk senders (>5K/day); `List-Unsubscribe` + one-click unsubscribe for marketing/subscribed mail; spam rate must stay below threshold. Google explicitly does not verify third-party open-rate figures.

**Infrastructure**
- [Cloudflare Email Routing docs](https://developers.cloudflare.com/email-routing/) — Primarily for receiving and routing inbound mail. Not the outbound newsletter delivery layer.
- [Cloudflare Workers + Resend tutorial](https://developers.cloudflare.com/workers/tutorials/send-emails-with-resend/) — Official pattern for transactional email from Workers via Resend `fetch()`.
- [Svix webhook verification (manual)](https://docs.svix.com/receiving/verifying-payloads/how-manual) — Algorithm reference for the HMAC-SHA256 webhook verification in `webhook.ts`.

**Open source reference implementations reviewed**
- [SamirPaulb/newsletter-and-contact-system](https://github.com/SamirPaulb/newsletter-and-contact-system) — Workers + KV pattern
- [i365dev/LetterDrop](https://github.com/i365dev/LetterDrop) — Workers + D1 + Resend; validates the stack combination
- [Divkix/pickmyclass](https://github.com/Divkix/pickmyclass) — token-in-URL pattern on Workers
- [mnestorov/security-headers-cloudflare-worker](https://github.com/mnestorov/security-headers-cloudflare-worker) — CSP + security headers reference

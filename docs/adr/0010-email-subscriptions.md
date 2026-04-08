# ADR-0010: Email Subscriptions — D1 + Resend + Turnstile

## Status

Accepted — 2026-04-08. Implementation shipped same day.

## Context

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

**Turnstile** (Cloudflare, free) for spam protection. Invisible mode with explicit render — no visible widget UI; widget is mounted into a hidden `.turnstile-slot` container and executed programmatically on form submit. `TURNSTILE_SITE_KEY` baked into static HTML at build time via `data-turnstile-sitekey` on the form element. `TURNSTILE_SECRET_KEY` set as a Worker secret via `wrangler secret put`.

**Resend** for email delivery. One `fetch()` to `https://api.resend.com/emails`. Free tier: 3,000 emails/month, 100/day — more than sufficient for Phase 1. `RESEND_API_KEY` set as a Worker secret. Resend is the delivery pipe; D1 is the source of truth. Swap the delivery layer later without losing subscriber data.

**Double opt-in** — not required by GDPR itself (which regulates consent quality, not mechanism), but adopted here because it produces the strongest proof of consent and eliminates bot/typo signups. Germany's case law effectively requires it for email marketing; for a global audience it is the lowest-risk default. Separate `confirm_token` (one-time, cleared after use) and `unsubscribe_token` (permanent per subscriber, included in every newsletter).

**Subscribe form** in `page.ts` footer — appears on every page. Highest-intent placement is immediately after finishing an article that resonated. Button is always enabled; Turnstile executes on submit and the fetch fires only after the token is returned (graceful fallback: submits without token in dev when `TURNSTILE_SITE_KEY` is unset, relying on server-side rate limiting). All form logic lives in `packages/blog/src/client/subscribe.ts` — a proper typed module imported via `main.ts`, not an inline script in the template.

**`source` column** tracks which page the subscriber came from — free analytics on which content converts.

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
    ├── 1. CORS origin check (allowedOrigin)
    ├── 2. Rate limit check (SUBSCRIBE_RATE_LIMITER: 3 req / 5 min per IP)
    ├── 3. verifyTurnstile() → challenges.cloudflare.com/turnstile/v0/siteverify
    ├── 4. validateEmail()
    ├── 5. findByEmail(DB) → 409 if active, re-send confirmation if pending, insert if new
    ├── 6. generateToken() → rawConfirmToken (256-bit)
    │       hashToken(rawConfirmToken) → confirmTokenHash (stored in DB)
    ├── 7. generateToken() → rawUnsubToken (256-bit)
    │       hashToken(rawUnsubToken) → unsubTokenHash (stored in DB)
    ├── 8. truncateIp(CF-Connecting-IP) → "1.2.3.x" (stored as consent_ip)
    ├── 9. insertSubscriber(DB, { email, confirmTokenHash, unsubTokenHash,
    │       confirmTokenExpiresAt, consentIp, source })
    └── 10. ctx.waitUntil(sendConfirmationEmail(rawConfirmToken)) ← fire-and-forget
               rawConfirmToken goes into the email URL — never stored plain in DB
```

### Request flow: confirm

```
GET /api/confirm/:rawToken
  │
  ├── 1. hashToken(rawToken) → tokenHash
  ├── 2. findByConfirmTokenHash(DB, tokenHash)
  │       → null: 404 "invalid or already used"
  │       → expired: 410 "link expired, re-subscribe"
  │       → valid: continue
  └── 3. confirmSubscriber(DB, tokenHash)
           clears confirm_token + confirm_token_expires_at
           sets status='active', confirmed_at=now()
```

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

  -- SHA-256 hashes stored; raw tokens sent only in email URLs (never persisted)
  confirm_token            TEXT,             -- NULL after use
  confirm_token_expires_at TEXT,             -- 24-hour window; NULL after confirmation
  unsubscribe_token        TEXT NOT NULL,    -- permanent, never expires

  source                   TEXT,             -- pathname of signup page
  consent_ip               TEXT,             -- truncated IP: "1.2.3.x" (GDPR proof-of-consent)

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

**Why not `crypto.randomUUID()`?** UUID v4 provides 122 bits of randomness — above OWASP's 128-bit minimum for session tokens, but right at the edge. For confirm and unsubscribe tokens, which function as single-use credentials in email URLs, we use 256-bit tokens generated via `crypto.getRandomValues(new Uint8Array(32))` encoded as 64 hex characters.

```typescript
// tokens.ts
export function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}
```

The confirm token lives in an email link for up to 24 hours and is sent to an email provider. 256-bit headroom is appropriate.

### SHA-256 token hashing before D1 storage

Raw tokens are never stored in the database. Only SHA-256 hashes are persisted. This is the same pattern used for password-reset tokens by security-conscious implementations (Devise, Doorkeeper, etc.).

**Threat model:** A D1 database export or breach yields only hashes. SHA-256 preimage resistance means an attacker cannot derive the raw token from the stored hash. Confirm links and unsubscribe links in inboxes remain valid; the attacker cannot forge new ones.

```typescript
export async function hashToken(raw: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
```

### Confirm token expiry: 24 hours

`confirm_token_expires_at = datetime('now', '+24 hours')` set at subscription time. `handleConfirm` distinguishes three outcomes:
- Token not found / already used → 404
- Token found but expired → 410 with "re-subscribe" CTA
- Token found and valid → confirm + clear token fields

### Unsubscribe tokens: permanent, stored raw (not hashed)

Unsubscribe tokens are stored as raw values in D1 — unlike confirm tokens, which are hashed.

**Why the different treatment:**
| Token | Stakes if DB leaked | How stored | URL contains |
|-------|--------------------|-----------:|-------------|
| Confirm | Attacker activates pending accounts | SHA-256 hash | raw token |
| Unsubscribe | Attacker can mass-unsubscribe | **raw** | raw token |

Mass-unsubscribing is annoying but not a security breach — no account access is granted. Storing raw tokens is the correct tradeoff because:
1. The raw token must appear verbatim in every newsletter footer URL
2. Without the raw value, you cannot build the URL without a reverse lookup (impossible with SHA-256)
3. `sendNewsletterBatch()` reads `subscriber.unsubscribe_token` directly when composing emails

Tokens never expire. A reader who gets an archived email from two years ago must still be able to unsubscribe via its footer link. Expiring unsubscribe links is a CAN-SPAM / GDPR compliance risk.

### Scoped CORS (not wildcard)

```typescript
// responses.ts
const ALLOWED_ORIGINS = new Set([
  'https://gkoreli.com',
  'http://localhost:8788',  // wrangler dev default
  'http://localhost:4321',  // astro dev default
]);
```

`Access-Control-Allow-Origin` is set to the specific requesting origin when it matches, or omitted entirely when it does not. This prevents cross-origin POST abuse from arbitrary domains. `Access-Control-Allow-Credentials` is not set (no cookies).

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

`wrangler.jsonc` declares a `ratelimits` binding (GA Sept 2025, free tier):

```jsonc
"ratelimits": [{
  "binding": "SUBSCRIBE_RATE_LIMITER",
  "namespace_id": "1001",
  "simple": { "limit": 3, "period": 300 }
}]
```

3 POST attempts per 5 minutes per IP, enforced before Turnstile verification. Defense-in-depth behind Turnstile: Turnstile catches bots early; the rate limiter caps burst attempts that sneak through. Zero KV writes — implemented at the CF edge, not in Worker code.

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

### Legal model: ePrivacy + GDPR (two layers)

For EU subscribers, the governing framework is two-layered — not just GDPR:

1. **ePrivacy Directive (2002/58/EC)** — defines *when* consent is needed. For direct-marketing emails, prior consent is required. This is the rule that makes unsolicited newsletters illegal, not GDPR.
2. **GDPR / EDPB guidance** — defines *what valid consent looks like*: freely given, specific, informed, unambiguous, expressed by a clear affirmative action. Withdrawal must be as easy as giving consent.

The practical consequence: what you store as consent evidence must satisfy GDPR's standard, and the entire flow (what the user saw, what they agreed to, when, how they can withdraw) must be defensible under ePrivacy's prior-consent requirement.

**Proof of consent:** `consent_ip` (last octet zeroed: `"1.2.3.x"`) + `created_at` timestamp + `source` (the page they signed up from) stored at subscription time. Together these establish: who signed up, when, from what context, on what device IP. Adequate evidence for GDPR Art. 7 without retaining a full IP address.

**Right to erasure (Art. 17):** Nightly cron via `handleScheduled`:
1. `purgeExpiredPending()` — deletes `status='pending'` rows where `confirm_token_expires_at < now()`. Unconfirmed signups never linger.
2. `purgeOldInactive()` — deletes rows older than 90 days using status-specific event timestamps: `unsubscribed_at` for `status='unsubscribed'`; `bounced_at` for `status='bounced'`. Satisfies GDPR Art. 5(1)(e) data minimisation: no purpose for retaining data about people who have opted out.

**Double opt-in:** GDPR/ePrivacy do not mandate double opt-in by name. It is adopted here for four concrete engineering reasons:
1. **Strongest consent proof** — the subscriber took a second action from their own inbox, which is hard to dispute
2. **List hygiene** — eliminates typos and bot-submitted addresses; Google explicitly says clean lists reduce spam complaints
3. **Fewer spam complaints** — opted-in addresses remember signing up; cold addresses don't; complaints damage sender reputation
4. **Sender reputation** — Google treats complaint rate as a hard deliverability signal; lower complaint rate = better inbox placement

Subscribers don't reach `status='active'` without clicking the confirmation link.

### CAN-SPAM compliance

CAN-SPAM's requirements are triggered by **commercial content**, not by being a blog. A purely personal blog sending non-commercial post-update emails is in a low-risk zone. The compliance burden increases when emails promote products, sponsors, paid content, or any commercial purpose.

Regardless, two rules apply now:
- **Transactional emails** (confirmation) are exempt from CAN-SPAM's bulk-marketing requirements
- **Subscribed-content emails** (future newsletters) must include an accurate sender address and a working opt-out; the `unsubscribe_token` flow already satisfies opt-out

Physical mailing address is required if/when emails become commercial under FTC rules. A P.O. box satisfies this. Defer until the blog generates commercial content.

**Email classification matters in code:** treat confirmation emails and newsletter emails as different classes from the start, even if the delivery provider is the same. They have different compliance obligations, different headers, and different deliverability rules. The `email.ts` module currently handles only the transactional confirmation — future newsletter sends belong in a separate function with appropriate `List-Unsubscribe` headers.

### Sender authentication: SPF, DKIM, DMARC (pre-bulk-send gate)

This is not optional at any real sending volume. Google's sender guidelines make these hard requirements for bulk senders (>5,000/day) and strongly recommended for all outbound mail:

| Record | What it does | Required by |
|--------|-------------|-------------|
| **SPF** | Lists servers authorised to send from your domain | Google (all senders) |
| **DKIM** | Cryptographic signature proving the message hasn't been tampered with | Google (bulk senders) |
| **DMARC** | Policy that tells mailboxes what to do when SPF/DKIM fail | Google (bulk senders) |

**None of this is code** — it is DNS configuration on `gkoreli.com`. Resend's dashboard provides the DNS records to add when you verify your sending domain. This should be done before sending the first newsletter, not after.

**`List-Unsubscribe` + `List-Unsubscribe-Post` headers** — required by Google for bulk senders, and strongly recommended for all subscribed-content emails. These enable one-click unsubscribe directly from Gmail's UI. They do not replace the in-body unsubscribe link — they are additive. Engineering task: add these headers to the future `/api/send` implementation in `email.ts`, not to the transactional confirmation email.

```
List-Unsubscribe: <https://gkoreli.com/api/unsubscribe/{rawUnsubToken}>
List-Unsubscribe-Post: List-Unsubscribe=One-Click
```

These are **Phase 2 engineering prerequisites**, not optional enhancements. First bulk send without them risks inbox filtering and potential provider policy violation at scale.

## Why No Third-Party Libraries

The existing blog Worker was built with zero npm runtime dependencies. Every kilobyte matters against the 1 MB uncompressed Worker bundle limit. The full newsletter implementation adds:

| What | Our approach | Alternative library | Bundle cost of library |
|------|-------------|--------------------|-----------------------|
| Token generation | `crypto.getRandomValues` (Web Crypto API, built in) | `nanoid`, `uuid` | ~3 KB / ~5 KB |
| Email delivery | Direct `fetch()` to Resend REST API | `resend` (official SDK) | ~150 KB |
| Turnstile verification | Direct `fetch()` to CF siteverify | — | — |
| Webhook signing | Inline HMAC + `crypto.subtle` | `@svix/api` | ~900 KB |
| Input validation | `email.includes('@')` + length check | `zod`, `joi`, `yup` | 50–150 KB |
| **Total** | **~0 KB external** | **potential total** | **>1 MB** |

The Svix SDK alone (`@svix/api`) would consume the entire Worker bundle budget. This is not a hypothetical — the 1 MB limit is real and enforced at deploy time.

### Inspiration from open source reference implementations

Before finalising the approach, we searched GitHub for real-world Cloudflare Workers newsletter implementations to validate patterns and avoid reinventing solved problems:

**[SamirPaulb/newsletter-and-contact-system](https://github.com/SamirPaulb/newsletter-and-contact-system)**
Uses Cloudflare Workers + KV for subscriber storage. KV is appropriate at small scale; D1 is chosen here because the blog already uses D1 and SQL makes cleanup queries (purge by status + age) significantly cleaner than iterating KV keys.

**[i365dev/LetterDrop](https://github.com/i365dev/LetterDrop)**
Full newsletter system on Workers + D1 + Resend. Confirms the D1 + Resend combination is validated in production. Their schema uses a similar `status` field pattern. They include an admin UI from the start — we defer this until manual D1 querying becomes the bottleneck.

**[Divkix/pickmyclass](https://github.com/Divkix/pickmyclass)**
Shows token-in-URL pattern for confirmation flows on Workers. We extend this with SHA-256 hashing before storage (they store raw tokens — a pattern we chose not to follow).

**[mnestorov/security-headers-cloudflare-worker](https://github.com/mnestorov/security-headers-cloudflare-worker)**
Reference for the CSP and security header set on Workers. Confirms `X-Content-Type-Options`, `Referrer-Policy`, and `Content-Security-Policy` are the right set for Workers-served HTML.

**Key difference from all references:** None of the above use SHA-256 token hashing. Storing raw tokens in the database is the common pattern in open source Workers implementations — and the common mistake. We adopt the pattern used in mature web frameworks (Devise's `Devise.secure_compare`, Doorkeeper's token hashing) where a DB breach cannot yield usable tokens.

**On the "why not a battle-tested library" question more directly:** The libraries that exist for this domain (Buttondown SDK, Mailchimp API client, ConvertKit wrappers) are designed around *managed newsletter platforms*, not around building your own subscription backend. They assume you are calling their API to manage subscribers on their platform — not building subscriber storage in your own D1. There is no battle-tested npm library for "run double opt-in confirmation with D1 as the store," because that combination is specific to this architecture. The Web Crypto API functions we use (`getRandomValues`, `subtle.digest`, `subtle.importKey`) are themselves the battle-tested primitives, backed by the browser specification and the WHATWG standards process.

## Tradeoffs

### Reusing `blog-analytics` DB vs. a separate `blog-newsletter` DB

**Chosen: same DB.** Simpler config (one binding), no new wrangler entry, free plan gives 10 databases and we're using 1.

**The concern:** Subscriber emails are PII. Mixing PII with anonymous page view data in one database is a security smell — a DB export includes both. **Accepted** at personal blog scale where both are on the same Cloudflare account under the same access credentials anyway.

**Migration path:** When the subscriber list reaches a meaningful size, create `blog-newsletter` D1, add a second binding `NEWSLETTER_DB`, migrate the table, update the package Env type. The package boundary (`@gkoreli/newsletter`) means this is isolated to one file change in `db.ts`.

### Resend vs. Cloudflare Email Workers (native)

Cloudflare announced native email sending (paid Workers plan, $5/mo). Still limited availability. Resend's free tier (3K/month) covers Phase 1-2 entirely. Resend is a single `fetch()` call — swappable in `email.ts` without touching any other code. Switch to native CF sending in Phase 3 if/when the subscriber volume justifies it.

### Turnstile managed vs. invisible mode

`data-appearance="interaction-only"` (managed mode): widget appears only when a challenge is needed; can still render a visible checkbox/badge. Invisible mode (`size: 'invisible'`, `execution: 'execute'`): no visible widget at all; Turnstile is an implementation detail.

**Chosen: invisible.** The visible widget — even in interaction-only mode — is visually incompatible with a minimalist blog design. It injects markup into the form, leaves a success-state badge permanently visible after solving, and makes Turnstile a UI component rather than a spam filter. Switching to invisible mode eliminates all visible footprint while preserving full server-side `siteverify` protection. Same bot protection, zero UI damage.

**Important:** "Invisible" is a **widget type configured in the Cloudflare dashboard**, not a client-side render parameter. `size: 'invisible'` is not a valid value and throws a `TurnstileError` at runtime. The sitekey must be for an Invisible widget — the client just calls `turnstile.render(slot, { execution: 'execute', ... })` with no size parameter. Visual hiding is handled by the `hidden` attribute on `.turnstile-slot`, which works regardless of widget type.

**Client-side flow:** Turnstile script loads with `?render=explicit&onload=__tsInit`. The `window.__tsInit` no-op is defined in an inline `<script>` that appears *before* the Turnstile `async` script tag in the HTML — this ordering guarantee means the no-op is always defined when Turnstile checks for it synchronously on load, even when loaded from cache. `subscribe.ts` overrides it with the real init function and also initialises directly if `window.turnstile` already exists — covering both timing orderings without a race. An init guard (`form.dataset.subscribeInit`) prevents double widget render and duplicate submit listeners if both paths fire.

### Rate limiting: Workers Native vs. KV-based

Workers Native Rate Limiting (GA Sept 2025, free tier): zero KV write costs, enforced at the CF edge before the Worker runs. KV-based alternatives require a KV write per request (slow, costs KV operations). The only downside is the `namespace_id` is arbitrary and must be stable across deploys — documented in wrangler.jsonc comments.

## What is NOT built (intentional scope)

- **Admin UI** — query D1 directly: `wrangler d1 execute blog-analytics --command "SELECT * FROM subscribers WHERE status='active'"`. Build a dashboard at `/admin/newsletter` when manual querying becomes friction.
- **Click tracking / open rates** — Resend provides these on paid plan. Not needed at Phase 1–2.
- **Drip sequences / automation** — deliberate simplicity. One confirmation email. Newsletters sent manually via `POST /api/send`. Automate when the manual process is the bottleneck.
- **Separate `NEWSLETTER_DB` binding** — see DB tradeoff above. Defer until subscriber list is meaningful.
- **Queue-based sending** — `POST /api/send` is synchronous. At 50–500 subscribers, a Resend batch call takes <1s. Queues are Phase 3.

## Known Gaps

- **`'unsafe-inline'` in `script-src` CSP** — Two inline scripts remain in `page.ts` (theme detection and analytics fire-and-forget). Both are intentionally tiny and performance-sensitive (theme must run before first paint to avoid flash; analytics benefits from `keepalive: true` at page exit). Moving them to external modules would allow removing `'unsafe-inline'` from the CSP. Defer until the cost is worth the security improvement; nonces would require per-request generation which is incompatible with a static build.
- **Turnstile iframe console violations** — Cloudflare's challenge iframe probes browser capabilities (XR tracking, camera, etc.) as part of bot fingerprinting. These probes are blocked by the `Permissions-Policy` header and logged as violations in DevTools (`normal?lang=auto:1 [Violation] Permissions policy violation: xr-spatial-tracking is not allowed`). Expected behavior; Turnstile functions correctly despite them. Only visible in DevTools — not user-facing. Cannot be silenced without weakening the Permissions-Policy.

## Future Vision

### Phase 2 (50+ subscribers) — SHIPPED

**Prerequisites before first bulk send (DNS + infrastructure, not code):**
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
  Saves users who miss the first email. Rate-limited. Always returns 200 (no enumeration).
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

# ADR-0010: Email Subscriptions — D1 + Resend + Turnstile

## Status

Accepted — 2026-04-08. Implementation shipped same day.

## Context

The procrastination article hit 8.3K views in under two hours, 52 shares, #9 on r/ADHD — with zero way to capture readers for the next article. Every channel used to distribute (Reddit, X, HN) is rented attention: the algorithm decides if people see the next post. An email list is the one channel where pressing send reaches 100% of subscribers — no feed ranking, no platform decay.

The goal: capture readers at peak intent (just finished an article that resonated) and retain them so the next article starts with a baseline audience instead of zero.

**Constraints:**
- Already running Cloudflare Workers + D1 + static assets — no new infrastructure budget
- Personal blog scale: 0 subscribers today, target <10K over 12–18 months
- Free tier must cover the full stack (D1, Workers, Resend, Turnstile all have generous free tiers)
- Must ship tonight while traffic is live, not after a 2-week architecture review

## Decision

**Add `packages/newsletter` — a self-contained package following the `packages/analytics` pattern.**

Routes added to the existing worker under `/api/*` (already `run_worker_first`, no wrangler changes):
- `POST /api/subscribe` — validate email → verify Turnstile → insert as pending → send confirmation via Resend
- `GET /api/confirm/:token` — confirm double opt-in → mark active → return success HTML
- `GET /api/unsubscribe/:token` — mark unsubscribed → return confirmation HTML

**Reuse the existing `DB` D1 binding.** Add a `subscribers` table to `blog-analytics` — no new D1 database, no new wrangler binding.

**Turnstile** (Cloudflare, free) for spam protection. Managed mode — invisible for trusted users, challenge only when suspicious. `TURNSTILE_SITE_KEY` baked into static HTML at build time via `process.env.TURNSTILE_SITE_KEY`. `TURNSTILE_SECRET_KEY` set as a Worker secret via `wrangler secret put`.

**Resend** for email delivery. One `fetch()` to `https://api.resend.com/emails`. Free tier: 3,000 emails/month, 100/day — more than sufficient for Phase 1. `RESEND_API_KEY` set as a Worker secret. Resend is the delivery pipe; D1 is the source of truth. Swap the delivery layer later without losing any subscriber data.

**Double opt-in** — legally required (CAN-SPAM, GDPR) and spam-prevention best practice. Separate `confirm_token` (one-time, cleared after use) and `unsubscribe_token` (permanent per subscriber, included in every newsletter).

**Subscribe form** in `page.ts` footer — appears on every page. Highest-intent placement is immediately after finishing an article. Button is disabled until Turnstile completes (or if `TURNSTILE_SITE_KEY` is unset in dev, enabled immediately as a graceful fallback).

**`source` column** tracks which page the subscriber came from. Free analytics on which content converts — knows if the procrastination article drove 80% of signups.

## Architecture

```
Browser form
  POST /api/subscribe { email, turnstile, source }
    │
    ├── verifyTurnstile() → challenges.cloudflare.com/turnstile/v0/siteverify
    ├── validateEmail()
    ├── findByEmail(DB) → 409 if active, re-send if pending, insert if new
    ├── insertSubscriber(DB, email, confirmToken, unsubToken, source)
    └── sendEmail(RESEND_API_KEY, email, confirmUrl) ← ctx.waitUntil() fire-and-forget

  GET /api/confirm/:token
    └── confirmSubscriber(DB, token) → HTML success page

  GET /api/unsubscribe/:token
    └── unsubscribeByToken(DB, token) → HTML confirmation page
```

```
packages/newsletter/
├── migrations/
│   └── 0001_create_subscribers.sql   ← apply to blog-analytics DB
└── src/
    ├── index.ts        ← public API: handlers + NewsletterEnv type
    ├── db.ts           ← D1 types + query helpers (findByEmail, insert, confirm, unsub)
    ├── turnstile.ts    ← Turnstile siteverify wrapper
    ├── email.ts        ← Resend fetch + HTML email templates
    ├── responses.ts    ← shared json() + htmlPage() response helpers
    ├── subscribe.ts    ← POST /api/subscribe handler
    ├── confirm.ts      ← GET /api/confirm/:token handler
    └── unsubscribe.ts  ← GET /api/unsubscribe/:token handler
```

**Env composition in the worker:**
```typescript
type Env = AnalyticsEnv & NewsletterEnv;
// AnalyticsEnv: { DB, ASSETS, OWNER_IPS? }
// NewsletterEnv: { DB, RESEND_API_KEY, TURNSTILE_SECRET_KEY }
// TypeScript intersection: DB appears once, both packages share the binding
```

## Schema

```sql
CREATE TABLE subscribers (
  id               TEXT PRIMARY KEY,                          -- crypto.randomUUID()
  email            TEXT UNIQUE NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'active', 'unsubscribed')),
  confirm_token    TEXT,                                      -- cleared after confirmation
  unsubscribe_token TEXT NOT NULL,                           -- permanent, used in email footers
  source           TEXT,                                     -- pathname where signup happened
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  confirmed_at     TEXT,
  unsubscribed_at  TEXT
);

CREATE INDEX idx_subscribers_email         ON subscribers (email);
CREATE INDEX idx_subscribers_confirm_token ON subscribers (confirm_token);
CREATE INDEX idx_subscribers_unsub_token   ON subscribers (unsubscribe_token);
CREATE INDEX idx_subscribers_status        ON subscribers (status);
```

**Why separate `confirm_token` and `unsubscribe_token`?** Confirm is one-time (cleared after use, reduces replay risk). Unsubscribe is permanent (stable link in every newsletter, never changes). Sharing a single token would mean clearing it on confirm breaks unsubscribe links.

**Why `id TEXT` (UUID) not `INTEGER AUTOINCREMENT`?** Consistent with the token generation approach (`crypto.randomUUID()`). Row IDs are never exposed externally — internal only — so the choice is aesthetic, not security-critical.

## Tradeoffs

### Reusing `blog-analytics` DB vs. a separate `blog-newsletter` DB

**Chosen: same DB.** Simpler config (one binding), no new wrangler entry, free plan gives 10 databases and we're using 1 — the headroom exists but the complexity doesn't pay off at this scale.

**The concern:** Subscriber emails are PII. Mixing PII with anonymous page view data in one database is a security smell — a DB export or backup includes both. **Accepted** at personal blog scale where both are on the same Cloudflare account under the same access credentials anyway. **Migration path:** When the subscriber list reaches a meaningful size, create `blog-newsletter` D1, add a second binding `NEWSLETTER_DB`, migrate the table, update the package Env type. The package boundary (`@gkoreli/newsletter`) means this is isolated to one file change in `db.ts`.

### Resend vs. Cloudflare Email Workers (native)

Cloudflare announced native email sending in late 2025 (paid Workers plan, $5/mo). Still limited availability. Resend's free tier (3K/month) covers Phase 1-2 entirely. Resend is a single `fetch()` call — swappable in `email.ts` without touching any other code. Choose native CF sending in Phase 3 if/when subscriber volume justifies the $5/mo and CF native is stable.

### Turnstile managed vs. invisible mode

Managed mode: widget appears as a small Cloudflare badge when a challenge is needed; invisible for trusted users. Invisible mode: no widget at all, but slightly lower friction means slightly weaker spam signal. **Chosen: managed.** The badge signals to users that the form is protected (trust signal) and provides stronger anti-spam guarantees.

## What is NOT built (intentional scope)

- **Bulk newsletter sending** — zero subscribers today; build the `/api/send` endpoint when you have 50+. Resend batch API + `ctx.waitUntil()` chain when needed.
- **Admin UI** — query D1 directly: `wrangler d1 execute blog-analytics --command "SELECT * FROM subscribers"`. Build a dashboard at `/admin/newsletter` when manual querying becomes friction.
- **Click tracking / open rates** — Resend provides these out of the box on paid plan. Not needed at Phase 1.
- **KV rate limiting** — Turnstile is sufficient for Phase 1. Add per-IP rate limiting via KV if bot traffic appears.
- **Drip sequences / automation** — deliberate simplicity. One confirmation email. Newsletters sent manually. Automate when the manual process is the bottleneck.

## Future Vision

### Phase 2 (50+ subscribers)
- `POST /api/send` — sends newsletter to all `active` subscribers via Resend batch API
- `delivery_logs` table — records sent/delivered/bounced per send
- Simple admin CLI or protected page to trigger sends

### Phase 3 (500+ subscribers)
- Migrate to Cloudflare native email sending (replace Resend entirely, zero cost)
- Subscriber segments via `tags TEXT` column (e.g. `adhd,engineering`)
- RSS-to-email automation: new post published → Cloudflare Queues → auto-send to list
- Click tracking via redirect: `/r/:token/:url` endpoint logs clicks before redirecting

### Phase 4 (2K+ subscribers)
- Migrate subscribers to separate `blog-newsletter` D1 for data hygiene
- Subscriber-facing preferences page (`/preferences?token=xxx`)
- Integrations: cross-post to Substack or Buttondown for discovery

## Setup Checklist

```
# One-time setup (15 min)
1. Create Turnstile widget at dash.cloudflare.com → Turnstile
   - Mode: Managed
   - Domain: gkoreli.com
   - Copy Site Key (public) → set TURNSTILE_SITE_KEY in build env
   - Copy Secret Key → wrangler secret put TURNSTILE_SECRET_KEY

2. Create Resend account at resend.com
   - Verify gkoreli.com domain (DNS TXT record)
   - Create API key → wrangler secret put RESEND_API_KEY
   - Set From address: newsletter@gkoreli.com (or hello@gkoreli.com)

3. Apply D1 migration:
   wrangler d1 execute blog-analytics \
     --file packages/newsletter/migrations/0001_create_subscribers.sql

4. Build with site key:
   TURNSTILE_SITE_KEY=0xYOURSITEKEY pnpm build

5. Deploy:
   wrangler deploy
```

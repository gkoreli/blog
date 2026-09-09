---
id: TASK-0125
title: Close client error reporting gaps for Turnstile and subscription failures
status: in_progress
parent_id: FLDR-0010
created_at: '2026-09-07T05:09:30.781Z'
updated_at: '2026-09-09T02:48:13.613Z'
type: task
---
P1 reliability. Audit and reproduce: Turnstile error-callback currently discards its code, calls setError, returns true, and never logger.report; missing script/widget, render/execute exceptions, unsupported browser and timeout paths need bounded explicit reporting. Preserve occurredAt in storage (currently parsed then discarded), attach actual build revision, and correlate the failed operation with its browser report instead of storing only the logging request ray. Install early enough to cover bootstrap/resource-load failures where practical. Add duplicate/event budgets and bounded delivery semantics; sendBeacon queueing is not durable receipt, FetchTransport ignores non-2xx, and D1 waitUntil writes may fail after 204. Preserve error distinctions and usable form recovery without capturing email addresses or challenge tokens. Tests must exercise failure behavior rather than mirror implementation.

## Investigation checkpoint

Executed local failure probes against application modules; recorded zero reports from the widget error callback and transport/persistence gaps. See packages/blog/drafts/research/newsletter-reliability/02-client-audit.md and repro/results.json. ADR-0011 now distinguishes implemented reporting from remaining goals. Product repairs and browser validation remain open.

## September 9 UTC client repair

The form now handles late/missing widgets, fresh retry identity, stale callbacks, verifier expiry/error/unsupported/timeout, an empty-token rejection, bounded API wait, and static privacy-minimized diagnostics. Generic 202 and service failures preserve form/email with truthful retry guidance. 25 controlled client tests pass; see [12-client-verification.md](../../packages/blog/drafts/research/newsletter-reliability/12-client-verification.md). A successful test of this component does not establish delivery of every client report; shared transport/ingestion and production completion remain separate unfinished acceptance in TASK-0126 and TASK-0124.

## Live component acceptance — September 9 UTC

The authorized native Chrome flow passed a real Turnstile challenge and signup, preserving a usable form after the earlier service failure and generic 202. The server log's opaque attempt ID links the accepted request to its ledger entry. [Live receipt](../../packages/blog/drafts/research/newsletter-reliability/15-live-signup-acceptance.md). This does not complete occurredAt/build identity, browser-to-server error correlation, early bootstrap coverage or shared logger transport/ingestion acceptance listed above; those remain open.

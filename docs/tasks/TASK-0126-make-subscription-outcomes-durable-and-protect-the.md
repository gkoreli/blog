---
id: TASK-0126
title: Make subscription outcomes durable and protect the diagnostic endpoint
status: in_progress
parent_id: FLDR-0010
created_at: '2026-09-07T05:09:30.844Z'
updated_at: '2026-09-09T01:57:04.585Z'
type: task
---
P1 operations. Record privacy-minimized server outcome stages for subscription rejection, pending creation, confirmation-email provider acceptance/failure, confirmation and rate-limit rejection, with retention and bounded cost. Current delivery_logs covers newsletter campaigns, not confirmation mail; confirmation send errors only reach Worker console while the browser already sees 202. Add a review/alert mechanism for configuration failures and tests for quota/DB failures. Audit ingestion: body size enforced from Content-Length only; server does not reapply client redaction; missing-origin/cross-origin requests are not explicitly rejected; no ingestion rate binding or event budget. Reproduce locally and remedy with actual byte limits, shared sanitization, appropriate origin checks and bounded rate limiting. Assess the shared-D1 quota dependency separately from this invalid-secret incident; do not infer the observed account usage alert caused it.

## Investigation checkpoint

Initial local probes completed, including actual-body size bypass without Content-Length, absent origin rejection, incomplete server redaction, and acknowledged failed D1 persistence. These are synthetic handler observations, not evidence of production abuse or historical report loss. Evidence: packages/blog/drafts/research/newsletter-reliability/repro/results.json.

## September 9 UTC prior-art input

[The source review](../../packages/blog/drafts/research/newsletter-reliability/05-prior-art-2026.md) identifies directly reusable Resend behavior: stable idempotency keys for retries of one send (24-hour provider retention), retained message IDs, and separate API-accepted, recipient-server-delivered, delayed, failed, bounced and complained outcomes. Current sendConfirmationEmail omits the idempotency key and discards a successful response body; campaign-level deduplication does not supply confirmation-send recovery. Specify bounded durable send intent and shared send reservations/cooldowns for both signup and resend, including ambiguous provider timeouts and a database outage. Provider idempotency does not cap distinct sends, and a delivery event does not prove inbox placement. Research only; implementation and acceptance remain open.

## Implementation checkpoint — September 9 UTC

Confirmation requests now reserve a private D1 attempt before the provider call and record accepted/failed/unknown outcome plus available provider ID/status. The response awaits bounded sending; retries share an idempotency key and exact payload. Failed/unknown/reserved attempts remain charged. Routine confirmation diagnostics use an opaque request ID and static stages without address/token/provider-body logging. This is not a durable outbox and does not save pre-admission addresses. See [10-verification.md](../../packages/blog/drafts/research/newsletter-reliability/10-verification.md) for local and deployment acceptance separately.

This task remains unfinished: general client-error ingestion still needs actual-byte enforcement, server sanitization and admission limits; persistence acknowledgement/transport failures, configuration-failure review and alerts need their own repair. Do not describe confirmation-ledger implementation as complete observability or historical recovery.

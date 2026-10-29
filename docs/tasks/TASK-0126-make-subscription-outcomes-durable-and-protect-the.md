---
id: TASK-0126
title: Make subscription outcomes durable and protect the diagnostic endpoint
status: in_progress
parent_id: FLDR-0010
created_at: '2026-09-07T05:09:30.844Z'
updated_at: '2026-10-29T23:34:32.779008+00:00'
type: task
---
P1 remaining operations. Shared confirmation admission, bounded provider retries and the private accepted/failed/unknown attempt ledger are implemented; sending is awaited before the response. Campaign delivery_logs remains separate. The authorized live test linked a server attempt ID to one accepted send and activation, with Gmail Spam placement tracked in TASK-0145. This task still owns configuration-failure review/alerts and general diagnostic-ingestion protection: actual-byte limits instead of trusting Content-Length, server sanitization, a deliberate origin policy, bounded rate/event admission, and an honest persistence acknowledgement. Reuse local failure captures and test the fixes without repeating production scans. Keep shared-D1 quota failures distinct from verifier configuration failures; one does not establish the other's cause.

## Investigation checkpoint

**October 29 direct-ingestion acceptance:** [Research 20](../../packages/blog/drafts/research/newsletter-reliability/20-production-diagnostic-readback-and-cleanup.md) verifies one controlled record independently of its 204 response, then removes it with an exact guard and confirms absence. The endpoint still acknowledges before its background write completes and the fallback fetch ignores rejected HTTP responses. Next: native delayed/failed persistence and non-2xx controls, followed by truthful confirmation semantics without automatic retries or duplicate reports. Other admission/configuration/alerting requirements remain open.

**October 29 retained-evidence follow-up:** [Bounded audit](../../packages/blog/drafts/research/newsletter-reliability/18-retained-widget-errors-and-conversion-limits.md) finds 35 generic widget reports in the October window, with no build identity or usable operation/provider-code distinction. It does not measure ingestion completeness or historical loss. The inspected handler still catches D1 failure and returns an early 204; beacon queueing has no persistence acknowledgment. Keep the existing acknowledgment/admission requirements open. No endpoint runtime or policy changes in this audit.

Initial local probes completed, including actual-body size bypass without Content-Length, absent origin rejection, incomplete server redaction, and acknowledged failed D1 persistence. These are synthetic handler observations, not evidence of production abuse or historical report loss. Evidence: packages/blog/drafts/research/newsletter-reliability/repro/results.json.

## September 9 UTC prior-art input

[The source review](../../packages/blog/drafts/research/newsletter-reliability/05-prior-art-2026.md) identifies directly reusable Resend behavior: stable idempotency keys for retries of one send (24-hour provider retention), retained message IDs, and separate API-accepted, recipient-server-delivered, delayed, failed, bounced and complained outcomes. Current sendConfirmationEmail omits the idempotency key and discards a successful response body; campaign-level deduplication does not supply confirmation-send recovery. Specify bounded durable send intent and shared send reservations/cooldowns for both signup and resend, including ambiguous provider timeouts and a database outage. Provider idempotency does not cap distinct sends, and a delivery event does not prove inbox placement. Research only; implementation and acceptance remain open.

## Implementation checkpoint — September 9 UTC

Confirmation requests now reserve a private D1 attempt before the provider call and record accepted/failed/unknown outcome plus available provider ID/status. The response awaits bounded sending; retries share an idempotency key and exact payload. Failed/unknown/reserved attempts remain charged. Routine confirmation diagnostics use an opaque request ID and static stages without address/token/provider-body logging. This is not a durable outbox and does not save pre-admission addresses. See [10-verification.md](../../packages/blog/drafts/research/newsletter-reliability/10-verification.md) for local and deployment acceptance separately.

This task remains unfinished: general client-error ingestion still needs actual-byte enforcement, server sanitization and admission limits; persistence acknowledgement/transport failures, configuration-failure review and alerts need their own repair. Do not describe confirmation-ledger implementation as complete observability or historical recovery.

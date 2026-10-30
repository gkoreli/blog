---
id: TASK-0125
title: Close client error reporting gaps for Turnstile and subscription failures
status: in_progress
parent_id: FLDR-0010
created_at: '2026-09-07T05:09:30.781Z'
updated_at: '2026-10-30T00:00:45.152259+00:00'
type: task
---

**October 29current rendering repair:** [Evidence and acceptance](../../packages/blog/drafts/research/newsletter-reliability/17-rendered-sitekey-regression.md). The live main form loses its public key through a nested attribute fragment, so the existing client cannot initialize verification. Direct native attribute binding, actual SSG/client regression coverage and a production-output guard pass local checks. Source delivery/activation/DOM acceptance remain separate; no email/challenge repeat or change to secrets, verification, limits or provider sending. Earlier September acceptance stays historical and the remaining reporting requirements below remain open.
P1 remaining client observability. The subscription form's missing/late widget, failure, expiry, unsupported-browser and timeout paths emit static stages and leave usable retries; the September acceptance remains dated evidence. Do not repeat that implementation. October 29's occurrence/phase/provider-evidence and acknowledgment implementations have separate delivery/acceptance records below. Attach actual build revision and correlate the failed operation with its browser report instead of storing only the logging request ray. Cover bootstrap/resource-load failures where practical. Add duplicate/event budgets and actual browser-delivery controls; a queued beacon remains distinct from storage acknowledgment. Keep addresses, tokens and arbitrary API response text out of diagnostics. Tests must exercise the remaining failure behavior.

## Investigation checkpoint

Executed local failure probes against application modules; recorded zero reports from the widget error callback and transport/persistence gaps. See packages/blog/drafts/research/newsletter-reliability/02-client-audit.md and repro/results.json. ADR-0011 now distinguishes implemented reporting from remaining goals. Product repairs and browser validation remain open.

## September 9 UTC client repair

The form now handles late/missing widgets, fresh retry identity, stale callbacks, verifier expiry/error/unsupported/timeout, an empty-token rejection, bounded API wait, and static privacy-minimized diagnostics. Generic 202 and service failures preserve form/email with truthful retry guidance. 25 controlled client tests pass; see [12-client-verification.md](../../packages/blog/drafts/research/newsletter-reliability/12-client-verification.md). A successful test of this component does not establish delivery of every client report; shared transport/ingestion and production completion remain separate unfinished acceptance in TASK-0126 and TASK-0124.

## Live component acceptance — September 9 UTC

The authorized native Chrome flow passed a real Turnstile challenge and signup, preserving a usable form after the earlier service failure and generic 202. The server log's opaque attempt ID links the accepted request to its ledger entry. [Live receipt](../../packages/blog/drafts/research/newsletter-reliability/15-live-signup-acceptance.md). This does not complete occurredAt/build identity, browser-to-server error correlation, early bootstrap coverage or shared logger transport/ingestion acceptance listed above; those remain open.

**October 29 rendered-key acceptance:** [Receipt](../../packages/blog/drafts/research/newsletter-reliability/rendered-sitekey-release.json) joins source `75bb999` / successful build / full allocated Worker. Excluded HTTP and agent-browser DOM checks confirm public-key delivery and handler initialization; no widget readiness, challenge, email or human accuracy claim. Existing reporting and broader analytics requirements remain open.

**October 29 retained-error audit:** [Evidence](../../packages/blog/drafts/research/newsletter-reliability/18-retained-widget-errors-and-conversion-limits.md) finds 35 generic widget-error reports in the fixed October window, all without build identity. A new idle-callback counterexample emits one report with no submit/execution/signup request; missing-key/slot controls assert silent initialization before a submission. All 129 site tests and workspace types pass. One native-tested production aggregate costs 341 reads/zero writes; no raw reports or new visits. Next: bounded operation-phase and provider-error metadata with missing/unknown states. Occurrence/build identity, correlation and delivery requirements above remain open; no historical attempt/human count is inferred.

**October 29 evidence implementation:** [Research 19](../../packages/blog/drafts/research/newsletter-reliability/19-subscription-error-phase-and-provider-evidence.md) implements phase/provider evidence and occurrence persistence. Native D1/CLI checks and 137 site tests/types/validation/isolated build pass. The additive production schema is accepted without a backfill. [Writer/client release](../../packages/blog/drafts/research/newsletter-reliability/subscription-evidence-release.json) joins source `15a6868`, native successful build, full Worker at 100% and exact/normalized served assets. No diagnostic report is posted, so live metadata readback remains separate. Actual build identity, correlation, early bootstrap, budgets and transport/ingestion acknowledgment remain open. No email or human trial runs.

**October 29 direct-ingestion readback:** [Research 20](../../packages/blog/drafts/research/newsletter-reliability/20-production-diagnostic-readback-and-cleanup.md) closes one labelled production metadata check on source `36839d7` / Worker `2a8c948e`: exact fields stored, unrecognized extra property discarded, one owned synthetic row removed and absence verified. Three primary statements cost nine reads/one cleanup write; ingestion cost is unmetered. Native guards and 138 site tests/types pass. This is direct HTTP ingestion, not actual browser callback or population delivery acceptance. The remaining requirements above stay open.

**October 29 acknowledgment implementation:** [Research 21](../../packages/blog/drafts/research/newsletter-reliability/21-truthful-error-report-acknowledgments.md) implements one-row D1 confirmation before 204, unconfirmed 503, and distinct transport receipts with exact-204 fetch handling and no retries. Handled disconnect completion stays registered. Paired native write/HTTP faults and 144 site tests/types/validation/isolated build pass. Activation and a labelled live success remain separate; actual browser delivery, build/correlation, budgets/admission and bootstrap remain open.

**Acknowledgment release accepted:** [Source/build/allocation/served-client/live success receipt](../../packages/blog/drafts/research/newsletter-reliability/client-error-acknowledgment-release.json) closes delivery on source `dae0bc3` / full Worker `e586a0e4` at 100%. One labelled record is independently read back, removed and verified absent. Native failures remain separate from actual browser/population/outage measurements. The remaining requirements above stay open.

# Preserve the error's context before clearing the attempt

October 29, 2026 UTC. The [retained-error audit](18-retained-widget-errors-and-conversion-limits.md) could not distinguish an idle widget error from a failed signup attempt. Its 35 generic reports also lacked provider codes and build identity. This iteration preserves two missing facts for new diagnostics and stops discarding the already parsed occurrence time. It does not reconstruct the old cohort or establish a conversion denominator.

## The new evidence

The dedicated [evidence module](../../../../client-observability/src/subscription-evidence.ts) defines `subscribe-error-v1`. A recorded value contains the active phase (`idle`, `verifying`, `sending`, or `unknown`) and one provider-code state: not applicable to this diagnostic, callback supplied no value, invalid under the bounded format, or a six-digit code. Unsupported profiles and malformed envelopes have separate states. Absence remains unrecorded, including older clients.

`idle` means no active attempt at detection; it does not mean the visitor has never submitted before. The main failure path captures the phase **before** clearing its active attempt. A provider code stays separate from HTTP status. Six ASCII digits are a syntax bound, not an authenticity or validity verdict: unknown numeric codes remain available for later interpretation. Arbitrary callback text, extra properties and unrecognized phase strings are not copied into the stored object. Browser redaction, server parsing and the storage boundary rebuild the same closed fields, scoped to subscription interaction reports.

The [callback documentation](https://developers.cloudflare.com/turnstile/troubleshooting/client-side-errors/) says it supplies an error code. The [current code reference](https://developers.cloudflare.com/turnstile/troubleshooting/client-side-errors/error-codes/) distinguishes configuration, iframe-loading and challenge problems. This implementation retains bounded evidence without asserting which historical code occurred. It does not adopt a challenge failure as a bot label. Reports remain spoofable; neither these fields nor a successful challenge establishes a human operator or useful reading.

New records also preserve canonical `occurred_at`, a client-reported instant, separately from server-generated `created_at`. This does not authenticate the client's clock. The nullable `subscription_evidence` column stores the normalized object. The [additive migration](../../../../client-observability/migrations/0002_add_subscription_error_evidence.sql) has no default, backfill or new index. Existing records retain null new fields. The old writer remains compatible while the schema is prepared. The [privacy page](../../../src/pages/privacy.ts) describes the added facts and clarifies that thirty days is cleanup eligibility, not guaranteed physical removal.

## Checks and schema delivery

[Checks](subscription-evidence-native.json): all **137 site tests**, workspace types, 22 Markdown validations and an isolated 33-post build pass. The client tests distinguish idle, verification and sending failures without changing static stages or HTTP statuses. Parser tests cover missing/malformed/future profiles, unknown phases, extra fields, invalid code formats and out-of-scope components/types. An initial loader-resolution failure and a sandbox IPC build failure occur before their tests/compilation; corrected launches succeed. The shared development output is untouched.

Native D1 exercises ten stored cases plus the actual logger → redactor → handler → database path. A legacy row keeps every previous scalar and null new fields after migration. These are controlled local cases, not human/device accuracy or actual challenge trials. Node SQLite tests remain separate from the native D1 check.

[Production schema receipt](subscription-evidence-schema.json): the original metadata preflight finds eighteen columns. The first migration invocation fails in Wrangler argument parsing because its SQL begins with a `--` comment. The installed CLI's unknown-argument validation and an exact local command test identify the execution-path issue. Supplying one `--command=SQL` argument preserves the commented SQL. A new frozen plan and fresh preflight again find eighteen columns before the corrected invocation. Both ALTER statements succeed; final metadata finds twenty columns and the two expected names. The root analytics migration queue is not applied.

Five metered SQL statements total **208 reads and two DDL writes**: two preflights, two ALTER statements and one final schema check. The rejected CLI invocation has no D1 result/meter; it is preserved separately. No diagnostic records are selected, rewritten or backfilled. There is no subscription request, email, human trial or own-site visit in schema delivery. Writer deployment and an actual production diagnostic readback remain separate acceptance work.

## What remains

Actual build identity, operation correlation, durable transport/ingestion acknowledgment, admission limits and early bootstrap coverage remain TASK-0125/0126. A newly stored occurrence time does not repair those gaps. No population error rate, subscriber loss, human growth or article usefulness follows from this change. Article 023/030 prose and existing traffic counts are unchanged; human trials remain deferred.

Next: publish the checked writer/client and join its source, successful build and full allocation. Verify the served client/privacy artifacts separately. A later labelled ingestion control needs a frozen write/readback/cleanup plan; it must not become an unexplained natural-error count.

The private pre-publication archive preserves 83 files under SHA-256 manifest `90bfd7b8f818b7af8160768e68b3a22b83ff2f55c3d9796731fa2081660c14bb`, including tested source, native/CLI results, rejected invocations, schema plans/meters and handoff. Runtime hashes match both the checked source and isolated snapshot. October 31 is an evidence-review date, not automatic deletion.

## Writer/client release accepted

[Release receipt](subscription-evidence-release.json): source `15a6868` links through successful native build `e134eca3` to full Worker `45650ef9-6f8b-405c-bd39-2a6dc8acd998`, confirmed by fresh CLI at 100% allocation. The native build uploads exactly the changed `main.js` and privacy HTML. The fresh completed GitHub check has a different ID from the initial in-progress capture for the same source/build; both records are preserved without inferring why.

Two frozen, one-attempt prefetch GETs return 200. All 28,162 bytes of client JavaScript match the checked build. Privacy HTML matches outside its single public-key attribute value; this does not verify that key's ownership or validity. Eligibility excludes the asset/prefetch requests by source; no ingestion readback or per-request Worker trace is collected. No diagnostic report is posted, so production persistence of the new metadata remains unmeasured. No challenge, subscription, email, human trial or additional D1 statement occurs during asset acceptance. Pending browser tabs are retained; no own-site browser tab is opened.

Next: native-test and freeze one labelled direct-ingestion write/readback/guarded-cleanup control. It must remain separate from actual browser callback delivery and human measurements, and it must not inflate natural diagnostic totals.

The private 23-file release archive has SHA-256 manifest `6f67ba00ec3c415dc81cfa23e5768bdc5dad2d5ba1f37c8437910edfe37ff15b`. It preserves both check identities, plans, native build state/screenshot, allocation and saved responses/controllers. Served artifact hashes match the acceptance receipt. The broader analytics goal remains open.

[Research 20](20-production-diagnostic-readback-and-cleanup.md) subsequently accepts one labelled direct-ingestion record, exact metadata readback and guarded cleanup/absence verification. This closes the planned persistence control for its measured source/Worker. It does not establish actual browser callback delivery or general transport durability.

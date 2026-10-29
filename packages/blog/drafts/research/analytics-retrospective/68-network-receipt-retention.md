# The network assessment survives the retained-log export

October 29, 2026 UTC. Continues [versioned published-address receipts](67-published-address-receipts.md). The previous goal turn shipped code and accepted live/storage evidence: progress. This follow-up reuses its two existing synthetic controls. It creates no observation, starts no tail and makes no new D1 query. Human-operated trials remain deferred.

## What was missing

Research 67 established live receipt/storage equality, but not whether the new network fields survived the provider's retained-log path. [Earlier receipt exports](28-receipt-export-fidelity.md) had omitted nulls and empty arrays. The new representation uses explicit scalar absence states, counts and named source objects. Native tests of that format did not establish provider behavior.

[Retained acceptance](network-receipt-retained.json) now covers both unsigned synthetic requests collected as `2026-10-29.3`, receipt `2026-10-29.1`, in Worker `2c8ab95c`. The existing public exclusion and exact-row acceptance remain as recorded in Research 67; they are not re-executed here.

## Fix the scope before interpreting a zero

An initial text-search view showed zero matches. Fixing the interval to **03:16–03:19 UTC** subsequently exposed the first control's stored/attempt pair. Query completion, elapsed time and scope changed; no single cause of recovery is isolated. Loading views also temporarily displayed previous results. These transitions do not establish lost records.

Clearing the text box with keyboard selection and Enter unexpectedly accepted an autocomplete term. The resulting URL included an unintended `$metadata.message` needle. The visible generated expression and URL exposed that difference. The final exact query uses structured `operationId` membership for the two private existing references, with no text needle. Its four visible events are **two attempts and two stored receipts**, not four page requests.

The native JSON download has a confirmation dialog and export limit. An initial download-event wait expired at that dialog, before download submission; the existing page state was inspected rather than starting another export. Selecting the smallest available limit, 100, then submitting produced exactly the four scoped records. An export limit is not a D1 read cap or population-completeness guarantee.

## Compare representations and stored facts separately

The maintained comparer requires unique operation references, exact log timestamps and matching collection/receipt versions. Both stored events match the archived live tail: **two identical pairs, zero differences, omissions, invalid pairs or unexpected network fields**. A separate deep comparison accepts complete receipt-object and storage-object equality for both pairs. The cached exact-row readback also reconciles both actual provider records without another database request.

Each stored event's individual copy was then captured after a fresh non-sensitive clipboard marker. Both UI actions acknowledged copying and replaced the marker. These individual objects flatten source fields and retain nanoseconds as decimal text; the existing normalizer checks exact conversion to milliseconds. Both individual receipts, storage objects and timestamps agree with the bulk download and live copies. Combining those two individual objects offline tests the supported input shape; it is not another provider export or two additional requests.

The configured Amazon source retains `not-listed`, its reason sentinel, 816-entry snapshot, digest, publisher version/availability and freshness times. Meta's unconfigured method retains zero counts, false summary flags and explicit no-check state. Neither copy authenticates its synthetic UA declaration.

Two positive structured queries test actual indexing within the same fixed interval:

| Typed field condition, with receipt version `.29.1` | Observed stored events | Existing control |
|---|---:|---|
| `receipt.vendorNetwork.checks.sources.amazon-search.outcome = "not-listed"` | 1 | Amazon search claim |
| `receipt.vendorNetwork.checkCount = 0` (numeric) | 1 | Meta advertising claim |

The nested source key and its available value appear in the native field selector. Querying the key returns the expected event; merely seeing a suggested key would have been weaker evidence.

## Documentation and limits

[Cloudflare Query Builder](https://developers.cloudflare.com/workers/observability/query-builder/) distinguishes text search, structured filters, Events and invocation grouping. The [telemetry query schema](https://developers.cloudflare.com/api/resources/workers/subresources/observability/subresources/telemetry/methods/query/) documents typed filters and comma-separated set membership. [Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/) describes structured indexing, sampling, truncation and retention. These capabilities support this method; none promises a complete or lossless account-wide export. Primary capture URLs and digests are included in the acceptance record.

Twenty-five relevant comparer, storage-reconciliation and network-projection tests pass. This is an evidence/documentation change: no runtime, schema, classifier, verifier, method profile, report cache or raw-capture setting changes. The article remains **1,358 words/31 prompts**, with its existing Research 67 link leading to this follow-up. No fresh served-page or production-health claim is made.

This closes the retained-fidelity gate for these two unsigned controls through the observed bulk/individual paths. It does not measure complete log retention, signed-proof/failure/multi-source branches, genuine vendor identity, human/device accuracy or request-level native-verifier agreement. Dashboard queries and export work have separate unreturned service costs; zero new D1 statements does not mean zero total service work.

Next: seek genuine current-verifier signed records with recoverable request inputs and exact storage references, using bounded native-log selection before any separately budgeted database query. Preserve unknowns if the inputs are missing. Human trials and the broader [goal requirements](current-goal-audit.json) remain open.

The private archive contains 31 captured files plus its manifest, with 0700/0600 modes. Manifest SHA-256: `9159fae5c23cdecba9e81911a5a9442673d79670db948a21cae7aaceee1c2b36`. The prior native/live archives stay unchanged. October 31 is a review date, not automatic deletion or provider-wide erasure.

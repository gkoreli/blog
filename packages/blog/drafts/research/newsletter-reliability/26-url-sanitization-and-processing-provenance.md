# Know which boundary processed a diagnostic

October 30 UTC, 2026. Local implementation, selected controls and additive production schema acceptance. Writer activation/readback remain separate gates.

Browser-side redaction did not establish a server boundary. A caller could bypass it and store URL credentials, query values, fragments, unsupported source URLs and confirmation-token paths. Truncation made this worse: cutting a long URL before parsing could preserve a partial username instead of the intended resource. These are synthetic reproductions, not findings that retained reader records contain those values.

## Shared processing, bounded claim

Browser redaction, HTTP parsing before logging, and the storage writer now share the URL policy. Complete bounded URL inputs are processed before output truncation. HTTP(S) sources retain origin/path while dropping userinfo, query and fragment. Same-origin referrers can retain a path; external or unknown-context referrers retain only origin. Unsupported source schemes produce a static marker, and invalid referrers are discarded. Known confirmation/unsubscribe token routes are masked, including one level of encoded path spelling. Network-path/control-character page paths are rejected. URL tokens in message/stack text are scrubbed; recognized non-HTTP URI tokens become a marker. Closed field reconstruction discards arbitrary properties.

This keeps script paths, separate line/column, HTTP status, bounded User-Agent and the complete supported client build ID. It is deliberately **not a universal personal-data or secret detector**. Plain text, encoded text not recognized as a URL, arbitrary path segments and application-specific values can still carry sensitive information. Query removal can lose stack locations embedded in a URL's query/fragment; separate line/column remain available. The corpus explicitly retains a plain-email-shaped free-text counterexample as unresolved. No legal compliance verdict, anonymization claim or identity proof follows.

[Sentry's URL utilities](https://github.com/getsentry/sentry-javascript/blob/develop/packages/core/src/utils/url.ts) distinguish URL parsing, query/fragment removal and userinfo filtering. Its [collected-URL helper](https://github.com/getsentry/sentry-javascript/blob/develop/packages/core/src/utils/data-collection/filterCollectedUrl.ts) also distinguishes SDK-collected URLs from caller-attached data. That distinction is why merely finding a sanitizer in an SDK would not prove all our caller fields are covered. We use platform URL parsing and our shared field policy without adding the SDK or claiming equivalent behavior. These source branches are mutable and were inspected on this date; documentation pages that failed to load are not evidence.

[OpenTelemetry's sensitive-data guidance](https://opentelemetry.io/docs/security/handling-sensitive-data/) puts context-specific sensitivity and collection review on the implementer. Its [redaction processor](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/processor/redactionprocessor) separates field allowlists, value masking and optional transformation summaries. We borrow closed reconstruction and explicit policy provenance, rather than assuming a parser makes arbitrary text safe. The engineering README's legal examples are not used as legal authority. Retention/basis review and the broader free-text collection decision remain open; no new IP/user identifier, third-party exporter, cookie or raw-reader scan is added here.

## Server-generated provenance

New rows can store a nullable `processing_evidence` JSON field:

```json
{"profile":"client-error-processing-v1","sanitization":"client-error-urls-v1","admission":"origin-route-budget-v1"}
```

The HTTP handler supplies admission context after its gates, and the writer supplies the sanitizer profile. Client properties cannot supply these facts through the payload parser. Direct storage calls without handler context record admission as `unassessed`; the writer still reparses and applies the shared boundary. The schema/profile describes the processing path, not the truth of the error, its original unretained contents or the operator's identity. It is not cryptographic attestation.

Historical rows remain null without backfill. A null record is unrecorded provenance, not proof of today's policy. Accepted-row stamps also do not count reports rejected or lost before storage. Comparisons across admission changes still need compatible denominators and loss measurements.

## Selected native and browser results

[Native receipt](client-error-sanitization-native.json): 13 conditions per version execute actual handlers in local workerd/native D1. Eleven old conditions retain a synthetic URL/token marker; none of those markers survive the current stored projection. Ten are scrubbed/dropped and the network-path case is rejected. The separate ordinary case retains useful fields, and the free-text counterexample survives in both versions. These are selected examples, not privacy error rates or population prevalence.

Four native rollout conditions verify old writer/old schema =204, new writer/old schema =503 without insertion, new writer/added column =204, and old writer/added column =204. Existing row values are unchanged and retain null processing provenance. This makes migration-before-writer delivery a measured requirement.

[Browser receipt](client-error-sanitization-browser.json): a frozen two-click local trial starts with zero rows. Actual beacon/fetch transports, shared browser redaction and the real native handler store two expected source paths and server profiles, with no synthetic URL credential/query marker in readback. Queueing and server acknowledgment remain separate client receipts. This is one agent-operated browser, not the complete production entry bundle, a human label, browser-close behavior or population compatibility. The owned controller ends 143 and its endpoint is unreachable; no final disposal marker is inferred. The completed tab is closed.

[Checks](client-error-sanitization-checks.json): 165 site tests, workspace types, 22 Markdown validations and isolated 33-post build pass. Existing native acknowledgment, byte-limit, admission and correlation assertions still pass with the additive schema. An initial fake-D1 test-brace syntax error is corrected and preserved. Correlation's first snapshot wrongly requests a new source file from an older commit; the corrected helper enumerates each commit's own source tree, and a new run passes. Those setup failures are not product results or silently overwritten trials.

## Schema acceptance and a query-access failure

The initial production `PRAGMA table_info` preflight returns Cloudflare 7403 and the controller stops before DDL. Fresh account/database metadata and listed OAuth D1 scope do not prove query access. A native-tested, separately frozen constant `SELECT 1 AS available` then succeeds for zero reported reads/writes. No credential or permission change is made, and no cause is inferred for the earlier rejection. [Cloudflare's query API](https://developers.cloudflare.com/api/resources/d1/subresources/database/methods/query/) lists D1 Read or Write as accepted permissions; observing a listed scope alone would still not prove that a particular request is authorized.

A new immutable schema plan uses that positive capability evidence. [Schema receipt](client-error-processing-schema.json) verifies the 20-column schema, adds one nullable TEXT column, and independently reads back 21 columns with every prior column's metadata unchanged. No backfill or diagnostic row-value export runs. The three accepted schema statements report 48 reads and one write; the constant probe adds zero. Five production SQL attempts include the original failed preflight, whose meter is unavailable. We do not equate 48 metered reads with 48 distinct diagnostic observations. No new writer is activated by the DDL itself.

Next: source/build activation and one bounded owned-record check of stored scrubbed fields and processing metadata. The full analytics goal remains active. Free-text privacy, duplicate/event budgets, bootstrap/resource failures, admission loss and real readership/agent-purpose measurements remain separate unfinished work. Article prose/prompts and analytics classification/verifier profiles stay unchanged.

The private 186-file implementation/schema archive preserves original plans/failures, exact native source snapshots, browser receipts, checked builds and schema meters under manifest SHA-256 `1abccd96433dfc192586c80d3a149cc0a5ea2ea6b73aa58344795df1fd73f60d`. October 31 is review, not automatic deletion. All owned local experiment/build command handles are terminal.

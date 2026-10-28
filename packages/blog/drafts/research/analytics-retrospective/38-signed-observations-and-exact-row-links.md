# Two signed observations now have exact stored-row links

October 27 Pacific / October 28, 2026 UTC. Continues [request-context acceptance 37](37-reference-vectors-and-request-context.md), [the prospective reference design](32-vendor-receipts-and-exact-storage-references.md), [retained-copy recovery 34](34-retained-receipt-recovery.md) and [TASK-0119](../../../../../docs/tasks/TASK-0119.md). No new labelled request, diagnostic activation or human trial is needed for this follow-up.

## What the new evidence closes

Two retained observations from collection `2026-10-27.10` now connect a native invocation, one attempt, one stored receipt and the exact D1 row reference returned by that write. The known receipt projection equals the values read from those rows. Both captured requests separately replay under the current `2026-10-28.1` verifier using later-captured Exa keys; their recorded coverage flags agree.

This is stronger than the earlier time/path cohorts and pre-reference signed chains. It is **not organic persistence under the newest collector**: both writes used verifier `2026-10-27.6`. Nor does the key prove who operated the client, why it fetched the page, reading, citation or a human trigger. These events predate this follow-up and differ from the documented unsigned operator controls. “Non-control” here means not one of those recorded controls, not independently authenticated natural traffic or fresh agent actions.

## A bounded Wrangler query supplies candidates, not conclusions

[The candidate SELECT](organic-receipt-candidates.sql) covers retained edge observations with stored `signature_status=verified`, four explicitly named receipt-capable collections and a fixed UTC interval: **October 27 22:51:11 inclusive to October 28 00:13:21 exclusive**. The start contains the first `.9` activation. The query uses the observed-time index and limits results to 21 as a truncation sentinel. It deliberately keeps missing/contradictory proof and owner records for assessment.

[Native local acceptance](organic-candidates-local.json) exercises four selected synthetic records, including missing and contradictory proof, plus rejected source/version/status/time cases, an empty selection and the 21-record cap. These fixtures are not cryptographic or organic labels. The native plan uses `idx_page_observations_observed_at`.

[Production candidate evidence](organic-candidates-production.json) records one command-mode Wrangler SELECT: **28 metered reads, zero diagnostic writes, `changed_db=false`**, below the reviewed 5,000-read post-execution threshold. That threshold is not an enforced database cap. The uncapped result has two `.10` rows, observed at 23:45:54–55 UTC, with non-owner flags, detailed local verified outcomes and no optional request capture. No `.9`, `.11` or October 28 `.1` candidate matches this predicate before its fixed cutoff. This says nothing about later rows, other versions/statuses, ineligible requests or missing history.

The returned private row references select the corresponding retained logs; timestamps and paths are not used as identity keys. The candidate query already returned those exact rows and their evidence, so a second D1 lookup adds no needed identity fact. No additional diagnostic SELECT is executed.

## Recover the exact native chains

The signed-in native dashboard's one-hour scope contains the selected events. Its documented query-language help supplies field equality and Boolean OR. Filtering `storage.observationId` by the two private references shows two successful stored events. An acknowledged clipboard copy contains both records. We first replace the agent-owned clipboard with a harmless marker, then check that the copy replaces it; a stale clipboard read cannot count as a new export.

Those stored events supply two distinct provider request references. Querying those exact references returns eight visible/copied records: two invocation records, four custom logs and two spans. [The existing invocation reconciler](reconcile-organic-exa.mjs) finds one attempt and one stored event per selected invocation, with matching operation/collection references and no failure log. No missing/colliding record IDs or explicit truncation appears in this capture. Spans stay context rather than becoming page observations. The separately copied stored records have identical source objects in the chain export.

[Cloudflare's Query Builder contract](https://developers.cloudflare.com/workers/observability/query-builder/) distinguishes event, invocation and search scopes. The visible counts and copied counts agree for these specific queries. They do not certify population retention, sampling or every export path; research 34's earlier scope uncertainty remains intact. A later selected one-hour query for current-profile verified receipts shows zero successful events and “No events found”; its capture time and predicate are recorded in the production evidence. This is a scoped negative result, not population absence. No pricing acceptance or account setting changes occur.

## Match the stored projection without fabricating a live tail

[The new offline reconciler](reconcile-receipt-storage.mjs) matches canonical positive signed-64-bit decimal references as strings. It neither converts them to JavaScript numbers nor falls back to time/path proximity. Selected provider/operation IDs must be present and unambiguous; collection, receipt and reference versions must be supported. Explicit truncation rejects a pair.

It compares the actual retained receipt with the existing `storedObservationReceipt` projection of the captured D1 values. This is a cross-store comparison of known closed facts, **not a second cryptographic verdict or full D1/raw-log equality**. Unprojectable snapshots, invalid/unavailable references, unmatched records, duplicates, unexpected fields, injected results and contradictory stored statuses retain explicit counters. Arbitrary unknown keys and source values are not copied into the public aggregate. We do not relabel projected rows as live-tail events.

Four [regression tests](../../../../analytics/test/receipt-storage-reconciliation.test.mjs) cover unsafe-integer neighbors sharing the same numeric conversion, identical time/path contexts, swapped or duplicate references, missing/truncated metadata, unknown snapshot shapes, privacy canaries, false versus unavailable native values and copied status contradictions. Injected outcomes remain separate. The full analytics suite passes **198 tests**; a final scoped four-test pass covers the last helper hardening. Runtime collection, classifier, verifier, report/cache and schema do not change.

## Replay is a separate test

At 00:20:03 UTC we capture [Exa's published directory](https://crawler.exa.ai/.well-known/http-message-signatures-directory): HTTP 200, the expected directory media type and two public keys. [The directory commitment](organic-directory-capture.json) records its later capture time/hash and the response headers used for replay. It does not reconstruct the directory or provider configuration at 23:45.

[The maintained analysis](analyze-organic-exact.mjs) replays each captured request at its native invocation-record timestamp with the current verifier, supplying that captured body and headers through an origin-restricted in-process fetcher. No replay reaches production or sends reader telemetry to Exa. Both replays verify against the recorded Exa publisher and reproduce the coverage flags. Original stored profile `.6` and current replay profile `.1` remain distinct.

[The closed result](organic-exact-analysis.json) records:

| Quantity | Accepted result |
|---|---|
| Exact native-to-receipt-to-row chains | 2 |
| Matching known receipt projections / differing pairs | 2 / 0 |
| Matching separately copied stored receipts | 2 |
| Current-profile recorded-time verified replays / coverage-flag matches | 2 / 2 |
| Recorded invocations / operation references / distinct signatures | 2 / 2 / 2 |
| Distinct captured URLs | 1 |
| Stored representations | 1 HTML / 1 Markdown |
| Stored declared roles | 2 AI search observations |
| Reviewed directory publisher / documented-origin assessment | Both matching |
| Native category equal to stored category | Both Search Engine Crawler |
| Native verified-bot or signed-agent booleans available | 0 |

Both proofs cover authority, without User-Agent, path, method or query coverage. [RFC 9421 §7.2.1](https://www.rfc-editor.org/rfc/rfc9421.html#section-7.2.1) explains the boundary for unsigned components. Distinct request/signature references do not establish distinct people, sessions or agent actions. A repeated URL cannot tell us whether these were retries, parallel work or independently triggered fetches. The native category is not evidence of native cryptographic-verifier agreement.

## Publication and remaining work

The retrospective replaces its prospective “future joins” wording with these two accepted links and the later-key replay limit. It remains **1,248 body words with 31 shaping prompts**. [Source checks](organic-exact-source-checks.json), source delivery, activation and served-content acceptance remain separate from the dated D1/log/replay observations above. No automatic goal wrapper is added to the prompts, and the older captures stay unchanged.

[Publication acceptance](organic-exact-publication.json) verifies source `04bb9c1`, native Ready/100% deployment and exact served/build Markdown equality, with the new link visibly rendered. Private evidence and publication captures are preserved outside Git. The current-profile organic persistence gate remains open: neither the fixed D1 predicate nor the later selected native query supplied a newest-profile verified candidate. Continue with a future actual signed event rather than a synthetic substitute or repeated broad scans. Human trials stay deferred. Native cryptographic agreement, raw-header capture fidelity, replay/DNS/egress, broader conformance and privacy/retention remain unresolved; this phase makes the chain inspectable without upgrading its readership claim.

Private captures are preserved outside Git in `~/.local/share/gkoreli/analytics-evidence/2026-10-28-organic-exact-links/`: 37 source/check files plus four publication files and a SHA-256 manifest, directory mode 0700 and files 0600. Investigation-copy review is October 31; this is not a provider-wide erasure guarantee.

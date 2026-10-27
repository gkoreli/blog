# Retained receipt recovery — October 27, 2026 UTC

The existing collection `.10` control is present in retained logs. Both its private row reference and scalar receipt `.3` match the live copy. This closes the specific retained-fidelity gate left open in [research 33](33-reviewed-directory-publishers.md), without creating another control or querying D1 again.

It does not establish complete retention, organic vendor identity, human purpose or a cause for the earlier empty results. Human trials remain deferred.

## Recover the known event before making more traffic

The earlier scoped queries showed zero, while the live receipt and exact D1 readback agreed. This follow-up refreshed the native time preset to fifteen minutes, with displayed start 23:00:16 UTC, containing the existing 23:08:46 UTC control. An AhrefsBot text query then showed six visible results, including the stored-event message. Elapsed time and time-scope refresh both changed; neither is isolated as the cause of recovery.

Expanding the known stored event exposed the full receipt and existing row reference. The event's own copy button acknowledged a clipboard write and supplied a single native object. The exact-operation/receipt-version query in the refreshed scope subsequently showed one result. Its acknowledged array copy also contained the same event.

A copy action over the six-result text query produced one record both with the event expanded and after collapse. Those acknowledged copies match the same control. The provider's selection/export scope remains unestablished. **Six visible results are not six eligible observations, and one copied record does not prove the others were lost.**

An early empty clipboard read after a copy attempt was weaker evidence than we first treated it as: a fresh write had not been independently established. The follow-up put a non-sensitive marker in the agent-owned browser clipboard before copying, then checked replacement before parsing. Markers were never pasted or transmitted. This distinguishes an acknowledged new copy from reading stale clipboard content. Initial captures stay preserved; the method correction does not erase them or explain every earlier zero result.

[Cloudflare's dashboard announcement](https://developers.cloudflare.com/changelog/post/2026-02-06-observability-ui-refresh/) documents expandable details and JSON/CSV exports. [Query Builder](https://developers.cloudflare.com/workers/observability/query-builder/) describes event filtering and result grouping. Neither certifies the completeness or selection scope of these captures. [Real-time logs](https://developers.cloudflare.com/workers/observability/logs/real-time-logs/) and [Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/) remain separate evidence paths.

## Preserve both native copy formats

The individual copy differs from the array export: source fields are flattened, and the timestamp appears as decimal text in `$metadata.timestampNs`. The array format already carries a timestamp and a `source` object. Treating one as the other would silently miss a valid receipt.

The [comparison helper](compare-receipt-captures.mjs) now accepts these specific formats explicitly. For individual copies it requires a stored-event shape, known event type, provider/request references and canonical positive timestamp text. Nanoseconds must divide exactly into milliseconds, fit the safe integer/date range and agree with the live timestamp. Numeric nanoseconds, fractional-millisecond truncation, unsupported or ambiguous shapes are rejected. Shape rejection is not a provider-corruption verdict. Bulk invocation/span context stays separate from the selected receipts.

Comparison still requires a unique existing operation reference, matching collection/receipt versions and exact log time. Explicit truncation blocks an accepted pair. Duplicate operations stay ambiguous; no deduplication or time/path surrogate is introduced. The tool compares known receipt fields and separate storage-reference fields, emitting only closed field names and counts. It neither authenticates the capture provider nor performs a new D1 identity query.

Four added regression tests cover individual/array equivalence, unusable timestamps, ambiguous/unsupported shapes, duplicate operations, explicit truncation, context accounting and private-value canaries. The full analytics suite passes 188 tests. Site/runtime code is unchanged; its earlier 106 site/type passes remain dated evidence. Article validation and isolated publication checks are separate.

## What is now accepted

[Closed recovery receipt](retained-v3-recovery.json) preserves input hashes and four comparisons: the individual copy, exact-query array copy, text-query array copy and collapsed-state text-query array copy. Each has one unique matching pair, no field differences/omissions and no rejected records. They are four copies of one existing control, not four requests or an independent population sample.

The match includes the publication method/profile/date/counts/state, declared Ahrefs name, absent local signature, unconfigured documented signing method, unavailable native booleans, empty native category and exact private row reference. The control remains an operator-generated unsigned Ahrefs declaration excluded by referral policy. No organic Ahrefs authentication is inferred.

The earlier exact D1 readback remains the separately dated storage observation in [research 33's release receipt](directory-publication-release.json). This follow-up adds no production SELECT, no new labelled control, schema migration, raw activation or classifier/verifier/report change. Dashboard and ordinary publication inspection are additional service work. Raw context and identifiers remain outside Git.

The article stays at 1,250 body words and 31 shaping prompts, linking this evidence through its existing private-reference sentence. [Source checks](retained-v3-recovery-source-checks.json) and publication acceptance remain distinct. This supersedes the earlier retained `.3` non-acceptance only for the recovered control and observed copy paths; historical nonmatches, export scope and population retention remain unresolved.

Next bounded work: audit the original goal against delivered capabilities and evidence, then investigate remaining native verification access separately. The earlier [native capability inventory](01-native-capabilities.md) distinguishes Ruleset Engine `cf.client.bot` from Worker Bot Management fields; Free-zone access to a useful independent signal still needs product-specific verification before any integration. No entitlement, configuration change or native cryptographic agreement is inferred. Human trials stay deferred.

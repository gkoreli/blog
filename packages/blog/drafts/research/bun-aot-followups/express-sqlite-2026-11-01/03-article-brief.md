# Follow-up decision: a concrete candidate, with measurements pending

Goga's tentative article request should produce a distinct reader benefit beyond appending another percentage to the original article. A useful candidate is an engineering field note about moving framework-generated code into an AOT build while preserving what the API returns.

**Proposed title:** Bun AOT in web APIs: check what your serializer returns

**Reader language and discovery hypothesis:** engineers trying Bun AOT with Express or Fastify ask whether it preserves API behavior and whether runtime code generation costs speed. Queries such as “Bun AOT Fastify serializer” describe the subject; no search demand or traffic improvement has been measured.

**Reader promise:** explain how to compare memory, CPU/request, request speed and first-use latency, and how to test a serializer optimization against schema behavior rather than one successful payload.

**Author's contribution:** the existing article supplied a checked comparison tool and earlier application/pool results. This investigation adds two SQLite fixtures, an independently computed output contract, a reproduced semantic difference in Bun's documented serializer suggestion, and a guarded experiment after detecting shared-host interference. The completed work is inspectable; there is no invented personal motive or successful adoption story.

## Evidence that already supports prose

Bun's documented `JSON.stringify` substitution matches the fixed response exactly, but emits extra fields that the generated serializer omitted and preserves a numeric string rather than emitting a number. The [functional experiment](results/serializer-contract.json), pinned dependencies and [primary source notes](01-source-notes.md) establish that bounded result. The practical lesson is to include rejected and transformed data in a serializer test before accepting a speed improvement.

Jarred's Express/SQLite, Hono and Fastify posts are useful external leads. They remain attributed maintainer reports. Our fixtures have different source and unspecified upstream conditions, so our percentages cannot validate or refute his exact chart.

## What is still needed for the performance article

1. Finish the uncontended full protocol and numeric audit; retain the overlapped captures as excluded exploratory work.
2. Test the supported standalone serializer under the source runtime and native AOT, including extra fields, coercion and required-field failure. No claim of a repaired response contract until it runs.
3. Compare its warmed results with default/generated and plain JSON output, keeping the control batches separate and their limitations beside the numbers.
4. Inspect the additional startup distribution and preserve the reversal in the excluded batches as a reason to avoid a simplistic first-launch headline.

If the standalone path preserves the tested contract and yields a useful measured difference, that supplies a concrete worked example for a separate article. If it does not, a failure report can still be useful; the title and verdict must follow that result. No site post, outreach or automatic promotion is prepared from the unaccepted timings.

The original article and its frozen research footprint remain unchanged. A future engineering post should include the exact [owner prompt](owner-prompt.md) in its prompt provenance; this working brief is not a published post or a measured research-usage claim.

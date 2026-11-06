# AI site audit: article, tool and limited API

Started November 5, 2026 Pacific / November 6 UTC. The owner requests a substantial article and a tool inspired by the supplied X post, using the existing analytics capability, DDD principles, an ADR and a possible five-to-ten-use free daily API, within three hours. The full human shaping message is in the [prompt record](../../../prompts/ai-site-check-evidence.prompts.md).

This is a separate bounded delivery from the concurrent [detection-improvement worklist](../analytics-retrospective/128-detection-improvement-worklist.md). Existing provider measurements are reused with their original conditions; no new detector-accuracy or provider trial is implied.

## Acceptance and current state

| Requirement | Evidence required | State at editorial checkpoint |
| --- | --- | --- |
| Understand reference | Official oEmbed/post context and linked product inspection | Root resolved Exepal `/check`; [source ledger](01-source-and-claim-ledger.md) records limits |
| More informative public URL audit | Versioned report and visible evidence for policy, responses, initial HTML, discovery and synthetic probes | Engineering active in isolated checkout |
| Existing analytics capability | Current-request endpoint preserving independent dimensions | Engineering active; no provider attribution inferred from spoofed headers |
| Free limited API | Atomic shared ten/day address quota, UTC reset, burst limit, failure semantics, API documentation | Implementation/testing pending root acceptance |
| DDD and ADR | Package/context boundaries, pure parsers, explicit adapter, rationale and alternatives | [ADR-0020](../../../../../docs/adr/0020-evidence-led-ai-site-check.md) authored |
| Substantial article | Useful first 50 words, claims/sources/limits, exact prompt, API examples | [Article](../../../posts/042-ai-site-check-evidence.md) authored; release claims await final code audit |
| Checks | Relevant package tests, typecheck, validation, isolated generated HTML/Markdown inspection | Pending root execution and receipts |
| Delivery | Scoped main commit/push, actual deployment association | Pending |
| Served acceptance | Current tool/API behavior, quota behavior, synthetic provenance and page availability | Pending; local tests do not substitute |

## Working boundaries

The isolated checkout is `/private/tmp/ai-site-audit-20261106/checkout`, based on committed main at task start. Preserve unrelated staged guidance, analytics and newsletter work in the main checkout. Do not build into another session's active `dist/`. Use the repository's personal identity and scoped staging.

The quota table's no-URL/no-raw-header contract is separate from Cloudflare request logging and ordinary analytics. Private captures and logs stay outside Git. Public receipts should retain methods, conditions, counts, versions, results and limits.

## Editorial checkpoint

The article focuses on what a site operator can determine and fix from a public page assessment. It uses the author's November 5 controlled provider findings, links the earlier study as the concrete basis, and keeps access, source selection and answer fidelity distinct. It contains no invented new trial, deployment result, adoption count or score calibration.

The selected title promises a crawl/access inspection, with the first paragraph narrowing it to this checker. Candidate framing around an AI-readiness score was rejected because the evidence does not calibrate such a score. Search/discovery routes such as robots debugging and AI crawler access are reader-task hypotheses, not measured query demand.

Next bounded action: finish code/tests, audit article statements against the final contracts, inspect the generated page and representations, then record code delivery, activation and fresh acceptance separately here.

## Local acceptance and quota schema delivery

November 6 UTC: the isolated implementation passes workspace typechecking and Markdown validation. The site-audit package has 29 passing domain/transport tests, including hostile redirects, private/mixed DNS, shared request budgets, noncooperative fetch/stream timeouts, RFC path cases and a >100,000-tag HTML regression. Four UI tests cover the no-JavaScript form/SSG insertion slot, nested response validation, target XSS and an actual enhanced form submission. The initial full blog suite passes 246 tests; analytics passes its existing 397 tests plus four new current-request/admission-boundary tests. Final integration checks follow the latest main source before release.

The native Miniflare/D1 acceptance harness exercises the atomic quota with thirty simultaneous calls: exactly ten allowed and twenty rejected. HTTP checks cover a second UTC day, independent addresses, form rendering/escaping, shared request assessment, malformed/oversized/cross-site inputs and failure behavior. Commands: `pnpm typecheck`, `pnpm -C packages/blog validate`, package suites and `pnpm -C packages/blog test:ai-check`. Loopback permission is required by Miniflare in this sandbox; no external request is allowed by the native fixture.

The quota-only migration was applied after a metadata check and native D1 acceptance. Four production statements inspected the two schema objects, created the table/index and inspected them again: initially zero matching objects, finally two. Statement meters total **97 rows read and three rows written**, including DDL accounting. No observations, diagnostics, newsletter rows or raw request records were read. Migration source: [0001_ai_check_quota.sql](../../../migrations/0001_ai_check_quota.sql). Table installation is separate from Writer activation and served acceptance.

A new privacy test exposed a raw signer URI in the reader-kind reason for the unsigned-name signed-agent fallback. The public request assessment now returns a closed reason marker and reviewed signer display; it does not publish that URI. This projection change leaves stored analytics semantics intact.

Code delivery, active deployment and fresh public acceptance remain pending at this checkpoint. Browser screenshots remain unavailable because local computer/browser access is disabled; SSG and native DOM tests are the UI evidence presently available.

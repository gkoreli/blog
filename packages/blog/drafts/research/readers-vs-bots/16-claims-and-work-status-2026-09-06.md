# Analytics claims, evidence, and outstanding work

Updated September 6, 2026 UTC. Bookkeeping for the investigation and article revision. This ledger separates article corrections from dashboard, ingestion, and deployment work. The September 6 article/README revision is published and live-verified in commit `eebe342`; the runtime repairs remain open.

## Current conclusion

The classifier separates substantial browser-shaped automation, but audience accuracy remains uncalibrated. In the complete September 4–5 UTC window, 372 browser-UA requests become 95 Browser HTML observations, compared with 14 non-bot RUM page loads after dashboard exclusions. Reclassification of 277/372 (74.5%) measures the rules' effect. The 6.79× counter disagreement does not identify a bot fraction or its causes. Removing the 22 repeated-referrer observations as a sensitivity calculation still leaves 5.21×.

Evidence: [production baseline](12-production-followup-2026-09-05.md), [SQL](12-production-followup.sql), [RUM query/results](12-web-analytics-results.json), and [existing Cloudflare diagnostics](15-existing-cloudflare-evidence-2026-09-06.md). The latter reports candidates for 77 of 95 D1 rows and 19 Redroid-UA candidates; these are correlations using incomplete keys, not an exact request join. Controlled-client trials and individual trace-span inspection remain outstanding.

## Correction ledger

The original correction requirements are retained below. Article 024 and README changes are recorded in [the revision audit](17-article-revision-2026-09-06.md); post 023 and runtime surfaces remain open where listed. Historical research stays dated; add a correction rather than making the old observation appear to have used the new method.

| Claim or expectation to correct | Required correction | Affected surfaces / work |
|---|---|---|
| The two rules establish an honest reader count or solve the discrepancy | Report measured classification impact alongside the unresolved 95-versus-14 comparison. Do not promise accuracy from the number of rows reclassified. | Post 024 opening, metadata, checklist; TASK-0103 |
| A ratio under two validates the counter, or above two diagnoses this automation problem | Retire the universal threshold. Matching counters do not establish truth; differing counters do not identify a cause. | Post 024 test/expectation; TASK-0104 current contract updated separately |
| Browsers is a lower bound on readership | Describe a request-based classification with both false inclusions and possible exclusions. No established lower or upper bound on people follows. | Post 024; post 023's general lower-bound interpretation; earlier research summaries |
| Approximately 21 people, or no additional people after launch | Identify the estimate as a manual assessment of plausible reader-like request observations. It is not a verified distinct-person count or evidence that nobody else arrived. | Post 023 metrics artifact; earlier investigation conclusions |
| The initial eleven-to-one comparison measures equivalent populations | Separate 578 daily IDs from 52 visits. Preserve it as an alarm involving different units; use page events/page loads for the new comparison, with eligibility limits. | Post 024 introduction/test; TASK-0104 |
| No signed request has arrived | Record nine production-verified requests in the saved cohort: five Ahrefs, two Exa, two deliberate DuckAssist tests. Distinguish stored verifier results from independent re-verification. | Post 024 signature section; TASK-0103 |
| A signed request establishes software acting because a person asked | Keep signer verification, declared/documented client role, and known trigger separate. Unknown trigger remains unknown. | Post 024 composition table, stats wording/read model, README; TASK-0119 |
| Routine production AI-agent classification validates vendor IP lists | Distinguish manual IP checks in the probe study from production ingestion, which uses UA rules and signatures. | Post 024 composition explanation; README/methodology audit; TASK-0119 |
| Every observation records network provenance | The inspected 1,797-row cohort has null `asn_source`; the INSERT omits it. Fix future writes and disclose missing historical provenance. Reconstruct only where evidence supports it. | README, post 024 history section, analytics ingestion; TASK-0119 and plan step 2 |
| A request count is an AI-read count | Retain observed requests and their identity basis; do not infer consumption, comprehension, citation, or one request per user action. | Post 024 ChatGPT totals and discovery promises; post 023 generalizations |
| The migration proves the latest repair is live | Record Worker activation separately from migration application. Last checked deployment predates the owner/network repair; owner table is empty. | Deployment bookkeeping, ADR-0016.4 status; release gate in artifact 14 |
| The D1 collection description covers all operational telemetry | Distinguish D1 from Worker logs/traces, client errors, and RUM. Existing diagnostics can contain useful request detail absent from D1. | Privacy/methodology review; TASK-0120; no new collection or deletion implied |

Before editing claims of novelty or broad tool coverage, use the selected, pinned source review in [artifact 14](14-evidence-backed-implementation-plan.md). That review does not prove that no other implementation combines particular signals. Protocol names and conformance claims also need checking against the exact profile supported by fixtures; an inspected draft is not automatically the deployed implementation's specification.

## Completed in this session

- Wrote the [evidence-backed implementation plan](14-evidence-backed-implementation-plan.md), extending [artifact 13](13-two-priority-implementation-plan.md) with pinned source reviews, data contracts, experiments, and gates.
- Implemented the [read-only extractor](../../../scripts/analytics-evidence.md). It captures D1 aggregates, both RUM bot-filter variants, exact queries, source/deployment provenance, comparisons, and file commitments. It does not instrument ordinary visitors or change production data.
- Executed a complete capture at **2026-09-06 01:54:55–01:55:00 UTC**. All 11 D1 statements reported zero writes. The result reproduced 95/14 = 6.79×; the RUM groups were unsampled.
- Verified eight extractor tests, strict TypeScript checks, nine artifact hashes, and refusal to overwrite an existing evidence directory. No application release followed.
- Reproduced the local Accept parser defect: explicit zero-quality HTML and wildcard ranges are treated as accepting HTML; `text/*` is rejected. The fix and historical-impact analysis remain open; stored booleans do not recover original headers.

The private run is `/tmp/blog-analytics-evidence-20260906/`, with `report.md` and `manifest.json`. The manifest identifies the exact extractor bytes used, which may differ from later script edits. Temporary paths are not durable repository evidence; artifact 12 retains the independently saved baseline queries and aggregate results. Review and deliberately archive a sanitized export if this run becomes publication evidence. Do not copy private rows, credentials, or raw diagnostic logs into the research directory.

## Work allocation and stopping rule

| Work | Status and next action |
|---|---|
| TASK-0103 / article 024 revision | Complete: the dated results and factual/semantic corrections are published and verified live. Release checks and deployment are recorded in artifact 17. The full experiment study does not gate this revision. |
| TASK-0119 / identity and role | Todo. Immediate scope is grouping and wording while retaining the verifier. Preserve evidence/history and verify deployed owner behavior. Full protocol investigation belongs to FLDR-0008 row 4. |
| TASK-0120 / discrepancy investigation | In progress. Extractor and existing-data inspection are completed substeps; trace details and controlled clients remain open. Full investigation belongs to FLDR-0008 row 10. |
| TASK-0104 / longer calibration | In progress. Preserve complete-day exports within the RUM retention window and compare the longer period around September 17. No universal ratio threshold or automatic completion from counter agreement. |
| Production owner/network repair | Still needs deployment verification and an actual controlled-browser owner mark. A later daily mark cannot remove September 3 observations automatically. |
| New telemetry and permanent browser confirmation | Proposed only. Inspect existing logs and execute controlled trials before deciding what missing evidence justifies collection. |

The next useful result is a corrected claim, a supported grouping/collection repair, or a controlled explanation of one failure mechanism. More fields, lower Browser totals, and counter agreement are not acceptance criteria by themselves.

## References for interpretation

- [Web Bot Auth draft, identity and trust boundaries](https://datatracker.ietf.org/doc/html/draft-meunier-webbotauth-httpsig-protocol-01#section-4): key/URL association does not establish a human trigger or purpose. This is a versioned draft reference, not a current-conformance assertion.
- [Exa's crawler documentation](https://crawler.exa.ai/): a signed client can be a search crawler.
- [Cloudflare RUM FAQ](https://developers.cloudflare.com/web-analytics/faq/): sampling, retention, and collection loss affect comparisons.
- [ADR-0016.1](../../../../../docs/adr/0016.1-analytics-purpose-and-decision-loop.md): analytics supports publishing decisions, with no action an acceptable outcome.

The initial bookkeeping pass changed no article or production behavior. The subsequent article/README revision corrects the affected prose and metadata. Runtime classification, retention, owner marking, and controlled-client work have separate completion criteria.

## Evidence preservation and deployment recheck

The complete September 4–5 extractor run is also archived privately under `/Users/goga/Documents/goga/analytics-evidence/blog-analytics-evidence-20260906/`; all nine artifact hashes match. An additional September 3 capture preserved both RUM filter responses and deployment history under `blog-analytics-evidence-20260903-preserved/` in the same archive. Its D1 capture failed validation/execution, so it is explicitly incomplete and supplies no ratio. These private archives are not public evidence; the reviewed aggregate baseline in artifact 12 remains the article source.

A fresh `wrangler deployments list --json` reports version `830a08f2-4dc3-4605-a2a9-7cb635309e29` activated at 2026-09-06 01:36:32 UTC. This supersedes the earlier deployment-date observation, but does not by itself verify owner behavior or repair missing provenance.

# Edge page observations versus Cloudflare RUM

Started September 6, 2026 UTC. Continuation of article 024, FLDR-0008 row 10, TASK-0120. Governing form: an evidence-led engineering investigation. Living center: finding which collection stage explains a measured counter disagreement. The experiment decides the section; the draft does not invent a result to fill a planned section.

Article 024's corrected revision is published at its stable URL. This follow-up starts from the 95 Browser HTML observations versus 14 non-bot RUM page loads for September 4–5. Those are different populations with no shared request identifier; 81 is not an established count of bots or lost beacons.

## Work and evidence

| Work | Status | Evidence / next acceptance condition |
|---|---|---|
| Preserve historical evidence | Complete for September 4–5 baseline; additional September 3 RUM saved with an explicit D1 failure | [Existing capture and limits](../readers-vs-bots/16-claims-and-work-status-2026-09-06.md) |
| Reproduce known parser/provenance defects | Executed locally | [Baseline](01-local-baseline.json), [repaired run](02-local-repair.json), [method and findings](03-local-experiment.md) |
| Correct future HTML acceptance and provenance writes | Implemented on `codex/analytics-calibration`, not deployed | 39 tests pass, including actual SQLite ingestion; no historical rewrite |
| Match existing Cloudflare observations | Partial, inconclusive | [Existing diagnostics](../readers-vs-bots/15-existing-cloudflare-evidence-2026-09-06.md); individual trace-span access still unresolved |
| Paired real-browser beacon trials | Pending | Execute the controlled protocol below; report each stage and failed/unknown observations |
| Separate signer identity from client role | TASK-0119 remains open | Preserve signature evidence; unknown trigger stays unknown. Full study is lane row 4. |
| Follow-up article | Started, unpublished | [Working draft](../../edge-page-views-versus-cloudflare-rum.md) |

## First browser experiment

Use an owner-marked test browser and an isolated test path whose eligibility matches article responses. Verify the owner mark and public-total exclusion before any trial. If an isolated path changes beacon injection or eligibility, document and fix that mismatch before interpreting the result. Do not tag ordinary readers or use a persistent browser identifier.

Run three paired repetitions per condition, with exact UTC start/end times and the same page/browser/network. Counterbalance allowed/blocked order. Keep a local trial ID and, where available, the response's Cloudflare request identifier. A URL/time correlation alone remains a candidate match.

| Condition | Controlled change | Observe separately |
|---|---|---|
| Normal navigation | JS and beacon allowed; cold cache | Edge arrival, response, injected script, script execution, beacon attempt, response/receipt, later RUM presence |
| Beacon blocked | Same browser and JS, block the beacon resource or endpoint explicitly | Which stage disappears; page rendering should remain observable |
| JS disabled | Same page/network, scripting disabled | Edge classification and absent script execution; do not equate this with automated access |
| Warm navigation / back-forward | Reuse cache, then back/forward restoration | Whether an edge request occurs and which RUM lifecycle event fires |

Record the block point, navigation/delivery type, response status, cache state, browser version, deployment version, and observation times. Keep failed and unjoined trials. Inspect existing Cloudflare diagnostics first; add telemetry only when a named stage cannot otherwise be observed. A request-scoped trial marker is useful for controlled visits; it is not permission to correlate ordinary visitors across sessions.

A successful trial demonstrates a possible mechanism under its recorded conditions. It does not measure that mechanism's historical prevalence. Repeatability and known inputs matter more than a ratio moving toward one.

## Publication boundary and data decisions

Publish the follow-up when it contains executed browser trials, their artifacts, a supported explanation of at least one collection difference, and a clear unresolved remainder. A complete fourteen-day headline requires fourteen complete days. Smaller Browser totals are not acceptance criteria.

The next two priorities remain explainable identity/role grouping (TASK-0119) and controlled collection calibration (TASK-0120). The small parser/provenance repair establishes a sounder starting point for both. User-Agent, city, and TLS observations are neither automatically forbidden nor proof of identity. Retain a field when it answers a concrete investigation question; first inventory existing diagnostics, access, retention, and combinations. This initial repair adds no new visitor field: it corrects a derived value and populates an existing provenance column.

The author direction and exact prompts are preserved in the [article 024 prompt record](../../../prompts/how-i-separate-readers-from-bots-without-javascript.prompts.md), including the request to finish that revision and start this next iteration. Before this draft is published, freeze its own materially shaping prompt record.

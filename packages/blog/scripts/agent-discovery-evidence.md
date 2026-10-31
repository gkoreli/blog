# Analyze agent discovery and external reuse

This offline command turns saved question/search captures and reviewed external references into a JSON report and a readable decision brief. It recognizes agent-operated discovery and evidence reuse as audience outcomes. It needs no human-identity label, search account, API key, database or site request.

Run the actual October 31 two-run audit from the repository root on pinned Node 24:

```sh
node packages/blog/scripts/agent-discovery-evidence.mjs \
  packages/blog/drafts/research/discovery-experiment-02/agent-discovery-evidence.json \
  /tmp/new-agent-discovery-brief
```

The output directory must be new. `brief.md` explains the per-run denominators, question-level results, comparison and distinct external source URLs. `report.json` retains all supplied source lists, method context, capture hashes, review assessments and the exact input-byte hash. The bundled audit is real saved evidence, not synthetic demo traffic. Its historical reference is dated separately from the repeat searches.

For another site, use the same input shape with your frozen questions, exact tracked source URLs and saved observations. Library callers import `analyzeAgentDiscovery` and `renderAgentDiscovery` from `@gkoreli/analytics/agent-discovery-evidence`. The library is independent of the collector and has no transport or storage dependency.

## Capture contract

- `version` is `agent-discovery-v1`; `provenance` is `saved-observations` or `synthetic`. Parsing a supplied record does not authenticate it.
- `questionSet` names the frozen set; `questions` contains unique `id` and exact `query`. All runs refer to that same set. Changing a question requires another pack or an explicit new set, rather than silently pairing different questions.
- `sources` contains unique `id`, `label`, and explicit `urls`. Matching is exact, with no inferred redirect, fragment, tracking-parameter or trailing-slash equivalence. Register an alias only when its relationship is established. One URL cannot belong to multiple sources.
- Each run has an `id`, a `method` and `observations`. The method names `service`, `mode`, `model` (null if unavailable), `context` and `responseSetting`. Include whether a source was supplied in the context. Do not describe a source-seeded retrieval as unseeded discovery. Same declared methods do not prove identical hidden services, personalization or page versions.
- Each observation has `questionId`, a UTC `capturedAt`, SHA-256 of the saved raw capture, and `status`. A `captured` observation includes `returnedSources` with `title` and `url`; an empty list means an observed empty pool. A `failed` observation includes a short `reason` instead. An omitted question is missing. Failed/missing questions are unavailable, not zero visibility. One observation per question per run is permitted; preserve additional attempts as additional labelled runs.
- `references` is an array, empty if no reviewed references are available. It records supplied manual reviews: `sourceUrl`, `targetId`, `relation` (`link` or `evidence-reuse`), UTC `capturedAt`, `rawSha256` and `review`. A link must actually be inspected; reuse needs support in the captured source, not a search snippet alone. The parser records those assessments without independently verifying them. Repeated reviews preserve observations but count the same source URL and target once after removing URL fragments; query strings are preserved. An evidence-reuse pair includes its link; do not add those counts together as independent outcomes. Variants need review before a claim of distinct publishers or independent coverage.

The first run is the declared baseline; subsequent runs compare with it. Comparisons show appeared, disappeared, retained, absent in both and unavailable questions, with the paired-completed denominator. Method changes require a new baseline and withhold paired transitions; compatible comparisons remain descriptive. Question-level absence from a returned pool is an inspection lead, not evidence of non-indexing or proof that the answer needs rewriting. Search outputs are never converted into AI-answer citations, origin requests, unique people, operator adoption or a population growth rate.

## Private and bounded

The command reads only a regular UTF-8 JSON file, capped at eight MiB on the opened descriptor. Invalid encoding, BOM, devices and FIFOs are refused. Schema budgets allow at most 100 questions, 100 tracked sources, 20 runs, 1,000 returned entries per observation and 1,000 reference reviews. No network request, account access, upload, code execution from evidence or production query occurs.

Output directories use mode `0700`; files use `0600`. Existing destinations and destination symlinks are refused. Command logs contain status, provenance, run count and output path, not query text or raw sources. Keep private inputs and outputs outside Git. Public research records should expose methods and nonprivate results deliberately, rather than automatically publishing raw captures. The command does not contact publishers to correct older copies.

See the [experiment and decision](../drafts/research/discovery-experiment-02/01-repeat-and-decision.md) and the [discovery skill](../../../.agents/skills/run-discovery-experiment/SKILL.md) for the actual interpretation and next action. Reuse the existing [Google search-evidence adapter](search-evidence.md) for Search Console query/page rows; those are a different measurement contract.

From the repository root, run `pnpm -C packages/analytics test` before `node packages/blog/scripts/check-agent-discovery-runtime.mjs /tmp/new-runtime-checks.json` to compare the compiled Node result and browser-bundled local workerd result. The latter opens only a local runtime and requires loopback permission. `node packages/blog/scripts/check-agent-discovery-cli.mjs` runs the private CLI controls in a fresh temporary directory. These controls do not repeat the public searches.

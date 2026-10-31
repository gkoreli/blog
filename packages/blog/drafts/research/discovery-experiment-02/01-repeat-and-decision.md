# Repeat the question set before choosing a discovery edit

October 31, 2026 UTC. Continues the [accepted discovery audit](00-worklist.md) and [offline search workbench](../analytics-retrospective/121-offline-search-evidence-workbench.md). Source baseline `73deb54`. The owner asks to learn, build and iterate further.

## Frozen plan

The first four public web-tool searches returned the canonical fetcher study for three questions, including no result in the Grok pool. One absence could reflect a coverage problem or ordinary search variation. Before editing the article, repeat all four exact [questions](questions.json) once each with the same public search tool and short response setting, without adding a domain, source URL or site filter. Keep every attempt, returned source list, capture time and response hash. No retries selected for a favorable answer. The tool exposes neither a stable underlying model nor a complete ranking contract; record those as unavailable. Prior conversational knowledge exists in this session, but the explicit search requests contain only the frozen questions.

Primary observation: canonical presence for each question in each captured result pool. Compare matched questions descriptively; do not interpret a same-day repetition as a growth rate or causal effect. The intervening article change adds an external reference, so this is not an unchanged-page control. If the Grok result appears, stop treating the first absence alone as grounds for an article edit. If still absent, inspect the question/answer fit before proposing a change. No new article edit is pre-authorized by the hypothesis alone.

Build a portable offline analyzer that consumes these actual captures and the already verified external-reference evidence. It should show completed, failed and missing observations; distinct questions versus repeated trials; exact page matches; deduplicated external references; and separate search discovery, external reference and evidence reuse. It must not promote a returned source into an answer citation or turn repeat searches into unique people. A human label is not required to count the observed agent discovery or reuse.

Acceptance: run the analyzer on the saved first audit and new repetition; inspect the generated decision brief; test denominator handling, missing/error cases, method incompatibility and source matching. Keep raw captures private. Deliver a documented command and package export without adding a collector route, database field or production query. Use an isolated checkout for checks. Stop after four new search calls and the bounded implementation; no accounts, external messages, paid services or scheduled work.

## Results

The plan assumed the earlier short response setting. Review found that the original saved request metadata does not retain that setting. The evidence pack now records it as unrecorded, rather than asserting method equality; the analyzer requires a new baseline and withholds transitions between these runs. Their individual question-presence results remain usable. This corrects the initial assumption without rewriting the frozen plan.

The four new exact search calls all completed, without retries or added source URLs. The canonical article appeared for headers, signature coverage and Codex again, and was absent from the returned Grok pool again: three of four completed questions in each run, six of eight observed query trials across four distinct questions. These are positive agent-discovery observations, not eight independent audience members or a measured growth rate. [Portable evidence pack](agent-discovery-evidence.json) retains both complete returned-source lists and [generated brief](agent-discovery-brief.md) is the actual command output.

| Exact question ID | Initial returned URLs | Repeat returned URLs | Exact URLs common to both | Canonical presence |
| --- | ---: | ---: | ---: | --- |
| headers | 22 | 16 | 15 | Both runs |
| coverage | 21 | 20 | 20 | Both runs |
| codex | 19 | 19 | 19 | Both runs |
| grok | 20 | 21 | 18 | Neither returned pool |

The result pool changes even when the tracked-source presence does not. The study is observed discoverable for three technical questions; the persistent Grok gap deserves product/question-fit inspection. The first absence was not sufficient evidence for an article rewrite.

Arcjet's guide appeared in both coverage searches. The earlier complete-HTML review established one direct reference reusing our DuckAssistBot signature capture. The workbench counts that as one distinct reviewed source URL/target pair, separately from its two search appearances. This is useful external distribution and reuse. The tool does not independently certify the supplied review or turn a historical capture into current source behavior. The Web Pulse reproduction appeared for headers again; selection does not make its older claims independent corroboration.

## What changed in the product

The [offline analyzer](../../../../analytics/src/agent-discovery-evidence.ts), package export and [command](../../../scripts/agent-discovery-evidence.md) turn actual saved search captures and reviewed references into a repeatable decision brief. This adds a non-request audience evidence channel alongside the Search Console adapter and server observations. It needs no human labels or Google account. It records exact question/method context, explicit source URLs, capture hashes, completed/failed/missing observations, paired comparisons and reference deduplication. No new dependency, collector import, dashboard route, storage schema or production query is introduced.

The input is deliberately a supplied evidence record. It cannot authenticate an arbitrary capture, judge whether a review is true, infer a model's answer from a search snippet or follow a redirect. Exact source-URL aliases are explicit, with no silent normalization. A failed or uncollected trial stays unavailable; a completed empty pool is an observed non-return. Repeated references retain their review history without becoming additional independent references.

## Product and period matter before a content intervention

The [current FAQ returned for Grok Bot](https://docs.x.ai/grok-bot/faq) explicitly distinguishes that product from the Grok chat app. This source check concerns the captured FAQ, not a fresh vendor-request trial. Our September study concerns anonymous and signed-in chat fetches. A broad brand-level question may therefore select material about another product or mode. This is a candidate explanation for query fit, not a measured cause of the missing result.

The existing article already has a dedicated Grok section with anonymous and signed-in observations, its assigned-URL attribution method and a limit on universal detectability claims. **Decision: retain its title and prose in this iteration.** There is no demonstrated missing technical answer to repair. Keep the Grok query as an observed gap and distinguish dated chat-fetcher evidence from current browser-agent claims before choosing an intervention. A source can be discoverable yet answer the wrong product/time scope; presence alone is not answer quality.

## Acceptance and next bounded action

All 345 analytics tests and workspace typechecks pass in an isolated checkout. Eight focused groups cover the actual pack, unavailable observations, exact URL matching, reference deduplication, method changes, malformed context and untrusted prose. Ten actual CLI controls verify a usable real-data brief, exact input-byte hash, private modes, overwrite/symlink refusal, UTF-8/BOM/size refusal, minimized logs and nonblocking FIFO/device refusal. Twelve exact Node/workerd report-and-brief comparisons pass: one actual saved audit plus eleven modified controls, eight accepted and four rejected. The first local runtime attempt could not open a loopback socket under the sandbox; the permitted local rerun passed. These local controls generate no production traffic or SQL.

A concurrent [independent review](../analytics-retrospective/122-independent-agent-discovery-and-report-review.md) reproduced two draft-reporting risks. The final module now withholds transitions for incompatible declared methods and removes fragments when grouping external reference URLs, while preserving query strings and each original review URL. Reference totals name URLs rather than asserting distinct pages or publishers. Regression controls cover both corrections. The independent task's four additional search calls remain separate from this pack and its four-call budget.

The discovery skill now routes to the tested workbench and preserves repeated-trial versus distinct-reference counts, with product/mode/version inspection before diagnosing an article gap. Existing owner direction and claim boundaries remain intact. No public article changes, external messages, account operations or future automation occur in this iteration. Source delivery and the private archive receipt are recorded in [checks](agent-discovery-checks.json); this offline tool has no new production activation claim.

The next bounded experiment is **answer fidelity for the existing signature-coverage question**: freeze a small rubric that distinguishes key association, signed authority/agent and unsigned path/method/User-Agent, then capture complete answers and cited URLs from a named, available agent service under declared source-selection conditions. Score whether the answers preserve the published boundaries, including when they cite an external reproduction. That tests whether discoverability transfers useful engineering evidence into agent work. Keep source-supplied answer trials separate from unseeded discovery; do not repeat origin probes or require human identification for that outcome. It is a proposed next experiment, not an unobserved success or scheduled continuation.

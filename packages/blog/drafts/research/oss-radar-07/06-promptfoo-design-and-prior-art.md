# Promptfoo: evidence capture, product design, and prior art

Checked September 8, 2026. Selected question: **Can Promptfoo Preserve the Evidence Behind an AI Answer?** Governing form: OSS Radar project deep dive. The owned problem is preserving enough of an AI answer to inspect its citations and later compare bounded answer observations with the blog's request analytics.

**Working decision:** use Promptfoo for the next bounded evaluation, with an explicit capture provider and retained raw records. Its extension interface passed the installed fixture check. The built-in OpenRouter path did not preserve the fixture's citation fields in its normalized summary. Full adoption awaits live response, failure, billing, and trace/export checks. This is an authorial decision from the evidence below, not a maintainer recommendation.

## Baseline and timely change

Promptfoo source is pinned to `89052308bce06f53645b1f189ada5ac9d1897347`, release **0.122.2**. Its [0.122.1 release](https://github.com/promptfoo/promptfoo/releases/tag/0.122.1), published August 26, added per-test roots, target spans, OpenTelemetry GenAI alignment, and richer usage accounting. [0.122.2](https://github.com/promptfoo/promptfoo/releases/tag/0.122.2), published August 28, is the installed release examined here. These dates make evidence reconstruction a timely August–September question. They do not establish when the adapter omission began.

Use this single source baseline throughout the review. The [installed method and results](repro/installed/README.md) pin the npm artifact and dependency lock separately. A repository's generic latest-release endpoint may refer to a separately versioned product; it is not a substitute for identifying the CLI package under test.

Blog continuation baseline: `b338d642f04da6a9c24af513212d4a6565778bc3`. Older option-selection observations retain their original baseline in [02-evidence-ledger.md](02-evidence-ledger.md). No upstream change was submitted. The only issue material to this continuation, [#9968](https://github.com/promptfoo/promptfoo/issues/9968), was open on September 8; its telemetry report is discussed in the reproduction notes. Recheck it before publication.

## The product's job and the competing explanation

The [purpose and trajectory audit](08-promptfoo-purpose-and-trajectory.md) expands the project's context: application evaluation, adversarial testing, service-backed code scanning, current OpenAI affiliation, and the stated Frontier direction. The dedicated draft section uses this wider purpose before narrowing to our workload.

The pinned [README](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/README.md) presents evaluation and red teaming for AI applications. The [custom-provider documentation](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/site/docs/providers/custom-api.md) lets an operator bring an application behind a common interface. These support reusable testing and inspection within the maintainers' broader application-security purpose. They do not promise a publisher citation census or a complete forensic archive for every provider.

| Theory | Whose view | Evidence for | Evidence against or limit | Direction | What would disprove it for this workload? |
|---|---|---|---|---|---|
| A common runner and result model reduce repeated evaluation work | Maintainer thesis, reconstructed from README and interfaces | Shipped providers, assertions, custom interface, traces; installed text assertions and metadata export worked | Evidence fields depend on adapter behavior; trace coverage needs participating systems | Stated evaluation purpose; shipped extension path | The operator must replace orchestration, scoring, and export to retain the needed records |
| A small direct runner is enough for a small citation study | Our competing implementation theory | One fixture can be fetched and saved with little code; direct raw capture has fewer normalization steps | A study still needs repeats, assertions, errors, review, and versioned results; we have not measured total maintenance effort | Our proposed alternative | Promptfoo adds those useful functions while the capture layer stays small and independently replayable |

The first theory currently wins the next-step decision. The custom provider passed evidence into Promptfoo's existing summary without changing framework code. That tests one prerequisite for adoption; it does not measure the total cost of maintaining a live integration. Keep the direct runner as a fallback rather than treating a plugin interface as proof that every future requirement is cheap.

| Role | Layer | Evidence and scope |
|---|---|---|
| Replaces | Repeated scripts for assembling test cases and assertions | Public `evaluate()` interface and the executed assertion path |
| Wraps | Provider APIs or an operator's application | Built-in and custom provider call sites |
| Extends | Evaluation inspection with execution traces | Shipped evaluator/tracing code; not executed in this probe |
| Relies on | Model/retrieval services, returned evidence, source availability, and operator review | Those facts enter from outside the normalized result contract |
| Could support | A reproducible answer-and-citation evidence dataset | Raw/metadata fields and successful export enable it; capture policy and source review are our work |

The operator controls test cases, captured records, and publication. Providers supply inference and retrieval and set their exposed fields and charges. Promptfoo coordinates the evaluation; it cannot recover private task history or sources a service never returns. Local execution and reviewed static exports suit this first workload. Hosted sharing is a separate data-transfer decision and was disabled in the probe.

## Trace the shipped path

The core design separates the provider response from evaluation and storage. That is useful for comparing unlike services, but the adapter decides which provider-specific evidence reaches the common record.

| Stage | Pinned source | What it does | Consequence |
|---|---|---|---|
| Library entry | [node/evaluate.ts](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/node/evaluate.ts) | Runs a configured test suite and returns an evaluation object | A public summary can be serialized without the UI |
| Provider transport | [openrouter.ts](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/providers/openrouter.ts) | Posts chat-completion input through `fetchWithCache`; returns selected answer/usage fields | The fixture's source list and annotations do not enter that normalized response |
| Cache | [cache.ts](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/cache.ts) | Stores parsed response data with HTTP details; caching defaults on | The local cache retained the full parsed fixture; this is not an immutable archive |
| Response interface | [contracts/providers.ts](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/contracts/providers.ts) | Allows `raw` and arbitrary response metadata | The framework has an explicit place for evidence |
| Evaluation/result | [evaluator.ts](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/evaluator.ts), [evalResult.ts](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/models/evalResult.ts) | Runs assertions, handles response metadata, and projects result fields | The installed programmatic summary preserved custom raw/metadata fields; other export modes remain untested |
| Tracing | [evaluatorTracing.ts](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/tracing/evaluatorTracing.ts), [tracing documentation](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/site/docs/tracing.md) | Adds evaluation/test/target relationships and can connect participating traces | Useful execution structure; a span cannot establish unrecorded task or answer evidence |

The installed result corrected the broadest interpretation of the original source probe: **the data survived in the cache**. The missing fields are at the adapter-to-summary boundary. The custom path also demonstrated working behavior; positive evidence must carry equal weight in the verdict.

## Claim audit

| Claim | Product says | Code or test | Evidence state | Inference | Why it matters |
|---|---|---|---|---|---|
| The OpenRouter summary omits this fixture's structured citation fields | No complete citation-archive promise found | Installed fresh and cached runs, saved summaries | Reproduced | One successful non-streaming payload; not all providers | The chosen workload needs extra capture |
| The cache retains the same fields | Cache source stores parsed data | Exact parsed-object comparison with the fixture | Reproduced | No durability/restart claim; byte identity is not retained by parsing | Avoid accusing the whole framework of destroying evidence |
| Custom raw/metadata survive programmatic JSON export | Provider contract exposes both | Same fixture through a custom provider; re-read serialized summary | Reproduced | Only this export path; no privacy-redaction guarantee for arbitrary raw content | A framework fork is unnecessary for this bounded case |
| Traces connect recorded execution steps | Release/docs and implemented roots/target spans | Full relevant source path inspected | Code-inspected | Trace export was off; no citation or trigger completeness result | Trace coverage is a later gate, not today's measured success |
| Telemetry opt-out still reaches a send path | User report #9968 | Pinned code plus one blocked POST in the final probe | Reported and Reproduced | No claim that prompts leaked; initial delivery is unknown | Restricted collection needs explicit egress control |
| Citation analytics exists as a publisher-facing practice | Bing's February announcement | Primary product announcement read | Reported | Provider-defined coverage, not all AI answers | Category novelty is not our claim |
| Source support differs from causal reliance | Original citation research | Papers read, not rerun | Reported | Our pilot leaves faithfulness untested | Avoid a stronger conclusion than the measurements support |
| Promptfoo is worth the next bounded trial | Our workload and rival theory | Capture prerequisite passed; live behavior untested | Author judgment from reproduced evidence | Conditional adoption, not a general ranking | Gives a concrete next decision |

## Prior art and the contribution we can make

AI citation analytics already exists. Microsoft's [February 10, 2026 AI Performance announcement](https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview) describes publisher citation totals, cited pages, sampled grounding queries, and trends across supported Microsoft surfaces and selected partners. Its coverage and aggregation are defined by that product. It is not a census of all answers or a source-support audit. This is decisive counterevidence to a claim that counting AI citations is a new category we invented.

Earlier research supplies the evaluation methods. [ALCE, EMNLP 2023](https://aclanthology.org/2023.emnlp-main.398/), evaluates generated answers and their citations. [Liu, Zhang, and Liang, 2023](https://arxiv.org/abs/2304.09848), study verifiability in generative search. [Wallat et al.'s 2024 preprint](https://arxiv.org/abs/2412.18004) separates supporting citations from citations faithful to the model's actual reliance. The [trigger research](04-trigger-provenance-and-ai-citations.md) records these papers' scope and the relevant provenance standards. No historical failure rate is projected onto current systems.

The original [Trellner lead](02-evidence-ledger.md) also already describes an inspectable citation study. Its separate audit and comparison task stays open. This worklist should add evidence through the installed adapter test and the blog's own later observations, rather than borrowing someone else's results as firsthand findings.

Our plausible contribution is an open, inspectable method that preserves a run's evidence across a provider adapter, exposes what remains unknown, and compares answer-side observations with an owned site's bounded request records. The completed fixture already adds one reusable finding. Live datasets, review disagreements, and origin joins would add further value after execution. None justifies a “first ever” claim without a much wider novelty search.

“Citations will become more important” remains Goga's product hypothesis. The research supports investing in a small measurable experiment, not forecasting universal growth. Reader use, corrections, and reuse of the artifacts would be useful outcomes even if the blog receives no citations in the pilot.

## What extra code remains?

The successful prototype only captures a known successful fixture. Before paid use, implement response validation, absent-versus-empty fields, provider request IDs, errors/retries, cache provenance, and charge provenance. Retain immutable private raw records before deriving reviewed public records. Test non-success paths before interpreting a missing citation array as zero citations.

Keep citation extraction separate from claim review. A source list, citation annotation, quoted evidence passage, support judgment, and faithfulness judgment have different meanings. The [measurement contract](07-citation-measurement-contract.md) defines units and missing data. A hash commits to captured bytes; it does not establish that a remote provider sent them or that their contents are true.

For traces, test the same run and attempt IDs across captured responses, the evaluation summary, and enabled trace export. A stable identity/join that the systems carry explicitly can support correlation. A timestamp match alone remains ambiguous. When the remote service does not expose a field, preserve unknown rather than reconstructing an imagined history.

Two future paths follow from shipped parts. **Enabled, our proposal:** the raw/metadata interface can feed a static case viewer, after a capture schema and source reviewer exist. **Speculative, our proposal:** joining selected controlled runs to Worker observations can show where source-side analytics misses answer-side use, after marker propagation and cache cases are validated. Neither is a Promptfoo roadmap claim or a reason to add production D1 columns today.

## Decision gates and article shape

Proceed with a capture provider and keep the fixture regression. The next adoption gate is complete, replayable records for live successes and failures within the planned preflight, including cache state and a defensible charge record. A second gate tests explicit joins through the trace/export surfaces we choose to depend on. If those require replacing most of the runner or leave unreported evidence loss, use the direct-runner fallback and publish that result.

The [Radar draft](../../oss-radar-07-promptfoo.md) centers the project decision. Its first experiment can stand on its own while live evidence remains unresolved. The engineering continuation should ask what the blog can observe about citations using a new operated capture pipeline. It belongs beside the existing Measurement boundaries work, not as a renamed copy of this project review.

Editorial record: the selected title stays. Reader job: decide whether Promptfoo can retain evidence for citation evaluation. Protected boundary: installed synthetic results, no live model quality or discovery finding. Useful artifact: runnable probe and raw summaries. No SEO performance or citation-growth promise; no distribution has occurred. Full publication metadata and render review remain future work.

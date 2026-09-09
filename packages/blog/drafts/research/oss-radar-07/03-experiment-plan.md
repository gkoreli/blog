# Promptfoo citation pilot

Status: proposed, September 8, 2026. The only completed execution is the [offline module probe](repro/README.md). It does not satisfy the live-pilot gates below.

The first week should determine whether Promptfoo can support an auditable, small citation study with a thin adapter. It should leave useful research code and a project verdict. It should not promise a measured increase in organic discovery.

## First-week sequence

| Step | Work | Required evidence | Stop or change direction when |
|---|---|---|---|
| 1 | Reproduce the adapter result using the installed pinned package and a mock HTTP endpoint | Package/lockfile versions, request/response fixture, exported result, cache configuration | The installed result differs: explain the difference before claiming a defect |
| 2 | Build a raw-response capture adapter and replay the same fixture | Exact payload, citation/annotation fields, request ID, usage, charge provenance, error/cached states | Capturing results requires a large framework fork: compare a small standalone runner |
| 3 | Run five paid preflight calls at most | Working account/route, actual response shape, bill/usage agreement, limits and retry record | Key/route unavailable, evidence fields missing, or spend cannot be bounded |
| 4 | Freeze the pilot protocol and run 72 fresh calls | 12 questions × 2 wordings × 3 repetitions; complete response and failure records | Budget reserve is reached or the provider changes behavior/version materially |
| 5 | Score, review failures, and compare with a bounded source-side capture | Fixed rubric, per-question table, disagreement notes, explicit join coverage | The retained data cannot support the planned claim: narrow the claim |
| 6 | Build the article artifact and decide | Static dataset, minimal case explorer, runnable checks, adoption verdict | The experiment adds no useful product judgment: publish a small research note instead |

Five preflight calls are separate from the 72 analyzed calls. Runs are repeated observations on 12 questions, not 72 independent engineering problems. A week is a planning target; these steps are not scheduled automation.

## Question set

Freeze exact wording and inclusion rules before viewing answers. Use four task types, each with three specific questions derived from real decisions in this repository.

| Task type | What the questions should test | Existing evidence used to score |
|---|---|---|
| Diagnose analytics | Explain a counter disagreement without converting it into a count of people | Article 024 and its capture windows |
| Choose an implementation | Recommend an analytics or referrer-policy approach with inspectable tradeoffs | Articles 020/025 and the D1 read-budget record |
| Interpret a protocol | Explain what a signature, request header, or Markdown representation proves | Article 023 and the current protocol/source notes |
| Check a quantitative claim | Retain the relevant denominator, window, and caveat when summarizing a result | Frozen article-derived support ledger |

Two wording conditions: a plain question; the same question with an explicit request to check primary evidence and state limits. Keep the task, output budget, route, region, language, and model settings constant. The added instruction is the intervention; record it. Randomize run order and use fresh sessions.

The discovery pilot must not supply gkoreli.com, an article URL, the author name, or the expected answer. That would test directed access. Prepare the scoring evidence privately from the frozen corpus; do not leak it into the request.

Use one retrieval stack first. Sonar and Sonar Pro can be a later within-provider comparison, but are not independent search engines. An additional provider is a separate cohort with its own route, billing, source fields, and limits.

## Capture contract

Retain an immutable private raw-response record and a reviewed public export. The public schema should include:

| Group | Fields |
|---|---|
| Run identity | run ID, task ID, condition, repetition, UTC timestamps, model, provider, gateway/endpoint, region if known, version or unresolved alias |
| Inputs | exact prompt, settings, context/response limits, input hash, protocol version |
| Transport | HTTP outcome, provider request ID when available, elapsed time, retries, local-cache state |
| Evidence | provider-returned source list, explicit answer-citation annotations, answer text, fetched source status, source-content hash or access limitation |
| Resources | input/output/reasoning/cache usage when exposed, provider-reported charge, gateway charge if distinct, estimated charge marked as estimated |
| Review | supported/unsupported/unverifiable claim judgments, preserved limitations, reviewer disagreements, correction notes |
| Origin comparison | matching rule, observation window, path, match confidence, reason for unmatched or unknown cases |

Preserve field absence as unknown, not zero. Retain raw URLs; derive hostname and registrable-domain fields using a pinned Public Suffix List implementation. Keep citation occurrences, unique URLs, unique domains, and answer claims as separate units. Preserve lookup failures separately from confirmed absence. Do not publish subscriber addresses, request credentials, or private visitor-level traces.

Response caching must be disabled for repeated sampling through a supported version-specific setting and verified with transport counters. Replaying a saved response for parser tests is desirable; counting that replay as a new model answer is not.

## Primary outcomes and scoring

Primary outcomes are citation-field retention through the chosen adapter and the proportion of scored claims that their cited sources support. Report the numerator, denominator, unit, and unavailable-source count. Return URLs alone do not prove that every source supports a statement or that the model fetched it during that run.

Secondary outcomes are qualification retention, unsupported generalization, citation-set variation within a question, gkoreli.com inclusion, failures/abstentions, and cost per completed answer. Define a valid completed answer before the run. Keep inaccessible sources in the record; do not quietly remove difficult cases.

Blind reviewers to the wording condition where practical. Manually check all material conclusions and a fixed sample of otherwise passing claims. If using a model judge, retain its prompt/model, compare it with human judgments, and publish disagreements. This small pilot estimates variation in these tasks; it does not establish a general AI credibility effect.

## Cloudflare comparison

Use existing saved evidence first. If new data are necessary, define one bounded UTC window and one export, with the query, rows read, sampling, and fields retained. The already completed D1 repair should not be benchmarked again for this article.

Keep these four observations distinct:

1. A request reached the Worker.
2. The provider returned a URL among its sources.
3. The answer cited a URL in support of a claim.
4. The cited source supports that claim.

A source-side request log cannot reveal all downstream citations. Retrieval caches can produce answers without a new origin fetch. A path/time coincidence is a candidate association, not a shared request identifier. Controlled fetches with a nonce belong in a separate directed-access test and must not be counted as organic discovery.

Compare Trellner domains against available exported referrers only as an overlap study. A referrer is client-supplied, and an overlap does not establish source quality, common ownership, or cause. TASK-0132 stays open until that comparison runs or a concrete data limitation is recorded.

## Budget

The proposed incremental API ceiling is $20, including preflight, retries, and any model grading. This is a ceiling to enforce when the experiment starts, not money spent or an assumed subscription entitlement. Consumer-app access and API billing are separate interfaces.

Current [Perplexity pricing](https://docs.perplexity.ai/docs/getting-started/pricing) includes token charges plus request fees for Sonar models. [OpenRouter Sonar](https://openrouter.ai/perplexity/sonar) and [Sonar Pro](https://openrouter.ai/perplexity/sonar-pro) have their own displayed rate information. Pin the selected route and settings and reconcile the preflight to its actual usage/charge records; do not combine native and gateway prices into one made-up estimate.

Set an output limit, low concurrency, a finite retry count, and a reserve before each batch. Stop early if actual charges cannot be read or the estimated worst-case next batch exceeds the remaining ceiling. Publish cost per successful run and the cost of failures separately. A paid model judge is optional; manual scoring may be a better use of this small budget.

## Radar and engineering continuation

The Radar verdict concerns Promptfoo: what it preserves, what its provider boundary omits, what extension is needed, and whether the tool is worth adopting for this workload.

The engineering continuation concerns the blog's new evidence pipeline: a capture schema, reproducible analysis, and an answer/source viewer alongside its existing analytics. Serve reviewed results from static files. Do not add a paid API call or an unrestricted D1 query to each reader interaction. Public placement remains the design decision tracked in TASK-0106.

The [existing credibility design](../engineering-credibility/02-experiments.md) is a later controlled study: 12 tasks × 4 variants × 5 repetitions = 240 runs per model. It tests ownership wording and evidence access with supplied material. The 72-call open-web pilot here does not replace it, execute it, or claim its causal conclusions.

Publish a meaningful negative result if necessary. No model needs to cite gkoreli.com for the adapter findings, method, and honest limits to help another engineer.

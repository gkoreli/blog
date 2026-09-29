# Prompt caching from inference API to agent loop

Started: 2026-09-28. Status: expanded teaching chapters, upstream context-management reproductions, and 35 live requests complete. Publication and distribution checks are in progress. The original plan and initial checkpoint below are historical; [the latest checkpoint](checkpoint-2026-09-29.md) records accepted work, limits, and remaining actions.

## Start reading here

1. [Canonical TypeScript article](../../../packages/blog/posts/prompt-cache-context-edits.ts): the prose and presentation, using the site’s shared article templates. It includes a worked dependency/hash/checkpoint diagram, prefill/decode visual, four-layer map, and expandable measured comparisons. The [earlier Markdown draft](article-draft.md) is retained as history, not a second editable source.
2. Start with [the KV-cache walkthrough](research/08-kv-cache-walkthrough.md), which defines tokens, vectors, attention, saved state, and memory costs from actual serving code. Then read [inference and cache repair](research/01-inference-and-cache-repair.md): causal dependencies, vLLM/SGLang internals, retained branches, modular caching, approximation, and architecture-specific exceptions.
3. [Provider contracts](research/02-provider-contracts.md) plus [OpenAI, SDK, and Codex](research/04-openai-sdk-codex.md): exact API surfaces, counters, controls, translation, and current limitations.
4. [Harness audit](research/03-harness-audit.md): Pi, Oh My Pi, OpenCode, and Gemini CLI. Codex is covered separately above; Claude Code has a documented-product evidence boundary in the provider report.
5. [Live experiment](research/05-live-anthropic-experiment.md): all nine cases, conditions, pricing, timing, and correctness limits. [Runnable labs](lab/README.md) include numerical state dependencies, actual Pi transformation, actual mocked SDK serialization, and the paid probe.
6. [Context management](research/07-context-management.md): what pruning, truncation, and compaction actually send next in Pi, OMP, OpenCode, and Codex. [Changing retrieved evidence](research/09-changing-retrieved-evidence.md) compares replacement, appended corrections, and old assistant answers against the live API.
7. [Claim ledger](research/06-claim-ledger.md): which claims are documented, source-inspected, locally reproduced, provider-observed, inferred, or still proposed.

The direct Sonnet 5.5 run cost an estimated **$0.1777092**. It observed 7,870-token reuse after an appended system update, zero reads after an early replacement, and 5,371-token reuse after a middle edit. It did not establish general instruction equivalence or a speedup. The second eight-request experiment cost $0.0308808; total inference spend is **$0.20859**. Appending corrected evidence reused more cached input but cost more than replacing a short late source in that layout. No further paid run is needed to inspect the retained analysis.

The [source register](sources.md) points into the reports; [the lock file](sources.lock.json) pins eleven cloned repositories and their inspected local paths. Exact shaping prompts are preserved in [the initial request](initial.prompt.md), [research direction](research-direction.prompt.md), and [follow-up messages](follow-up.prompts.md).

To render the isolated draft preview from the repository root:

```sh
pnpm -C packages/blog exec node --import tsx drafts/prompt-cache-preview.ts
```

Open `/tmp/prompt-cache-article-preview/index.html`. The preview writes only its own temporary directory. The production build and browser checks are recorded in the latest checkpoint.

## Purpose and article center

Learn how LLM inference APIs work, what prompt caching reuses, how providers expose it, and how agent harnesses affect reuse across turns. Develop the article while learning: keep explanations, mistaken predictions, request traces, and changes of mind as the work happens.

The live question is: **When an agent sends its next request, what work can the provider reuse, and what decisions in the harness make that possible?** This is a question to investigate, not a conclusion that every cache miss is a harness bug.

Working form: a learning journal that can become an evidence-led engineering explanation. The final title and argument remain open. There is no supplied incident, cost saving, or benchmark outcome to narrate yet.

- **Reader promise:** explain a cache hit or miss from an API request, understand provider differences, and inspect an agent's request construction and usage accounting.
- **Author promise:** preserve Goga's actual questions, predictions, experiments, and judgments as he learns. The initial curiosity is documented; further firsthand material must come from the work.

Keep [the original prompt](initial.prompt.md) verbatim. Use [the source register](sources.md) to start research and record provenance. This directory owns the worklist; link future research and draft artifacts here as they are created.

## Original investigation plan

The checkboxes preserve the initial plan, rather than suggesting every broad research question is closed. Use the latest checkpoint and claim ledger for the completed first-pass scope. Additional provider tests, retention/concurrency work, and end-to-end agent quality evaluation are proposed follow-ups, not missing results silently assumed by the draft.

### 1. Build the inference model

- [ ] Trace one tool-using turn: harness → provider adapter/SDK → HTTP request → inference service → streamed output and usage → tool execution → next request.
- [ ] Explain tokenization, prefill, autoregressive decoding, attention, and key/value state with a small worked example. Distinguish per-generation KV state from reuse across requests.
- [ ] Separate prefix caching, explicit cached-content resources, full-response caching, semantic caches, conversation persistence, and the harness's local session files.
- [ ] Identify what a hit can save and what remains: transmission, uncached prefill, decoding, context-window occupancy, and provider-specific billing. Verify each boundary rather than assuming one meaning of “cached.”
- [ ] Read an open serving implementation such as vLLM or SGLang for prefix matching, block organization, eviction, and routing. Use it to explain one implementation, without attributing its internals to every hosted provider.
- [ ] Produce a plain-language explanation and a diagram of two successive tool turns. Goga should be able to predict the reusable prefix before seeing usage.

### 2. Compare provider API contracts

Start with OpenAI, Anthropic, and Gemini. Then examine DeepSeek and a routed path through OpenRouter. Add hosted variants such as Azure OpenAI, Amazon Bedrock, and Vertex AI where they change the contract. Consider Together, Fireworks, and Groq if they add a distinct mechanism or serve a selected harness configuration; log exclusions instead of promising an exhaustive market survey.

- [ ] Pin the date, model identifier, endpoint, SDK version, authentication mode, and hosting route for every comparison. Separate direct APIs, gateways, and subscription-backed harness access.
- [ ] Build a matrix covering automatic behavior and opt-in controls; exact request fields; minimum cacheable length; matching granularity; breakpoint rules; cache identity and scope; retention/refresh/eviction; model availability; and unsupported combinations.
- [ ] Record the usage fields for cache reads, writes, ordinary input, and output. Determine whether counters overlap before normalizing them.
- [ ] Compare read discounts, write premiums, storage charges, TTL options, rate-limit accounting, and regional/data-retention constraints using dated primary documentation. Leave unknown cells explicit.
- [ ] Test what “OpenAI-compatible” establishes about request shape and what remains provider-specific about cache semantics and counters.
- [ ] Separate routing hints, cache keys, cache objects, and conversation IDs. Establish which fields actually influence reuse for each endpoint.
- [ ] Produce minimal request/response examples for a first request, a reuse attempt, and a changed-prefix control. Mark examples as documented, locally validated, or live-tested.

### 3. Dissect agent harnesses

Required coverage: Pi, Oh My Pi (the working interpretation of “omp”), Codex, OpenCode, and Claude Code. Follow at least one full request path for each. Broaden only where another harness contributes a useful contrast.

| Harness | Audit focus | Evidence needed |
|---|---|---|
| Pi | Shared model abstraction, provider adapters, prompt assembly, cache options, usage normalization | Pinned code plus serialized request fixture |
| Oh My Pi | Differences from Pi in provider adapters, session handling, retention, and prompt/tool construction | Its own pinned code; do not infer current behavior from its ancestry |
| Codex CLI | Request construction, stable instructions/tools, session affinity, continuation, compaction, token accounting | Pinned public CLI code and applicable API docs; distinguish CLI from app/hosted behavior |
| OpenCode | Provider transforms, SDK behavior, cache markers, message cleanup, compaction, usage reporting | Pinned harness and relevant dependency versions |
| Claude Code | Documented caching behavior, settings, turn structure, compaction, observed usage | Establish source/license availability first; use official docs and permitted observation where internals are unavailable |
| Additional candidates: Aider, Cline, Gemini CLI, Goose, OpenHands | Different prompt layout, edit loop, provider integration, or context-management strategy | Select two or three after checking maintenance, public source, tests, and real operational evidence |

“Battle tested” is a selection question. Record concrete evidence such as maintained releases, regression tests, resolved cache incidents, and reproducible usage; popularity alone does not establish reliability.

For every selected harness:

- [ ] Record canonical repository, release/commit, license, dependency versions, provider/model, and exact configuration. Resolve renamed repositories and ambiguous forks.
- [ ] Trace configuration → context assembly → provider transform → serialized request → usage parsing → displayed/accounted cost. Cite commit permalinks and symbols.
- [ ] Inspect ordering and stability of system instructions, tool definitions, skills, repository context, timestamps, environment metadata, messages, and tool results.
- [ ] Locate breakpoint placement, retention options, cache keys/affinity hints, capability detection, defaults, and overrides. Distinguish absent support from a missed search.
- [ ] Inspect model/provider switching, reasoning/thinking blocks, history edits, retries, session forks, parallel agents, and compaction. Determine where prefixes change and why.
- [ ] Check whether the SDK adds, removes, or rewrites fields. A harness source search alone may miss behavior implemented in a dependency.
- [ ] Reproduce at least one request fixture and one cache-relevant change. Separate static code findings, local fixture results, and provider observations.
- [ ] Write a short finding explaining the mechanism, evidence, tradeoff, and remaining uncertainty. Avoid ranking harnesses across different models or tasks.

### 4. Run controlled experiments

First make an offline request-comparison fixture with synthetic content. Before live calls, record the available account/model route, estimated spend, and a bounded run budget. This worklist does not establish available credentials or a live experiment result.

| Experiment | Change | Question |
|---|---|---|
| Baseline reuse | Repeat a sufficiently long, stable request, then append a turn | Does the API report reuse, and how much? |
| Prefix sensitivity | Change one item near the start versus near the end | Where does reusable content stop? |
| Tool stability | Reorder tools, edit one schema, or add one tool | How does tool construction affect reuse? |
| Growing agent loop | Append deterministic tool calls and results | Does reuse grow across realistic turns? |
| Context maintenance | Compact, prune, or rewrite a message | What prefix survives, and what context is lost? |
| Identity and routing | Hold payload fixed; vary a supported session/cache hint or route | What changes are documented, observed, or still opaque? |
| Retention and concurrency | Delay reuse or run controlled parallel requests | What can the sample establish about expiry and routing? |

- [ ] Fix model, content, output cap, tools, and generation settings where supported; vary one factor at a time. Use deterministic fixture tool results for the controlled comparison.
- [ ] Distinguish a predicted cold request from a measured miss; use observed usage to label cache state. A fresh client session does not establish an empty server cache.
- [ ] Record timestamp, request/fixture hash, relevant configuration, cache read/write and total token fields, time to first token, full response time, output length, retries/errors, and estimated billed cost.
- [ ] Keep provider counters alongside normalized metrics and publish the normalization rules. Report repeated samples and spread; do not infer cache hits from speed alone.
- [ ] Calculate break-even reuse from each provider's actual billing categories, including writes and storage where applicable. Keep latency, cost, and answer/task quality separate.
- [ ] Run a small end-to-end task after the controlled fixtures to assess practical consequences. Do not interpret synthetic cache efficiency as better coding performance.
- [ ] Keep credentials, private prompts, and raw operational captures outside Git. Commit synthetic fixtures, methods, sanitized results, and reproduction instructions.

### 5. Write while learning

- [ ] After each research session, record: question, prediction, evidence, what changed, and the next unresolved question. Preserve substantive shaping prompts chronologically.
- [ ] Start a draft once the mechanism and first request trace can be explained. Add provider comparisons and harness findings as they are established.
- [ ] Maintain a claim table with statement, evidence class, date/version, artifact or source, counterevidence, and limits. Use documented / code-inspected / locally reproduced / provider-observed / inferred / proposed labels.
- [ ] Test competing explanations for misses: changed prefixes, thresholds, retention, route changes, unsupported controls, and accounting mistakes. Keep counterexamples.
- [ ] Build the article around the strongest explanatory example. Candidate assets: a turn-by-turn prefix diagram, a dated provider matrix, an annotated harness request diff, and a cost example with explicit assumptions.
- [ ] Ask Goga for his interpretation of the actual findings and decisions when there is concrete evidence to react to. Do not manufacture a starting belief or a personal failure.
- [ ] Choose the final form and scope from the evidence. Run discovery/positioning and engineering review after the article's claims stabilize; polish prose last.
- [ ] Before publication, recheck changing API claims, prices, repository identities, and code citations. Carry source dates and limitations into the article, and move the exact shaping prompts to its eventual prompt file.

## Completion criteria

The research is ready for synthesis when the mechanism is explainable, the provider matrix has sourced boundaries, every named harness has an evidence-backed finding or an explicit access limit, and at least one cache-preserving and one cache-breaking request comparison is reproducible. An unavailable live account can remain a named limit; local results must not be presented as provider measurements.

The article is a separate deliverable: it must teach from the evidence, preserve Goga's real learning, link its artifacts, and distinguish explanation from measurement. Creating this worklist does not complete that deliverable.

## Initial checkpoint — 2026-09-28 (superseded)

Superseded by [the research-and-draft checkpoint](checkpoint-2026-09-28.md); retained as the starting state.

- Completed: scope and sequence, provider and harness coverage, experiment design, initial source entry points, and exact initial prompt preservation.
- Evidence so far: documentation/repository discovery only. No pinned harness audit, benchmark, live inference request, cost saving, or article draft.
- Open decisions: concrete model/account routes, additional harness selection, and live experiment budget. None blocks the first documentation and source-code pass.
- **Next bounded action:** explain a two-turn tool conversation, populate the OpenAI/Anthropic/Gemini contract matrix from current docs, and pin Pi plus Oh My Pi for the first comparative request trace. Save the explanation and findings here and link them from this worklist.

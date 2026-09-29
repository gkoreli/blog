# Can You Change an Agent’s Context Without Losing Its Prompt Cache?

Working draft, September 28, 2026. Prepared for author review; not published. Provider contracts and source revisions are dated in the linked research.

Changing an agent's instructions does not always require paying to process its whole conversation again. In a small Sonnet 5.5 experiment, replacing an instruction near the beginning caused a complete cache miss. Appending the same requested policy change as a new system message preserved **7,870 cached tokens**. Both returned the two fields the test expected. Those are different representations of the task, though, and that distinction matters more than the cache-hit number.

I'm building a harness. I want instruction changes, tools, and retrieved documents to be flexible without turning every adjustment into another expensive prefill. I also want correctness: keeping a cache is useless if the model is now reasoning from state that no longer represents its input.

The investigation produced four findings:

- Editing history generally invalidates downstream state in a conventional causal transformer. Similar meaning does not establish reusable computation.
- APIs can support **prospective updates** that preserve history. Some SDKs and harnesses already implement them; support depends on the exact route and version.
- A provider can reuse less than the mathematically unchanged prefix because of stored boundaries, lookup rules, routing, or expiry.
- Cache hits reduce input work and cost. They do not guarantee a faster complete response, a smaller context window, or correct task behavior.

The evidence includes pinned source audits, a numerical dependency experiment, actual Pi and SDK reproductions, and 27 direct Anthropic requests. The live run cost an estimated **$0.1777**. It covers one synthetic task on one model, not a ranking of inference providers. [Methods and all observations](research/05-live-anthropic-experiment.md).

## The cache stores a computation with a history

An LLM does work before it can produce the first output token. During **prefill**, it processes the input and creates per-layer key/value state. During **decode**, it generates additional tokens while attending to permitted earlier state. Prompt caching makes compatible state available to another request so the service can skip some repeated prefill.

For a conventional causal transformer, the important dependency is:

```text
token + position
    → representation after attention to earlier tokens
    → deeper-layer keys and values
    → later tokens' computations
```

The causal mask prevents future text from changing earlier representations. That is why appending another turn can preserve the previous prefix. It does not prevent earlier text from influencing later representations. An unchanged paragraph following a changed system instruction can therefore have different deep-layer state. [Transformer decoder masking and attention](https://arxiv.org/abs/1706.03762).

This is where my initial picture of a stack collapsing after an edit was useful, but incomplete. A server can retain multiple histories. Changing one request need not delete the old request's cache. Returning to an already computed branch can work, provided its entries are still available. What does not generally work is attaching that branch's downstream state to a different beginning.

The indexing reflects this dependency. In the audited vLLM source, a block hash includes the preceding block's hash, current tokens, and relevant extra keys. SGLang walks a prefix tree and splits at divergence. These structures preserve compatible histories; they do not make arbitrary suffix transplantation valid. [vLLM hash construction](https://github.com/vllm-project/vllm/blob/28f673957671d8d4c5672c2085b3f22c79c0b0b5/vllm/v1/core/kv_cache_utils.py#L650), [SGLang matching](https://github.com/sgl-project/sglang/blob/2ff52e3ceb0bcfdc8ba1dd0367b39ce0370bbfaf/python/sglang/srt/mem_cache/radix_cache.py#L639).

<!-- cache:dependencies:start -->
![A causal dependency grid and retained prefix branches](assets/cache-dependencies.svg)
<!-- cache:dependencies:end -->

The [local lab](lab/kv_dependency.py) makes this numerical. It uses an untrained three-layer transformer, edits one early token without changing sequence length, and compares three computations:

| Computation | Maximum difference from fresh final logits |
|---|---:|
| Reuse the valid prefix, recompute the rest | 0 |
| Recompute the changed token, splice the old suffix state back in | 0.339935 |
| Append new context to a valid cached prefix | 0 |

The number has no language-quality meaning; the model is untrained. It demonstrates that the shortcut computes something different. At an unchanged later token, first-layer K/V remained identical while deeper layers changed. That is a useful correction to the loose claim that every cached value after an edit must change.

The zero differences come from the toy's identical arithmetic order. They do not promise bitwise identity across GPU kernels, batching, precision, or sampled responses. [Recorded result and reproduction limits](lab/README.md).

## Four layers decide whether reusable work is actually reused

A harness can construct an eligible request without receiving a cache hit. A server can hold useful state that the API offers no way to select. Each layer controls a different part of the result.

<!-- cache:layers:start -->
| Layer | What it controls | What to inspect |
|---|---|---|
| Inference engine | State validity, attention, indexing, residency, eviction, execution | Model assumptions, cache identity, matching and scheduling code |
| Provider API | Supported updates, boundaries, lifetime, routing controls, counters, prices | Exact endpoint/model contract and returned usage |
| SDK or adapter | Message conversion, supported options, serialization, response normalization | Final outbound body and raw-to-normalized usage |
| Agent harness | History, prompt versions, tools, retrieved context, compaction, retries | The operation before and after provider conversion |
<!-- cache:layers:end -->

Consider a two-turn tool interaction. The first request contains instructions, tool definitions, and the user's question. The model generates a tool call. The harness executes it and sends a second request containing the prior conversation plus the tool result. The service can potentially reuse the earlier prefix and process the new suffix. The fact that this was one UI conversation does not itself provide that reuse: the adapter must preserve the relevant input, the API must recognize an eligible boundary, and the serving path must have the entry.

Likewise, a conversation ID can restore history without guaranteeing cached inference. An explicit cache object can represent a fixed prefix without supporting arbitrary edits. A response cache can return an old answer without running the model at all. These mechanisms solve different problems; calling all of them caching obscures the useful distinctions.

## What the live experiment established

The synthetic task asked Sonnet 5.5 for a currency and the value of one record. The prompt had a system policy, reference text, two blocks of records, and explicit five-minute cache boundaries. Each variant kept the same model, low effort, and output cap. Three distinct baseline prefixes separated the repetitions.

<!-- cache:measurements:start -->
| Change | Cache reads | New cache writes | Mean estimated whole-request cost |
|---|---:|---:|---:|
| Repeat the original request | 7,870 | 0 | $0.001820 |
| Change the early currency policy | 0 | 7,871 | $0.019934 |
| Return to the original request | 7,870 | 0 | $0.001820 |
| Edit a record in the second block | 5,371 | 2,499 | $0.007568 |
| Append a new system policy | 7,870 | 0 | $0.002486 |
| Append an inline tool definition | 7,870 | 0 | $0.002038 |
<!-- cache:measurements:end -->

Read/write counts were the same in all three repetitions of each case. Every answer matched its expected currency and record value. The early edit and appended instruction both changed the expected currency from USD to EUR; the middle edit changed the expected record value.

The middle edit is especially instructive. Reuse stopped at the earlier stored boundary. The second record block was processed again, including unchanged records before the edited record. The mathematical dependency boundary and the API's reusable boundary were not identical.

The inline tool request was accepted and kept the prefix hit. It did **not** test whether the model could select or correctly call that tool: the prompt prohibited tool calls. Nor did the test cache the appended control messages for a future turn; all explicit markers were before them.

Cheap also did not mean faster in this sample. The appended-system case had median time to first visible text of **1.761 seconds**, versus **1.432 seconds** for the early edit. Two appended requests generated extra thinking tokens. Timing includes transport, queueing and reasoning; with three ordered samples per case, it would be misleading to claim a general latency result. The measured result is preserved input reuse with lower estimated request cost and a narrow successful behavior check. [Complete method, timing ranges, and counters](research/05-live-anthropic-experiment.md).

For budgeting, separate the stable prefix from everything else. If it contains `P` tokens, appears in `N` requests, and is written once then successfully read on every repeat, its cost is `P × (write price + (N − 1) × read price)`, with prices expressed per token. The uncached comparison is `P × N × ordinary input price`. Add new input, output, and any storage charges separately.

At the tested Sonnet rates, a five-minute write costs 1.25 times ordinary input and a read costs 0.1 times. One successful reuse already pays back the write premium: 1.25 + 0.1 is less than two ordinary prefills. A one-hour write at twice ordinary input would need two successful reuses: 2 + 0.1 is still more than two prefills, but 2 + 0.1 + 0.1 is less than three. These are prefix-only calculations assuming hits inside retention, not measured whole-task savings. Keeping irrelevant text merely to improve hit rate can still cost more than shortening the context. [Dated prices and counter rules](research/05-live-anthropic-experiment.md).

## APIs can represent change without rewriting the past

Anthropic's current API supports system messages within the conversation on selected models, including the tested Sonnet 5.5. A new instruction retains system authority while leaving the preceding prefix intact. Tool additions and removals have their own protocol, including beta inline definitions. This is useful for tools unknown at session start or a schema that changes later. The inline path has constraints, including an initially present non-deferred tool to avoid changing the rendered head when the first new tool appears. [Official update contract](https://platform.claude.com/docs/en/build-with-claude/mid-conversation-system-messages).

OpenAI also documents prospective controls: restrict callable tools while keeping their definitions stable, load deferred tools later, or append supported reasoning-configuration updates. Its current caching behavior differs by model generation; older advice about automatic interval caching and retention keys does not fully describe newer explicit boundaries. [OpenAI cache controls](https://developers.openai.com/api/docs/guides/prompt-caching).

The providers do not expose one interchangeable abstraction:

| Surface | Distinction that changes harness design |
|---|---|
| OpenAI | Model-dependent implicit/explicit boundaries and configuration updates; API generation matters |
| Anthropic | Explicit or automatically advancing boundaries, plus supported mid-conversation system/tool controls |
| Gemini | Implicit reuse versus named explicit cache resources; contents of an explicit resource are immutable |
| DeepSeek | Persisted prefix units; a common prefix can become reusable only after the corresponding unit is stored |
| OpenRouter | Upstream translation and provider affinity; staying on a route and hitting an inference cache are separate |

The [dated provider report](research/02-provider-contracts.md) records endpoints, limits, counters, hosted-platform distinctions, and authoritative links. In particular, current Gemini Interactions and GenerateContent expose different caching surfaces. Do not transfer the contract of one endpoint to another because both use the same model family. [Gemini caching](https://ai.google.dev/gemini-api/docs/caching), [explicit resources](https://ai.google.dev/api/caching), [DeepSeek persistence](https://api-docs.deepseek.com/guides/kv_cache/), [OpenRouter routing](https://openrouter.ai/docs/guides/best-practices/prompt-caching).

For my harness, the useful operation is often *apply this policy from now on*. That can fit an append-only protocol. *Pretend the earlier instruction never existed* is a different requirement. So is deleting sensitive context. An appended correction does not remove old information from the input or its cached representations.

## The SDK can preserve a feature—or hide it

Provider support is not enough. The request has to survive the SDK's model of the world.

The [mocked SDK experiment](lab/sdk-wire.mjs) executed published Vercel provider packages and captured their outgoing requests. OpenAI explicit breakpoints and TTL controls survived. An Anthropic mid-conversation system message and tool-removal reference survived too. These are implemented features, not hypothetical improvements.

There was a smaller gap: the tested OpenAI provider-options schema accepted `mode` and `ttl`, but had no diagnostics comparison-ID field. Supplying an invented JavaScript option did not forward it. The official OpenAI SDK exposed the underlying field. That is a reason to inspect the adapter, use a supported escape hatch, or add an explicit capability—not evidence that the SDK's caching is generally defective. [Versioned SDK findings](research/04-openai-sdk-codex.md).

A cache-aware abstraction should make unsupported operations visible. Silently treating an update as a full prompt rebuild can preserve functionality while surprising the caller with very different cost. Discarding an unsupported diagnostics option is another kind of surprise. Capturing the serialized request is how to tell which happened.

## Harnesses are already doing substantial work here

My suspicion was that these layers might leave useful caching features unused. The source audit narrowed that suspicion. Several harnesses already implement careful, provider-specific behavior.

| Harness | Finding at the audited revision |
|---|---|
| Pi | Preserves native system updates when supported; otherwise collapses them into the leading prompt. Tool redefinitions trigger a separate fallback. |
| Oh My Pi | Implements explicit OpenAI cache anchors, Anthropic tool-control history, stable MCP ordering, and cache-warming policy. |
| Codex CLI | Can pin a context window's request-level reasoning effort and append trusted configuration updates on supported models. |
| OpenCode | Applies provider-specific cache markers through AI SDK, with distinct automatic-caching and runtime paths. |
| Gemini CLI | Appends selected retry nudges rather than rewriting system instructions; authentication routes differ. |
| Claude Code | Official documentation describes stable prefixes, appended updates, cache settings, and compaction; this was not a source audit of its production request builder. |

The [harness audit](research/03-harness-audit.md), [Codex audit](research/04-openai-sdk-codex.md), and [Claude Code documentation](https://code.claude.com/docs/en/prompt-caching) provide the versions and evidence boundaries. Default-branch code is not proof of the behavior of an older installed release.

Pi supplied the clearest local reproduction. Using its actual pinned transcript functions, the same system-section change kept the original prefix when native mid-conversation support was enabled. With that capability disabled or unspecified, it replaced the section in the leading system message. Both representations replayed to the same current system text in Pi's helper, but that does not make them identical model inputs. [Fixture and returned transcripts](lab/pi-transcript-results.json).

That is a concrete requirement for a harness API: expose the difference between an append, a history rewrite, and a provider fallback. The user should not need to discover it from a bill.

## Research does attempt reusable pieces of context

The inference question remains interesting even after the API improvements. Could independently cached pieces be assembled with only a little repair?

**Prompt Cache** uses schema-defined modules and positions. Its paper explicitly describes an attention approximation: independent modules omit some dependencies that ordinary concatenated attention would have computed. **CacheBlend** instead reuses chunks and selectively recomputes tokens to reduce deviation from full recomputation. **PIE**, designed for code edits, repairs positional effects while treating suffix reuse as an approximation. [Prompt Cache](https://arxiv.org/html/2311.04934v2), [CacheBlend](https://arxiv.org/html/2405.16444v3), [PIE](https://proceedings.iclr.cc/paper_files/paper/2025/file/9530635032b95cea9585bd800d308300-Paper-Conference.pdf).

Those results are relevant, but their correctness baseline needs to be explicit. Matching a benchmark score is weaker than reproducing the same conditional distribution. A position correction is not a recomputation of what the token learned from the old context. Moving or compressing a cache also does not establish that its contents remain valid after an edit.

There are architecture-specific exceptions. A deliberately independent attention mask changes which dependencies exist. Pure local attention can bound their reach, while hybrid or recurrent models require different checkpoint reasoning. None supplies a universal hosted-API operation for editing arbitrary old text while retaining the entire suffix unchanged. [Inference report, implementation details, and research limits](research/01-inference-and-cache-repair.md).

I would keep approximate cache repair behind a separate evaluation decision. It may be useful for a workload willing to measure and accept a quality tradeoff. It does not yet satisfy my demand for a generally correctness-preserving replacement operation.

## What I would build into a harness

For an implementer, the first useful artifact is an operation matrix, not a cache-hit target.

| Requested operation | Candidate implementation | Required correctness check |
|---|---|---|
| Change a preference from this turn onward | Supported authoritative message appended to history | New behavior applies with the intended scope |
| Add or change a tool | Native tool update where supported; otherwise deliberate rebuild | Correct schema/version and executor permissions |
| Replace stale evidence | New version with explicit precedence, or rebuild the relevant context | The answer uses the intended evidence; old content may still influence appended form |
| Erase or redact earlier content | Rebuild without it and its derived context; address provider retention separately | No claim that an appended correction removes prior information |
| Compact a long session | Summarize and begin a new context version | Task-relevant facts survive; lower hit rate may still reduce total cost |

Stable instructions, deterministic tool ordering, versioned context, and unchanged history avoid accidental misses. Supported prospective controls provide flexibility. Meaningful rewrites should remain visible, even when they cost more.

Observability then needs both sides of the boundary: a sanitized request comparison and the provider's returned usage. Log the model, route, adapter version, requested retention, selected boundaries, read/write/ordinary-input buckets, output tokens, time to first text, and task outcome. Keep raw counters because providers disagree about whether total input already includes cached tokens. Use diagnostics where available; a zero hit alone does not identify the cause. [OpenAI diagnostics](https://developers.openai.com/api/docs/guides/prompt-caching/diagnostics), [Anthropic diagnostics](https://platform.claude.com/docs/en/build-with-claude/cache-diagnostics).

The question I started with was whether I could swap pieces out without the rest falling over. I now need to name the operation more carefully. Updating an instruction from this point onward can be cache-friendly today. Revisiting an old exact branch can be too. Replacing the past while pretending its downstream computation has not changed is the operation the ordinary cache cannot generally give me.

That leaves useful work for the harness: make the supported operation easy, make the fallback visible, and evaluate the behavior separately from the savings.

---

## Glossary

| Term / claim | Primary source | Date |
|---|---|---|
| Causal attention and state dependencies | [Attention Is All You Need](https://arxiv.org/abs/1706.03762) | 2017 |
| Prefix hash provenance | [Pinned vLLM implementation](https://github.com/vllm-project/vllm/blob/28f673957671d8d4c5672c2085b3f22c79c0b0b5/vllm/v1/core/kv_cache_utils.py#L650) | Inspected 2026-09-28 |
| Mid-conversation system/tool changes | [Anthropic contract](https://platform.claude.com/docs/en/build-with-claude/mid-conversation-system-messages) | Checked 2026-09-28 |
| Provider-specific caching controls | [OpenAI](https://developers.openai.com/api/docs/guides/prompt-caching), [Anthropic](https://platform.claude.com/docs/en/build-with-claude/prompt-caching), [Gemini](https://ai.google.dev/gemini-api/docs/caching) | Checked 2026-09-28 |
| Modular and selectively repaired reuse | [Prompt Cache](https://arxiv.org/abs/2311.04934), [CacheBlend](https://arxiv.org/abs/2405.16444) | 2023 / 2024 preprints; versions reviewed in research |
| Source audits, reproduction and measurements | [Research and runnable labs](README.md) | 2026-09-28 local / 2026-09-29 UTC |

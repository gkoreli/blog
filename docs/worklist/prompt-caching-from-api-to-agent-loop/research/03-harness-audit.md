# How four harnesses turn conversation changes into API requests

A harness does more than attach a cache key. It decides where instructions live, how tools enter the request, which messages keep their original form, and what the provider adapter can express. Pi gives a particularly clear example: the same instruction update becomes an appended message on a supported route and a rewritten opening prompt on another.

This chapter follows September 28, 2026 source snapshots and a local Pi reproduction. It establishes request-construction behavior; provider hits, latency and task correctness require separate measurements. These default-branch revisions can differ from an installed release. The OMP commit is September 29 in its +02:00 timestamp, but September 28 in Los Angeles.

## Repositories and dependencies

| Harness | Commit | Package / dependencies inspected | License |
|---|---|---|---|
| Pi | `cb7969d212836b8939001dce159fbd2ed6ad395f` | pi-ai 0.87.1; OpenAI JS 7.19.0; Anthropic SDK 0.124.0; Google GenAI 2.21.0 | MIT |
| Oh My Pi | `d1932a6ff85613dde1160b87a73ddcdc3beb01f6` | pi-ai 18.4.3; in-repository pi-wire and HTTP clients, rather than direct vendor SDK dependencies in pi-ai manifest | MIT |
| OpenCode | `7945de208964a49300d7f770d1a71d078db9a4c4` | opencode 1.18.33; AI SDK 6.0.168; Anthropic provider 3.0.111; OpenAI provider 3.0.88 | MIT |
| Gemini CLI | `fe6350238c1862dade66a9dea9080c6508475bec` | core 0.63.0-nightly.20260923.gf50ba8608; Google GenAI 1.30.0 | Apache-2.0 |

Pi's old `badlogic/pi-mono` URL redirects to `earendil-works/pi`. The pinned checkouts used here are in `/tmp/prompt-cache-harnesses-20260928/{pi,omp,opencode,gemini-cli}`; the reproduction commands below accept fresh external checkouts too.

## Pi: the same edit can become an append or a prefix rewrite

The agent loop records executable-tool changes as `toolsAdded` / `toolsRemoved` on system messages. Before inference it applies `transformContext`, then `convertToLlm`, normalizes the transcript and calls the selected stream adapter. A transform that edits an old message can change the prefix before the provider adapter even sees it. [agent-loop tool declarations and request pipeline](https://github.com/earendil-works/pi/blob/cb7969d212836b8939001dce159fbd2ed6ad395f/packages/agent/src/agent-loop.ts#L322-L404)

`resolveTranscript` preserves mid-conversation system messages when the adapter's model compatibility supports them. Otherwise `collapseSystemMessages` folds current system sections and tools into a new leading system message and removes later system messages. A section update can therefore preserve the original prefix on one supported path and rewrite that prefix on another. The setting changes the model input, not just its cache policy. [transcript collapse and capability dispatch](https://github.com/earendil-works/pi/blob/cb7969d212836b8939001dce159fbd2ed6ad395f/packages/ai/src/utils/transcript.ts#L70-L119)

For example, the [local fixture](../lab/pi-transcript.mjs) starts with an output-language section and then updates it:

```text
Original:        system: explain in English → user: explain this function

Native support:  system: explain in English → user request → system: use Spanish
Fallback:        system: explain in Spanish → user request
```

The fixture executes Pi's own functions and observes both results. Pi can replay both into the same *current system text*, but a model still receives different histories. Appending a change applies it prospectively; replacing the opening instruction removes the earlier wording from this request. [Returned transcripts](../lab/pi-transcript-results.json).

For Anthropic the native tool-change path requires both compatibility flags, a nonempty initial tool set, and no tool redefinition. The initial tool set remains at the head; later tools become deferred top-level definitions; control messages reference their names. Redefining a tool name falls back to sending the current tool set. The implementation also moves system updates to legal message boundaries so they do not split tool-use/tool-result pairs. The adapter preserves the protocol's message structure while choosing how to represent the update. [Anthropic request construction and tool fallback](https://github.com/earendil-works/pi/blob/cb7969d212836b8939001dce159fbd2ed6ad395f/packages/ai/src/api/anthropic-messages.ts#L1042-L1158) [legal control placement and tool references](https://github.com/earendil-works/pi/blob/cb7969d212836b8939001dce159fbd2ed6ad395f/packages/ai/src/api/anthropic-messages.ts#L1244-L1280)

Anthropic cache retention defaults to `short`; `long` becomes a one-hour time to live (TTL) only when compatibility permits. Cache markers are added to system blocks, the last tool definition, and eligible final user/system content. Cache-read and cache-creation fields are separately captured, including one-hour creation tokens. [Anthropic retention](https://github.com/earendil-works/pi/blob/cb7969d212836b8939001dce159fbd2ed6ad395f/packages/ai/src/api/anthropic-messages.ts#L56-L84) [conversation breakpoint](https://github.com/earendil-works/pi/blob/cb7969d212836b8939001dce159fbd2ed6ad395f/packages/ai/src/api/anthropic-messages.ts#L1407-L1434) [Anthropic usage](https://github.com/earendil-works/pi/blob/cb7969d212836b8939001dce159fbd2ed6ad395f/packages/ai/src/api/anthropic-messages.ts#L610-L625)

The OpenAI Responses adapter knows GPT-5.6-style `prompt_cache_options`: `none` chooses explicit mode with no cache anchors, `long` requests 30m on compatible models, and older-model long retention uses 24h. It parses `cache_write_tokens` separately. But an exact search of `packages/ai/src` found no `prompt_cache_breakpoint` implementation, and `OpenAIResponsesOptions` has no named per-block cache-anchor control. The named options support the retention policy, but do not expose OMP's explicit block-selection control. Request hooks or extensions may still customize the body. [OpenAI retention policy and options](https://github.com/earendil-works/pi/blob/cb7969d212836b8939001dce159fbd2ed6ad395f/packages/ai/src/api/openai-responses.ts#L83-L111) [OpenAI cache-write accounting](https://github.com/earendil-works/pi/blob/cb7969d212836b8939001dce159fbd2ed6ad395f/packages/ai/src/api/openai-responses-shared.ts#L560-L577)

## Oh My Pi: choose a boundary and keep tool history stable

OMP exposes `promptCache` options for OpenAI Responses. `applyOpenAIResponsesPromptCachePolicy` gates support on `supportsPromptCacheBreakpoints`, errors on explicit mode for incompatible endpoints, writes `prompt_cache_options`, and marks a suitable stable block before the latest input message. The surrounding stateful-baseline logic preserves existing breakpoints while comparing request history. The caller can choose explicit caching instead of relying only on an automatic endpoint policy. [explicit breakpoint policy and baseline handling](https://github.com/can1357/oh-my-pi/blob/d1932a6ff85613dde1160b87a73ddcdc3beb01f6/packages/ai/src/providers/openai-responses.ts#L1018-L1173)

For Anthropic, `planAnthropicToolControls` records declared/active/deferred tools with the assistant response's message index. It replays an old tool-control record only if it still occupies the original message position. When compaction has moved or removed that history, the adapter reconstructs the active set from the surviving records. New tools are deferred top-level definitions, and `anthropicToolChangeBlocks` emits name references. Missing definitions on resume are an explicit accepted cache-miss case in code. [tool control history](https://github.com/can1357/oh-my-pi/blob/d1932a6ff85613dde1160b87a73ddcdc3beb01f6/packages/ai/src/providers/anthropic.ts#L4270-L4335) [tool-reference wire blocks](https://github.com/can1357/oh-my-pi/blob/d1932a6ff85613dde1160b87a73ddcdc3beb01f6/packages/ai/src/providers/anthropic.ts#L4430-L4445)

`applyHeadCaching` anchors the last nondeferred tool and stable system boundary; `applyPromptCaching` spends the remaining Anthropic breakpoint budget across selected history positions. The implementation deliberately skips volatile or control-only tail messages. A temporary message that changes on the next request is a poor final anchor: the prefix ending there would not repeat. [stable head cache anchors](https://github.com/can1357/oh-my-pi/blob/d1932a6ff85613dde1160b87a73ddcdc3beb01f6/packages/ai/src/providers/anthropic.ts#L4050-L4130) [tail breakpoint selection](https://github.com/can1357/oh-my-pi/blob/d1932a6ff85613dde1160b87a73ddcdc3beb01f6/packages/ai/src/providers/anthropic.ts#L3903-L4005)

Model Context Protocol (MCP) servers can finish connecting in different orders. Without sorting, the same tools could appear as `[read, search]` on one request and `[search, read]` on another. `sortMCPToolsByName` sorts tool names after mutations, making their order independent of connection timing. [MCP ordering](https://github.com/can1357/oh-my-pi/blob/d1932a6ff85613dde1160b87a73ddcdc3beb01f6/packages/coding-agent/src/mcp/manager.ts#L175-L188)

A cache warmer replays a request before its entry is expected to expire. OMP schedules this only for models with catalogued TTLs, uses an expected-savings floor, and stops on context changes, misses or time limits. Its estimate includes a fixed probability that an idle session will resume. Whether that assumption fits a workload affects the result: a refresh is itself an inference request, so it belongs in total spend. [cache warming policy](https://github.com/can1357/oh-my-pi/blob/d1932a6ff85613dde1160b87a73ddcdc3beb01f6/packages/coding-agent/src/session/cache-warmer.ts#L1-L100)

Both Pi and OMP use deferred top-level definitions and name references in these Anthropic tool-addition paths. The provider's newer inline-definition path is worth comparing for tools discovered later or schemas that change. Deferred tools have their own rendering rules, so their presence at the top level does not by itself establish a cache miss. See the [provider contract](02-provider-contracts.md) before treating the alternative as an improvement.

## OpenCode: the request passes through another adapter

The normal AI SDK runtime calls `streamText` with prepared system/messages/tools, provider options, and middleware that applies `ProviderTransform.message` to the SDK prompt. OpenCode also has a native runtime path, so a finding about the AI SDK route needs that qualification. [AI SDK runtime and prompt middleware](https://github.com/anomalyco/opencode/blob/7945de208964a49300d7f770d1a71d078db9a4c4/packages/opencode/src/session/llm.ts#L275-L345)

Request preparation combines provider/agent instructions, supplied system text and user system text into a leading system string. Plugins can transform it. For OpenAI OAuth, that text goes into `options.instructions` instead of a leading message. This is why inspecting UI messages or session files alone is insufficient to explain cache misses. [request preparation](https://github.com/anomalyco/opencode/blob/7945de208964a49300d7f770d1a71d078db9a4c4/packages/opencode/src/session/llm/request.ts#L56-L114)

For Anthropic-family paths, `applyCaching` decorates up to the first two system messages and last two nonsystem messages. It uses provider-specific option namespaces and chooses message-level versus content-level placement based on adapter. When a relevant Anthropic adapter already receives `options.cacheControl`, OpenCode skips this manual pass and lets the automatic-caching setting govern. [cache marker policy](https://github.com/anomalyco/opencode/blob/7945de208964a49300d7f770d1a71d078db9a4c4/packages/opencode/src/provider/transform.ts#L358-L407) [automatic-caching guard](https://github.com/anomalyco/opencode/blob/7945de208964a49300d7f770d1a71d078db9a4c4/packages/opencode/src/provider/transform.ts#L465-L484)

OpenAI and several other providers receive a session-based `promptCacheKey` unless `setCacheKey` disables it; gateway paths get automatic caching options. That key is a provider input, not proof that changed content reuses old inference state. Usage normalization receives AI SDK cache-read/write details, with provider metadata fallbacks for writes. [provider cache keys](https://github.com/anomalyco/opencode/blob/7945de208964a49300d7f770d1a71d078db9a4c4/packages/opencode/src/provider/transform.ts#L1323-L1342) [cache accounting](https://github.com/anomalyco/opencode/blob/7945de208964a49300d7f770d1a71d078db9a4c4/packages/opencode/src/session/session.ts#L339-L376)

A search of the harness alone is insufficient to establish all SDK capabilities. Exact searches of `packages/opencode/src` and its provider tests found no `prompt_cache_options`, `prompt_cache_breakpoint`, `tool_addition`, `tool_removal`, or `mid-conversation-system` strings. Searching all `packages/**/*.ts` found newer `cache_write_tokens` accounting in the console gateway but no named implementation of those other wire features. Those searches leave an unresolved question: will the pinned SDK forward the feature through generic options, or does this route lack it? A captured outbound request can answer that. The [separate SDK experiment](04-openai-sdk-codex.md) executes a newer major version; its result cannot be assigned to this OpenCode revision.

## Gemini CLI: keep retry guidance at the end

GeminiChat assembles request config with `systemInstruction` and `tools`, then sends model/contents/config through the content generator. On the API-key/Vertex path, `createContentGenerator` wraps `GoogleGenAI.models` in mapping and logging layers. Google-login Code Assist follows a different service path. [generation call](https://github.com/google-gemini/gemini-cli/blob/fe6350238c1862dade66a9dea9080c6508475bec/packages/core/src/core/geminiChat.ts#L1070-L1091) [Google GenAI wrapper](https://github.com/google-gemini/gemini-cli/blob/fe6350238c1862dade66a9dea9080c6508475bec/packages/core/src/core/contentGenerator.ts#L385-L412)

After selected stream failures, Gemini CLI appends retry guidance to the conversation instead of editing the system instruction. The unchanged prefix remains ahead of the new instruction. This still changes what the model is asked to do; preserving the prefix does not establish that the retry guidance fixes the failure. [config and retry nudges](https://github.com/google-gemini/gemini-cli/blob/fe6350238c1862dade66a9dea9080c6508475bec/packages/core/src/core/geminiChat.ts#L952-L975)

The registry sorts tool categories and MCP servers; server-specific retrieval additionally sorts tool names. Other extension paths still need checking before assuming every tool array has one canonical order. [tool sort policy](https://github.com/google-gemini/gemini-cli/blob/fe6350238c1862dade66a9dea9080c6508475bec/packages/core/src/tools/tool-registry.ts#L305-L350)

Cache telemetry records `cachedContentTokenCount`. An exact non-test search of core source found `cachedContent` forwarding/conversion and usage accounting, but no `caches.create` or `caches.update` call. This generation path does not show a manager creating and refreshing explicit named cache resources. It can still receive implicit cache hits. Google-login Code Assist is also a different service from the API-key route, even when both surface Gemini models. [cachedContent forwarding](https://github.com/google-gemini/gemini-cli/blob/fe6350238c1862dade66a9dea9080c6508475bec/packages/core/src/code_assist/converter.ts#L158-L175) [cache telemetry](https://github.com/google-gemini/gemini-cli/blob/fe6350238c1862dade66a9dea9080c6508475bec/packages/core/src/services/chatRecordingService.ts#L748-L760)

## Follow the operation, not the cache switch

These implementations already do substantial caching work. Their important differences appear when an instruction, tool set or conversation changes. For a new harness, make those operations visible: append an authoritative update, rewrite a historical message, or fall back because a route lacks the requested operation.

Useful next comparisons are a same-name tool redefinition, an MCP reconnect with different completion order, a resumed session with a missing tool, and a context compaction. Capture the resulting request and locate its first changed prefix position. Then compare provider usage and task outcome separately. The [context-management chapter](07-context-management.md) follows pruning and compaction in more detail, including two runnable source examples.

## Dependency manifests

- [pi manifest](https://github.com/earendil-works/pi/blob/cb7969d212836b8939001dce159fbd2ed6ad395f/packages/ai/package.json#L1)
- [omp manifest](https://github.com/can1357/oh-my-pi/blob/d1932a6ff85613dde1160b87a73ddcdc3beb01f6/packages/ai/package.json#L1)
- [opencode manifest](https://github.com/anomalyco/opencode/blob/7945de208964a49300d7f770d1a71d078db9a4c4/packages/opencode/package.json#L1)
- [opencode manifest](https://github.com/anomalyco/opencode/blob/7945de208964a49300d7f770d1a71d078db9a4c4/package.json#L1)
- [gemini manifest](https://github.com/google-gemini/gemini-cli/blob/fe6350238c1862dade66a9dea9080c6508475bec/packages/core/package.json#L1)


## Reproduce the source audit

These commands inspect source only and do not send inference requests. Run from the external checkout directory. The report's SHAs are the snapshot pins; `git clone --depth 1` alone is not a reproducible pin when HEAD advances.

```sh
git clone https://github.com/earendil-works/pi.git pi
git -C pi checkout cb7969d212836b8939001dce159fbd2ed6ad395f
git clone https://github.com/can1357/oh-my-pi.git omp
git -C omp checkout d1932a6ff85613dde1160b87a73ddcdc3beb01f6
git clone https://github.com/anomalyco/opencode.git opencode
git -C opencode checkout 7945de208964a49300d7f770d1a71d078db9a4c4
git clone https://github.com/google-gemini/gemini-cli.git gemini-cli
git -C gemini-cli checkout fe6350238c1862dade66a9dea9080c6508475bec
rg -n 'resolveTranscript|collapseSystemMessages' pi/packages/ai/src/utils/transcript.ts
rg -n 'prompt_cache_options|prompt_cache_breakpoint' pi/packages/ai/src omp/packages/ai/src/providers/openai-responses.ts
rg -n 'tool_addition|tool_removal' pi/packages/ai/src/api/anthropic-messages.ts omp/packages/ai/src/providers/anthropic.ts
rg -n 'prompt_cache_options|prompt_cache_breakpoint|tool_addition|tool_removal|mid-conversation-system' opencode/packages --glob '*.ts'
rg -n 'cachedContent|caches\.create|caches\.update' gemini-cli/packages/core/src --glob '!*.test.ts'
```

Empty search results establish only bounded textual absence, not absence of behavior. A generated SDK, indirect option forwarding, remote service, differently named field or alternate runtime can change that conclusion.

## Run the Pi instruction-update example

The Pi example runs the pinned upstream functions directly with Node v24.14.1 native TypeScript stripping. See [the executable fixture](../lab/pi-transcript.mjs), [recorded output](../lab/pi-transcript-results.json), and [reproduction instructions](../lab/README.md). All assertions passed: native support preserves the original head and later update; an unsupported or unspecified capability collapses the update into the head. This runs without an inference request.

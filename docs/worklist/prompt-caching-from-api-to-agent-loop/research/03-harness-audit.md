# Four harnesses: source audit, 2026-09-28

Scope: read-only static source inspection of shallow clones, followed by one synthetic fixture executing pinned upstream Pi transcript functions. No packages installed, no upstream test suite executed, no inference requests made, no production cache hit or latency claim. These are default-branch snapshots, not claims about every released client. The OMP commit is dated September 29 in +02:00 but September 28 in Los Angeles. Source comments identify intended behavior; they do not establish provider behavior.

## Repositories and dependencies

| Harness | Commit | Package / dependencies inspected | License |
|---|---|---|---|
| Pi | `cb7969d212836b8939001dce159fbd2ed6ad395f` | pi-ai 0.87.1; OpenAI JS 7.19.0; Anthropic SDK 0.124.0; Google GenAI 2.21.0 | MIT |
| Oh My Pi | `d1932a6ff85613dde1160b87a73ddcdc3beb01f6` | pi-ai 18.4.3; in-repository pi-wire and HTTP clients, rather than direct vendor SDK dependencies in pi-ai manifest | MIT |
| OpenCode | `7945de208964a49300d7f770d1a71d078db9a4c4` | opencode 1.18.33; AI SDK 6.0.168; Anthropic provider 3.0.111; OpenAI provider 3.0.88 | MIT |
| Gemini CLI | `fe6350238c1862dade66a9dea9080c6508475bec` | core 0.63.0-nightly.20260923.gf50ba8608; Google GenAI 1.30.0 | Apache-2.0 |

Pi's old `badlogic/pi-mono` GitHub URL was opened and verified to redirect to `earendil-works/pi`. Local clones live in `/tmp/prompt-cache-harnesses-20260928/{pi,omp,opencode,gemini-cli}`. Do not vendor these source trees into the article repository.

## Pi: the same edit can become an append or a prefix rewrite

**Code inspected.** The agent loop records executable-tool changes as `toolsAdded` / `toolsRemoved` on system messages. Before inference it applies `transformContext`, then `convertToLlm`, normalizes the transcript and calls the selected stream adapter. This makes the transcript, transformation callback and provider capability flags all relevant to cache stability. [agent-loop tool declarations and request pipeline](https://github.com/earendil-works/pi/blob/cb7969d212836b8939001dce159fbd2ed6ad395f/packages/agent/src/agent-loop.ts#L322-L404)

`resolveTranscript` preserves mid-conversation system messages when the adapter's model compatibility supports them. Otherwise `collapseSystemMessages` folds current system sections and tools into a new leading system message and removes later system messages. A section update can therefore preserve the original prefix on one supported path and rewrite that prefix on another. This is directly relevant to the user's question: evolving instructions need not mean editing history, but changing the representation changes the request semantics and must be tested. [transcript collapse and capability dispatch](https://github.com/earendil-works/pi/blob/cb7969d212836b8939001dce159fbd2ed6ad395f/packages/ai/src/utils/transcript.ts#L70-L119)

For Anthropic the native tool-change path requires both compatibility flags, a nonempty initial tool set, and no tool redefinition. The initial tool set remains at the head; later tools become deferred top-level definitions; control messages reference their names. Redefining a tool name falls back to sending the current tool set. The implementation also moves system updates to legal message boundaries so they do not split tool-use/tool-result pairs. This is careful protocol adaptation, not arbitrary KV hot swapping. [Anthropic request construction and tool fallback](https://github.com/earendil-works/pi/blob/cb7969d212836b8939001dce159fbd2ed6ad395f/packages/ai/src/api/anthropic-messages.ts#L1042-L1158) [legal control placement and tool references](https://github.com/earendil-works/pi/blob/cb7969d212836b8939001dce159fbd2ed6ad395f/packages/ai/src/api/anthropic-messages.ts#L1244-L1280)

Anthropic cache retention defaults to `short`; `long` becomes a one-hour TTL only when compatibility permits. Cache markers are added to system blocks, the last tool definition, and eligible final user/system content. Cache-read and cache-creation fields are separately captured, including one-hour creation tokens. [Anthropic retention](https://github.com/earendil-works/pi/blob/cb7969d212836b8939001dce159fbd2ed6ad395f/packages/ai/src/api/anthropic-messages.ts#L56-L84) [conversation breakpoint](https://github.com/earendil-works/pi/blob/cb7969d212836b8939001dce159fbd2ed6ad395f/packages/ai/src/api/anthropic-messages.ts#L1407-L1434) [Anthropic usage](https://github.com/earendil-works/pi/blob/cb7969d212836b8939001dce159fbd2ed6ad395f/packages/ai/src/api/anthropic-messages.ts#L610-L625)

**Concrete capability gap, not a proven bug.** The OpenAI Responses adapter knows GPT-5.6-style `prompt_cache_options`: `none` chooses explicit mode with no cache anchors, `long` requests 30m on compatible models, and older-model long retention uses 24h. It parses `cache_write_tokens` separately. But an exact search of `packages/ai/src` found no `prompt_cache_breakpoint` implementation, and `OpenAIResponsesOptions` has no named per-block cache-anchor control. So it understands the newer policy API without exposing OMP's explicit stable-prefix anchor abstraction through this inspected path. Generic request hooks or extensions could still add functionality; this is not a claim that users cannot customize it. [OpenAI retention policy and options](https://github.com/earendil-works/pi/blob/cb7969d212836b8939001dce159fbd2ed6ad395f/packages/ai/src/api/openai-responses.ts#L83-L111) [OpenAI cache-write accounting](https://github.com/earendil-works/pi/blob/cb7969d212836b8939001dce159fbd2ed6ad395f/packages/ai/src/api/openai-responses-shared.ts#L560-L577)

**Test next.** Capture wire payloads for a system-section update, a newly added tool, a removed tool, and same-name schema redefinition with native compatibility on/off. Compare immutable prefix bytes and legal control placement. Separately test long/none/short retention on older/newer model compat. Do not infer a paid cache hit from payload equality alone.

## Oh My Pi: explicit anchors, stable tool control history and warmers

**Code inspected.** OMP exposes `promptCache` options for OpenAI Responses. `applyOpenAIResponsesPromptCachePolicy` gates support on `supportsPromptCacheBreakpoints`, errors on explicit mode for incompatible endpoints, writes `prompt_cache_options`, and marks a suitable stable block before the latest input message. The surrounding stateful-baseline logic preserves existing breakpoints while comparing request history. This is an actual SDK/harness affordance beyond a generic retention switch. [explicit breakpoint policy and baseline handling](https://github.com/can1357/oh-my-pi/blob/d1932a6ff85613dde1160b87a73ddcdc3beb01f6/packages/ai/src/providers/openai-responses.ts#L1018-L1173)

For Anthropic, `planAnthropicToolControls` records declared/active/deferred tools with the assistant response's message index. It reconstructs old controls only where the history record is still at its live index; compacted or rewritten history follows a different path. New tools are deferred top-level definitions, and `anthropicToolChangeBlocks` emits name references. Missing definitions on resume are an explicit accepted cache-miss case in code. [tool control history](https://github.com/can1357/oh-my-pi/blob/d1932a6ff85613dde1160b87a73ddcdc3beb01f6/packages/ai/src/providers/anthropic.ts#L4270-L4335) [tool-reference wire blocks](https://github.com/can1357/oh-my-pi/blob/d1932a6ff85613dde1160b87a73ddcdc3beb01f6/packages/ai/src/providers/anthropic.ts#L4430-L4445)

`applyHeadCaching` anchors the last nondeferred tool and stable system boundary; `applyPromptCaching` spends the remaining Anthropic breakpoint budget across selected history positions. The implementation deliberately skips volatile or control-only tail messages. This is more involved than simply tagging the last message. Treat the comments about expected provider hits as the authors' intent, not measured evidence for this audit. [stable head cache anchors](https://github.com/can1357/oh-my-pi/blob/d1932a6ff85613dde1160b87a73ddcdc3beb01f6/packages/ai/src/providers/anthropic.ts#L4050-L4130) [tail breakpoint selection](https://github.com/can1357/oh-my-pi/blob/d1932a6ff85613dde1160b87a73ddcdc3beb01f6/packages/ai/src/providers/anthropic.ts#L3903-L4005)

MCP discovery order is deliberately normalized: `sortMCPToolsByName` sorts names using a total order, and the manager calls it after mutations. This addresses an avoidable cache-loss mechanism: async server connection order changing the same tool array. [MCP ordering](https://github.com/can1357/oh-my-pi/blob/d1932a6ff85613dde1160b87a73ddcdc3beb01f6/packages/coding-agent/src/mcp/manager.ts#L175-L188)

The cache warmer models retention separately from prompt layout. It schedules near expiry only for models with catalogued TTLs, uses an expected-savings floor, and stops on context changes/misses/time limits. The fixed idle-continuation probability in source is an upstream assumption, not a measured result from our task. A refresh itself is an inference request; evaluate total spend including warmers, not just cache-hit ratio. [cache warming policy](https://github.com/can1357/oh-my-pi/blob/d1932a6ff85613dde1160b87a73ddcdc3beb01f6/packages/coding-agent/src/session/cache-warmer.ts#L1-L100)

**Bounded opportunities.** Both OMP and Pi's inspected Anthropic tool-addition paths use deferred declarations plus name references rather than newly documented inline tool definitions. Determine whether inline definitions improve schema-update/ergonomic cases under the current provider contract. Do not claim deferred tools inherently bust the prefix: the protocol intentionally treats them differently. OMP's warmer is a candidate for workload-specific tuning, not proof that warming saves everyone money.

**Test next.** Replay the same MCP tools discovered in different orders; compare request JSON. Exercise explicit OpenAI policy with no eligible stable block, stateful baseline preservation, disable caching and unsupported model flags. Test Anthropic resume after a formerly declared tool disappears, and compaction that shifts recorded control indexes. Use provider usage only in a separately authorized live experiment.

## OpenCode: AI SDK policy layer, with a bounded adoption question

**Code inspected.** The normal AI SDK runtime calls `streamText` with prepared system/messages/tools, provider options, and middleware that applies `ProviderTransform.message` to the SDK prompt. There is also a native runtime path; this audit does not claim identical behavior across both transports. [AI SDK runtime and prompt middleware](https://github.com/anomalyco/opencode/blob/7945de208964a49300d7f770d1a71d078db9a4c4/packages/opencode/src/session/llm.ts#L275-L345)

Request preparation combines provider/agent instructions, supplied system text and user system text into a leading system string. Plugins can transform it. For OpenAI OAuth, that text goes into `options.instructions` instead of a leading message. This is why inspecting UI messages or session files alone is insufficient to explain cache misses. [request preparation](https://github.com/anomalyco/opencode/blob/7945de208964a49300d7f770d1a71d078db9a4c4/packages/opencode/src/session/llm/request.ts#L56-L114)

For Anthropic-family paths, `applyCaching` decorates up to the first two system messages and last two nonsystem messages. It uses provider-specific option namespaces and chooses message-level versus content-level placement based on adapter. Crucially, this manual pass is skipped when a relevant Anthropic adapter already receives `options.cacheControl`; automatic and manual caching are distinct paths. [cache marker policy](https://github.com/anomalyco/opencode/blob/7945de208964a49300d7f770d1a71d078db9a4c4/packages/opencode/src/provider/transform.ts#L358-L407) [automatic-caching guard](https://github.com/anomalyco/opencode/blob/7945de208964a49300d7f770d1a71d078db9a4c4/packages/opencode/src/provider/transform.ts#L465-L484)

OpenAI and several other providers receive a session-based `promptCacheKey` unless `setCacheKey` disables it; gateway paths get automatic caching options. That key is a provider input, not proof that changed content reuses old inference state. Usage normalization receives AI SDK cache-read/write details, with provider metadata fallbacks for writes. [provider cache keys](https://github.com/anomalyco/opencode/blob/7945de208964a49300d7f770d1a71d078db9a4c4/packages/opencode/src/provider/transform.ts#L1323-L1342) [cache accounting](https://github.com/anomalyco/opencode/blob/7945de208964a49300d7f770d1a71d078db9a4c4/packages/opencode/src/session/session.ts#L339-L376)

**Bounded absence.** Exact searches of `packages/opencode/src` and its provider tests found no `prompt_cache_options`, `prompt_cache_breakpoint`, `tool_addition`, `tool_removal`, or `mid-conversation-system` strings. Searching all `packages/**/*.ts` found newer `cache_write_tokens` accounting in the console gateway but no named implementation of those other wire features. This is a research lead about the inspected runtime layer. It does not establish that dependencies, generic provider-options forwarding, remote gateways or other transports cannot support them. The pinned AI SDK adapter must be traced to a captured wire request before calling this a defect.

**Test next.** Capture OpenCode's provider request with default caching, model `cacheControl`, custom provider options and plugin-modified system text. Verify whether the pinned AI SDK forwards newer OpenAI policy options or ignores them. A no-op plugin transformation should produce a byte-identical stable prefix; a meaningful change should remain visible to the model.

## Gemini CLI: suffix nudges and implicit caching, without a named-cache manager in inspected core

**Code inspected.** GeminiChat assembles request config with `systemInstruction` and `tools`, then sends model/contents/config through the content generator. On the API-key/Vertex path, `createContentGenerator` wraps `GoogleGenAI.models` in mapping and logging layers. Google-login Code Assist follows a different service path. [generation call](https://github.com/google-gemini/gemini-cli/blob/fe6350238c1862dade66a9dea9080c6508475bec/packages/core/src/core/geminiChat.ts#L1070-L1091) [Google GenAI wrapper](https://github.com/google-gemini/gemini-cli/blob/fe6350238c1862dade66a9dea9080c6508475bec/packages/core/src/core/contentGenerator.ts#L385-L412)

A concrete cache-conscious choice is retry nudging: when a stream fails in selected ways, a nudge is appended to conversation contents rather than rewriting the system instruction. The code comment explicitly connects this with prefix preservation. It changes the current model input, so correctness still requires evaluating the retry instruction; it does not pretend the failed response never happened. [config and retry nudges](https://github.com/google-gemini/gemini-cli/blob/fe6350238c1862dade66a9dea9080c6508475bec/packages/core/src/core/geminiChat.ts#L952-L975)

The registry sorts tool categories and MCP servers; server-specific retrieval additionally sorts tool names. That is not automatically proof of a single canonical global schema order under every extension path. [tool sort policy](https://github.com/google-gemini/gemini-cli/blob/fe6350238c1862dade66a9dea9080c6508475bec/packages/core/src/tools/tool-registry.ts#L305-L350)

Cache telemetry records `cachedContentTokenCount`. An exact non-test search of core source found `cachedContent` forwarding/conversion and usage accounting, but no `caches.create` or `caches.update` call. The inspected normal generation path therefore does not itself demonstrate an explicit named-cache resource lifecycle. Implicit service caching may still happen, and Code Assist behavior cannot be inferred solely from the public Gemini API. [cachedContent forwarding](https://github.com/google-gemini/gemini-cli/blob/fe6350238c1862dade66a9dea9080c6508475bec/packages/core/src/code_assist/converter.ts#L158-L175) [cache telemetry](https://github.com/google-gemini/gemini-cli/blob/fe6350238c1862dade66a9dea9080c6508475bec/packages/core/src/services/chatRecordingService.ts#L748-L760)

**Test next.** Compare wire requests across retry nudges, MCP reconnects, system-instruction changes and model fallback. Check generation config plus backend route, not just the chat messages. If adding explicit caching, measure storage charges, expiry, system/tools ownership and auth-path compatibility before calling it an improvement.

## What this changes in the article

The evidence does not support a blanket claim that modern harnesses ignore prompt caching. Pi and OMP already contain advanced protocol-specific work. The more useful question is: which operation does this exact model/adapter/runtime version represent as an append, which operation becomes a head rewrite, and where is that distinction visible to the harness author?

A promising fixture suite uses the same logical operation across paths: append tool result; append instruction update; edit original system prompt; add/remove/redefine tool; compact history; change effort; switch model; resume with missing tools. Save sanitized wire structures, exact provider/model/SDK versions, first differing prefix position, and explicit policy fields. Separately record observed hit/read/write tokens and latency if live testing is later performed. Byte equality is an eligibility check, not a server-hit measurement or a correctness proof.

## Manifest provenance

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

## Local reproduction added

The Pi transcript-dispatch claim was reproduced by executing the actual pinned upstream pure functions with Node v24.14.1 native TypeScript stripping. See [the executable fixture](../lab/pi-transcript.mjs), [recorded output](../lab/pi-transcript-results.json), and [reproduction instructions](../lab/README.md). All assertions passed: supported dispatch preserves the original head and later update; unsupported or unspecified capability collapses the update into the head. The fixture measures no provider cache, tokens, latency or model correctness.

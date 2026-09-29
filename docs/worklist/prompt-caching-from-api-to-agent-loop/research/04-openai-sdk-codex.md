# OpenAI, SDK translation, and Codex

Checked 2026-09-28 Los Angeles / 2026-09-29 UTC. OpenAI findings are documentation and source inspection; no OpenAI inference requests were made. The SDK fixture uses a mocked fetch and synthetic credentials. The local test below captures outgoing JSON; it does not ask OpenAI to run the model.

## OpenAI's current contract is model-dependent

The [official caching guide](https://developers.openai.com/api/docs/guides/prompt-caching) distinguishes GPT-5.6 and later from earlier models. The newer contract exposes message/block boundaries through `prompt_cache_options` and `prompt_cache_breakpoint`; the old contract used implicit intervals and `prompt_cache_retention`. Do not infer one model's contract from an older tutorial or a field's familiar name.

For the newer family, the guide documents a 1,024-visible-token minimum, implicit or explicit-only modes, a `30m` minimum lifetime refreshed on reuse, and a maximum four writes per request. Explicit-only mode with no markers creates no cache writes. Initial developer content needs its own selected boundary if changing later content would otherwise leave only an unusable longer entry. Top-level `instructions` cannot carry a block marker; represent the relevant developer instruction as an input content block when that control is needed.

A matching prefix must still be in the server’s cache, and it must end somewhere the API will look for it. The guide's lookup window and message eligibility matter. Extending a single message can bury a formerly reusable endpoint inside that message. Preserving the old message or an explicit content-block boundary can keep it discoverable.

Current documented economics for this family are 1.25× ordinary input for writes and 0.1× for reads. These are alternative billing buckets, not fees to add to ordinary input. The response's `input_tokens` includes both. Calculate ordinary input as total minus reads minus writes. With a prefix of size P reused N times after one write, the prefix-only input charge is proportional to `P × (1.25 + 0.1 × N)`. This excludes new suffixes, output, misses, and any other service charges. Recheck the [pricing page](https://developers.openai.com/api/docs/pricing) for a selected model.

The same guide describes `prompt_cache_key` differently by generation: an affinity aid on older models, optional accounting separation on GPT-5.6 and later. A key does not validate changed context. The [diagnostics guide](https://developers.openai.com/api/docs/guides/prompt-caching/diagnostics) even distinguishes a key-related reported miss from a physical cache miss. Billing reuse and physical tensor reuse are not interchangeable observations.

## Change what happens next without editing earlier messages

The guide recommends stable tool definitions plus `tool_choice: "none"` or `allowed_tools` for callability changes. Tool search with deferred loading and developer-role `additional_tools` items adds tools later in context. On supported GPT-6 models, a `configuration_update` item changes reasoning effort while keeping the original request-level effort stable. These operations preserve earlier input; they do not rewrite earlier hidden state. [Official cache-preserving updates](https://developers.openai.com/api/docs/guides/prompt-caching#manage-tools-with-append-only-updates), [reasoning updates](https://developers.openai.com/api/docs/guides/reasoning#change-reasoning-mid-conversation).

Diagnostics use `prompt_cache_options.comparison_response_id`. This compares with an earlier response; it neither restores that response's context nor changes caching. Read diagnostics and actual usage separately. Supported reasons include tools, model, effort, verbosity, schema, key, service tier, compaction, and input changes. Inconclusive/expired comparisons remain unknown. [Diagnostic contract](https://developers.openai.com/api/docs/guides/prompt-caching/diagnostics).

## Follow an option through the SDK

The official OpenAI JavaScript SDK snapshot is `openai@7.23.0`, commit `b3c71cb023a8fdd15b90a00c9e37a6cf259a3d57`. Its Responses method posts the supplied body through the HTTP client. The typed request surface includes the diagnostics comparison field. The SDK sends requests and exposes typed fields. It does not store the model’s KV state locally or make earlier context editable. [Create method](https://github.com/openai/openai-node/blob/b3c71cb023a8fdd15b90a00c9e37a6cf259a3d57/src/resources/responses/responses.ts#L215), [request cache options](https://github.com/openai/openai-node/blob/b3c71cb023a8fdd15b90a00c9e37a6cf259a3d57/src/resources/responses/responses.ts#L11458).

Vercel AI SDK is an additional translation layer. Inspected repository commit: `546a6f8876b0de68452d71a3e49716bcdf7f40c9`. Independently installed and executed published packages: `@ai-sdk/openai@4.0.80` and `@ai-sdk/anthropic@4.0.68`. The source snapshot and npm execution are separately pinned; matching manifest versions are not proof the complete trees are byte-identical.

The [mocked-wire fixture](../lab/sdk-wire.mjs) demonstrated:

- A system message becomes an OpenAI developer message, including its explicit `prompt_cache_breakpoint`.
- `promptCacheOptions.mode` and `.ttl` become the corresponding request fields.
- A JavaScript `comparisonResponseId` property supplied inside that options object disappears. The inspected typed schema contains only `mode` and `ttl`; that property is **not a supported option** in this version. This is a capability gap to expose or bypass deliberately, not a bug in an advertised field.
- An Anthropic mid-conversation system message and a tool-removal reference survive translation; the adapter adds its required beta headers. The fixture tests serialization only and intentionally does not validate the synthetic removal against a live declared tool.

Here is one small part of that conversion. The caller uses JavaScript option names:

```json
{"openai": {"promptCacheOptions": {"mode": "explicit", "ttl": "30m"}}}
```

The captured HTTP body contains the provider's field names:

```json
{"prompt_cache_options": {"mode": "explicit", "ttl": "30m"}}
```

The apparent renaming is easy to overlook when searching a harness for a raw API field. A missing `prompt_cache_options` string in the harness does not prove the feature is missing: its adapter may create that field later. Conversely, a JavaScript property that the schema does not recognize can disappear before any HTTP request is made.

See [actual serialized output](../lab/sdk-results.json), [OpenAI option schema](https://github.com/vercel/ai/blob/546a6f8876b0de68452d71a3e49716bcdf7f40c9/packages/openai/src/responses/openai-responses-language-model-options.ts#L253), [OpenAI conversion](https://github.com/vercel/ai/blob/546a6f8876b0de68452d71a3e49716bcdf7f40c9/packages/openai/src/responses/convert-to-openai-responses-input.ts#L462), and [Anthropic system options](https://github.com/vercel/ai/blob/546a6f8876b0de68452d71a3e49716bcdf7f40c9/packages/anthropic/src/anthropic-language-model-options.ts#L76).

The SDK's [Responses usage conversion](https://github.com/vercel/ai/blob/546a6f8876b0de68452d71a3e49716bcdf7f40c9/packages/openai/src/responses/convert-openai-responses-usage.ts#L25) subtracts read and write buckets from total input and retains raw usage. This is an example of the accounting work a portable SDK must perform correctly. It does not establish that every consuming harness uses the same version. OpenCode's audited manifest uses an earlier major; see [its audit](03-harness-audit.md).

## Codex keeps the initial reasoning setting stable

Public CLI source inspected at `c248f6d48b97eb4a2aa56147a0b11b7d763278b9`; Apache-2.0. No Rust build or upstream tests ran. Do not extrapolate the public client to every hosted Codex product or account route.

The [request builder](https://github.com/openai/codex/blob/c248f6d48b97eb4a2aa56147a0b11b7d763278b9/codex-rs/core/src/client.rs#L902) has different layouts for Responses Lite and ordinary Responses. The latter sends base instructions and tools at the head; the former can encode initial tools as an `AdditionalTools` item. The [request type](https://github.com/openai/codex/blob/c248f6d48b97eb4a2aa56147a0b11b7d763278b9/codex-rs/codex-api/src/common.rs#L278) carries a cache key. [Key selection](https://github.com/openai/codex/blob/c248f6d48b97eb4a2aa56147a0b11b7d763278b9/codex-rs/core/src/client.rs#L575) uses an override, an internal-source/parent combination, or session identity depending on path.

The relevant implementation is [session/reasoning_effort.rs](https://github.com/openai/codex/blob/c248f6d48b97eb4a2aa56147a0b11b7d763278b9/codex-rs/core/src/session/reasoning_effort.rs#L1): it keeps the initial request-level reasoning effort unchanged within a context window. A later effort change becomes a trusted `ConfigurationUpdate` item in the conversation. That preserves the old request setting while telling the model what to do next. Successful compaction starts a new context and retires the old setting. Unsupported models retain conventional request-level behavior. The [capability check](https://github.com/openai/codex/blob/c248f6d48b97eb4a2aa56147a0b11b7d763278b9/codex-rs/core/src/client.rs#L552) requires both feature enablement and model support on the OpenAI route.

The [stream parser](https://github.com/openai/codex/blob/c248f6d48b97eb4a2aa56147a0b11b7d763278b9/codex-rs/codex-api/src/sse/responses.rs#L127) preserves cache-read and cache-write tokens separately. This is code evidence for support, not a recorded hit. In the inspected `ResponsesApiRequest` struct and builder, explicit cache-option/breakpoint controls were not exposed as ordinary named fields; that observation does not rule out provider defaults, other transports, or internal rendering.

The practical question for a new harness is therefore operation-specific: what authority does an update require, can this model represent it in history, does the adapter retain it, and do diagnostics/usage demonstrate reuse? A generic `cache: true` switch answers none of those questions.

Return to [the worklist](../README.md).

# Provider prompt caching research — 2026-09-28

Official sources accessed 2026-09-28. This report covers documentation, not paid API measurements; the subsequent [live experiment](05-live-anthropic-experiment.md) has its own evidence record. The report distinguishes published contracts from inference and proposed experiments. DeepSeek pages failed to open through browser tooling; their live official HTML was read with Python urllib.request. All other sources were inspected through web tooling.

The important discovery: some APIs now directly support changing instructions and tool availability prospectively while preserving the existing prefix. This does not mean retroactively replacing an earlier instruction and treating the remaining KV state as equivalent.

## Provider contract notes

| Surface | Controls and thresholds | Lifetime and economics | Important limit |
|---|---|---|---|
| Anthropic Messages | Opt in with top-level `cache_control` for an advancing breakpoint, or mark blocks explicitly; maximum four breakpoints. Minimum varies: Sonnet 4.6 1,024; Opus 4.6 and Haiku 4.5 4,096; several newer models 512. | 5m writes 1.25× input price; 1h writes 2×. Reads usually 0.1×, with newer model exceptions. TTL refreshes on use and starts at request start, so generation consumes TTL. | Prefix order is tools → system → messages. Writes occur at marked boundaries; lookback searches previously written entries, at most 20 positions per breakpoint. It does not manufacture an entry at every stable block. |
| Gemini Developer API, Interactions | Implicit caching only, automatically enabled for Gemini 2.5+. Stateful and stateless supported. | No hard implicit TTL guarantee on reviewed page. | `previous_interaction_id` is conversation state, not an explicit cache object. |
| Gemini Developer API, GenerateContent | Implicit plus explicit cache objects. Current docs label this surface Legacy; explicit caching is beta. | Explicit TTL defaults to one hour, configurable; storage costs depend on tokens × duration. | Cache object contains a prefix, not freely spliceable segments. |
| Google Cloud, formerly Vertex AI | Implicit default plus explicit named caches; separate platform contract. | Explicit cache creation charged standard input; storage separately; Gemini 2.5+ reads discounted 90%. Implicit storage free. | Thresholds differ from Developer API, including 6,144 implicit tokens for several newer models. |
| DeepSeek | Automatic disk caching, persisted prefix units, not a universal current 64-token rule. | Best effort; construction takes seconds; unused entries usually disappear within hours to days. | Common text can remain uncached until a corresponding complete prefix unit is persisted. |
| OpenRouter | Provider routing and translation above upstream caching. | Affinity has a separate ten-minute inactivity timer. | Routing affinity is not proof of KV reuse; fallback changes serving provider. |
| Bedrock | Explicit/implicit availability depends on model and API. Converse uses `cachePoint`; Claude InvokeModel uses `cache_control`. | Many Claude models support 5m/1h; per-model pricing. | Cross-region routing can increase writes; explicit eligibility does not guarantee a hit. |

Sources: [Anthropic caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching), [Gemini Interactions](https://ai.google.dev/gemini-api/docs/caching), [Gemini GenerateContent](https://ai.google.dev/gemini-api/docs/generate-content/caching), [Google Cloud](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/context-cache/context-cache-overview), [DeepSeek](https://api-docs.deepseek.com/guides/kv_cache/), [OpenRouter](https://openrouter.ai/docs/guides/best-practices/prompt-caching), [Bedrock](https://docs.aws.amazon.com/us_en/bedrock/latest/userguide/prompt-caching.html).

## Prospective changes with system authority

Supported Anthropic models accept `role: system` in `messages`. Later system messages take precedence for subsequent turns; this preserves preceding history rather than rewriting it. Text needs no beta header on supported models. Tool changes require beta support. Content-bearing system messages have placement restrictions and cannot separate a tool call from its result.

Turn-scoped messages (`clear_at: next_user_message`) require a separate beta header. Replay them verbatim after clearing; the earlier reusable boundary survives, but the intervening assistant turn is reprocessed.

Inline tool definitions use `inline-tools-2026-09-15`:

```json
{
  "role": "system",
  "content": [{
    "type": "tool_addition",
    "tool": {
      "type": "tool_definition",
      "definition": {
        "name": "lookup_record",
        "description": "Read a record by identifier.",
        "input_schema": {
          "type": "object",
          "properties": {"id": {"type": "string"}},
          "required": ["id"]
        }
      }
    }
  }]
}
```

Keep at least one non-deferred tool in the initial `tools`; otherwise the first inline definition costs a full prefix miss. A new same-name schema replaces the old one prospectively. Known tools belong upfront, optionally deferred; inline definitions handle unknown tools or later schema versions. [Mid-conversation systems and tools](https://platform.claude.com/docs/en/build-with-claude/mid-conversation-system-messages).

Interpretation: prospective change and retroactive replacement are different inputs. The former does not prove that all old representations equal a recomputation under the new policy. An application must still evaluate desired behavior and enforce tool authorization itself.

## Deferred tools and the remaining uncertainty

Deferred definitions are excluded from the initial system prefix. Discovery adds references in conversation history; strict-mode grammar construction is separate and uses the complete tool set. [Tool caching](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-use-with-prompt-caching).

The registry still goes in every request. References are expanded from the supplied definitions before inference. This suggests adding an undiscovered deferred registry entry can avoid changing the rendered prefix, but does not justify claiming that changing an already referenced schema preserves its historical expansion. The reviewed general tables also broadly say tool-definition edits invalidate caches. Treat those cases separately in experiments. Inline versioned definitions offer an explicit prospective contract without changing old definitions. [Tool search](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool).

## Diagnostics

Anthropic supports `diagnostics.previous_message_id`; the former beta header is no longer required. Opt in on the first request with a null previous ID, then carry response IDs forward. Diagnostics compare request fingerprints independently of actual hits. Reasons include model, tools, system, or history changes. Missing fingerprints and unavailable comparisons are inconclusive. `cache_missed_input_tokens` is a byte-derived estimate, not a billing counter. [Cache diagnostics](https://platform.claude.com/docs/en/build-with-claude/cache-diagnostics).

## Counter normalization and limits

- Anthropic total input = `input_tokens + cache_creation_input_tokens + cache_read_input_tokens`. Cached reads normally do not consume ITPM; Haiku 3.5 is a documented exception. Writes consume ITPM. [Rate limits](https://platform.claude.com/docs/en/api/rate-limits).
- All three buckets count toward Anthropic's context window. [Context windows](https://platform.claude.com/docs/en/build-with-claude/context-windows).
- Gemini GenerateContent `promptTokenCount` already includes `cachedContentTokenCount`; adding them double-counts. Python uses corresponding snake_case names. [Usage schema](https://ai.google.dev/api/generate-content#UsageMetadata).
- Gemini Interactions reports `usage.total_cached_tokens`, a different response surface. [Interactions caching](https://ai.google.dev/gemini-api/docs/caching).
- Bedrock Converse total = `inputTokens + cacheReadInputTokens + cacheWriteInputTokens`. Bedrock Responses has a different, OpenAI-shaped schema. [Bedrock caching](https://docs.aws.amazon.com/us_en/bedrock/latest/userguide/prompt-caching.html).

## Gemini's cache object is immutable context

`contents`, `tools`, `systemInstruction`, `toolConfig`, and `model` are immutable. A `cachedContents/{id}` resource is not authorization to reuse arbitrary text under substituted instructions. [CachedContent schema](https://ai.google.dev/api/caching).

GenerateContent permits expiry/TTL updates and deletion, not content edits. Cached content remains a prompt prefix and counts toward token limits. The OpenAI compatibility library can expose explicit caching through `extra_body.cached_content`. [GenerateContent caching](https://ai.google.dev/gemini-api/docs/generate-content/caching).

Google Cloud documents a one-minute minimum explicit lifetime with no maximum; Developer API docs state no minimum/maximum TTL bounds. Preserve the platform distinction. [Cloud limits](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/context-cache/context-cache-overview#limits).

## DeepSeek's three-request test

Current documentation ties changed persistence rules to sliding-window attention. Request `A+B` writes complete units at input/output boundaries. A subsequent `A+C` can miss because `A` alone was not yet a persisted unit; the service detects common `A`, persists it, and a third `A+D` can hit. Long inputs/outputs also receive units at unspecified fixed intervals. Matching text length therefore need not equal cache-hit length. Usage exposes `prompt_cache_hit_tokens` and `prompt_cache_miss_tokens`. [Current guide](https://api-docs.deepseek.com/guides/kv_cache/).

The 2024 announcement's 64-token rule is historical evidence, not a reliable description of the current serving contract. [2024 announcement](https://api-docs.deepseek.com/news/news0802/).

Dated pricing example: current DeepSeek-V4.1-Flash via `deepseek-flash` lists peak input $0.30/MTok miss versus $0.006 hit, a 50× input-price difference; off-peak halves both. This alone establishes neither total task cost nor quality. [Pricing](https://api-docs.deepseek.com/quick_start/pricing/).

## OpenRouter affinity and translation

Body `session_id` or `x-session-id` provides affinity; body wins, maximum 256 characters. Absent both, `prompt_cache_key` can provide affinity, otherwise opening messages determine identity. Explicit session IDs activate stickiness after a successful request before an observed hit. Manual `provider.order` overrides stickiness; provider failure can cause fallback. Usage reports `prompt_tokens_details.cached_tokens` and `cache_write_tokens`.

For Gemini, OpenRouter manages explicit cache objects using the final block breakpoint. Dynamic trailing text inside the initial system message is not independently uncached because the normalized system instruction is immutable. Its reviewed tables disagree with direct-provider documentation on some Gemini thresholds and discounts; do not silently merge the contracts. [OpenRouter caching](https://openrouter.ai/docs/guides/best-practices/prompt-caching).

## Claude Code evidence boundary

The public repository is not the full production request-builder implementation. [Repository](https://github.com/anthropics/claude-code).

Current official documentation describes stable system/project prefixes and appended history; skills and permission changes often leave earlier context intact. Root/user CLAUDE.md edits preserve caching because they do not apply mid-session. Output-style changes now append instructions. Compaction summarizes with the old prefix, then replaces history. Gateway stripping of markers can silently eliminate savings.

`promptCacheTtl` and `subagentPromptCacheTtl` configure separate request buckets; API-key/cloud defaults are five minutes, included subscription main-session usage normally one hour. Embedded directory, memory paths, and startup state limit cross-session sharing. These are documented behaviors, not measurements. [Claude Code caching](https://code.claude.com/docs/en/prompt-caching).

## Proposed experiments, not accepted findings

1. DeepSeek three-request branch test separating common text from persisted prefix units.
2. Anthropic stable-prefix marker versus marker after a varying timestamp.
3. Original policy replacement versus appended system update, with quality evaluated separately.
4. Sanitized final request and usage comparison before/after SDK or gateway translation.
5. Request-start time, generation duration, idle gap, TTL, and next-hit retention test.
6. Deferred undiscovered registry addition versus already referenced schema edit versus inline schema version update.
7. Task success, wall time, and total spend alongside hit rate: hit rate alone rewards preserving useless context.

No claim here establishes a specific SDK defect, performance number, or correctness guarantee without a corresponding controlled test.

## Sonnet 5.5 live-test setup verification

Official model ID: `claude-sonnet-5-5`. Input $2/MTok; output $10/MTok. Five-minute cache writes $2.50/MTok, one-hour writes $4/MTok, reads $0.20/MTok. Minimum cacheable prefix: 512 tokens. [Model overview](https://platform.claude.com/docs/en/models/sonnet-5-5/overview), [Cache pricing](https://platform.claude.com/docs/en/build-with-claude/prompt-caching).

`output_config: {"effort":"low"}` is supported. For adaptive thinking, omit `thinking` or use `{"type":"adaptive"}`. To suppress up-front thinking, Sonnet 5.5 uses `{"type":"between_tools"}`, not `disabled`; it is valid at low/medium/high effort. Thinking consumes the output cap even when its content is not returned. Changing effort per message is supported with a beta header under adaptive thinking, but changing effort while using `between_tools` is rejected. Keep the same effort and thinking settings throughout a cache comparison. [Effort](https://platform.claude.com/docs/en/build-with-claude/effort).

Mid-conversation system text is supported on this model with no beta header. Use a `role: system` entry after a user turn, ending the message array or preceding an assistant turn; inline tool additions still require their beta header. [Message placement](https://platform.claude.com/docs/en/build-with-claude/mid-conversation-system-messages).

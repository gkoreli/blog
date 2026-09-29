# What an agent keeps after it clears context

A coding agent can read a long build log, extract one failing test, and continue with only that failure in view. The useful question is not just how many tokens disappeared. It is **what the next request contains, what remains recoverable elsewhere, and what the agent can still know**.

This chapter follows the pinned Pi, Oh My Pi, OpenCode and Codex implementations already recorded in the [source manifest](../sources.lock.json). Two small fixtures execute upstream functions directly. They give us concrete transformations to inspect without paying for a model call.

## Three kinds of clearing

**Truncation** shortens one item, such as a tool result. **Pruning** selects older items to remove or replace. **Compaction** constructs a smaller continuation context, often by summarizing older history and retaining recent messages. These are related operations, but their timing matters.

Consider this illustrative conversation:

```text
System:   Fix the release build. Do not change public interfaces.
User:     Run the tests and fix the failure.
Assistant calls shell: pnpm test
Tool:     [30,000 tokens of output, including one failure]
Assistant: Release flag is enabled; test X expects it disabled.
Assistant calls read: release.ts
Tool:     [current source]
```

Truncate the log **before it is first sent**, and the provider never computes the omitted text in this conversation. Prune it **after later turns have used it**, and the next request has a different history. Under ordinary prefix caching, reuse can remain before that edit, while the changed item and dependent suffix need processing again. Compact the history into a summary, and the continuation starts from a new representation:

```text
System:   Fix the release build. Do not change public interfaces.
Summary:  Test X failed because it expects the release flag disabled.
Recent:   read release.ts → [current source]
```

A **retained tail** is the recent sequence copied into that new context. Its text can be unchanged while its preceding context changes from the original log to a summary. Unchanged tail text therefore does not establish a reusable old tail KV cache. The unchanged tools and system prefix may still be eligible for reuse; the new summary starts a different branch.

The cache explains how much computation can be reused. The summary explains what information the next model invocation receives. They are separate questions.

## Pi: a checkpoint plus recent work

Pi's coding-agent compaction configuration reserves 16,384 tokens and targets 20,000 recent tokens to keep. The selection code walks backward through estimated message sizes and chooses a valid cut point. It avoids starting with a tool result separated from its initiating assistant call. A long tool-using turn can be split; in that case Pi summarizes the earlier part of that turn as well as older conversation. These are targets and structural rules, not a guarantee of an exact token count. [Defaults and accounting](https://github.com/earendil-works/pi/blob/cb7969d212836b8939001dce159fbd2ed6ad395f/packages/coding-agent/src/core/compaction/compaction.ts#L142-L164), [cut-point selection](https://github.com/earendil-works/pi/blob/cb7969d212836b8939001dce159fbd2ed6ad395f/packages/coding-agent/src/core/compaction/compaction.ts#L458-L525), [compaction preparation](https://github.com/earendil-works/pi/blob/cb7969d212836b8939001dce159fbd2ed6ad395f/packages/coding-agent/src/core/compaction/compaction.ts#L894-L959).

The summary prompt asks for the goal, constraints, progress, decisions, next steps and critical context. Pi also extracts read/modified file lists and appends them to the summary. On a later compaction, the previous summary becomes input to the next one. This keeps a rolling account of the work, but it also means an error in an earlier summary can be carried forward. A request to preserve exact paths and errors is an instruction to the summarizer, not a proof that it succeeds. [Summary instructions](https://github.com/earendil-works/pi/blob/cb7969d212836b8939001dce159fbd2ed6ad395f/packages/coding-agent/src/core/compaction/compaction.ts#L529-L601), [iterative inputs](https://github.com/earendil-works/pi/blob/cb7969d212836b8939001dce159fbd2ed6ad395f/packages/coding-agent/src/core/compaction/compaction.ts#L894-L959), [file-list output](https://github.com/earendil-works/pi/blob/cb7969d212836b8939001dce159fbd2ed6ad395f/packages/coding-agent/src/core/compaction/compaction.ts#L1078-L1092).

The CLI's session manager stores a compaction entry with a summary and a pointer to the first retained entry. Its projection—the function that selects stored entries for the next model request—uses the latest checkpoint, its retained range, and later entries. When present, a saved system message is emitted before the summary. Old log entries can remain in the session tree while disappearing from active context. [CLI checkpoint projection](https://github.com/earendil-works/pi/blob/cb7969d212836b8939001dce159fbd2ed6ad395f/packages/coding-agent/src/core/session-manager.ts#L469-L513), [system and summary emission](https://github.com/earendil-works/pi/blob/cb7969d212836b8939001dce159fbd2ed6ad395f/packages/coding-agent/src/core/session-manager.ts#L439-L466).

```text
Stored session:
  old user → old tool call → old log → recent work → checkpoint → new user

Active context:
  saved system state → checkpoint summary → recent work → new user
```

There is also a newer Pi agent-library session projector with the retained tail embedded directly in the checkpoint. Our [fixture](../lab/context-harness.mjs) executes this library projector, not the CLI session-manager path. With a synthetic checkpoint saying “the release flag is enabled,” it produces a summary plus two user messages; the original tool result is absent. Removing that original entry from the fixture produces exactly the same projected messages, because the derived statement is already inside the summary. The summary is supplied by the fixture, not generated by a model. [Library projection](https://github.com/earendil-works/pi/blob/cb7969d212836b8939001dce159fbd2ed6ad395f/packages/agent/src/harness/session/context.ts#L10-L72), [recorded output](../lab/context-results.json).

Pi's one-off summarization wrapper sets `cacheRetention: "none"`. That is a request to the selected adapter, whose behavior depends on the provider/model: it is not a universal promise that no server-side reuse occurs. The consequential cost is still real: compaction may spend an inference call now to make later calls smaller. [Summarization wrapper](https://github.com/earendil-works/pi/blob/cb7969d212836b8939001dce159fbd2ed6ad395f/packages/coding-agent/src/core/compaction/compaction.ts#L641-L662).

## OpenCode: clear old tool output, then summarize when needed

OpenCode has a pruning pass separate from summary generation. When pruning is enabled, it walks backward, skips the newest user-turn region until it has encountered two user messages, protects `skill` outputs, stops at a previous summary or previously compacted result, and protects 40,000 estimated tokens of the older tool output it examines. It applies changes only when candidates exceed its 20,000-token pruning minimum. These constants describe this revision's policy; they are not provider cache rules. [Pruning selection and thresholds](https://github.com/anomalyco/opencode/blob/7945de208964a49300d7f770d1a71d078db9a4c4/packages/opencode/src/session/compaction.ts#L269-L318).

The key implementation detail is what gets changed. The pruning pass stamps `part.state.time.compacted`; it does not replace the stored output string in that loop. Later, conversion to model messages sees that stamp and emits a placeholder while dropping associated attachments from the request. [Mutation](https://github.com/anomalyco/opencode/blob/7945de208964a49300d7f770d1a71d078db9a4c4/packages/opencode/src/session/compaction.ts#L307-L314), [request conversion](https://github.com/anomalyco/opencode/blob/7945de208964a49300d7f770d1a71d078db9a4c4/packages/opencode/src/session/message-v2.ts#L294-L320).

```text
Stored tool part:
  output: "[the full old build log]"
  time.compacted: <timestamp>

Next model request:
  tool result: "[Old tool result content cleared]"
  attachments: []
```

This saves active context while preserving the local record in this path. It is also a historical edit from the model's perspective: the placeholder replaces bytes that an earlier request contained. Putting a cache marker after the placeholder cannot make the old downstream computation valid again.

OpenCode's summary path selects a recent tail with a configurable budget. It serializes older messages into a summarization prompt and carries the previous completed summary forward. Tool output is capped at 2,000 characters in this summarization serialization; a previously pruned output is already just the clearing notice. The summarizer cannot recover omitted details from that serialized text. If the decisive error was beyond the cap and absent from assistant discussion, a good summary prompt alone cannot preserve it. [Serialization](https://github.com/anomalyco/opencode/blob/7945de208964a49300d7f770d1a71d078db9a4c4/packages/opencode/src/session/compaction.ts#L28-L85), [tail selection](https://github.com/anomalyco/opencode/blob/7945de208964a49300d7f770d1a71d078db9a4c4/packages/opencode/src/session/compaction.ts#L224-L267), [summary request](https://github.com/anomalyco/opencode/blob/7945de208964a49300d7f770d1a71d078db9a4c4/packages/opencode/src/session/compaction.ts#L358-L440).

Once a summary completes, `filterCompacted` places the summary before the retained tail for model consumption. The session's original chronological order and its next model context are therefore different views of the same work. [Compacted ordering](https://github.com/anomalyco/opencode/blob/7945de208964a49300d7f770d1a71d078db9a4c4/packages/opencode/src/session/message-v2.ts#L525-L575).

OpenCode's Anthropic-oriented adapter separately places cache markers on selected system and recent messages, unless the adapter has automatic caching configured. Those markers choose candidate prefix endpoints. They do not certify that a pruned log or summary retained all task-relevant evidence. [Cache placement](https://github.com/anomalyco/opencode/blob/7945de208964a49300d7f770d1a71d078db9a4c4/packages/opencode/src/provider/transform.ts#L358-L407).

## Oh My Pi: consider the suffix you would disturb

Oh My Pi adds a useful question to pruning: **how much already-sent conversation follows this result?** Removing 1,000 tokens near the front of a large warm conversation can force far more than 1,000 tokens to be processed again.

Its ordinary pruning configuration can protect candidates whose following messages exceed `cacheWarmSuffixTokens`. The coding-agent caller supplies an 8,000-token suffix limit; for models with prefix-bound thinking, it tightens that setting to zero. This is a local estimate of the cost-sensitive region, not a query proving that the provider currently holds those tokens. [Suffix calculation and guard](https://github.com/can1357/oh-my-pi/blob/d1932a6ff85613dde1160b87a73ddcdc3beb01f6/packages/agent/src/compaction/pruning.ts#L355-L389), [caller policy](https://github.com/can1357/oh-my-pi/blob/d1932a6ff85613dde1160b87a73ddcdc3beb01f6/packages/coding-agent/src/session/session-maintenance.ts#L659-L685).

A separate pass recognizes superseded reads of a file and results marked uninformative. Those candidates can bypass the ordinary age protection, but the caller still restricts deep warm-prefix edits. After 90 minutes of inactivity, its stale-result caller permits a wider cleanup. That timeout is chosen relative to the retention assumptions in the source. “Cold” here is an assumption in policy, not an observed provider miss; rewriting still incurs the next request's applicable input charges. [Stale-result selection](https://github.com/can1357/oh-my-pi/blob/d1932a6ff85613dde1160b87a73ddcdc3beb01f6/packages/agent/src/compaction/pruning.ts#L267-L306), [90-minute caller setting](https://github.com/can1357/oh-my-pi/blob/d1932a6ff85613dde1160b87a73ddcdc3beb01f6/packages/coding-agent/src/session/session-maintenance.ts#L300-L316).

For more aggressive reduction, OMP's **shake** operation removes recoverable heavy text without asking an LLM to summarize it. Its pure layer finds eligible old tool results and large fenced/XML blocks, preserves protected tools and a recent tail, and replaces selected text with a supplied placeholder. For tool results, it retains non-text blocks and the tool-call structure. The surrounding session code can save removed regions as an artifact, write recovery links, persist the rewritten entries, rebuild active messages and close incompatible provider sessions. Recovery is a separate read operation; the placeholder does not put the removed material back in the model's attention. [Selection](https://github.com/can1357/oh-my-pi/blob/d1932a6ff85613dde1160b87a73ddcdc3beb01f6/packages/agent/src/compaction/shake.ts#L306-L375), [replacement](https://github.com/can1357/oh-my-pi/blob/d1932a6ff85613dde1160b87a73ddcdc3beb01f6/packages/agent/src/compaction/shake.ts#L427-L477), [artifact and session orchestration](https://github.com/can1357/oh-my-pi/blob/d1932a6ff85613dde1160b87a73ddcdc3beb01f6/packages/coding-agent/src/session/session-maintenance.ts#L877-L981).

Our fixture executes the actual `collectShakeRegions` and `applyShakeRegions` functions:

```text
Before:
  Tool read release.log: [long text] [image] [second text block]
  Assistant: The release flag is enabled, according to the log.
  Skill: [protected instructions]
  Recent tool result: [current output]

After:
  Tool read release.log: [fixture placeholder] [same image]
  Assistant: The release flag is enabled, according to the log.
  Skill: [same protected instructions]
  Recent tool result: [same current output]
```

All those checks passed. The fixture also verifies that entries before a supplied compaction boundary are skipped: editing material already absent from active context would not shorten the request. It uses deliberately small protection thresholds and a deterministic character-count estimator to exercise the branches. It does not write an artifact, run the session orchestrator, or measure provider tokens. [Fixture and output](../lab/context-results.json).

There is another cache here worth separating from the provider's KV cache. OMP memoizes token estimates and message conversion locally. A memo is a saved result of a client-side function. In-place text removal keeps the same JavaScript message object, so a memo keyed only by object identity could return stale content or counts. `applyShakeRegion` calls `invalidateMessageCache`; the fixture observed a version increment and a registered invalidation callback. This is a correctness requirement inside the harness even if the provider's caching is disabled. [Local invalidation](https://github.com/can1357/oh-my-pi/blob/d1932a6ff85613dde1160b87a73ddcdc3beb01f6/packages/agent/src/compaction/message-cache.ts#L32-L92).

OMP's Anthropic adapter also reserves cache boundaries for stable tools/system content and chooses eligible history endpoints within the breakpoint budget. This can preserve the stable head when a history rewrite starts later. It does not preserve a changed history suffix merely because the last marker is unchanged. [Head and tail boundaries](https://github.com/can1357/oh-my-pi/blob/d1932a6ff85613dde1160b87a73ddcdc3beb01f6/packages/ai/src/providers/anthropic.ts#L3903-L4130).

## Codex: truncate on entry, then choose a compaction representation

Codex applies tool-output truncation while recording a cloned item into live history. The original rollout payload remains separate. A rollout is the persisted record of session events; it is not identical to the next request's context. Truncating at this entry point can keep an oversized result out of the request from the start, avoiding a later rewrite of already-sent full output. [Live-history recording](https://github.com/openai/codex/blob/c248f6d48b97eb4a2aa56147a0b11b7d763278b9/codex-rs/core/src/context_manager/history.rs#L495-L555).

Its local compaction path constructs a replacement history from selected user messages and a generated summary. The user-message retention budget is 20,000 approximate tokens; the builder visits newer messages first, truncates where necessary, restores chronological order and appends the summary. Initial context placement depends on whether compaction occurs between turns or during an ongoing turn. This is more specific than “keep the last N chat messages.” [Local replacement](https://github.com/openai/codex/blob/c248f6d48b97eb4a2aa56147a0b11b7d763278b9/codex-rs/core/src/compact.rs#L649-L740), [initial-context placement](https://github.com/openai/codex/blob/c248f6d48b97eb4a2aa56147a0b11b7d763278b9/codex-rs/core/src/compact.rs#L55-L76).

The remote v2 path has a different representation. It selects supported retained inputs, including user messages and conditionally client-authored developer messages, applies a retention budget, and appends the provider's compaction output. It does not simply retain every assistant/tool message as text. The caller installs that replacement history and records its compaction response identity. The content inside a provider compaction item should not be assumed to be an ordinary human-readable summary. [Remote retention](https://github.com/openai/codex/blob/c248f6d48b97eb4a2aa56147a0b11b7d763278b9/codex-rs/core/src/compact_remote_v2.rs#L504-L600), [installation](https://github.com/openai/codex/blob/c248f6d48b97eb4a2aa56147a0b11b7d763278b9/codex-rs/core/src/compact_remote_v2.rs#L298-L375).

Compaction is also a boundary for configuration history. On supported paths Codex pins the request-level reasoning effort and represents later changes as trusted update items. Successful compaction retires that baseline; failed compaction must not change it. A context checkpoint therefore affects both conversation content and the protocol state used to continue it. [Effort baseline lifecycle](https://github.com/openai/codex/blob/c248f6d48b97eb4a2aa56147a0b11b7d763278b9/codex-rs/core/src/session/reasoning_effort.rs#L1-L24).

## Why a lower cache-hit rate can be cheaper

A cache read still has a price and still contributes context to the request. Keeping a huge obsolete log just to preserve a high hit rate can cost more over the remaining task than replacing it once.

Here is arithmetic under **illustrative**, fixed prices: ordinary input costs 1 unit per token, cache writes 1.25 units, and reads 0.1 units. Assume every read/write succeeds, ignore shared unchanged prefixes and output, and compare the same future work:

| Input strategy | First continuation | Each later continuation |
|---|---:|---:|
| Keep reading 100,000 cached tokens | 10,000 units | 10,000 units |
| Replace them with 20,000 tokens, including the summary | 25,000 units | 2,000 units |

Across three continuations, keeping costs 30,000 units and replacing costs 29,000. Add the cost of generating the summary, and replacement takes longer to break even. Add cache expiry, a changing suffix, retention/storage charges or a failed task, and the answer changes again. The example is a calculation, not a benchmark or a claim about this run's provider bill.

Quality can dominate that arithmetic. A 2,000-token summary that forgets the failing test may cause another repository scan or an incorrect patch. An artifact pointer can make recovery possible, but only if the harness exposes the read tool and the model recognizes when it needs the original. Measure task completion and recovery calls alongside input charges.

## Removing text does not erase what was derived from it

Both fixtures preserve a fact after removing its original tool text. In Pi it remains in the supplied checkpoint summary; in OMP it remains in an assistant statement. That is often desirable: the entire purpose of a summary is to preserve useful conclusions after detailed evidence leaves the window.

It matters when the requested operation is redaction or correction. To remove a fact from future context, inspect its descendants: assistant statements, summaries, tool arguments, memory records and retrieved artifacts. Deleting the first appearance alone does not delete these copies or deductions. Removing it from the active request also says nothing about deletion from local logs, saved artifacts or provider retention.

A practical context-management design should answer four questions for each transformation:

1. What exact content will the next request contain?
2. Which facts and instruction scopes must survive, and how are they checked?
3. Where can removed material be recovered, and what will recovery cost?
4. Which client memos, provider continuation state and cached prefixes become invalid?

That is the distinction a generic “clear context” button conceals. Pruning, summaries, artifact offload and cache boundaries each solve part of it; none makes the other questions disappear.

## Run the local examples

From the repository root, using Node 24 and the pinned checkouts:

```sh
node docs/worklist/prompt-caching-from-api-to-agent-loop/lab/context-harness.mjs \
  /tmp/prompt-cache-harnesses-20260928/pi \
  /tmp/prompt-cache-harnesses-20260928/omp
```

The fixture verifies the upstream commits and that imported source files are unmodified. Node's type stripping runs those source files directly; a resolver hook adds `.ts` to OMP's extensionless relative imports. No package installation or network request is needed. [Recorded JSON](../lab/context-results.json) contains the returned contexts and mutation checks. These examples test client transformations, not summary accuracy, model task quality, provider KV hits or billing. The revisions were pinned September 28, 2026; this context-management pass and its fixtures ran September 29. See the [manifest](../sources.lock.json) for all four revisions.

Return to [the reading guide](../README.md).

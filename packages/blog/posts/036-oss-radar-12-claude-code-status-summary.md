---
title: "OSS Radar #12: Claude Code’s Status Labels Make Their Own Model Calls"
seoTitle: "Claude Code Agent Summary Costs: What the 16.4% Report Proves"
alternativeHeadline: "A pinned Claude Code binary contains the reported summary requests; a timer-hook test shows why loading the workaround does not establish savings"
date: "2026-10-30"
description: "Claude Code's tiny agent-status labels can trigger separate model requests. I checked the binary and timer hook, including a case where the workaround silently misses."
section: oss-radar
tags: [oss-radar, ai, claude-code, testing]
---

# OSS Radar #12: Claude Code’s Status Labels Make Their Own Model Calls

Claude Code has a separate model-request path for writing a background agent’s short status label. The full-transcript version marks its request to **skip the conversation transcript**. Counting only the conversation can miss work the client asked the model to do.

I checked the [official macOS binary for version 2.1.312](https://registry.npmjs.org/@anthropic-ai/claude-code-darwin-arm64/2.1.312) and tested the proposed timer hook. [Flamerix AI reports that these requests accounted for 16.4% of its estimated cost over one week](https://gist.github.com/flamerix-ai/c3905705cc4205e5de3011fa2e74efce). That percentage remains its measurement; I did not reproduce the week or measure my own savings.

- The reported request path exists in the inspected binary.
- A loaded hook does not prove that requests stopped.
- Cache reads still cost something, and the savings depend on the workload and model.

## A small label can have a large input

The full-transcript path forks a model request with the agent’s messages and asks for a three-to-five-word progress label. It names the request `agent_summary`, limits the fork to one turn and sets `skipTranscript`. The short answer does not describe how much input the model reads.

The same binary also contains a shorter-notes path and configurable refresh intervals. The scheduler checks whether enough messages exist, whether the transcript changed and whether a request should wait for the agent’s own response. **A timer firing is not automatically another billed request.**

That also limits the headline claim. The code supports the mechanism behind the report, but source inspection cannot tell me which server configuration every user currently receives. I would not multiply a 30-second timer by an entire working day and present that as measured spend.

## Closing the panel is not a verified fix

[A reader asked whether hiding the agent panel stops the summaries](https://news.ycombinator.com/item?id=50284537). In the background-task paths I inspected, enablement comes from agent, interactive-session and SDK conditions. The task lifecycle starts the summarizer, which owns its timer. Those paths do not check panel visibility before scheduling it.

That is a code finding, not a live panel-open versus panel-closed experiment. It is enough that I would not rely on closing the panel as a spending control. The check that matters is whether `agent_summary` requests disappear while the same background work continues.

## The hook worked in one test and missed in another

The [proposed workaround](https://gist.githubusercontent.com/flamerix-ai/c3905705cc4205e5de3011fa2e74efce/raw/e02ed433d5f3504e8d5dc333c2ae818eb77f4c4c/no-agent-summary.js) wraps global `setTimeout`. It inspects a callback’s source text for summary-related strings. Matching timers get an inert replacement; other timers pass through.

I extracted the actual scheduler source from the integrity-checked binary and ran it in an isolated JavaScript test environment. Dependencies were replaced only far enough to schedule the callback. No agent or model request ran.

| Test | Observed result |
| --- | --- |
| Scheduler without the hook | Callback scheduled for 30 seconds |
| Hook in `pass` control mode | Same callback and delay |
| Hook in `off` mode | Inert replacement timer |
| Unrelated callback | Original delay preserved |
| Process identity outside Claude Code | Hook left the scheduler alone |
| Same summary callback wrapped with `.bind()` | Hook missed it |

The last case matters after updates. A bound function does not expose the same source text, so this matching method can silently stop working. The workaround’s own documentation warns about that; the test reproduced the failure mode.

I separately loaded the hook into the real binary with `--version`, temporary configuration and outbound networking blocked. It logged successful activation. It matched **zero summary timers**, exactly as a version check should. That proves loading, not live suppression or savings.

## Cached input is cheaper, but the denominator still matters

[Another reader asked whether caching makes the cost small](https://news.ycombinator.com/item?id=50284556). Anthropic’s [cache pricing](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) charges for reads at model-specific rates. A cached transcript can be cheaper than a fresh one while repeated reads still add up.

The reported 16.4% uses per-request cost estimates. It is neither 16.4% of output tokens nor a promised reduction in everyone’s subscription bill. The report distinguishes subscription limit headroom from an API invoice.

For your own check, use the [documented API-request events](https://code.claude.com/docs/en/monitoring-usage), with the same observation window before and after:

1. Group requests by `query_source` and model.
2. Sum `cost_usd` for `agent_summary` and divide by the cost of **all requests in that window**.
3. Keep ordinary input, cache reads, cache creation and output separate. The input field already excludes the two cache categories.
4. Compare equivalent background work and confirm it still completes.

`cost_usd` is an estimate. You can do this accounting without exporting raw prompt bodies. A request count alone cannot establish a cost share, and a quiet status line cannot establish that requests stopped.

## What I would do

[The runner, hashes and results are public](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-claim-checks-2026-10). I left my normal client and environment unchanged. For people running background agents, I would measure this request category first. If its overhead matters enough to justify the unofficial hook, verify matched timers and request totals after each update; treat a successful preload message as the first check, never the final one.

---

## Glossary

| Term / claim | Primary source | Date |
| --- | --- | --- |
| Reported cost share — scopes the author’s observation and workaround limits. | [Pinned report](https://gist.githubusercontent.com/flamerix-ai/c3905705cc4205e5de3011fa2e74efce/raw/c288c965303ec5ee0dbadc3c64a33f599505171b/README.md) | Checked October 30, 2026 |
| Hook test — distinguishes source matching, activation and live suppression. | [Runner](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-claim-checks-2026-10/repro/status-summary-hook.cjs), [results](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-claim-checks-2026-10/results/status-summary-hook.json) | Same check date |

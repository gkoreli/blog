---
title: "My Evals Say It Works. I Still Don't Reach for It."
seoTitle: "ghx sidecar passed the eval. The habit didn't."
alternativeHeadline: "ghx sidecar evals, founder dogfooding, and the adoption gap"
date: "2026-08-21"
description: "The ghx AI-agent reconnaissance sidecar passed a 90-episode eval at 25× compression. My usage logs show a three-day burst, then silence."
section: engineering
tags: [agentic-engineering, ghx, sidecar-agents, evals, adoption]
series:
  id: ghx-field-notes
  title: ghx field notes
  order: 4
---

# My Evals Say It Works. I Still Don't Reach for It.

I use ghx. I barely use the sidecar.

The distinction is the problem.

[ghx began as a remote-first GitHub exploration CLI](/how-ghx-was-born), built to keep HTML noise and repeated API calls out of an agent's context. The sidecar is the product bet that grew from it: give a separate agent a GitHub reconnaissance question, keep the main agent's context clean, and return a compact, cited evidence report.

On July 5, the gate run I had spent a month building returned a verdict: THESIS SUPPORTED. Ninety episodes. All five gates passed. The sidecar scored 0.908 correctness against 0.931 for agents using [ghx](https://github.com/gkoreli/ghx) directly, at 25× context compression. The capability worked.

The [last ghx field note](/what-if-the-agent-was-better-before-we-helped) ended with me trusting the eval enough to let it stop the build. Six weeks later, I found a harder limit: an eval can prove a capability. It cannot make me reach for the product.

The VPS where I began this draft made the sidecar look almost unused. This Mac tells a more complicated story. On July 6, it recorded 24 sessions outside the explicit eval wrapper, including seven GitHub-wide discovery asks. By July 8, the journal goes silent. Direct `ghx read`, `explore`, `grep`, and `tree` calls appear again in a July 17 engineering session. The sidecar does not.

I did not build something nobody used. I built something I used intensely while testing and researching it, then stopped reaching for when the work moved on.

I wrote the blunt version while steering this article:

> "I myself don't use the sidecar ghx yet. It's slow and not fully proven, and I still haven't proven why this is much better than simply triggering a subagent with Claude."

The eval proved a capability. It did not create a habit, remove the setup tax, or explain why somebody should install this instead of triggering the subagent already inside their coding tool.

That gap is where ghx is now.

## The proof is real. It is also confined.

The eval framework did its job. The verdict survived re-runs, a contamination guard that fired seven times, and an honesty pass that forced the sample up to contract.

I trust the number. Here is what the number cannot do.

Every episode ran inside my own harness, on my own task corpus, scored by my own deterministic gates. Two of the six tasks discriminate between profiles; the other four are answerable with plain tools. The judge layer that would grade reasoning quality is built and uncalibrated. It stays non-citable until my hand-labels reach κ ≥ 0.6 against it.

So the proof says: inside this harness, on this sample, the sidecar compresses reconnaissance without losing correctness. It does not say that a stranger, on their machine, with their host's built-in subagent, will be better off installing mine. That experiment has registered gates and zero episodes.

## Where it hurts

The friction log is the most valuable product document in the repository because it was written while the failures were happening. It says the sidecar lost on exactly what a user feels in the first five minutes:

- **Slow, by measurement.** Sidecar asks ran 40.7 to 106.2 seconds across depth tiers in dogfooding. Host-native Explore subagents answered comparable repo questions in 10 to 30 seconds.
- **The silent wall.** While a turn ran, the terminal printed about 48 `(pending)` lines. There was no first signal for the first minute. Silence reads as death.
- **Setup was the hardest step.** The default agent binary failed the ACP handshake in common setups; the fix once lived only in a wrapper script inside my repository. On a work laptop, an ask returned exit 0 with no report and left one breadcrumb in a daemon log.
- **It died at quota.** Real asks ended on "You've hit your session limit · resets 8:30am". The product's answer to a dead backend was a dead ask.
- **"Cheap" was a config field.** Nothing structurally enforced that the sidecar ran on a cheaper model than the main agent. The original gate run consumed the same subscription quota it was supposed to save.
- **The dependency stack is tall.** ghx, gh auth, Node, a pinned adapter package, the Claude Agent SDK, Claude Code credentials. Every hop is a place a stranger's machine differs from mine.

None of these are eval failures. The evals picked a winner. The product made the winner unpleasant to drive, and the driver was me.

## One empty machine, one three-day campaign

The first usage audit happened on the VPS. The product has a full-visibility surface: every ask writes OpenTelemetry metrics for duration and tokens; session directories carry reports, activity, commands, traces, and agent stderr; the daemon keeps its own log. I opened that storage root and counted.

Five hundred sixty-six files. Every one created on August 21.

Four sessions existed. Two were malformed-slug probes. Two were real reconnaissance questions: how the TypeScript MCP SDK structures specs and conformance suites, and how gjson parses escaped characters. Both returned cited, line-numbered evidence in 38 to 82 seconds. Six weeks after the runtime shipped, that machine held no older production record.

That was true of the VPS. It was false as a lifetime claim.

The Mac has 762 files across 36 journaled sessions. Twelve sessions used the explicit eval-agent wrapper. Twenty-four did not. Seven were repository-wide discovery asks, including the twelve-framework delegation scan and research into MCP SDK transports, LLM eval tools, and self-hosted AI gateways.

All seven discovery asks happened on July 6. The last journaled sidecar activity on this Mac was July 8.

The sidecar was not unused. It was campaign-used.

The direct CLI tells a different story because it leaves no journal. `ghx explore`, `read`, `grep`, and `tree` are stateless by design. Claude transcripts on this Mac show direct ghx calls again on July 17 while I was engineering in another repository. The sidecar journal stayed silent.

The audit therefore found two incomplete records. The VPS made the sidecar look unused. The Mac showed an intense research campaign followed by silence. Neither machine could count the direct CLI across my other laptop, my work machine, or the Hermes sessions on the VPS.

The honest conclusion is narrower and worse: when work explicitly turned toward ghx research, I used the sidecar. When the work moved on, I kept using ghx and stopped using the sidecar.

## The ruler was wrong too

The audit also caught a defect in the measurement itself. A weekly rollup script reported p50 latency of 51.3 seconds against a 15-second target. It pushed every histogram into the latency array without filtering by metric name, so report sizes in bytes were counted as seconds. The true p50 across those asks was 17.5 seconds.

The incorrect number had already become the baseline for the latency work. I logged the defect and fixed the source before treating the report as evidence.

That is what the north star's measurement tenet requires: the system that produces the number stays inside the audit boundary. The culture caught its own instrument within a day, but only because writing this article triggered a manual inspection.

## We built a tool for a habit we do not have

In [You Don't Always Need Codemap](/you-dont-need-codemap), I argued that the first decision is not how to map a repository, but whether it deserves to be read at all. The discovery tier, shipped July 6, was meant to make that decision cheap: ask which repositories do X, get candidates verified by reading them. It targets a question I face every week: before designing an evidence-contract specification, which projects publish conformance suites and how do they map tests to clauses? Before building a degradation ladder, who else has handled provider quota death?

The Mac proves I used that tier. Seven times, all on the day it shipped.

Then I stopped.

The twelve-framework delegation scan happened because I explicitly dispatched a research fanout. It was not evidence that consulting outside code had become my reflex. Open source is the largest reference library ever assembled, and I still consult it like an archive I visit for a campaign, not a colleague I think with every day.

On August 21, I restored the loop on the VPS: re-exported the recon skill, re-registered the MCP server, one tool call away in every Claude Code session there. On this Mac, where I also work, the exported skill and ghx MCP registration were absent when I checked. Its ghx config had not changed since July 5.

Restoring one machine is not restoring a habit.

The [north star](https://github.com/gkoreli/ghx/blob/mainline/docs/NORTH_STAR.md) already says dogfooding is the ergonomics bar, the main agent's context is sacred, remote-first escalation must be explicit, and trust in measurement is a tracked workstream. Those tenets made the failures legible. They did not enforce themselves.

> "Unenforced doctrine is prose."

Every failure above is a tenet that depended on my memory: no routing trigger, no cross-machine install, no default path that ran when I stopped thinking about ghx. The fix is not guilt. It is to make the founder's real workflow the first adoption funnel and remove every place where the product waits for me to remember it exists.

## The host can build most of my moat

Host-native delegation is still the default to beat. Claude Code ships Explore and Plan subagents inside the tool I already open. For the question I usually have — where is this implemented? — Explore is often fast enough and requires no second install, daemon, adapter, or configuration file.

I had drawn the contrast too broadly. Host agents are not categorically local-only or amnesiac. [Claude custom subagents](https://code.claude.com/docs/en/sub-agents) can receive scoped MCP servers and persistent memory. [GitHub Copilot custom agents](https://docs.github.com/en/copilot/reference/custom-agents-configuration) can use configured MCP tools. A host can assemble much of the trio I called defensible.

The narrower ghx bet is a product, not an exclusive primitive: remote and discovery-class reconnaissance, a schema-validated evidence report, and a durable ledger behind one tool. The host can technically express those pieces. I am betting users should not have to assemble them themselves.

For most questions, on most days, the metric a user feels is time-to-first-answer, and the built-in subagent wins it. ghx has to make the evidence contract, remote discovery, and persistent sessions valuable enough to justify the extra product. I have not proved that they are.

## Why adoption has not followed

Four reasons remain after the audit:

1. **The lead benefit became table stakes.** "Delegate so exploration doesn't flood your context" was my opening pitch. Hosts now provide isolated subagents. A pitch cannot lead with what the user already has.
2. **Strings work.** A schema-validated evidence contract is differentiating in principle and invisible in practice until somebody has been burned by an unauditable summary.
3. **Install to first answer had too many hops.** Hand-written config, adapter quirks, credentials, a daemon, and silent failure modes charged the user before the first answer.
4. **I used it like a campaign.** The builder reached for the sidecar while testing and researching the sidecar, then returned to the CLI and the host subagent. Adoption cannot outrun the daily-driver problem.

The category is not waiting for me. [codebase-memory-mcp](https://github.com/DeusData/codebase-memory-mcp) makes a different trade: no LLM sidecar, a local persistent graph, a native binary, and structural queries that return almost immediately. When I checked during this audit, it had 39,811 stars. Its README advertised 43 automatic or conditional client surfaces and a [public benchmark preprint](https://arxiv.org/abs/2603.27277).

That is what it is better at: a stranger can understand the product, install it, and cite its benchmark without entering the author's repository. I have an eval stack that outsiders cannot run and a product boundary I am still explaining to myself.

Whoever publishes the citable reconnaissance benchmark gets to frame the category. Right now that person is not me.

## What changed on August 21

I wrote a decision record that says frameworks do not get adopted; products do. The effort split moved to product 45%, framework 35%, evals 20%. Formal proof campaigns were parked, not deleted. Then the friction log turned into shipped code:

- **Silence became a live signal.** An ask now streams tool calls, text excerpts, quiet states, and a truthful completion line. The fixture measured about 0.3 seconds to first signal; dogfood showed the first derived state at 4 seconds. The 48-line `(pending)` wall cannot recur.
- **Quota death became explicit degradation.** Cached evidence can answer with a labeled staleness note. A configured cheaper model gets one retry. With neither, the turn returns a typed error and recovery path after its artifacts are flushed.
- **Seven tools became one reconnaissance contract.** `ghx serve` now defaults to one MCP tool returning a machine-parseable envelope: report, route, and artifacts. A command prints the ready-to-paste MCP configuration. The envelope is backed by an 18-clause normative specification and conformance inventory.
- **The VPS dogfood loop came back.** The recon skill and MCP server were restored. The two-week adoption clock started there.

These changes remove excuses. They do not prove adoption. The warm-latency target is p50 under 15 seconds; the corrected audit measured 17.5. The Mac still lacks the restored route. The experiment against the host-native subagent still has zero episodes.

## The two questions left

**Does it beat a plain subagent on the host's own turf?** The experiment is designed: identical engineering objectives across a plain host, a host with the recon tool, and a host with its native subagent. The gates are pre-registered for success non-inferiority, efficiency superiority, and deterministic recon quality. Episodes run: zero. If the native subagent ties the sidecar, I will publish that and reposition ghx around the narrower product contract.

**Will I keep using it when I stop thinking about ghx?** The real test is not whether I can produce two weeks of sessions on one VPS. It is whether the route survives across the machines and agents where I work, and whether architecture questions begin with reconnaissance without a campaign forcing them to.

If the next audit shows another three-day burst followed by silence, the answer is not that ghx needs more features. It is that the product should shrink until it fits something I reach for.

The eval machinery has earned the right to stop me twice: it killed a feature I liked when its recall gate came back at 0.071, and it turned a scary verdict into a bug report instead of a funeral. I have learned to let it stop the build. I have not yet let it start the habit.

If you have a sidecar-shaped thing you use daily, or you looked at mine and picked the built-in subagent, tell me why. I'm [@GogaKoreli](https://x.com/GogaKoreli) and I mean the question.

---

## Glossary

| Term / Claim | Source | Date |
|---|---|---|
| THESIS SUPPORTED: 90 episodes, 5 gates, sidecar 0.908 vs ghx 0.931, 25× compression; fixbatch 16.6×, ratio 0.983 | [ghx NORTH_STAR.md](https://github.com/gkoreli/ghx/blob/mainline/docs/NORTH_STAR.md), M4/C3 rows; [confirmatory run](https://github.com/gkoreli/ghx/tree/mainline/docs/evals/gate-run-2026-07-05-confirmatory) | Jul 2026 |
| Latency 40.7–106.2s vs Explore 10–30s; quota-death log line | [ADR-0040: investment rebalance](https://github.com/gkoreli/ghx/blob/mainline/docs/adr/0040-investment-rebalance-product-framework-forward.md); [FRICTION.md](https://github.com/gkoreli/ghx/blob/mainline/docs/dogfood/FRICTION.md) | Aug 2026 |
| ~48 `(pending)` lines; exit-0 silent failure on a work laptop | [FRICTION.md](https://github.com/gkoreli/ghx/blob/mainline/docs/dogfood/FRICTION.md); [ADR-0033](https://github.com/gkoreli/ghx/blob/mainline/docs/adr/0033-sidecar-out-of-box-agent-config.md) | Jul 2026 |
| Claude subagents: built-in isolation, configurable MCP servers and persistent memory | [Claude Code subagents](https://code.claude.com/docs/en/sub-agents) | Aug 2026 |
| Copilot custom agents can use configured MCP tools | [GitHub custom-agent configuration](https://docs.github.com/en/copilot/reference/custom-agents-configuration) | Aug 2026 |
| codebase-memory-mcp: 39,811★ snapshot, created 2026-02-24, public benchmark, 43 supported client surfaces | [Repository](https://github.com/DeusData/codebase-memory-mcp); [arXiv:2603.27277](https://arxiv.org/abs/2603.27277) | Aug 2026 |
| Twelve-system delegation and evidence-contract scan | [ADR-0026](https://github.com/gkoreli/ghx/blob/mainline/docs/adr/0026-prior-art-landscape.md) | Jun 2026 |
| Host-task gates registered, zero episodes | [ADR-0032.1](https://github.com/gkoreli/ghx/blob/mainline/docs/adr/0032.1-host-task-evals-decision.md), NORTH_STAR C8 row | Aug 2026 |
| Judge κ ≥ 0.6 calibration pending founder labeling | [ADR-0023.1](https://github.com/gkoreli/ghx/blob/mainline/docs/adr/0023.1-judge-scorer-decision.md); [TRUST.md](https://github.com/gkoreli/ghx/blob/mainline/docs/evals/TRUST.md) H1 | Aug 2026 |
| M8 anticipation killed by gate: nextReads recall 0.071 | [ADR-0031.1](https://github.com/gkoreli/ghx/blob/mainline/docs/adr/0031.1-anticipation-v1-decision.md), NORTH_STAR M8 row | Jul 2026 |
| Production telemetry: OTel duration, token, and report-size metrics per turn | [ADR-0022](https://github.com/gkoreli/ghx/blob/mainline/docs/adr/0022-shared-visibility-runtime.md) | Jul 2026 |
| Discovery tier shipped as repository-optional GitHub-wide reconnaissance | [ADR-0019.1](https://github.com/gkoreli/ghx/blob/mainline/docs/adr/0019.1-discovery-tier.md), NORTH_STAR B5 | Jul 2026 |
| Cross-machine audit: VPS 566 files/4 sessions; Mac 762 files/36 sessions, 7 discovery asks, last activity Jul 8; direct CLI visible later only in transcripts | Agent forensics over both `~/.ghx` stores and local Claude transcripts; Hermes and work-laptop records unavailable | Aug 2026 |
| dogfood-week.mjs p50 bug: report-size bytes counted as seconds; script said 51.3s, corrected p50 17.5s | [FRICTION.md](https://github.com/gkoreli/ghx/blob/mainline/docs/dogfood/FRICTION.md); [commit cf925c5](https://github.com/gkoreli/ghx/commit/cf925c5) | Aug 2026 |

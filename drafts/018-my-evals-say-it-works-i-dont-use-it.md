---
title: "My Evals Say It Works. I Don't Use It."
seoTitle: "ghx sidecar: my evals say it works, I don't use it"
date: 2026-08-22
description: "My eval framework says the ghx sidecar wins at 25× compression. I still trigger a Claude subagent. The honest inventory of why nobody uses it yet."
section: engineering
tags: [agentic-engineering, ghx, sidecar-agents, evals, adoption]
series:
  id: ghx-field-notes
  title: ghx field notes
  order: 4
---

# My Evals Say It Works. I Don't Use It.

I don't use my own product.

On July 5, the gate run I had spent a month building came back with a verdict: THESIS SUPPORTED. Ninety episodes. All five gates passed. The sidecar answered repo questions with 0.908 correctness against 0.931 for agents using [ghx](https://github.com/gkoreli/ghx) directly, at 25× context compression. The main agent saw a twenty-fifth of the context and the answers held. A second run after the fixes: correctness within 1.7% of direct ghx, 16.6× compression, all five gates again.

Six weeks later, the founder who ran that gate run defaults to a Claude Code subagent whenever a repo question shows up. The sidecar is one tool call away on my machine. Its skill file had gone stale on July 3 and I had not noticed for six weeks.

Both facts are true at once. My measurement machinery says the sidecar wins. My hands pick the subagent. I wrote the sentence out this week while steering this article; it is the most honest sentence I have about my own product:

> "I myself don't use the sidecar ghx yet. It's slow and not fully proven, and I still haven't proven why this is much better than simply triggering a subagent with Claude."

This is the inventory of that gap.

## The proof is real. It is also confined.

The last field note ended with a promise: the eval framework would be allowed to tell me the worst possible answer, and I would believe it. It did its job. The verdict survived re-runs, a contamination guard that fired seven times, and an honesty pass that forced the sample up to contract.

I trust the number. Here is what the number cannot do.

It cannot leave the repo. Every episode ran inside my own harness, on my own task corpus, scored by my own deterministic gates. Two of the six tasks discriminate between profiles; the other four are answerable with plain tools. The judge layer that would grade reasoning quality — the part a skeptic would want — is built and uncalibrated: it stays non-citable until my own hand-labels reach κ ≥ 0.6 against it.

So the proof says: inside this universe, at this sample, the sidecar compresses reconnaissance brutally without losing correctness. It does not say: a stranger, on their machine, with their host's built-in subagent, will be better off installing mine. That experiment exists. It has registered gates and zero episodes.

## Where it hurts

The friction log is the most valuable file in the repository: it is the only one written while bleeding. Read as a product document, it says the sidecar lost on exactly the things a user feels in the first five minutes:

- **Slow, by measurement.** Sidecar asks ran 40.7 to 106.2 seconds across depth tiers in dogfooding. Host-native Explore subagents answer comparable repo questions in 10 to 30 seconds.
- **The silent wall.** While a turn ran, the terminal printed nothing but `(pending)` lines, about 48 of them. No first signal for the whole first minute. Silence reads as death.
- **Setup was the hardest step.** The default agent binary fails the ACP handshake in common setups; the fix once lived only in a wrapper script inside my own repo. On a work laptop, the ask returned exit 0 with no report and one breadcrumb in a daemon log. A silent nothing is worse than an error.
- **It died at quota.** Daemon logs show real asks ending on "You've hit your session limit · resets 8:30am". The product's answer to a dead backend was a dead ask.
- **"Cheap" was a config field.** Nothing structurally enforced that the sidecar runs on a cheaper model than the main agent. The original gate run consumed the same subscription quota it was supposed to save.
- **The dependency stack is tall.** ghx, gh auth, Node, a pinned adapter package, the Claude Agent SDK, Claude Code credentials. Every hop is a place a stranger's machine differs from mine.

None of these are eval problems. The evals did their job. The product made the winner unpleasant to drive, and the driver was me.

## We instrumented everything and had no patient

This week I asked a question I was afraid of: do we even know how ghx is being used? Not in evals — in production, by us, while building ghx itself?

The product has a full-visibility surface. Every ask writes OpenTelemetry metrics with per-turn duration, input/output/reasoning tokens, report sizes; session directories carry the live activity stream, command logs, traces, agent stderr; the daemon keeps its own log. Shipped July 5. So I opened the storage root and counted.

Five hundred sixty-six files. Every one of them created on August 21.

Six weeks of shipped runtime and the production storage held nothing older than that morning. Four sessions exist. Two are probes of the malformed-slug failure path. Two are real reconnaissance questions — how the TypeScript MCP SDK structures specs and conformance suites, asked while writing our evidence-contract spec, and how gjson parses escaped characters. Both came back with cited, line-numbered evidence in 38 to 82 seconds. The telemetry worked perfectly. It answered my audit in minutes. There was no patient attached to the instruments.

Then the footnote carried its own finding: the bare CLI does not write to `~/.ghx` at all. Only the sidecar journals. Direct `ghx explore` and `ghx read` are stateless by design — remote-first, nothing persisted, no counter anywhere. The tool can be used heavily and leave zero trace in its own storage; the only usage record for those calls lives in my conversation transcripts. We built full-visibility telemetry and gave it to half the product. When people say "we have no analytics," they usually mean nobody built them. Our case is stranger: we built them and pointed them at the part of the funnel nobody walks through.

The instruments were not above suspicion either. Yesterday's swarm shipped a weekly rollup script to baseline the latency war, and its first report claimed p50 of 51 seconds against a 15-second target. I checked its math while writing this article: it pushes every histogram into the latency array without filtering by metric name, so report sizes in bytes got counted as seconds. True p50 across today's asks is 17.5 seconds. Our freshly shipped ruler was lying by three times. The fix is a friction-log entry, not a shrug — the L1 latency card is drilling against a false number otherwise. This is what "trust in the measurement is a tracked workstream" means when it grows up: audit the auditor, especially the one you shipped yesterday.

One caveat kept honest: my laptops are not the only machines this ran on, and the Mac's disk is not inventoried here. But the repo's own working-rhythm document already said the quiet part: the dogfood loop had been stale since July 3. Two records, same wound.

The hard failures are in the log too. Today's daemon log carries the quota-death line twice — "You've hit your session limit · resets 8:30am" — sitting right above the streaming progress lines that only exist because that pain got engineered against. And every single session spawn prints the same SDK warning about the report-sink tool being shadowed. Nobody reads daemon logs for a product with zero users.

## We built a tool for a habit we do not have

The second half of the audit is worse. ghx has a discovery tier — ask which repositories do X, get candidates verified by reading them — shipped since July 6. It aims at exactly the question I face every week: before designing the evidence-contract spec, which projects publish conformance suites and how do they clause-map tests? Before building the degradation ladder, who else has handled provider quota death, and what did they learn?

Zero discovery-scope sessions exist. Not this week. Ever.

When those questions came up, I answered them from memory, from whatever was already in context, or from a scheduled research fanout — the twelve-framework delegation scan happened because someone explicitly dispatched it, not because reaching for outside code is my reflex. Open source is the largest reference library ever assembled, and I consult it like an archive I visit quarterly, not a colleague I think with daily. The tool whose entire purpose is to make that consultation cheap sat one tool call away while I designed around my priors.

That is the injury called by name: ghx does not have an injury. My habits bleed around it. The fix is routing, not guilt — every architecture question starts with a discovery ask, every friction lands in the log, and the founder's own workflow becomes the first adoption funnel. If the tool cannot survive being used where I work, no stranger will save it.

## What the tenets say about what we found

I did not have to wonder whether the audit contradicts the vision. The steering documents predicted every wound in it, written weeks before the data existed. That is the part that keeps me from despairing: the diagnosis was already on the books. We failed to run it against ourselves.

**"Dogfooding is the ergonomics bar"** sits in the north star as a named tenet, with the rule that founder friction outranks speculative features. The same document defines the adoption milestone's exit bar as two weeks of logged real use. The audit found six weeks of empty storage. The tenet was never violated by argument. It was violated by silence.

**"The main agent's context is sacred"** — and my own sessions this month answered repo questions with raw `grep` over local clones and full-file reads inside the main agent's window, the exact waste the product exists to remove, committed by the person who wrote the sentence.

**"Trust in the measurement is a tracked workstream."** This one held — barely, and only because it is written down. The rollup script shipped with a three-times-wrong p50 and nobody caught it until an article asked how we use the product. The ledger culture caught its own instrument lying within a day of being pointed at it. That is the system working at the speed of a manual trigger, which is another way of saying it does not work yet.

**"Remote-first, escalation explicit"** cut both ways in the audit. It is why direct CLI calls leave no trace — stateless by design, nothing persisted. Honest architecture, unintended blindness: the same decision that keeps agents clean made usage invisible.

The pattern across all four: the doctrine is not wrong. Unenforced doctrine is prose. Every failure above is a tenet that was true on paper and unstaffed in practice — no loop, no trigger, no default path that runs without my memory being involved.

## The subagent is not a straw man

Claude Code ships Explore and Plan subagents that run in their own context window and return a summary. Cursor has subagents. GitHub Copilot made custom agents with skills and MCP generally available on July 29. They are free, fast, zero-config, and already inside the tool people open anyway.

They are also local-filesystem-bound, string-returning, amnesiac between questions, and unauditable. Explore cannot leave your checkout. It cannot sweep GitHub for which repos do X before anyone has named a repo. It carries nothing from yesterday's question into today's. And when it is done, what comes back is prose — no schema, no artifacts on disk, no way to re-verify where its claims came from.

That trio — remote and discovery-class reconnaissance, persistent session memory, an auditable evidence contract — is the bet. Every delegation mechanism I could find returns strings or transcripts; none returns a schema-validated evidence report a parent agent can read with `ls` and `jq`. The gap is real. The pain is quiet: strings work well enough that nothing has broken yet.

For most questions, on most days, the metric a user feels is time-to-first-answer, and the subagent wins it. That is why my hands vote the way they do. The trio is my bet for what hosts cannot commoditize. A bet is not a measurement.

## Why there is no adoption

Five reasons, in order of how much each one stings:

1. **The lead benefit became table stakes.** "Delegate so exploration doesn't flood your context" was my opening pitch. Hosts shipped it for free. A pitch cannot lead with what everyone already has.
2. **Strings work.** The evidence contract is differentiating in principle and invisible in practice until someone has been burned by an unauditable string. Nothing has broken loudly enough yet.
3. **Install to first answer had too many hops.** The wiring, not the installing, was the tax: hand-written config, adapter quirks, silent failure modes. Most of that list above is this.
4. **The number a skeptic needs does not exist.** Sidecar versus host-native subagent, on the host's own turf, with pre-registered gates: designed, registered, deliberately not run. I parked formal proof to buy product speed. That choice has a price and this section is it.
5. **Me.** The builder is the counterexample. A tool whose author reaches past it is not a tool with an adoption problem. It is a tool with a daily-driver problem, and adoption is downstream of that.

Meanwhile the category narrative is being written by someone else. A competitor, codebase-memory-mcp, is brain-less by its own declaration: no sidecar, no doctrine, no evidence contract. When I checked the morning I wrote this, it stood at 39,811 stars — my own notes from two weeks earlier recorded 27,884. Twelve thousand stars arrived while my notes aged two weeks. Six months from repo creation to forty thousand stars, an arXiv benchmark preprint, and auto-install into eleven agents' configs. It is winning mindshare with distribution and a public benchmark while I hold a more rigorous eval stack that nobody outside my repository can run. Whoever publishes the citable reconnaissance benchmark frames the category. Right now that person is not me.

## What changed on August 21

I wrote a decision record that says it plainly: frameworks don't get adopted, products do. The effort split moved to product 45%, framework 35%, evals 20%. Formal proof campaigns parked, not deleted. Then, in one day, the friction log turned into shipped code:

- **First signal in seconds.** The ask now streams live progress from the session: tool calls with status, text excerpts, derived quiet-states, a truthful completion line. Budget was under 5 seconds to first signal; the fixture measured ~0.3s and dogfood showed the first derived state at 4 seconds. The 48-line `(pending)` wall cannot recur.
- **Degrade, never die.** When the backend dies of quota exhaustion, the ask no longer exits dead. With cached session evidence it answers from the durable ledger, labeled `DEGRADED (quota)` with a staleness note. With a cheaper fallback configured, it retries there once, labeled `DEGRADED (degraded:model)`. With neither, it fails as a typed error with a recovery affordance, only after the turn's artifacts are flushed.
- **One tool, one contract.** `ghx serve` now defaults to exactly one MCP tool whose result is a machine-parseable JSON envelope — report, route, artifacts — with the appended human prose deleted. The seven direct tools moved behind a flag. A new command prints the ready-to-paste MCP config block, so wiring is a copy-paste instead of a README archaeology session.
- **The contract became a spec.** The evidence envelope is now an 18-clause normative specification with a clause-to-test conformance inventory, so any harness — mine or a stranger's — can hold the product to its contract.
- **The dogfood loop came back.** The recon skill had been stale on this machine since July 3. I re-exported it and re-registered the recon MCP server the same day I wrote the confession at the top of this post. Every Claude Code session on this machine now starts with the sidecar one tool call away. The bar I set for the adoption milestone is two weeks of real friction in the log. Today is day one.

These are responses to the ledger. They are not proof of adoption. The latency target is p50 under 15 seconds warm, and the war is not won.

## What remains unknown

**Does it beat a plain subagent on the host's own turf?** The experiment is designed: identical engineering objectives across plain host, host with the recon tool, and host with its native subagent; gates pre-registered for success non-inferiority, efficiency superiority, and deterministic recon quality. Episodes run so far: zero. If the native subagent ties the sidecar, the honest move is to publish that and reposition on the trio. I have pre-committed to the move and not yet to the run.

**Is the quality half true?** The "both, not one" claim — the main agent gets better at engineering while getting better reconnaissance — is asserted, gated, and unmeasured. The judge that would measure it waits on my labeling session. Until κ lands, no quality claim is citable, including the flattering ones.

**Is the corpus honest?** Two of six tasks discriminate. Post-cutoff replacement tasks are landed and the closed-book canary runner is wired; the live canary numbers are the last step before any claim gets quoted.

**Will the routing habit survive contact?** The audit gave me one real day of founder usage and zero discovery asks in the product's lifetime. The commitment is mechanical now: architecture questions start with a discovery ask, frictions land in the log. If the next audit looks like this one — instruments humming, no patients — the honest reading is not that ghx needs more features. It is that I do not want what I built, and the product should shrink until it fits something I reach for.

**Will I keep using it?** The loop is restored. The friction log is open. Six weeks ago I proved the thing worked in a universe of one, and then did not use it. The next honest data point is whether the founder becomes user one, or becomes the case study in someone else's post about builder's blind spots.

The eval machinery has earned the right to stop me twice: it killed a feature I liked when its recall gate came back at 0.071, and it turned a scary verdict into a bug report instead of a funeral. I have learned to let it stop the build. I have not yet let it start the habit.

If you have a sidecar-shaped thing you use daily, or you looked at mine and picked the built-in subagent, tell me why. I'm [@GogaKoreli](https://x.com/GogaKoreli) and I mean the question.

---

## Glossary

| Term / Claim | Source | Date |
|---|---|---|
| THESIS SUPPORTED: 90 episodes, 5 gates, sidecar 0.908 vs ghx 0.931, 25× compression; fixbatch 16.6×, ratio 0.983 | [ghx NORTH_STAR.md](https://github.com/gkoreli/ghx/blob/mainline/docs/NORTH_STAR.md), M4/C3 rows; `docs/evals/gate-run-2026-07-05-confirmatory/` | Jul 2026 |
| Latency 40.7–106.2s vs Explore 10–30s; quota-death log line | ghx ADR-0040, "the latency war" | Aug 2026 |
| ~48 `(pending)` lines; exit-0 silent failure on a work laptop | ghx `docs/dogfood/FRICTION.md`; ADR-0033 | Jul 2026 |
| Host subagents: built-in, isolation-commoditized, Explore local-only | [Claude Code sub-agents docs](https://code.claude.com/docs/en/sub-agents) | Aug 2026 |
| Copilot custom agents + skills + MCP GA | [GitHub changelog](https://github.blog/changelog/2026-07-29-copilot-code-review-agent-skills-and-mcp-now-generally-available/) | Jul 2026 |
| codebase-memory-mcp: 39,811★ live 2026-08-22 (27,884 two weeks prior), created 2026-02-24, arXiv 2603.27277, 11-agent auto-install | `gh api repos/DeusData/codebase-memory-mcp`; ghx PA-0002.1 | Aug 2026 |
| No framework returns schema-validated evidence contracts | ghx ADR-0026 twelve-system scan | Jun 2026 |
| C8 host-task gates registered (δ=0.10), zero episodes | ghx ADR-0032.1, NORTH_STAR C8 row | Aug 2026 |
| Judge κ ≥ 0.6 calibration pending founder labeling | ghx ADR-0023.1, `docs/evals/TRUST.md` H1 | Aug 2026 |
| M8 anticipation killed by gate: nextReads recall 0.071 | ghx ADR-0031.1, NORTH_STAR M8 row | Jul 2026 |
| Dogfood stale since Jul 3, restored Aug 21; p50 ≤ 15s target | ghx `docs/research/005-north-star-working-rhythm.md` | Aug 2026 |
| Production telemetry shape: OTel gen_ai duration/token/report-size per turn | ghx ADR-0022/.1, `~/.ghx/sessions/*/metrics.jsonl` | Jul 2026 |
| Discovery tier shipped (repo-optional GitHub-wide recon) | ghx ADR-0019.1, NORTH_STAR B5 | Jul 2026 |
| ~/.ghx self-audit: 566 files, all created Aug 21; 4 sessions, 0 discovery-scope; bare CLI writes no usage trail by design | Agent forensics on `~/.ghx` + `internal/cli` source (this machine; Mac not inventoried) | Aug 2026 |
| dogfood-week.mjs p50 bug: report-size bytes counted as seconds; script said 51.3s, true p50 = 17.5s | ghx FRICTION.md entry, commit `cf925c5`; scripts/dogfood-week.mjs:104-122 | Aug 2026 |
| Dogfooding as quality practice (origin of the term) | [HackerNoon on dogfooding](https://hackernoon.com/why-you-should-be-obsessed-with-dogfooding) — Alpo ad campaign origin | Aug 2026 |

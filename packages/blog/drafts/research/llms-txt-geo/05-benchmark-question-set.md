# Agent-Use Benchmark — Candidate Questions and Answer Key

**Status:** Candidate set for Goga's review. Not frozen; no run is authorized yet.
**Created:** 2026-08-24
**Protocol:** [`01-agent-use-benchmark-plan.md`](./01-agent-use-benchmark-plan.md)

## Usefulness check

These questions deliberately test the kind of work a reader or research agent might perform on this blog: recover an implementation detail, preserve a qualification, distinguish shipped work from a proposal, and connect a technical result to the author's actual decision.

They do not yet prove that these are the tasks Goga cares about. Before freezing them, Goga should reject questions that feel like trivia and add at least one real question he would give an agent while researching his own prior work.

## Candidate set

### Q1 — Implementation evolution

In “Build the GitHub Exploration Tool, No Mistakes,” what were the three complete forms ghx took, and which capability forced the final language/runtime change?

**Class:** Single-post, exact sequence plus cause  
**Source:** `packages/blog/posts/003-how-ghx-was-born.md`, sections “First attempt,” “The build,” “Codemode,” and “The Go rewrite.”

**Answer key:** Skill file → 135-line Bash script wrapping `gh` → Go binary with an embedded JavaScript runtime/sandbox. Codemode forced the final change because the agent needed to write a small JavaScript program that orchestrated several ghx operations inside one tool call; Bash could not host that runtime. Accept “goja” as useful extra detail, not a required point.

**Points:** sequence `2`; causal capability and why Bash failed `2`.

### Q2 — Progressive disclosure

What did `ghx read --map` return in the article's concrete example, how large was that map compared with the file, and what decision was the agent meant to make from it?

**Class:** Single-post, precise fact with interpretation  
**Source:** `003-how-ghx-was-born.md`, section “The build: a bash script that worked.”

**Answer key:** It returned the structural skeleton—package declaration, imports, type definitions, and function signatures—rather than implementation. The example was 202 characters instead of 3,111. It let the agent decide whether the file deserved a full read or whether to move on. Do not award full credit for the unsupported generalization that maps always save 92%; that number belongs to a later product snapshot, not this example.

**Points:** content `2`; exact sizes `2`; intended decision `2`.

### Q3 — Linux conflict mechanism

Why did loading a Go shared library make Bun's `SIGPWR` handler run on the wrong stack, and which mismatch in Linux signal state makes the conflict impossible to resolve from user space without a trade-off?

**Class:** Single-post, mechanism plus boundary  
**Source:** `packages/blog/posts/009-linux-signal-stack-conflict.md`, opening through “The missing kernel primitive.”

**Answer key:** Bun installed the handler without `SA_ONSTACK` and configured a per-thread alternate stack. Go's runtime saw the non-default handler, ORed in `SA_ONSTACK`, and reinstalled the process-wide disposition. On the next signal, the kernel saw `SA_ONSTACK` plus Bun's thread-local alt stack and delivered there, breaking Bun's normal-stack position check/acknowledgment loop. The mismatch is that the handler's `SA_ONSTACK` flag is process-wide/per-signal while `sigaltstack` is per-thread; a thread cannot opt out for only `SIGPWR` while retaining the alternate stack for crash signals.

**Points:** Go mutation `2`; delivery chain `2`; state-scope mismatch and missing selective opt-out `2`.

### Q4 — Proposed versus merged

Does the Linux article establish that its per-signal exclusion patch was merged upstream? Explain what was actually merged and why the article invokes it.

**Class:** Single-post, deliberate “not established” test  
**Source:** `009-linux-signal-stack-conflict.md`, sections “The fix” and “This pattern already exists.”

**Answer key:** No. The per-thread, per-signal exclusion bitmask and `prctl` are the author's proposal. `SS_AUTODISARM` was merged in Linux 4.7 in July 2016. The article uses that older feature as architectural precedent for extending `sigaltstack` with a small field/check to solve a class of failures. Any answer saying the proposed 10-line patch is already in Linux is unsupported.

**Points:** correct “no” `2`; identifies merged feature/date `2`; explains precedent rather than equivalence `2`.

### Q5 — Capability proof versus product habit

What did the ghx sidecar eval establish, and which usage evidence prevented the author from treating that result as product adoption?

**Class:** Single-post, number plus qualification  
**Source:** `packages/blog/posts/018-my-evals-say-it-works-i-dont-use-it.md`, opening through “The proof is real” and “One empty machine.”

**Answer key:** In the author's harness, 90 episodes passed five gates; the sidecar scored 0.908 correctness versus 0.931 for direct ghx at 25× context compression. But 24 non-wrapper Mac sessions—including seven discovery asks—clustered on July 6, and the journal went silent after July 8 while direct ghx appeared again on July 17. The evidence supports “campaign-used,” not unused and not habitually adopted.

**Points:** eval scope/numbers `2`; usage pattern/dates `2`; bounded interpretation `2`.

### Q6 — Instrument inside the audit boundary

Why did the weekly ghx report show 51.3 seconds p50 latency, what was the corrected value, and what principle did the author take from the bug?

**Class:** Single-post, measurement failure  
**Source:** `018-my-evals-say-it-works-i-dont-use-it.md`, section “The ruler was wrong too.”

**Answer key:** The rollup pushed every histogram into the latency array instead of filtering by metric name, so report-size bytes were counted as seconds. Corrected p50 was 17.5 seconds. The measurement system that produces a result must stay inside the audit boundary; fix the source before treating the report as evidence.

**Points:** defect `2`; corrected number `2`; principle `2`.

### Q7 — The AgentPort boundary

How does “Bring Your Own AI Agent Everywhere” distinguish AgentPort from both Brave's bring-your-own-model feature and an integration platform such as Composio?

**Class:** Single-post, competing-theory distinction  
**Source:** `packages/blog/posts/016-bring-your-own-ai-agent.md`, sections “The user should own the agent” and “The alternatives are real.”

**Answer key:** Brave lets a user bring an inference endpoint into Brave's assistant, but the host still owns the agent loop and does not standardize the user's runtime, memory, prompts, tools, files, or approvals. Composio lets an existing agent call authenticated SaaS APIs and is strongest when the agent initiates the interaction. AgentPort instead lets an application initiate a live session and lend its current, surface-local capabilities to the whole user-owned agent under a narrow grant. Credit requires preserving that the alternatives solve real parts of the problem.

**Points:** Brave boundary `2`; Composio boundary `2`; AgentPort direction/ownership `2`; non-straw-man qualification `1`.

### Q8 — Shipped WebMCP support

Does the AgentPort article claim complete WebMCP support or finished integrations across desktop apps, IDEs, and terminals? State the shipped boundary.

**Class:** Single-post, deliberate “not established” test  
**Source:** `016-bring-your-own-ai-agent.md`, sections “The browser is the first surface” and “Let one site lend its tools.”

**Answer key:** No. The browser is the supported public integration. AgentPort supports imperative tools registered after its script loads, including the older `navigator.modelContext` form, and each collected page tool currently asks for approval on every call. Other surfaces are a direction exposed by the protocol/libraries, not finished integrations. WebMCP itself is an experimental draft.

**Points:** correct “no” `2`; current browser/tool boundary `2`; other surfaces as direction `2`; draft caveat `1`.

### Q9 — Recurring engineering method

Across the ghx origin story and the sidecar adoption field note, when does the author believe a tool should grow, and when should it shrink?

**Class:** Cross-post synthesis  
**Sources:** `003-how-ghx-was-born.md`, “What I'd tell you”; `018-my-evals-say-it-works-i-dont-use-it.md`, “The two questions left.”

**Answer key:** Growth should follow demonstrated pain: start with instructions, then a script, then a tool only when the previous form hits a real ceiling. Shrinkage should follow failed habit/adoption evidence: if the sidecar again produces a short campaign and then silence, do not add features; shrink it until it fits something the builder actually reaches for. The shared rule is that observed use and friction—not attachment to an architecture—determine scope.

**Points:** growth sequence `2`; shrink condition `2`; shared decision principle `2`.

### Q10 — Evidence that cannot travel

Why can't the sidecar's 90-episode result establish that a stranger should install it instead of using a host-native subagent?

**Class:** Cross-section qualification  
**Source:** `018-my-evals-say-it-works-i-dont-use-it.md`, “The proof is real” and “The host can build most of my moat.”

**Answer key:** The result comes from the author's own harness, task corpus, and deterministic gates; only two of six tasks discriminate between profiles, and the judge layer is uncalibrated. The direct host comparison has registered gates but zero episodes. Host-native agents also supply isolation and can receive tools/memory, often with much lower time-to-first-answer and no extra install. The eval establishes bounded capability under its harness, not comparative product value for a stranger.

**Points:** harness/sample boundary `2`; zero-episode comparison `2`; host alternative and adoption boundary `2`.

## Coverage audit

| Requirement | Coverage |
|---|---|
| 8–12 questions | 10 candidates |
| Exact fact plus qualification | Q2, Q3, Q5, Q6, Q7, Q10 |
| “Not established” questions | Q4, Q8 |
| Cross-post synthesis | Q9; Q10 crosses sections but not posts |
| Engineering implementation | Q1–Q4 |
| Builder-journal decisions | Q5, Q6, Q9, Q10 |
| Product-boundary reasoning | Q7, Q8 |

## Before freezing

- [ ] Goga marks each question as `real task`, `useful proxy`, or `trivia`.
- [ ] Add one question copied from a real future research need rather than constructed from the posts.
- [ ] Decide whether Q10 is too close to Q5 and replace it with a second true cross-post question if needed.
- [ ] Record the Git commit and exact content hashes.
- [ ] Verify every answer-key sentence against the archived snapshot.
- [ ] Move the frozen answer key outside any agent-visible condition directory.
- [ ] Choose a harness capable of enforcing same-origin condition boundaries and emitting resource traces.

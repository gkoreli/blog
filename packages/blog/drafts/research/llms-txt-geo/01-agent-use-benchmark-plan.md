# llms.txt Agent-Use Benchmark — Pre-registration

**Status:** Design in progress. Do not run yet.
**Created:** 2026-08-24
**Parent research artifact:** [`00-research-scratchpad.md`](./00-research-scratchpad.md)

## Why run this

This benchmark tests one bounded claim: after an agent has been sent to gkoreli.com, does the site's AI-readable layer help it answer questions about the blog more accurately or efficiently than the ordinary HTML site?

It does **not** test whether ChatGPT, Claude, Perplexity, or Google discovers, indexes, ranks, retrieves, or cites the blog in the wild. The domain and allowed entry points are supplied by the experiment.

## Hypotheses

- **H1 — Curated map:** `llms.txt` plus targeted Markdown endpoints reduces navigation and fetched tokens without reducing answer quality relative to HTML.
- **H2 — Full dump:** `llms-full.txt` improves cross-post synthesis enough to justify its much larger payload.
- **H0 — No material benefit:** the formats produce no repeatable gain in accuracy, source coverage, time, or fetched tokens for these tasks.

We should keep `llms.txt` cheap even if H0 survives. We should not promote it as meaningful infrastructure unless H1 or H2 survives across more than one model or agent implementation.

## Frozen site snapshot

Before running:

1. Build the blog from a named Git commit.
2. Archive `dist/llms.txt`, `dist/llms-full.txt`, every tested `.md` file, and the corresponding HTML pages.
3. Record byte counts and content hashes.
4. Serve every condition from that snapshot, not the changing production site.

This prevents a later article edit or deploy from changing one condition.

## Conditions

| Condition | Initial resource supplied | Allowed navigation | What it isolates |
|---|---|---|---|
| A — HTML | Homepage URL | Same-origin HTML links only; no `.md`, `llms*.txt`, `posts.json`, sitemap, repository, or web search | Normal human-facing site navigation |
| B — Map + Markdown | `/llms.txt` | Links present in the file, including targeted `.md` endpoints; no HTML fallback unless a listed link requires it | Curated navigation plus clean per-document content |
| C — Full dump | `/llms-full.txt` | No other site fetches | One-shot large-context consumption |

Do not let the agent use a general search engine, prior repository knowledge, GitHub source, or an unrestricted browser in any condition. If the harness cannot enforce those boundaries and record resource reads, do not publish the run as a controlled benchmark.

## Tasks

Use two task classes because the formats may have different advantages.

### Single-post retrieval

Questions should require exact, non-obvious details that live in one article. Candidate domains:

- the specific kernel data structure and conflict mechanism in the Linux signal-stack article;
- the eval/use mismatch in the ghx field note;
- the implementation sequence in the ghx origin story;
- the product boundary argued in “Bring Your Own AI Agent Everywhere.”

### Cross-post synthesis

Questions should require connecting claims from at least two posts. Candidate domains:

- how the author's position on agent context changed across the codemap, OpenWiki, and eval field notes;
- which repeated failure modes separate the blog's builder-journal stance from generic “vibe coding” advice;
- how the OSS Radar pieces distinguish an agent tool from an agent runtime or platform.

## Question construction rules

- Freeze 8–12 questions before the first model run.
- At least half must require an exact fact plus its surrounding qualification, not keyword extraction alone.
- No question may be answerable from the title, description, or `llms.txt` summary alone.
- Avoid subjective grading such as “give a good summary.”
- Include at least two questions whose correct answer is “the article does not establish that.” This tests hallucination restraint.
- Store an answer key with exact source locations and acceptable paraphrases before seeing outputs.
- Do not use article passages added after the benchmark was designed.

## Run protocol

For each model or agent implementation:

1. Start a fresh context for every condition/task pair.
2. Use the same system instruction, question wording, token budget, timeout, and tool policy.
3. Randomize condition order to reduce warm-cache and operator-order effects.
4. Run at least three repetitions per cell if cost permits; otherwise label the work a demonstration, not an eval.
5. Capture every requested resource, response status, transferred bytes, elapsed time, tool call, and final answer.
6. Prevent one run's fetched content or answer from entering another run's context.
7. Score blind to condition labels where possible.

## Measures

### Primary

- **Factual accuracy:** answer-key points correctly recovered.
- **Qualification accuracy:** caveats and boundaries preserved.
- **Citation correctness:** cited source contains the claimed support.
- **Unsupported-claim rate:** answer claims not supported by allowed resources.

### Efficiency

- Resources requested.
- Bytes transferred.
- Input tokens attributable to fetched content, if the harness exposes them.
- Wall-clock time to final answer.
- Failed requests or navigation loops.

Do not collapse all measures into one convenient score unless the weighting is declared before the run. Report the vector of results.

## Scoring rubric

Each answer-key item receives:

- `2` — correct and preserves the load-bearing qualification;
- `1` — directionally correct but incomplete or loses a qualification;
- `0` — absent, wrong, or unsupported.

Citation correctness and unsupported claims are scored separately. A fluent answer with invented support must not outrank a terse grounded answer.

## Decision thresholds

These thresholds must be frozen before running:

- Call a condition **quality-preserving** only if factual and qualification scores are not lower than HTML beyond one scoring point across the full set.
- Call it **more efficient** only if it reduces median fetched bytes or input tokens by at least 20% without increasing unsupported claims.
- Call the full dump **worth retaining for agents** only if it materially improves cross-post synthesis over targeted Markdown or removes enough navigation to offset its payload.
- If results disagree by model, report the disagreement. Do not average it into a universal verdict.

The 20% threshold is a practical editorial choice, not a field standard. Revisit it before the run if ordinary HTML extraction or caching makes byte counts misleading.

## Threats to validity

- Models may already contain the public posts from training or prior browsing. Use newly written, unpublished fixtures if contamination appears plausible.
- Agent harnesses differ in HTML extraction, link selection, caching, and token accounting.
- A file-size advantage is not automatically a model-context advantage; the tool may transform both formats.
- Production latency and CDN caching add noise unrelated to content format.
- A tiny personal blog understates navigation costs that documentation sites face.
- The benchmark supplies the entry point, so it cannot support any discovery or ranking claim.
- A question set built from this blog may favor its own Markdown organization.

## Stop conditions

Stop and redesign if:

- the harness silently uses web search or outside knowledge;
- resource-access traces are unavailable;
- conditions receive different model versions or tool budgets;
- content contamination makes no-fetch answers accurate;
- the answer key changes after outputs are visible;
- fewer than two conditions can be isolated as written.

## Artifacts to preserve

- site commit and archived snapshot hashes;
- frozen questions and answer key;
- harness instructions and model identifiers;
- condition manifests;
- raw tool traces and answers;
- scoring sheet with adjudication notes;
- failures and excluded runs;
- a short statement of what the benchmark cannot establish.

## Next design step

Build the question set and answer key from the frozen site snapshot. Have Goga review whether the questions represent real agent tasks he would care about before any run begins.

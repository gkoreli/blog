# Research and illustrated draft checkpoint

Recorded September 28, 2026 America/Los_Angeles; live requests occurred September 29 UTC. Supersedes the initial worklist checkpoint without discarding its history.

## Accepted first-pass work

- Explained the four layers and causal dependencies, with an independently reviewed numerical lab and a dependency/branch SVG.
- Inspected eleven pinned repositories; [the manifest](sources.lock.json) records SHAs and local checkouts. Audited Pi, Oh My Pi, Codex, OpenCode, and Gemini CLI. Claude Code is covered through official documentation, with its source-access limit stated.
- Compared direct-provider and routed contracts, including differing counters, boundaries, retention, and prospective system/tool controls. Reports retain primary-source and commit links.
- Executed actual Pi transcript functions and published Vercel provider packages with mocked network calls. No provider behavior is inferred from those local outputs alone.
- Completed 27 direct Sonnet 5.5 requests for an estimated **$0.1777092**, inside the user's $5–10 allowance. The independent review recalculated usage costs and checked request hashes/model identity against private receipts. All 27 answers passed the fixture's two-field check; no general quality or speed improvement is claimed.
- Wrote [the article](article-draft.md) and [TypeScript presentation](../../../packages/blog/posts/prompt-cache-context-edits.ts), with shared-theme CSS, native expandable measurement rows, a layer map, and an inline dependency infographic. The article and its important numbers remain readable without JavaScript. No new package dependency was added to the blog.
- Preserved complete substantive user messages in the three linked prompt records. The initial docs-only preference was superseded by explicit paid-API authorization. No credential values are in those records.

## Editorial assessment

The central question is whether an agent can change context while preserving useful cached work **and** intended behavior. Intended readers are harness implementers and engineers diagnosing prompt-cache misses. The title names that problem; metadata names LLM prompt caching and the examined layers. Plausible discovery queries include “prompt caching system prompt changes” and “agent context cache invalidation”; these are hypotheses, not measured search demand.

The concrete payoff is distinguishing a prospective update, an old exact branch, and a retroactive rewrite, then checking the final request and usage counters at each layer. The source audits supply counterevidence to the initial suspicion that harnesses broadly neglect caching. The live result makes the distinction inspectable without turning a synthetic task into a provider ranking.

This draft intentionally gives more space to technical explanation than personal narrative. The author's supplied harness-building objective, flexibility/correctness constraints, Jenga analogy, and suspected implementation gaps are the firsthand starting material. The research artifacts supply the actual work. Proposed harness choices remain proposals; no product implementation, personal incident, or independently reported change of belief has been invented. Author review can refine the proposed choices without being treated as evidence already obtained.

The [claim ledger](research/06-claim-ledger.md) records evidence classes, rejected overclaims, and next experiments. The title/opening/headings/visuals/ending were checked against that scope using the positioning and engineering review skills. This is a draft review, not publication acceptance.

## Verification and presentation limits

- `pnpm typecheck`: passed across the repository.
- `pnpm -C packages/blog validate`: passed, 17 existing posts. Drafts are excluded from that command.
- Scoped draft TypeScript check: `pnpm -C packages/blog exec tsc -p ../../docs/worklist/prompt-caching-from-api-to-agent-loop/tsconfig.json` passed.
- Numerical lab, actual Pi fixture, mocked SDK fixture, and paid-probe dry-run passed. The live probe was subsequently hardened to reject incomplete SSE streams or an unexpected returned model; the paid run was not repeated. Request construction hashes were checked separately.
- Isolated HTML/CSS preview rendered to `/tmp/prompt-cache-article-preview/index.html`; no active `dist/` was touched. SVG raster rendering was visually inspected and corrected for standalone rendering.
- Final artifact checks passed for all 30 scoped text files: relative Markdown links, JSON parsing, whitespace, exclusion of configured private values, one rendered H1, six native expandable comparisons, unique HTML IDs, fragment targets, local preview asset paths, and noindex. These are structural checks, not browser acceptance.
- **Full browser review remains open.** Local HTTP binding was denied by the sandbox; the in-app browser was unavailable and Safari control was not approved. Static rendering and source inspection do not establish desktop/mobile layout, keyboard behavior, or final dark-theme acceptance.
- No production build, article route publication, deployment activation, or production acceptance measurement was performed.

## Remaining scope and next bounded action

1. Open the rendered draft in an available browser and review desktop/mobile, dark/light, keyboard expansion, tables, and the diagram. Fix actual layout problems before publication.
2. Read the article alongside the claim ledger; decide whether the next learning pass should prioritize conflicting retrieved evidence or an executing tool lifecycle. Both remain relevant. No more inference spend is necessary for the present artifact set.
3. For a later publication, recheck mutable API documentation and prices, set the real publication date, assemble the exact prompt records into the article's prompt file, integrate the TS post through the normal build, and verify its public asset/evidence links.

Additional providers (Together, Fireworks, Groq), Azure-specific comparison, more harnesses, retention/concurrency tests, and an end-to-end quality benchmark were not needed for this bounded first pass. They remain explicitly unmeasured, not silently assumed complete. The project list is not an empirical “battle tested” ranking.

Raw synthetic HTTP/SSE receipts remain private, outside tracked files; [the live report](research/05-live-anthropic-experiment.md) records their location and retention concern. Public JSON has sanitized observations and receipt hashes. Research-agent token usage and total research cost were not measured; the $0.18 figure is only the live inference experiment.

Return to [the reading guide and worklist](README.md).

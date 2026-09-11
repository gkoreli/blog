# Publication candidate review

September 8, 2026 PDT / September 9 UTC. Continues [the takeover review](10-takeover-and-evidence-review.md). At this checkpoint, the [TypeScript publication candidate](https://github.com/gkoreli/blog/blob/db010a56ff12b0f73a9386f872a639b00a04da11/packages/blog/drafts/oss-radar-07-promptfoo.ts) and [Markdown manuscript](../../oss-radar-07-promptfoo.md) remained in `drafts/`.

**Historical review:** the September 10 [publication decision](17-publication-decision.md) supersedes the release gate below. The article publishes the completed controlled tests; the real-answer preflight remains unrun follow-up work. Use the [worklist](00-worklist-index.md) for current release status.

**Decision: layout, references, and local implementation evidence are ready for author review. The selected workload review still needs one real answer capture and its source-support review.** This is not a live citation study or a publication record. The later [provider-choice correction](13-provider-choice-and-web-capture.md) removes the API-account prerequisite: the existing Perplexity web membership can supply a separately labeled web-answer/import case. The verification counts below record the original candidate review; the latest clarification is now prompt ten. The [frozen preflight](12-directed-answer-preflight.md) makes the next action concrete.

## Editorial scope

The governing form is an OSS Radar project deep dive. Its living center is whether a reusable evaluator retains the records needed to question an answer. It opens with the observed result and synthetic-response boundary, breaks that result into three findings, then explains Promptfoo's purpose, implementation, and the blog's workload. The product section separates the MIT runner from connected services and shipped August work from the stated Frontier plan.

The adapter section marks the change to an implementation register. The two experiments retain their separate denominators: three original evaluations/two local requests, then ten new evaluations/eleven attempts. The cache result constrains the omission claim. The final decision is a bounded trial with explicit capture, with a direct runner as the alternative if maintaining the integration duplicates too much of the runner. A real-answer result may narrow or reverse that decision.

The sources, glossary, and research record follow the narrative. No personal experience or human execution was invented: the record credits Goga's workload/editorial direction and Codex's execution. No token footprint is claimed because complete usage logs from the original ChatGPT work are unavailable.

## Discovery package

These are editorial candidates, not measured search demand. Language comes from the inspected project, response contract, and the author's selected workload. No ranking or citation-frequency claim follows from it.

All three candidates share the reader-growth role; slug `oss-radar-07-promptfoo`; tags `oss-radar`, `promptfoo`, `ai-evaluation`, `analytics`; and the existing mechanism/experiment headings. The primary reader job is choosing an evaluator for a citation-evidence workload. Secondary phrases are custom provider, OpenRouter adapter, JSON export, and trace context. The internal link to the first-party analytics article explains the request-side system; the Radar hub and series trail provide publication context. The link-worthy assets are the pinned capture implementation and independently reopenable saved exports. None promises organic discovery, a complete citation archive from an unmodified adapter, model-wide source accuracy, or a complete production integration guide.

| Surface | A — selected: workload question | B — implementation result | C — adoption decision |
|---|---|---|---|
| Primary doorway | Promptfoo citation-evidence review | Promptfoo custom-provider evidence retention | Choosing Promptfoo for citation evaluation |
| H1 | Promptfoo: Can It Preserve the Evidence Behind an AI Answer? | Promptfoo Citation Capture: What Survived the Export | Promptfoo for Citation Evaluation: A Conditional Adoption |
| Article/OG title | OSS Radar #07: Can Promptfoo Preserve the Evidence Behind an AI Answer? | OSS Radar #07: Promptfoo Citation Capture and Export | OSS Radar #07: Should We Adopt Promptfoo for Citation Evaluation? |
| SEO title | Promptfoo Review: Preserving AI Citation Evidence | Promptfoo Custom Providers: Retaining Citation Evidence | Promptfoo for Citation Evaluation: Design and Limits |
| Alternative headline | Citation fields, failed attempts, and trace joins through Promptfoo 0.122.2 | A tested capture layer retains records omitted by the built-in summary | What Promptfoo supplies and what our citation workload still needs |
| Description | Promptfoo can retain citation evidence with explicit capture. We tested adapter omissions, failed attempts, database export, and local trace joins. | Ten controlled cases tested citation capture through Promptfoo's database and JSON exports. The custom layer retained successful and failed attempts. | A review of Promptfoo's runner, provider boundary, and execution records for citation evaluation, using local tests and explicit adoption limits. |
| Standfirst | Promptfoo's evaluation runner can keep citation evidence through its database and JSON exports, provided we capture it explicitly. | Our Promptfoo capture layer retained citation fields and failed attempts through saved results and JSON exports in ten controlled cases. | Promptfoo is worth a bounded citation-evaluation trial when its runner and result inspection justify maintaining explicit evidence capture. |
| Distribution hook | The answer survived; citation fields depended on the adapter. | A successful retry need not erase the failed first attempt. | Inspect the adapter and export path before adopting the runner. |

Candidate A preserves the author's selected question while naming Promptfoo first in the visible H1. Its description is 147 characters. B overweights export mechanics relative to the product review; C makes the conditional decision less concrete than the question it answers. Neither alternative is installed in metadata.

## Promise ledger

| Surface promise | Inspectable support | State and reader boundary |
|---|---|---|
| Promptfoo review | Pinned code, releases, license, public purpose, product theories, local execution | Reviewed for this workload; red teaming and scanning were inspected, not exercised |
| Preserve citation evidence | Original three-path comparison and the ten-case continuation | Reproduced with synthetic responses; live provider behavior remains open |
| Failed attempts survive | Five failure cases and one explicitly allowed retry with both attempts | Reproduced; transport exceptions and streaming remain outside the accepted fixture matrix |
| Database and JSON exports | Library export plus a fresh CLI process reopening the persisted database | Reproduced; not a remote storage or hosted-service test |
| Local trace joins | Exact evaluation/test/trace/target-span IDs in the full-success export | Reproduced once; no claim about remote retrieval history or immediate human authorization |
| Worth a bounded trial | Useful runner/assertion/result machinery plus small capture interface | Editorial judgment, conditional on the next live result |

## Verification

The isolated preview checkout is `/private/tmp/blog-radar07-preview`, based on `5fc2dc5dc40ad2397a78325e3a192485b44e8cb5`. Only that temporary checkout puts the candidate in `posts/` as `026-oss-radar-07-promptfoo.ts`. This prevents a preparation commit from publishing the issue or incorporating concurrent article edits into this review.

- The exact installed 0.122.2 continuation passed ten cases, eleven local HTTP attempts, all received-response/input hashes, both export paths, and the explicit local trace join. [Accepted records and method](repro/capture/README.md).
- The capture source and candidate TypeScript passed their focused type checks. The isolated blog passed its normal type check and production build with 26 posts. The build's validation checked canonical/metadata and document structure.
- The rendered candidate has one H1, four comparison tables, a ten-row glossary, 37 dated source cards with reasons, and a matching prompts page. The original eight prompt entries remain exact; the takeover request is ninth.
- Desktop and a fixed 390-pixel iframe were visually inspected. The mobile document has no page-level horizontal overflow. Comparison tables own horizontal scrolling and use a minimum width to avoid tall, cramped last columns; glossary definitions wrap within the page. Hero, response-flow diagram, result table, source cards, and glossary were inspected. Browser error/warning logs were empty at the review.
- The generated Markdown exposed an existing exporter defect: table cells lost their heading relationships. The scoped `preserveMarkdownTables` repair now emits GFM tables for rectangular header tables and retains HTML for merged cells. Two focused tests cover measurements, code containing a pipe, links, empty cells, and the merged-cell fallback. All five candidate tables retain their columns in the generated Markdown.
- The source audit retrieved all 34 unique original external links and checked the material claims against source contents. New capture references point to the committed artifact at `5fc2dc5`; the trace implementation was checked at the pinned upstream revision. Time-sensitive claims are dated September 8 and require refresh if release is delayed.

Read time is 12 minutes at 200 words per minute for the rendered title/body through the decision, excluding reference backmatter. The preparation date in metadata must be replaced by the actual release date. No deployment, production analytics query, live model call, subscription purchase, or social post was performed.

## Release handoff

1. Use the existing Perplexity web membership under the amended preflight. Preserve the answer and visible citation links as a web capture. API access is optional; no provider or credit purchase is required.
2. Import the captured record through Promptfoo, verify its retention, and review every material claim/citation relationship under the frozen rubric. Keep absent/inaccessible evidence explicit. Incorporate the result into the body and adoption decision, preserving a negative result if it occurs.
3. Refresh relevant release/issue state, set the actual publication date, and recheck the changed candidate. On publication instruction, move the module into `posts/` with the available sequence number. The prompts file already matches its slug.
4. Keep the 72-call frequency study, analytics integration, and engineering continuation open. They are not conditions for this narrow Radar release.

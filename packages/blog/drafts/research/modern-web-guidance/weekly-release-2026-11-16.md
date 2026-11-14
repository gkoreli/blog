# OSS Radar #15 — Monday release preparation

November 14, 2026, America/Los_Angeles. Target: **November 16 at 08:00 Pacific**. The [weekly production worklist](../../../../../docs/worklist/oss-radar-weekly/README.md) owns the recurring cadence. This pass prepares the existing [reviewed manuscript](article.md); it does not start another article or alter frozen study results.

Working title: **OSS Radar #15: How Modern Web Guidance’s Seven-Line Embedder Works**. Planned route: `/oss-radar-15-modern-web-guidance-static-embeddings`. The route is expected to be absent before the Monday release. The [release manifest](../../../publication-schedule.json) owns the queued snapshot. The authoring draft remains as a research snapshot; publication changes after release belong in the maintained post.

## Value and scope

Reader: an engineer evaluating a small local query encoder or trying to understand where the computation in an embedding-based search system went. The article explains the weighted sum, learned table, normalization and asymmetric document/query preparation, then supplies a runnable local example and consequences for adoption.

The independent contribution is the source-informed calculation reproduction and destructive table control, with exact result receipts and measured runtime/search boundaries. The practical artifact is the catalog-search example. It deliberately indexes short metadata with the query table on both sides; no compatible full-article teacher index or production search is claimed. Existing pooled relevance labels do not become independent human judgments.

## Evidence reviewed in this pass

- Read the complete manuscript against the source and result boundaries recorded in the [editorial disposition](embedding/editorial.md) and [publication review](embedding/publication-review.md). Preserved upstream attribution, archive-size mismatch, timing boundaries, unjudged candidates, negation/admission controls and the interface study's baseline ceiling.
- Ran `embedding/verify.py`: six frozen local files, three process receipts, 604 public ranking rows, 160,768 coordinate comparisons per process, 36 matched CLI calls and 280 archive-file receipts accepted. This verifies saved-evidence consistency; it is not a new benchmark, training run or relabeling study.
- Followed the reader example from a fresh output folder using Node 24.14.1 and the already verified 1.0.0 package. Re-exported the 46-post source snapshot at `19d8f8971d1d74b9118c7819bfbb55aa26f7ba9d`; all 51 vector comparisons and the model/license/notice hashes passed.
- Opened that fresh example in the actual browser. The initial `signup form` query placed Turnstile first; `Bun memory` placed the Bun/Express/Fastify article first. A wholly unknown query in static mode returned zero results. Returning to hybrid search restored the expected Bun result. These are exploratory interaction controls, not a representative search-quality estimate.
- Kept the measured publication population at its recorded 46-post snapshot. This example does not claim the future site inventory remains at 46.

## Release checks

The dated queue source is `scheduled/2026-11-16/046-oss-radar-15-modern-web-guidance-static-embeddings.md`, relative to `packages/blog`. It has explicit OSS Radar metadata and one matching H1. The original explanation and research URLs remain intact; the issue prefix and release metadata identify its weekly-series placement.

- Rechecked the primary Chrome report: HTTP 200, with the historical 30-microsecond and 507 MB claims present. All seven pinned implementation links resolve to the inspected source revision. Current upstream main was `5e5cd33a7738f21281e3027732bcbd58cfa82bf1`; its embedder, training script, search implementation, provenance README and benchmark README were byte-identical to the corresponding files at the article's pinned `596acbc75a330508591b07cd9e198b219341f619` revision. This does not substitute current guide inventory for the frozen study population.
- Weekly publisher tests passed **14/14**; workspace `pnpm typecheck` and `publication check` passed. Tests cover the Pacific clock boundary, later months/DST, missing dates, other weekdays, duplicate Monday issues, source collisions, rollback and prompt protection.
- In an isolated checkout, rehearsed the real November 16 promotion: 07:59:59 Pacific was blocked; 08:00 promoted the exact source bytes; a retry made no change. This was a simulated release clock in a local rehearsal, not early publication to the site.
- Metadata validation accepted 36 Markdown posts; the full production build generated 47 total posts. Checked one matching H1, publication date, canonical/search metadata, six tables and the code block, plus generated Markdown, citation formats, post index, RSS, sitemap, discovery files, home/section entry and social image. The actual rendered article had no horizontal page overflow at the default 1280-pixel browser viewport. The social image's complete title was legible.

Local and hosted queue acceptance are complete; the reviewed source is queued. Source commit `20dff0323787ebe0d8dfbc23b09cb8632c9f6729` was accepted on main. [Hosted check run 43617079152](https://github.com/gkoreli/blog/actions/runs/43617079152) succeeded and accepted the November 16 queue. It ran in **non-publishing** mode: source promotion/push, production validation/build and live verification were skipped as intended. The local rehearsal above supplied rendering/build evidence; actual Monday promotion and deployment still need their own observed acceptance.

The [machine-readable receipt](weekly-release-2026-11-16.json) retains artifact hashes and acceptance boundaries. Temporary local evidence lives under `/private/tmp/oss-weekly-20261114`; it is a working capture location, not a public reader dependency.

Sunday's session should recheck consequential live facts and reconcile any newly accepted work before freezing the Monday source. An independent full-article experiment underway elsewhere is outside this receipt until its source, outputs and interpretation are reviewed; do not silently promote a proposed result into the article. No Monday wakeup, live release or reader outcome is claimed in advance.

## November 14 addendum: completed local passage comparison

The [separate E5 experiment](passage-search/report.md) is now complete and reviewed against its frozen inputs and three result receipts. It indexes all 46 source articles as 866 passages. On 36 source-aware agent-authored questions, BM25/E5/hybrid known-answer-at-three counts are **32/27/33**. Labels are incomplete; all nine discordant cases and the shared prompt-cache label miss are documented without changing the primary metric. All eight expected-no-answer queries received results. This is a full local transformer experiment, distinct from MWG's static query table and the still-unbuilt Gemini document index.

The authoring manuscript and dated queue now contain the same new E5 subsection and research source row. The original loop explanation and its evidence remain intact. The earlier queue hash, hosted run and six-table build receipt above remain historical evidence for the prior bytes. `fullArticleExtension` in the [machine-readable receipt](weekly-release-2026-11-16.json) identifies the revised queue hash and its new acceptance.

Checks for this revision: frozen files/model hashes, source/passages coverage, all vector norms and all primary results verified; the actual local passage UI passed selected browser controls. Publication check, main Markdown validation (35 posts) and workspace typecheck passed. An isolated archived checkout promoted the revised exact queue bytes under a simulated Monday clock and completed the production pipeline, generating 47 posts. The resulting article has one H1 and seven tables; HTML, Markdown, canonical metadata and discovery files include the new results. Existing locked dependencies were reused; no local environment files or shared `dist/` were copied or changed.

Two rehearsal setup failures are retained locally: the first command ran from the repository root where `tsx` was unavailable, and the package's `tsx` CLI then could not open its IPC pipe under the shell restriction. Running the same referral-policy check and production entry through `node --import tsx` in the isolated blog package passed. Neither failure generated a different relevance run or changed the article inputs.

The earlier hosted non-publishing run does not validate these revised bytes. Monday publication and live acceptance remain pending. Sunday's source/fact review should use this completed comparison rather than the superseded note that it was underway. No production search was added.

## November 14 subsequent editorial review

The [review after E5](embedding/publication-review.md#november-14-review-after-the-e5-comparison) keeps the MWG explanation, reproduction, timing, guide replay and representation limits together before either blog application. The loop and normalization explanation are unchanged. A shorter, explicitly separate E5 section retains the mixed results, source-selected labels, useful unlabeled passages and expected-no-answer admissions. It states that the different content, label sets and cutoffs prevent comparing the encoders through these two studies. E5's timing and model-size details remain in its full report.

The draft and queue bodies match, with the original queue frontmatter and November 16 release date preserved. `postE5EditorialReview` in the [receipt](weekly-release-2026-11-16.json) identifies these latest source bytes and acceptance. The saved MWG verifier and a read-only audit of all three E5 process receipts passed without rerunning a benchmark or altering labels. Publication check and an isolated production build passed; the generated 47-post output retains one article H1, seven tables, the intended section order and the numerical claims in both HTML and Markdown. The shared development output was untouched. Earlier rendering receipts remain attached to their original hashes; live publication remains pending.

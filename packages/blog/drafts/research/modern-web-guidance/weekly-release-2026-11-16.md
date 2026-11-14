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

Local acceptance is complete; the reviewed source is queued. Hosted activation/check remains pending the source push and a **non-publishing** workflow run. The [machine-readable receipt](weekly-release-2026-11-16.json) retains artifact hashes and acceptance boundaries. Temporary local evidence lives under `/private/tmp/oss-weekly-20261114`; it is a working capture location, not a public reader dependency.

Sunday's session should recheck consequential live facts and reconcile any newly accepted work before freezing the Monday source. An independent full-article experiment underway elsewhere is outside this receipt until its source, outputs and interpretation are reviewed; do not silently promote a proposed result into the article. No Monday wakeup, live release or reader outcome is claimed in advance.

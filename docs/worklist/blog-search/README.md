# Blog search package and dogfood integration

A separate [compact search placement correction](ui-placement-2026-11-15.md) follows the completed package work. The completed v0.1 record is below. A separately accepted [v0.2 iteration](v0.2.md) tracks current package, reader interaction and article work.

November 14, 2026. Accepted product work following the completed [reader-search investigation](../../../packages/blog/drafts/research/modern-web-guidance/reader-search/README.md). The earlier MWG and E5 measurements remain frozen. This work builds a reusable monorepo package, integrates it into the publication, compares representative retrieval approaches, and revises the engineering article from the resulting evidence.

## Outcome and acceptance

- A reader can describe a topic, find distinct articles, inspect matching source passages and open the actual paragraph.
- A typed search package owns document identity, query interpretation, retrieval, article grouping, excerpt selection and result provenance behind a small interface. HTML extraction, embedding inference, persistence and site presentation are adapters. Avoid framework types, hosted credentials and publication-specific slugs in the domain.
- Compare the existing BM25/E5/hybrid controls with pinned MiniSearch and Pagefind under recorded conditions. Distinguish same-input retrieval comparisons from each product's native indexing and UI. Document hosted services inspected but not executed. Preserve failed runs and incomplete labels.
- Add search to the existing publication design, with a regular search page and progressively enhanced dialog. Cmd/Ctrl+K opens search; Escape closes it and returns focus. Preserve editable controls, native links, keyboard navigation, readable source text and non-JavaScript access.
- Keep source snapshots, document/query embedding compatibility and index freshness explicit. Do not present rank scores as answer confidence or classify every related result as an answer.
- Dogfood actual article and paragraph flows. Verify code, build output, activation and observed production behavior separately. Commit and push scoped changes to main after appropriate checks.
- Keep the article's seven-line weighted-sum explanation central. Separate released-weight MWG reproduction, local E5 product experiments, inspected implementation, upstream reporting and unexecuted paths. Add a focused account of the chosen search approach and its costs.

## Worklist

- [x] Read the existing experiment, failures, source coverage and delivery records.
- [x] Inspect pinned DocSearch keyboard, focus, result hierarchy and hosted-client paths; check primary Pagefind/MiniSearch documentation.
- [x] Implement the first package boundary: article/passages, HTML extraction, stable native anchors, safe document URLs and explicit index exclusions; six focused tests pass.
- [x] Record comparison inputs, method configurations and labels before new rankings.
- [x] Implement and test the package boundary, extraction, stable paragraph anchors and retrieval adapters.
- [x] Execute comparisons, inspect disagreements and choose defaults within the declared development boundary.
- [x] Integrate static index production, fallback search page, enhanced UI and keyboard behavior.
- [x] Run representative browser trials, accessibility/keyboard checks, loading/error/empty states and performance checks.
- [x] Revise the article and review every material claim against recorded evidence.
- [x] Finish isolated builds, scoped delivery, current production acceptance and private prompt backup.

## Evidence and continuity

The [comparison record](../../../packages/blog/drafts/research/modern-web-guidance/search-package/README.md) owns research conditions and outcomes. Package/API and accepted architecture documentation will live beside their implementation and in an ADR. Raw author queries, bodies, model files and operational logs remain outside Git. The existing study's closed status is preserved; this is new accepted work rather than a reinterpretation of its validation set.

Current state: the reusable [package](../../../packages/search/README.md), native UI, browser worker, static indexing, no-JavaScript word route and [ADR](../../adr/0023-publication-passage-search.md) are implemented. [Controlled comparisons](../../../packages/blog/drafts/research/modern-web-guidance/search-package/report.md) and [package acceptance](../../../packages/blog/drafts/research/modern-web-guidance/search-package/package-acceptance.md) retain mixed outcomes, source-aware labels, model/download costs and browser limitations. All 51 fixed cases completed in Node and the actual application browser worker. Nineteen package tests, 460 blog tests, workspace typechecks, content validation and isolated builds passed. The standalone MWG manuscript is polished with a dedicated own-approach section; no date/slug or Radar assignment is introduced. Private request preservation is backed up. [Delivery and activation](delivery-2026-11-14.md) record source commits, the automatic serving build, its different vector bytes, the recovered asset-retirement failure and final live paragraph navigation. Accepted work is complete. Later relevance, device-cost or adoption studies remain separate proposals; the manuscript stays unpublished.

## Search dialog · November 20, 2026

The launcher opens a focused query field and the three latest published articles. Section and matching controls share a Filters disclosure. A query shows one source passage per article, with context and additional matches available in the dialog. Full search carries the query, mode, section and article scope in the URL fragment. The standalone form still supports a native GET word search.

Isolated Chromium and mobile WebKit checks exercised recent-article navigation, typing, clearing, passage expansion, scope transfer, model consent and Escape with focus return. Desktop and narrow phone layouts use the same markup. At 320px, the related-search consent button wraps inside the viewport.

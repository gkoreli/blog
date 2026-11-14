# Blog search package and dogfood integration

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
- [ ] Record comparison inputs, method configurations and labels before new rankings.
- [ ] Implement and test the package boundary, extraction, stable paragraph anchors and retrieval adapters.
- [ ] Execute comparisons, inspect disagreements and choose defaults within the declared development boundary.
- [ ] Integrate static index production, fallback search page, enhanced UI and keyboard behavior.
- [ ] Run representative browser trials, accessibility/keyboard checks, loading/error/empty states and performance checks.
- [ ] Revise the article and review every material claim against recorded evidence.
- [ ] Finish isolated builds, scoped delivery, current production acceptance and private prompt backup.

## Evidence and continuity

The [comparison record](../../../packages/blog/drafts/research/modern-web-guidance/search-package/README.md) owns research conditions and outcomes. Package/API and accepted architecture documentation will live beside their implementation and in an ADR. Raw author queries, bodies, model files and operational logs remain outside Git. The existing study's closed status is preserved; this is new accepted work rather than a reinterpretation of its validation set.

Current state: source inspection and the tested extraction/identity boundary. A two-record fixture confirms Pagefind 1.6.0 can be queried in Node with a confined local-file fetch adapter; no blog ranking has been run. New retrieval and deployed search behavior remain unaccepted. Next bounded action: freeze comparator configurations and question-specific labels, then execute development comparisons while implementing the retrieval interface.

# Search package: comparisons and product evidence

November 14, 2026. Active follow-up to the completed [reader-search prototype](../reader-search/README.md). The [accepted worklist](../../../../../../docs/worklist/blog-search/README.md) owns delivery. All prior MWG and E5 freezes and results remain unchanged.

The product question is whether a remembered topic leads to the right article and a useful source passage, with an affordable, maintainable implementation for this publication. No single industry-wide best search configuration is assumed. Compare representative lexical, fuzzy, static-site and dense/hybrid approaches; keep account/service evaluation distinct from methods actually executed.

## Sources inspected before implementation

- [DocSearch](https://github.com/algolia/docsearch) at `d715ca1f9ff107ca30b16937a86cbb9a1d740db4`: keyboard handling, result hierarchy, focus handling and `useSearchClient`. Its client calls Algolia; reading that code does not reproduce hosted ranking or crawler quality. [Official keyboard API](https://docsearch.algolia.com/docs/v4/api/) documents Cmd/Ctrl+K and `/`.
- [Pagefind's Node API](https://pagefind.app/docs/node-api/), [ranking controls](https://pagefind.app/docs/ranking/) and [sub-results](https://pagefind.app/docs/sub-results/): static indexing, configurable lexical ranking and heading-linked sections. Its native whole-page product differs from a controlled record-level comparison.
- [MiniSearch search options](https://lucaong.github.io/minisearch/types/MiniSearch.SearchOptions.html): BM25+, prefix/fuzzy options and field weighting. Typo tolerance does not establish semantic equivalence.
- [WAI modal dialog guidance](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/): focus entry, containment, Escape and focus return. A familiar keyboard convention is not a universal browser standard.
- The original [E5 model/runtime recipe](../passage-search/README.md) remains pinned to the measured model and Transformers.js 3.8.1. npm metadata now lists Transformers.js 4.3.2; upgrading a comparator's runtime is a separate change, not silently substituted into the historical experiment.

Official npm metadata checked during preparation lists MiniSearch 7.2.0, Pagefind 1.6.0 and parse5 8.1.1. The exact registry metadata and operational captures are retained locally; install locks and measurement receipts will identify executed versions. Source inspection is not a relevance result.

## Comparison boundary

Use the same article inventory and eligible text for controlled comparisons. Report article discovery and source-block selection separately. The previous 114 cases are regression evidence with known label limitations; they cannot become an untouched new holdout. A new question-specific pack must be written and frozen before its rankings, with source-aware authorship and any influence from earlier results disclosed. No corrected historical paragraph-accuracy number will be published.

Native Pagefind whole-page sections, a small lexical package and a local transformer have different deployment costs. Record those costs within their boundaries rather than comparing a warm arithmetic loop with a complete search request. Hosted Algolia results require an actual compatible index/account; they are not inferred from DocSearch's UI or from a package download.

The [comparison report](report.md) retains development and reserved results across lexical, fuzzy, native Pagefind, dense/hybrid and cross-encoder conditions. The [product decision](amendment-02.md) preceded reserved inspection. [Package acceptance](package-acceptance.md) covers the separately built current corpus, actual application browser worker and source navigation. [`@gkoreli/search`](../../../../../search/README.md) owns the portable API; [ADR-0023](../../../../../../docs/adr/0023-publication-passage-search.md) records its boundary. [Production acceptance](production-check.json) and the [delivery record](../../../../../../docs/worklist/blog-search/delivery-2026-11-14.md) identify the activated source, current index and actual paragraph navigation. The [worklist](../../../../../../docs/worklist/blog-search/README.md) is complete.

# Stats and shared data patterns — November 13, 2026

The Stats page now leads with a short introduction, labeled filters, defined totals and the trend chart. Visible chapters separate pages/sources, request signals and supporting evidence. A traffic-mix summary uses the existing five disjoint request groups and the same included observations as the headline. The API, database, collector, classifications and cache rules are unchanged.

The metric and comparison-row templates are shared with Design Language. Metric tiles keep the number beside its definition; daily clients remain per-day identifiers rather than people. Comparison rows print their values, wrap labels and separate the filter destination from the Open action. Period and page actions retain 44px targets. Country names and codes replace flag emoji. Chart series differ in stroke style and color, with a dated readout and an accessible data table.

Native section links navigate the complete report. Fragment-only history changes no longer refetch the API, hide the dashboard or reset the scroll position. Direct section URLs scroll after the asynchronous report becomes available. The category selector, period controls, scoped filters, JSON link and browser history retain the same URL contract. All returned classification reasons are visible; the existing cache-method diagnostic disclosure stays secondary.

## Reference study

[GOV.UK tabs guidance](https://design-system.service.gov.uk/components/tabs/) distinguishes section switching from page navigation and notes the discovery cost of hidden content. This report uses native section links and keeps results in the page. [Government Analysis Function chart guidance](https://analysisfunction.civilservice.gov.uk/policy-store/data-visualisation-charts/) supports readable chart text and access to the underlying data. These references informed presentation choices; they do not establish reader comprehension or the effectiveness of this design.

## Verification boundary

The baseline was inspected on the live page at 1280 × 720: totals began at 638px and the chart section at 1380px from the document top. Local review reuses one saved public 30-day/all report with its original calculation time. Controlled empty and unavailable states are explicitly local fixtures. No production filter grid, database mutation or new measurement interpretation is part of this work.

Local types, 451 site tests, 34 Markdown validations and an isolated 45-post build pass. Tests cover traffic-group reconciliation, native filter/section structure and escaping of captured labels and unsafe destinations. Browser review covers 393px controls and 320px chart/table containment, 44px filter and page-action targets, native section navigation without an extra data request, URL/filter history, service failure/retry and an empty report. Both light and dark themes and the shared Design Language examples pass the 320px check. At the same 1280 × 720 viewport, totals now begin at 421px and the chart section at 567px. These are layout and interaction observations, not a measured reader-use outcome. Source delivery and fresh production acceptance follow separately.

## Delivered and verified

Implementation `ef66ea11cb632ebeb0bdbd406fd1fb74e710c276` was integrated with concurrent main changes; all 453 combined site tests, types and the 45-post build passed. Final stylesheet correction `eb271c100b1cc7fdec4ac56c70f039621d157532` keeps the full load announcement available to assistive technology without repeating the visible total. Its production build passed and Cloudflare build `e59955af-9b06-46d1-a0c9-4a55055a34b2` completed successfully.

The [fresh acceptance receipt](../../drafts/research/ai-site-audit/2026-11-13-stats-design-acceptance.json) records matching served identity on Stats, Design Language and the homepage, plus exact Stats/CSS assets reproduced with the public build metadata. The live browser loaded the default report, selected Browser signals and a seven-day period, inspected hourly values, opened the data table by keyboard and verified 320px containment. Shared pattern examples also fit at 320px. The final default report and visually hidden announcement were checked after the stylesheet correction. Production checks were bounded UI use, not a filter-grid benchmark or new audience measurement. The requested implementation is delivered; further usefulness is a reader-feedback outcome.

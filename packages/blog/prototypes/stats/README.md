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


## Reading hierarchy refinement — November 13

A follow-up keeps the report's depth while separating results, record coverage and interpretation. Result panels lead with their data. Shared visible reading notes follow the results, retain the full evidence boundaries and use short paragraphs at 14px. Coverage counts use escaped definition-list markup; zero values remain printed and overlapping facts are labeled. The Design Language page renders the same note template and coverage renderer with illustrative inputs.

Page paths have the full report width. Detached heading subtitles are removed, and device-type claims, network countries and the names/categories/signatures table have more descriptive headings. Classification reasons sit beneath their category heading in a responsive two-column list, avoiding the large holes produced by unequal category lengths. Compound signature reasons and archive-network codes receive readable labels, with original codes retained as titles, in filter destinations and in the unchanged JSON. Evidence tables keep complete rows, readable field names and horizontal containment on narrow screens.

The complete methodology is organized into five visible, directly linked topics. A source comparison confirms all 17 original method paragraphs and all 23 result sections remain. Existing top-ten rankings, complete evidence tables, all classification reasons, secondary cache diagnostics, data definitions, API contracts, stored counts and collection rules are preserved.

Local verification passed workspace types, 455 site tests, 34 Markdown validations and isolated 45-post builds. The saved 30-day/all report retained both headline values, all 80 classification reasons, 136 signature-evidence rows, 204 name/category/signature rows, 53 native-category rows, four Fetch Metadata rows and all existing coverage counts. All 16 reading notes survived a controlled failed filter request and history restoration. Light/dark review and 320px checks covered report and shared patterns without page overflow. These observations concern rendering and preservation, not new traffic measurement or reader comprehension. Source delivery and fresh served acceptance follow separately.

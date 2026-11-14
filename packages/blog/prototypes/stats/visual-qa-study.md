# Stats visual QA and report study — November 13, 2026

This pass changes the presentation of the existing report. It retains all 23 result sections, the same API requests and consistency checks, the existing ranking limits, complete evidence records, all classification reasons and the full method text. Collection, classifications, SQL, privacy and cache behavior are unchanged.

## Findings and decisions

The baseline at 1280 × 720 put a 728px report in the publication's editorial grid. The saved report occupied 49,423px of document height. Long evidence tables repeated classification labels in each row; unrelated verification and cache facts received the same ranking bars as pages and countries. Generic reading-note labels and small detached metadata competed with the data. Section navigation disappeared during the long scroll. Phone tables initially exposed labels while request counts were far to the right.

An initial wider pass improved the evidence tables but left the trend below a full row of totals. The selected composition puts the defined totals beside the trend on desktop, and uses a compact two-column summary above it on phones. Native filters stay explicit; redundant introductory labels are removed. The selected period, calculation time, partial-bucket boundary and exclusion count stay in the overview. A loading surface prevents the method chapter from flashing into the report's place while data loads.

| Area | Revised pattern |
| --- | --- |
| Shell | Shared report variant, with the existing sidebar, a wider data area, a 1440px outer limit and the unchanged mobile shell. |
| Orientation | Sticky five-link section index with a current-location cue, plus direct links to evidence and method topics. |
| Page rankings | Readable publication titles with exact paths in the same generous filter target; Open remains a separate native link. Unknown paths keep their original label. |
| Comparisons | Quiet area bars for rankings. A labeled five-group distribution uses the existing disjoint request counts. Color remains supplementary to names and printed numbers. |
| Diagnostic facts | Visible definition lists; signature coverage, candidate selection and provider booleans have named subgroups. Overlapping facts are not presented as competing rankings. |
| Evidence | Common classification context is a row-group heading. Every underlying row, full evidence label, verifier version and count remains visible in the document. |
| Request context | The same 28 parsing facts are transposed into seven states across four request fields. The overlapping parameter counts remain explicit. |
| Phone tables | Wrapped captions and group labels, a visible request-count column, a scroll cue and native keyboard access to additional columns. |
| Interpretation | Visible contextual notes with readable text and a quiet surface, followed by the complete linked methodology. |

## Reference study

[Carbon's data-table guidance](https://www.carbondesignsystem.com/building-blocks/core/components/data-table/guidelines) informed the wider comparison area, consistent row rhythm and separation of table titles, headers and records. [GOV.UK's table guidance](https://design-system.service.gov.uk/components/table/) informed captions, semantic headers and right-aligned numeric comparisons. These are design references; they are not evidence that this page is easier for readers to understand. The implementation keeps core results visible rather than adopting expandable records or pagination.

The report remains part of the publication: Lora for text, monospace for numbers and technical metadata, the same warm palette, native controls and the same navigation. Shared comparison rows, coverage lists, contextual notes and grouped evidence are rendered by the real components on Design Language; its sample records are explicitly illustrative.

## Preservation comparison

A local preview served the previous published HTML, Stats bundle and styles beside the revised implementation. Both used the same saved 30-day/all public response, including its original calculation time. DOM records were normalized by their actual page paths, classification context, evidence cells and printed counts; sorting accounts for the new grouping order.

All nine comparisons matched: headline totals; chart buckets and counts; ranked and diagnostic rows; coverage counts; all classification reasons; full signature, client and native-category records; all 28 Fetch Metadata facts; reading-note bodies; and method-paragraph bodies. The comparison includes 80 reasons, 136 signature records, 204 combined-evidence records and 53 provider-category records. Zero, missing, historical and unrecognized states remain separate.

At the same desktop viewport the final saved-data page measures 43,264px, a reduction of 6,159px without removing records or note bodies. The report width is 964px. These are rendering measurements using a dated saved report, not current traffic measurements, reading-time results or a comprehension study. Raw responses, snapshots and screenshots remain outside Git.

## Local visual and interaction QA

Desktop, 900px tablet, 393px phone and 320px phone layouts were reviewed, with light and dark themes. The page has no horizontal overflow; wide tables keep their own horizontal scroll. The 320px report retains 44px filter, section-link and page-action targets. Table scrolling and method navigation work by keyboard, headings clear the sticky index and the active chapter follows scrolling. Four native topic jumps produce zero additional API calls beyond the initial load.

Controlled unavailable and empty responses preserve a useful status and the complete method. History restoration brings back every note and all records. A script-free page retains the JSON fallback and measurement notes. Shared Design Language examples retain all three illustrative records, including zero, with 320px containment and keyboard scrolling. Tests cover record and zero preservation, escaping, unsafe destinations, title-catalogue SSG output, all 28 transposed facts and existing report structure.

Source delivery, final checks, deployment activation and fresh public acceptance are recorded separately in the delivery record below.


## Delivery and fresh public acceptance

Implementation `0e31268b0b74359ec498702a2890cc83df3e976d` was pushed directly to main after workspace types, 457 site tests, 35 Markdown validations, referral-policy verification, the private-prompt guard and an isolated 46-post production build passed. Concurrent documentation and publication work was preserved. Cloudflare build `8912caab-29b9-4bd7-9eb5-04c1b822d3b6` completed successfully.

The [fresh acceptance receipt](../../drafts/research/ai-site-audit/2026-11-13-stats-visual-acceptance.json) records six read-only public page/asset requests with matching served identity and exact Stats, Stats stylesheet and shared stylesheet hashes. The homepage retains its default shell. The live report has its 964px desktop area, all 16 reading notes, five method topics, ten mapped page titles, all 393 combined evidence records and seven parsing-state rows. Browser signals filtering retains every verification fact, prints zero selected-name coverage and updates the JSON link; restoring All works. Native evidence navigation works by keyboard. The 320px dark-theme report has no page overflow, keeps request counts on screen and allows keyboard table scrolling. Shared examples retain all three illustrative records and zero at the same width. No new disclosures or pagination hide results. The requested visual revision is delivered; reader comprehension remains an outcome for future feedback rather than a measured result.

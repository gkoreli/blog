# Manuscript review for publication

November 13, 2026, America/Los_Angeles. Scope: review and polish the existing manuscript against saved evidence and pinned source. Research results, learned data, frozen reproduction scripts and interface-study records remain unchanged. The source remains outside `posts/`; this review does not deploy or publish a site route.

## Consequential changes

| Finding | Revision |
| --- | --- |
| Training background delayed the promised explanation | Put the loop first; explain row indices, flat-array offsets, folded scales, contribution fractions and fixed output dimensions |
| A weighted sum alone did not explain normalization | Add a clearly illustrative two-dimensional example; verify the arithmetic; distinguish it from measured model rows |
| A reproduction-led title could imply reproduction of the full upstream result | Use “How Modern Web Guidance’s seven-line embedder works”; state the scope of each result beside it |
| The timing table did not identify which implementation was timed | Explicitly name upstream's original embedSync; the separate implementation checked coordinate equality |
| “Recreated search” could imply a fully independent retriever | Disclose reuse of the original corpus loader, BM25 and rank-fusion functions |
| Dataset qualifications followed the score table | Explain upstream pooled labels, ten exclusions and the different grade-2 metric before the scores |
| Training method could read as independently verified table provenance | Attribute the inspected recipe and documented training population; distinguish using released weights from reproducing their creation |
| General discussion of negation could exceed the tested control | Keep the precise removed-not example and explain the absence of a learned word-order term |
| The downstream interface study distracted from the loop | Condense it to a separate evidence boundary with its denominator, ceiling and linked harness history |

The body retains the current archive discrepancy, unjudged retrieval candidates, out-of-scope admission results, float32 word-order qualification and the absence of historical-runtime or private-telemetry reproduction. Title, search title and description are aligned in [the editorial record](editorial.md).

## Acceptance

Source and saved-evidence review passed. The worked example normalizes `[1, 0.5]` to approximately `[0.894, 0.447]`; these are illustrative values. Checks passed for eight Markdown files, 74 local links, owned evidence links, one body H1, balanced code fences and the intended seven-line source excerpt. The saved-evidence verifier accepted all six frozen local files, three process receipts, 604 ranking rows and archive inventory totals. No benchmark was rerun and no model generation was added for this review.

A standalone reading preview rendered with the existing marked 17.0.4 parser was inspected in the in-app browser at widths 1,280 and 390 pixels. It contained the expected six tables and one code block. At narrow width, the code fitted its container, tables scrolled inside their wrappers and the document had no horizontal overflow. The temporary viewport override was reset. This is manuscript-format acceptance, not a production site build or deployment check.

The title, opening, headings, example, source labels, result tables and ending were reviewed together for scope and readability. Private source-message preservation and scoped public-diff review remain part of delivery; raw source wording and operational captures are excluded from public files.

Next bounded action: release preparation and publication when requested. The manuscript review is not evidence of deployment activation, current served behavior or reader reception.

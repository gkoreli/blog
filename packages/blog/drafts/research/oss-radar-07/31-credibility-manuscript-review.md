# Credibility and voice review of the rewritten manuscript

Reviewed September 11, 2026, against [the manuscript](../../oss-radar-07-promptfoo.md), SHA-256 `6d0b7f662514999209509502c1886ccce3ba082125e23c33392934c5dbfe4b25`. Line references below describe that snapshot. No article edits were made.

**Result:** no factual blocker found in the Wallat, Khan, or Google passages. The rewritten article has a clear publisher stake and makes real choices among projects. The main unresolved issue is that the closing predictions and their proposed tests measure different things.

## Findings

1. **Medium — make the bets match their tests (lines 126–128).** The first predicts that citation checks will enter ordinary test suites, while its test asks whether they catch useful errors at acceptable cost. Usefulness can support adoption but cannot establish it. Either narrow the prediction to additional errors caught by a citation check, or name an adoption sample, date, and observable threshold. The second predicts a better long-term publishing strategy, while its proposed test concerns decisions from supplied evidence. Keep the publishing ambition, but label the experiment as testing correct use after retrieval. It cannot by itself establish more organic discovery, readership, or sustained publishing success.

2. **Editorial — the strongest personal stake still comes after four percentages (opening, lines 3–11).** The original OSS Radar #01 gets its energy from selective attention, concrete judgments, and an author willing to prefer one project. The new manuscript does this in the OpenScholar verdict and the wrong-source evaluator comparison. Its opening is more academic: the reader gets several ratings before learning why a mistake under this blog's URL matters. Move the existing publisher stake closer to the first sentence, then let the STORM comparison substantiate it. Preserve the first paragraph's significance and the ensuing finding bullets.

3. **Editorial — let more section endings finish on the decision.** The repeated “My take” structure is serviceable, but several conclusions end with another limit: “A successful export is still only a successful export,” for example. The body has already earned those boundaries. Ending selected sections with the concrete choice—what to inspect, use, retain, or test—would give the cohort more of #01's energy without increasing factual confidence. Keep the current final paragraph; it states the author's ambition plainly.

## Claim checks

| Passage | Decision | Basis |
| --- | --- | --- |
| Wallat, lines 97–99 | Pass | Correct final-paper condition: 273 citations among 476 cases retaining the statement, from 702 attempted perturbations. The manuscript avoids treating this as current prevalence and keeps supportive evidence useful even when causal reliance is unknown. [Final paper, Figure 6](https://staff.fnwi.uva.nl/m.derijke/wp-content/papercite-data/pdf/wallat-2025-correctness.pdf). |
| Khan, line 109 | Pass; optional precision | Twelve models and supplied-candidate selection are accurate. “Holding supplied content constant” is reasonable shorthand; “holding the supplied information semantically equivalent” follows the paper's paired-content description more exactly. No organic-blog ranking claim is made. [Primary paper, §2–4](https://www.microsoft.com/en-us/research/wp-content/uploads/2026/04/khan26_iclr.pdf). |
| Google, line 111 | Pass | Index/snippet eligibility and the absence of a special AI-file/schema requirement match its AI Overviews/AI Mode guidance. The manuscript distinguishes recommendations from promises. Naming those two features would make the scope even more explicit. [AI-feature guidance](https://developers.google.com/search/docs/appearance/ai-features); [helpful-content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content). |
| Publisher practices, lines 107–120 | Pass as editorial judgment | Methods, versions, populations, inspectable artifacts, and corrections serve the reader's ability to evaluate a claim. The paragraph explicitly identifies this as publishing judgment and leaves organic citation effects to measurement. |
| Real-run use in the opening and social hook | Pass for the single observation | The retained review documents that Claude changed the meaning of 277 from the reclassified population to cloud-classified requests. It does not justify a model comparison or general error rate. [Source review, A4](21-real-answer-source-review.md). |

This review uses the [primary-source audit](26-source-credibility-and-citation-evidence.md), including the visually checked final Wallat figure. It does not independently approve every STORM/OpenScholar score, evaluator implementation, or publication-footprint total; those belong to the other review tracks.

The [rewritten social draft](../../social/oss-radar-07-promptfoo/launch.md) uses the concrete retained error to introduce the broader cohort. HN receives the manuscript's faithful title and author-only comment guidance, not generated comment text.


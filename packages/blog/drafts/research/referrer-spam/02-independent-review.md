# Independent review: referrer-spam engineering note

Reviewed September 7, 2026 UTC. Scope: [article passport](00-article-passport.md) and `posts/025-filter-referrer-spam-without-deleting-analytics-history.md`, checked against the shipped implementation in commit `fe9456e011e3e2dd7c0f691fe8ba8c247cd03a6d`, the activation record in commit `e1aa4a305ef934b1f089b24894321558db5f1603`, artifacts 17–19, the pinned Matomo source, and the article's prompt record.

## Decision

**Accept after three bounded wording fixes.** The note preserves its short decision-case-study form. It accurately separates a reported hostname from sender identity, the pinned Matomo source from local judgment, retained observations from reporting decisions, policy replay from an as-published response, and the fixed August 8–September 6 check from the later live August 9–September 7 report. The Matomo attribution is precise: the pinned implementation uses case-insensitive substring search over the whole referrer string, while this site applies the list at hostname-label boundaries.

## Required fixes

1. **Opening policy summary overstates unknown-host aggregation.** Line 20 says all unreviewed hostnames become an unnamed aggregate. Matomo-listed or locally excluded unreviewed hosts are omitted from included metrics instead; only unreviewed hosts that remain included contribute to “Other reported referrers.” Line 45 states the correct rule. Qualify the opening bullet with “included” or “unless an exclusion rule matches.” This distinction is part of the article's central model, so the first-section promise must be exact.

2. **Attach the 35 local exclusions to their window when first discussing source impact.** Line 53 says the local rule accounts for all 35 exclusions in “the inspected population” before defining that population. The initial September 6 dashboard capture and the later fixed August 8–September 6 verification both contain 35, but they are different reads and populations. Name the fixed window there or defer the count to the results section. Artifact 18 supports 35 local exclusions and zero Matomo-source exclusions for the fixed window; artifact 19 separately supports 35 exclusions in the live report.

3. **Remove or ground the author's “straightforward” judgment.** Line 33 says removing the name was straightforward. The prompt record establishes the wish to remove the exposure while preserving provenance, but it does not contain that assessment of difficulty. A factual formulation such as “Suppressing the name alone would not preserve the reason or evidence” keeps the design contrast without putting an unsupported evaluation in the author's voice.

## Verified claims and boundaries

- The quoted sentence at line 31 is one complete prompt message, reproduced verbatim.
- The pinned Matomo revision contains 2,348 canonical hosts and omits `uniuit.com`; the deployed policy therefore needs the local exclusion. Source: artifact 18 and the archived `spammers.txt` commitment `83d2f174807c72987e73611fd7b36776bab02ee85fccc7b705d3be1bfa2a80b5`.
- The fixed-window arithmetic is supported: 972 before policy, 937 included, 35 excluded; 60 named + 7 other + 870 absent = 937. The article correctly says the reads were separate and non-transactional. Source: artifact 18.
- The production totals-query comparison, 7.77 ms/8,423 rows read versus 14.95 ms/19,826 rows read, is quoted within its measured database boundary. Source: artifact 18.
- Deployment and live verification are supported by the activation record: policy `2026-09-06.2`, source revision `e65db652`, code commit `fe9456e`, and the later live report. The article does not turn capture time into activation time. Source: artifact 19 and `packages/analytics/policies/activations/2026-09-07.1.json`.
- The capture command stores the exact received JSON text and its hash, validates advertised policy provenance and public names, and refuses overwrite. Captures are explicit rather than continuous. Source: shipped `referral-policy.ts`, `referral-policy.models.ts`, and the policy maintenance guide.
- The limits remain honest: referrers do not authenticate identity or intent; list membership can be wrong; included observations are not proven people; retained data contains a bounded hostname rather than the original header.

No additional section, tutorial, benchmark detail, or full ADR restatement is needed. After the three fixes, the article satisfies the passport's reader job and evidence boundary.

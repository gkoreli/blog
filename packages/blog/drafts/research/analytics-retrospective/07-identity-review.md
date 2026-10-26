# Identity and evidence review

October 25, 2026 Pacific. Reviewed the [article](../../../posts/030-building-blog-analytics-what-the-numbers-can-prove.md), [improvement plan](05-improvement-plan.md), [Wrangler follow-up](03-wrangler-followup.md), its SQL, and the [standards/library evidence](02-standards-and-libraries.md). No production or credential calls and no article/plan edits were made in this review.

## Verdict

No blocking identity or deterministic-attribution overclaim found. The retrospective can publish while controlled calibration remains open. It makes a useful distinction between a deterministic query over retained evidence and an authenticated identity/purpose claim. The improvement plan preserves the important unknowns and separates proposed work from accepted releases.

## Two small precision improvements

1. **Distinguish coverage from replay uniqueness in the article's signature paragraph.** It correctly explains that an authority-bound signature can be reused across paths/methods/bodies. Add the local implementation fact that timestamps are checked but nonce reuse is not tracked. Narrower path/method coverage would restrict what can be replayed; it would not by itself establish a one-time request. Suggested factual addition: “Our verifier checks validity times but does not track nonce reuse. Narrower request coverage and replay uniqueness are separate questions.” This strengthens the reader's understanding without declaring the draft's minimum invalid or requiring a replay store before publication.
2. **Avoid implying vendor recognition in the plan's key-verification example.** In “Candidate evidence model,” change the example “Covered bytes accepted for documented origin” to “Covered bytes accepted under the selected directory key.” The following vendor-recognition row already supplies the separate documented-vendor association. The current local verifier can resolve arbitrary supported HTTPS directories; “documented origin” should not silently imply that the directory was independently recognized as a vendor.

These are scoped wording improvements, not a new acceptance gate or a demand to implement cryptographic/authentication changes during the writing pass.

## Claims checked and retained

| Area | Review result |
|---|---|
| R1 context | The 138 cross-site / 135 none / 124 same-origin split matches the follow-up. The article treats external-referrer/same-origin combinations as a question, not an impossible browser state, proven fabrication or operator attribution. It correctly leaves even cross-site declarations unauthenticated. |
| Same-ID behavior | The context SELECT joins R1's IDs against the same owner-filtered, cutoff-bounded public population across reader kinds. The article's “in that inspected population” qualification is necessary and present. This does not prove no later, differently identified, excluded, cached or unrecorded continuation. |
| Exa/Ahrefs roles | The fresh aggregation records the generic class and null names; the local official-UA probe explains a concrete catalogue gap. Neither establishes which exact UA appeared in each historical event. The common Exa signer cannot assign ExaSearchBot versus ExaUser, and the article does not attempt that reconstruction. |
| Signature trust | The article distinguishes native crypto primitives from the local protocol parser/policy; RFC 9421 from the evolving bot-specific draft; arbitrary directory association from independently recognized vendor identity; and recorded outcomes from fresh message verification. No unsupported full-conformance or superiority claim appears. |
| Role assertions | The article and plan say that a declared UA/role can change independently of an uncovered signature. A future catalogue update therefore preserves the declaration as evidence rather than promoting it into authenticated request purpose. |
| Authorization | An optional credential or scoped action receipt remains proposed and tied to a real cooperative client. Possession/validated scope is separated from the physical operator, request-by-request human trigger, reading and comprehension. It does not retrospectively identify R1 and does not gate public reading. |
| History/privacy | The article scopes IP/UA minimization to the edge table, calls the HMAC pseudonymous, preserves original archive versus minimized copy, and explains that discarded headers cannot be reconstructed by changing a parser. It makes no general anonymity or deletion claim. |
| Native evidence | Actual field availability and retained-log access remain unverified despite current documentation. Product categories, documented behavior and identity signals are kept separate from a particular user's request. |
| Next plan | Owner exclusion precedes new controlled traffic. Candidate field collection is conditional on a named decision, retention and public projection. R1 inclusion/exclusion needs an explicit policy rationale and false-exclusion tradeoff; no actor identity is required to make an honest reporting-policy decision. |

The plan's supported-profile review appropriately treats narrower coverage, maximum age and replay state as choices requiring interoperability, privacy and cost evidence. Preserve that distinction. Do not substitute a mandatory auth system, broad raw logging or a smaller Browser total for the existing bounded experiments.

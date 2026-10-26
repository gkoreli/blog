# Analytics retrospective — worklist and shaping notes

Requested October 25, 2026 Pacific. New retrospective article and improvement plan; existing calibration, identity/purpose, and referral tasks retain their scope and history.

## Governing form and question

A retrospective builder's article, governed by the evidence-led engineering investigation workflow. What can an independently inspectable page counter establish, which repairs made this implementation more explainable, and which audience claims remain unsupported?

Working claim: the useful result of this work is a more inspectable measurement system, not an established count of people. Falsifiers and limits: reconciled aggregates alone do not establish ingestion completeness or classification accuracy; empirical errors or a stronger supported audience measure would narrow this account. Current evidence can still show correct implementation, explicit selection, preserved history, and bounded unresolved questions.

Reader promise: explain how to define page events, preserve method changes, distinguish identity from purpose, defend public referrers, control D1 query work, and design the next calibration experiment.

Author promise: show Goga's actual beacon-to-edge migration, classification and provenance repairs, referral-policy work, D1 incident and recovery, referrer-context release, October audit, and still-open calibration work. Do not invent motives, feelings, human outcomes, or completed experiments.

## Evidence ownership

- [Today's audit](../edge-vs-rum/05-analytics-audit-2026-10-25.md), [sanitized measurements](../edge-vs-rum/2026-10-25-audit.json), and [exact queries](../edge-vs-rum/2026-10-25-audit.sql) remain the authoritative dated capture. Reuse them; no new production traffic or broad extraction is needed merely to write this article.
- Historical decisions/releases are evidence of their dated states, not today's production behavior.
- Native capabilities and library behavior require primary documentation or pinned source. Cross-reference documentation, the implementation, measured acceptance, and limitations.
- Raw captures, credentials, session logs, and unreviewed referral names stay outside Git.
- Retain the complete five owner messages that shaped this article: the audit request, retrospective/research/plan request, two follow-up questions with their interface annotation context, and the request to use Wrangler. No measured token footprint is promised.

## Work

- [x] Create the article's evidence directory and establish the governing question.
- [x] Review primary Cloudflare documentation against the deployed implementation and accessible product capabilities.
- [x] Review the standards and pinned libraries used for identity, classification, validation, and referral policy.
- [x] Reconcile historical decisions, observed releases, corrections, and current limits in a claim ledger.
- [x] Write a dependency-ordered improvement plan with explicit acceptance evidence and open questions.
- [x] Write the article, complete prompt provenance, contextual cross-references, and a reference glossary.
- [x] Apply discovery positioning, engineering review, and prose polish.
- [x] Validate the source, isolated generated article/prompts/Markdown representations, links, and required repository checks.
- [x] Commit and push the scoped work to main; keep source delivery, deployment, and measured production acceptance separate.

No improvement implementation or recurring capture is running from this writing request. The plan must distinguish intended engineering from accepted releases.

## Evidence and delivery index

- [Native platform capabilities](01-native-capabilities.md): primary Cloudflare references, local implementation/receipt mapping, entitlements and actual-access gaps.
- [Standards and libraries](02-standards-and-libraries.md): versioned protocol/vendor/library sources, verifier trust/coverage limits and the [maintained local probe](probe-ua-coverage.mts) / [saved results](ua-coverage.json).
- [Wrangler follow-up](03-wrangler-followup.md), [SQL templates](wrangler-followup.sql), and [sanitized results](wrangler-followup.json): six zero-row-write SELECTs, 213,067 reads; combined with the first audit, 630,169 measured direct SQL reads, excluding public-report fills.
- [Claim/release ledger](04-claims-and-release-ledger.md) and [improvement plan](05-improvement-plan.md): completed work, corrections, evidence gates and next bounded actions.
- Independent [native review](06-native-review.md) and [identity review](07-identity-review.md): no blocking claim errors; the article/plan incorporates all four precision recommendations.
- [Article source](../../../posts/030-building-blog-analytics-what-the-numbers-can-prove.md) and [five complete shaping messages](../../../prompts/building-blog-analytics-what-the-numbers-can-prove.prompts.md). The prior referrer article gains a navigation link and modification date; its prompts and frozen footprint remain unchanged.

Validation: workspace typechecks and Markdown frontmatter validation pass. An isolated source copy built 31 posts, with one article H1, complete HTML/Markdown representations, five escaped prompt blocks, 30 article internal links/anchors, and a working predecessor link. Research/document links, fragments, JSON, fences, aggregate invariants and omission of R1's private hostname are checked. The initial representation assertion was corrected to accept the generated Markdown's leading newline; no content change was needed. No shared development `dist/` was overwritten or server stopped.

Private originals are retained at `~/.local/share/gkoreli/analytics-evidence/2026-10-26-analytics-retrospective/`; today's earlier audit archive remains separate and frozen. Documentation URLs and check dates are preserved; live documentation pages can change. Pinned standards/source versions and local source hashes identify the particular reviewed material where available. Private hashes are commitments for the author, not independent public authentication of provider data.

This article's commit records checked source delivery to main. No new analytics runtime behavior, reporting policy, authorization service or classifier repair is claimed by it. Deployment activation and live article-body acceptance were not measured in this writing pass; source delivery and the isolated build do not establish either. No recurring capture, browser trial or background tail was scheduled.

Completed: source research, Wrangler evidence extension, cross-references, prospective plan, retrospective, provenance and source/build checks. Open engineering remains in the existing tasks. First bounded implementation: actual owner/test-browser exclusion acceptance, followed by the independent identity/role model and known catalogue gaps. Historical log access and native field availability need a supported actual-access receipt; the installed CLI inventory does not provide one.

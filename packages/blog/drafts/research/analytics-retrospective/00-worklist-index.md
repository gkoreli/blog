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

This article's commit records checked source delivery to main. No new analytics runtime behavior, reporting policy, authorization service or classifier repair is claimed by it. At source delivery `c4a8ae8`, deployment activation and live article-body acceptance were still unverified. The subsequent [publication receipt](publication-acceptance.json) records a 100% Worker activation at October 26 01:31:31 UTC, 200 HEAD responses for article/prompts, the five-prompt public metadata, and live Markdown exactly matching the isolated build. The HTML body and rendered production UI were not fetched; availability/Markdown acceptance is the stated scope, not a full browser-layout test. No direct Git-to-Worker attestation was inferred. No recurring capture, browser trial or background tail was scheduled.

Completed: source research, Wrangler evidence extension, cross-references, prospective plan, retrospective, provenance and source/build checks. Open engineering remains in the existing tasks. First bounded implementation: actual owner/test-browser exclusion acceptance, followed by the independent identity/role model and known catalogue gaps. Historical log access and native field availability need a supported actual-access receipt; the installed CLI inventory does not provide one.

## Completion audit — October 25 Pacific / October 26 UTC

The requested evidence exploration, capture, authoritative native/library references, implementation cross-references, improvement plan and retrospective are delivered. The current article source and plan were inspected against the claim ledger; current installed dependency versions match the review; eight initial-audit and sixteen follow-up capture commitments match the private originals; the maintained probe and classifier hashes match the saved run. Source `c4a8ae8` is on main, and the live Markdown/index checks establish publication of the same article content and five-prompt provenance. The publication receipt records these checks and their limits.

Implementation of the proposed iterations is a future objective, not a missing deliverable of this research/plan/article request. Owner/browser calibration, role-model changes, R1 policy decisions, native-field availability and historical log access remain open exactly where the plan says they do. No additional production SQL or test page traffic was needed to close this publication audit.

## Follow-up implementation — October 25 Pacific / October 26 UTC

The later explicit Exa/Ahrefs repair request authorizes implementation and article revision. The original research/publication completion audit above remains a dated receipt, not the current implementation status.

- [Classification repair](08-classification-repair.md), [after probe](ua-coverage-after.json), [Cloudflare-local D1 results](classification-local-d1.json) and [reproducer](check-classification-local-d1.mjs) preserve the new evidence alongside the unchanged baseline.
- [ADR-0016.8](../../../../../docs/adr/0016.8-declared-client-roles-and-signer-evidence.md) records the changed precedence, public labels, independent signer aggregate and no-backfill decision.
- The article now includes this bounded repair and six complete shaping messages. It retains the frozen audit's totals, unknown historical roles and unresolved R1 attribution.
- Local checks pass. Source `0d12382` was pushed; Wrangler activation, four excluded live UA controls, the separate signer report and a cache MISS/HIT are accepted in the [release receipt](classification-release-acceptance.json). Signed-role preservation uses a local fixture key; no organic vendor-signature acceptance is claimed. TASK-0119 is in progress, not complete. No recurring capture is scheduled.

Next bounded action after this repair: verify actual owner-browser exclusion before calibration. Per-observation versions, native entitlement/field acceptance and signature-profile work remain open.

## Follow-up understanding — October 25 Pacific / October 26 UTC

[Field semantics and evidence boundaries](09-field-semantics-and-evidence-boundaries.md) cross-references seven primary documentation sources with the current extractor, parser, writer, route lookup and background lifecycle. [Eleven referrer and five simulated network cases](field-semantics.json), [reproducer](probe-field-semantics.mjs), establish local transformations; analytics tests pass 57/57. This review makes no production calls and does not complete native/runtime or browser acceptance.

The article now distinguishes populated fields from validated values, hostname grouping from browser origin, origin-only root ambiguity and unsupported legitimate referrer forms. It also explicitly limits the original audit to September 27–partial October 26: the September 9–26 gap is still unanalysed. Four subsequent shaping messages, including the annotated request, bring provenance to ten complete messages. Baseline capture files and original release receipts remain frozen.

Next bounded analysis: a locally checked, budgeted release-to-cutoff aggregate for the complete interval, preserving windows and method boundaries. Actual owner-browser exclusion remains the gate before navigation/calibration experiments. Meaning/validation changes identified by this probe are proposals, not deployed repairs.

Validation for this follow-up: 57 analytics tests; frontmatter validation; 78 local document links; saved JSON and source commitments; isolated production generation of 31 posts; one article H1 and ten escaped prompt blocks. Shared dist and other servers were untouched. Source publication and subsequent live article verification remain separate from this local acceptance.

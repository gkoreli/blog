# Agent access: the next Stats direction

November 14, 2026 UTC. Agent-mediated reach and use are the selected near-term priority for Stats. This supersedes the generic build order in the [earlier reader-understanding investigation](stats-reader-understanding-2026-11-14.md); its dated observation remains intact. The direction is accepted. The milestones below are a concrete implementation proposal, not delivered features or authorization for paid provider trials.

[ADR-0016.19](../../adr/0016.19-agent-mediated-audience-growth.md) already recognizes agent reach, discovery, citations and supported use as outcomes. The next work should connect the existing evidence to articles and publishing decisions, with each observation stage identifiable.

## Questions and evidence

| Question | Available basis | Missing work |
| --- | --- | --- |
| Which articles and evidence pages receive agent access? | Stored canonical path, time, declared client/kind, signature and network assessments; the offline [resource report](../../../packages/analytics/src/resource-reach.ts) already separates article/evidence/site roles. | A live article/resource-by-client report with explicit catalogue and observation coverage. |
| What format is served? | HTML/Markdown representation is already stored. | A joint article/client/format view. Requested preference and negotiation route need separate bounded capture; served Markdown alone does not explain how it was requested. |
| Is access sustained or concentrated in a burst? | Canonical event times and declared names. | Active UTC days and completed-week counts by article/client. Repeated access by the same declared client is not the return of an identified agent or person. |
| Are updates fetched again? | Article metadata supplies publication context. | A content revision bound to the actual served representation, plus an update timeline. Measure first observed post-update access; absence of a recorded refetch does not establish a stale external index. |
| Can an agent obtain the work successfully? | Our collector records eligible successful page GETs. [Cloudflare](https://developers.cloudflare.com/ai-crawl-control/features/analyze-ai-traffic/) documents blocked/error responses, transfer and requested/served formats at its broader observation point. | Reuse available upstream evidence for access failures. Keep attempts, redirects, HEAD checks, 304 revalidations and served bodies distinct, with their own denominators. |
| Does an answer cite or use the work correctly? | Existing [discovery analyzer](../../../packages/analytics/src/agent-discovery-evidence.ts) and [answer-review protocol](../../../packages/blog/drafts/research/discovery-experiment-02/13-public-answer-fidelity-protocol.md). | New bounded answer observations with exact citations, source versions and task criteria. Request logs alone cannot supply these results. |

The existing Agents filter includes declared on-demand fetchers and historical/unknown-role signed clients. It is not the complete AI-access population: AI-search and AI-crawler declarations appear under Crawlers. A valid signature does not establish a request's purpose. The new report should show those scopes and proof bases separately; hosting-list matches and unresolved traffic should remain inspectable without being promoted to identified AI use.

## First milestone: an Agent access report

Use a canonical report over 28 completed UTC days, with article, declared-client/role and served-format breakdowns. Keep partial-today activity separate. The blog supplies its article/resource catalogue; the analytics package supplies the portable aggregation and validated report contract.

The report should answer, for a selected article:

- Which named client declarations accessed it, under which stored roles?
- How many HTML and Markdown events were recorded, on how many UTC days?
- What changed across the four completed weeks, and are the collection/classifier profiles comparable?
- Was access concentrated on the article, or did its registered evidence resources also receive requests?
- Which signature/network evidence supports the attribution, and what remains missing or historical?

Use exact registered resource relationships, not guessed path suffixes. Keep article and evidence requests separate before showing related-resource totals. Do not imply that neighboring timestamps or a shared declared name form a session or prove that one actor followed a link. Unknown names and older/malformed representations remain visible. The current catalogue also does not establish that every listed resource existed throughout the historical window.

The useful result is a decision such as improving the machine-readable reference, making supporting evidence discoverable, correcting a stale explanation or leaving an article alone. Request volume and evidence-resource access are meaningful reach observations; further use can be investigated independently.

### Acceptance

1. Joint article/client/role/format counts reconcile with the included cohort and explicitly account for non-article/unregistered or unknown evidence. Client names remain declarations; reviewed signing publishers and network checks retain their separate meanings.
2. Reuse owner/referral exclusions and preserve original rows. Native D1 source/projection comparisons cover old and current formats; malformed or missing report sections fail visibly instead of becoming zeros.
3. Use a bounded catalogue, closed dimensions and one shared cached report. Article/client selections reuse that report rather than generating an unbounded request matrix. Measure statement reads in native D1 and review the proposed production selection before a fresh measurement. Caching is not a global read ceiling.
4. Render a useful overview, complete accessible detail, empty/error states and responsive layouts. Validate the actual Stats markup and both themes. Record source delivery, activation and live acceptance separately.

This milestone uses retained page-access fields. It does not require changing the successful-page count or collecting prompts, full query strings, persistent cross-day identifiers or new signing proofs.

## Second milestone: delivery, resource coverage and revision freshness

Expand collection only for named gaps:

- A closed requested-format preference and negotiation route alongside the served format. Keep a generic Accept value distinct from a specific Markdown preference.
- The canonical resource ID, role and exact served content revision. Prefer a representation-specific digest over a repository commit that changes for unrelated work. Old rows without this fact remain unknown.
- Explicit access records for registered evidence files, examples and citation formats where the current page collector has no observation. A `.bib` or CSL-JSON request is resource access, not an observed citation.
- Access outcomes and transfer facts from the appropriate edge source. A Worker cannot observe a request blocked before it runs. Do not add those attempts to successful page views or derive end-to-end rates from unmatched populations.

Define payload budgets, versioning, exclusions, retention/deletion and cost before enabling these records. Keep the resource-access domain distinct from browser activity and newsletter state. Show the first observed access after a deployed content revision as a measured delay with coverage limits; it is not a measure of training, internal retrieval freshness or all-provider reindexing.

Section-level demand also needs separate evidence: URI fragments are [not sent to the server](https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Fragment). A page GET cannot reveal which heading an agent used. Exact cited fragments can be inspected in a captured answer; cooperating clients could supply their own explicit receipt under a separate contract.

## Third milestone: discovery, citations and supported use

Reuse the existing neutral-question and source-supplied protocols for a small, frozen question set tied to actual articles. Record service/mode/model availability, complete answers, cited destinations/fragments, inspected source versions and review criteria. Preserve private captures and prompts; publish only normalized methods, outcomes and source references. Controlled requests remain separate from organic access, and unavailable conditions do not count as failed answers.

The [October 31 answer trial](../../../packages/blog/drafts/research/discovery-experiment-02/14-public-answer-fidelity-results.md) records one completed neutral answer: three rubric criteria supported and three capture-specific criteria unaddressed, despite citations to relevant sources. This is a useful starting case, not a current service-wide quality estimate. Discovery appearance, a returned source card, an inline citation and supported task completion are separate results.

Show these sampled results alongside access evidence with their own denominator. Do not build a sitewide fetch-to-citation conversion rate or infer a join from timing alone. A captured answer can support an exact citation or application claim even when no corresponding fresh origin request is found.

The intended advantage is an inspectable relationship between a publication's evidence, its machine access and the answers or tasks it supports. That advantage needs demonstrated outcomes; a larger detector catalogue cannot establish it by itself.

## Current checkpoint

Planning review used clean analytics/Worker source at `9bc553139645af02f09ce20ff67f962c6f61af39`. Existing dated trials and receipts were read for scope, not rerun as fresh acceptance. Cloudflare's current guide and the URI-fragment documentation were rechecked November 14.

The continuation passes checks for 78 local links across the plan, prior assessment and owning index, balanced fences, linked priority/next-action coverage, the recorded source revision, the private-prompt guard and scoped whitespace. Runtime checks and deployment are not applicable to this documentation-only change.

No production request/query, provider trial, collection change or runtime implementation ran for this reprioritization. Campaign outcomes and browser reading-activity experiments remain later options. The next proposed implementation is the retained-data Agent access report above.

# Agent access: the next Stats direction

November 14, 2026 UTC. Agent-mediated reach and use are the selected near-term priority for Stats. This supersedes the generic build order in the [earlier reader-understanding investigation](stats-reader-understanding-2026-11-14.md); its dated observation remains intact. The first milestone is shipped and accepted below. Later collection expansion and provider trials remain proposals.

[ADR-0016.19](../../adr/0016.19-agent-mediated-audience-growth.md) already recognizes agent reach, discovery, citations and supported use as outcomes. The next work should connect the existing evidence to articles and publishing decisions, with each observation stage identifiable.

## Questions and evidence

| Question | Available basis | Status and next work |
| --- | --- | --- |
| Which articles and evidence pages receive agent access? | Stored canonical path, time, declared client/kind, signature and network assessments; the offline [resource report](../../../packages/analytics/src/resource-reach.ts) already separates article/evidence/site roles. | Shipped: a live article/resource-by-client report with explicit catalogue and observation coverage. |
| What format is served? | HTML/Markdown representation is already stored. | Shipped: a joint article/client/format view. Requested preference and negotiation route need separate bounded capture; served Markdown alone does not explain how it was requested. |
| Is access sustained or concentrated in a burst? | Canonical event times and declared names. | Shipped: active UTC days and completed-week counts by article/client. Repeated access by the same declared client is not the return of an identified agent or person. |
| Are updates fetched again? | Article metadata supplies publication context. | A content revision bound to the actual served representation, plus an update timeline. Measure first observed post-update access; absence of a recorded refetch does not establish a stale external index. |
| Can an agent obtain the work successfully? | Our collector records eligible successful page GETs. [Cloudflare](https://developers.cloudflare.com/ai-crawl-control/features/analyze-ai-traffic/) documents blocked/error responses, transfer and requested/served formats at its broader observation point. | Reuse available upstream evidence for access failures. Keep attempts, redirects, HEAD checks, 304 revalidations and served bodies distinct, with their own denominators. |
| Does an answer cite or use the work correctly? | Existing [discovery analyzer](../../../packages/analytics/src/agent-discovery-evidence.ts) and [answer-review protocol](../../../packages/blog/drafts/research/discovery-experiment-02/13-public-answer-fidelity-protocol.md). | New bounded answer observations with exact citations, source versions and task criteria. Request logs alone cannot supply these results. |

Before this milestone, the Agents filter included declared on-demand fetchers and historical/unknown-role signed clients, while AI-search and AI-crawler declarations appeared under Crawlers. The new scope explicitly includes all four roles. A valid signature does not establish a request's purpose. The new report should show those scopes and proof bases separately; hosting-list matches and unresolved traffic should remain inspectable without being promoted to identified AI use.

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

**November 14 shipped and accepted:** [ADR-0016.25](../../adr/0016.25-agent-access-report-and-inclusive-ai-scope.md) records primary provider definitions, refreshed pinned PostHog/Rybbit source, native capabilities and the resulting boundaries. The package now has the role scope, validated report/selection domain, source/projected D1 adapter, canonical cached application service, and explicit admission choice. Stats has a native report element, public-catalogue adapter and `/api/agent-access` route. Feature source `3934fce0` and final cache correction `7015bac3` are accepted on `main`; the [normalized acceptance receipt](agent-access-acceptance-2026-11-14.json) records code, activation, local checks and current production evidence separately.

The integrated workspace types, 501 analytics tests, 460 site tests, Markdown validation, native portability and the isolated 46-post build pass. The final exact-path catalogue map has an additional regression check and native verification at 57 resources / 4,800 synthetic originals and the maximum 512-resource catalogue; source and projected results agree, missing/stale facts fall back, malformed proofs fail, and all originals remain unchanged. Native current-projection cost is 244,766 reported last-attempt reads and zero writes for that synthetic fixture. Missing attempt metadata remains explicit; this is not a production billing estimate.

Actual browser checks cover desktop and 390px/320px layouts, both themes, local article/client/role selection, keyboard focus, explicit empty and failed states, loading and successful retry. Local selections added no database batches. These checks caught and repaired the unnumbered heading layout and valid measurement-stamp recognition. The production browser also confirms the overview, article selection and mobile layout. The live JavaScript/CSS match the checked build byte-for-byte; HTML differs only in the same-source Cloudflare build ID and existing Insights injection. The configured newsletter key is preserved.

An existing private 88-original historical cohort was replayed in native D1 with external transport denied. Its frozen All report matches baseline `cafc6fa0` exactly across all 27 sections and 86 included events; the new agent report agrees between source and projection for 30 events across all four roles. Original rows remain identical. Current production metadata and a zero-read constant access control passed. The date-bounded source control returned 3,850 agent-cohort events (150 on-demand, 2,308 AI-search, 773 AI-crawler, 619 signed fallback); 64 original records are retained privately for a post-activation equality check. These SELECT-only controls have reported 549,525 reads and zero writes. They are controls, not live acceptance of the new endpoint.

Production acceptance is complete. Feature source `3934fce0` was measured on Worker `fadf94c5-eca8-4349-a7a7-324e7e9ed051`, with the same script ETag as the tagged prepared release. The final cache correction is active on Worker `1fdd094c-7c65-4ecb-a6b6-b42038377afc` and identifies source `7015bac3` in the hosted build. The canonical endpoint returned MISS then HIT with identical bytes and calculation time. Whole-window accounting, totals, every role/resource total and all 657 joint cells match the saved source control. All 64 sampled historical originals remain exactly identical. The measured fill reported 414,324 reads and zero writes; the saved source/control/sample/fill checks, including the final traffic-filter control, total 993,612 reported reads and zero writes, below their one-million-read review threshold. These are declared-check counters, not total account billing; cache reuse does not impose a global ceiling. No migration or source/derived-record mutation ran.

A concurrent release had also used the prior traffic-cache version. The final correction advances it to `2026-11-14.3`, so existing Agents/Crawlers cache entries cannot retain the old role scope. All 23 focused cache/report tests pass. A fresh, low-volume seven-day article-scoped Agents report includes both AI-search and AI-crawler rows, with five included events, 29,635 reported reads and zero writes. The independent agent report retains its own canonical namespace.

The live overview records 3,850 cohort events, 45 accessed articles, 28 active UTC days and 893 served Markdown events. Selecting Bun AOT gives 84 events, 18 active days and 31 Markdown events, while its registered download is correctly marked outside page collection. This establishes a concrete next bounded action: define the evidence-resource access contract and served-content revision in the second milestone before adding collection. Requested-format preference, upstream failures and answer-use observations remain separate proposals.

Planning review used clean analytics/Worker source at `9bc553139645af02f09ce20ff67f962c6f61af39`. Existing dated trials and receipts were read for scope, not rerun as fresh acceptance. Cloudflare's current guide and the URI-fragment documentation were rechecked November 14.

The continuation passes checks for 78 local links across the plan, prior assessment and owning index, balanced fences, linked priority/next-action coverage, the recorded source revision, the private-prompt guard and scoped whitespace. Runtime checks and deployment are not applicable to this documentation-only change.

The earlier reprioritization ran no production request/query, provider trial or runtime implementation. The first report is now shipped and accepted as recorded above. Campaign outcomes, broader collection and browser reading-activity experiments remain later options.

## November 15 UTC refinement — shipped and accepted

The first report now uses a single exploration model in analytics package source version 0.5.0. It owns coverage, attribution/measurement grouping and context-sensitive choices; the renderer only supplies labels and markup. Role controls join the article/client controls, the overview precedes the detailed tables, and section links and separate Visit actions simplify navigation. Selection announcements expose changed counts to assistive technology. This iteration preserves the report contract, query plans, cache namespaces, schema and collector. It adds no collection or stored-record mutation. The package remains private workspace source; this is not an npm publication.

The initial checkpoint passed 504 analytics and 460 site tests. The final integrated gate passes 504 analytics and 464 site tests, workspace types, Markdown validation, native portability, the isolated configured 46-post build and Worker dry run. Integration retains the shared time presentation adapter. Manual native-fixture checks confirm alternative choices remain visible for empty intersections and native radio arrow keys update the report. Those interactions issued no extra database batches. Manual testing found and repaired focus loss when Clear disabled itself and when Retry disappeared, and a squeezed article-table layout. Clear restores article focus; retry restores the appropriate control after success/failure and preserves focus when the operator moves elsewhere during loading.

Saved production aggregates are explicitly labeled as local replays, not current production observations. The manual matrix includes light/dark themes, 320/390/1280px layouts, native arrow keys, horizontal keyboard scrolling with pinned evidence counts, empty/error/retry states and Visit navigation. Neither preview issued extra report batches for filter changes; both preserve all 48 original fixture records. Native D1 also preserves all 4,800 scale-fixture originals, and 294 complete selection outputs match pre-iteration source `369871d9` exactly on the saved aggregate.

Feature source `266e7ce149107bed78f350de897ab14f47825435` is delivered on `main` and activated on Worker `db179695-37d9-4523-a1ff-8d7407f18bd4`. The live JavaScript and CSS match the checked isolated build; the public newsletter configuration is preserved. The [refinement acceptance receipt](agent-access-iteration-acceptance-2026-11-15.json) records source, activation and fresh manual production checks separately. The canonical report is a cache HIT after delivery, with exactly the same bytes and calculation time as before delivery: 3,858 included events, 46 accessed articles, 895 served Markdown events and 28 active UTC days. Live desktop/mobile checks confirm contextual selection, native role keys and Clear focus without page overflow. AI-search selection shows 2,362 events; AI-crawler shows 771. The separate legacy seven-day article report also loads.

One observed canonical report calculation reported 422,302 last-attempt reads and zero writes, below this iteration's one-million-read review threshold. Cache and UI checks produced no additional captured report-calculation event. No separate cost event was captured for the legacy report; absence is not a billing estimate. These counters describe observed query work, not an account-wide total or global ceiling. No production migration or source/derived-record mutation ran. The next bounded collection proposal remains the evidence-resource access contract and served-content revision from the second milestone; it is not enabled by this refinement.
